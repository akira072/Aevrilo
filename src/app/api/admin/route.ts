import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { canTransitionPaymentStatus } from "@/lib/domain/state-machines";
import { sanitizeText } from "@/lib/utils";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!adminRole) {
    return NextResponse.json({ error: "Admin role required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const action = String(body?.action || "");

  if (action === "update_account_status") {
    const targetUserId = String(body.user_id || "");
    const nextStatus = String(body.account_status || "");
    if (!["active", "suspended", "restricted"].includes(nextStatus)) {
      return NextResponse.json({ error: "Invalid account status." }, { status: 400 });
    }
    const { error } = await supabase
      .from("profiles")
      .update({ account_status: nextStatus })
      .eq("id", targetUserId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "update_account_status",
      entity_type: "profile",
      entity_id: targetUserId,
      after_data: { account_status: nextStatus },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "grant_role") {
    const targetUserId = String(body.user_id || "");
    const role = String(body.role || "");
    if (!["client", "freelancer", "organizer", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: targetUserId, role, granted_by: user.id }, { onConflict: "user_id,role" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "grant_role",
      entity_type: "user_roles",
      entity_id: targetUserId,
      after_data: { role },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "resolve_report") {
    const reportId = String(body.report_id || "");
    const status = String(body.status || "");
    const notes = sanitizeText(String(body.resolution_notes || ""));
    if (!["investigating", "resolved", "dismissed"].includes(status)) {
      return NextResponse.json({ error: "Invalid report status." }, { status: 400 });
    }
    const { error } = await supabase
      .from("reports")
      .update({
        status,
        resolution_notes: notes,
        assigned_admin_id: user.id,
        resolved_at: ["resolved", "dismissed"].includes(status) ? new Date().toISOString() : null,
      })
      .eq("id", reportId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "resolve_report",
      entity_type: "report",
      entity_id: reportId,
      after_data: { status, resolution_notes: notes },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "verify_payment") {
    const paymentId = String(body.payment_id || "");
    const nextStatus = body.status as "pending" | "processing" | "successful" | "failed";
    const externalReference = sanitizeText(String(body.external_reference || ""));

    const { data: rec } = await supabase
      .from("payment_records")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (!rec) return NextResponse.json({ error: "Payment record not found." }, { status: 404 });

    const check = canTransitionPaymentStatus(
      rec.status,
      nextStatus,
      true,
      Boolean(externalReference)
    );
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }

    const { error } = await supabase
      .from("payment_records")
      .update({
        status: nextStatus,
        external_reference: externalReference || rec.external_reference,
        verified_by: user.id,
        verified_at: nextStatus === "successful" ? new Date().toISOString() : null,
      })
      .eq("id", paymentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (rec.project_id) {
      await supabase
        .from("projects")
        .update({ payment_status: nextStatus })
        .eq("id", rec.project_id);
    }

    if (rec.payee_id) {
      await supabase.from("notifications").insert({
        user_id: rec.payee_id,
        type: "payout_status",
        title: `Payment record marked ${nextStatus}`,
        body: `Settlement reference ${externalReference || "updated"} (${rec.net_amount_inr} INR).`,
        link_url: "/payments",
      });
    }

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "verify_payment",
      entity_type: "payment_record",
      entity_id: paymentId,
      after_data: { status: nextStatus, external_reference: externalReference },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "update_commission") {
    const bps = Number(body.commission_bps);
    if (!Number.isInteger(bps) || bps < 0 || bps > 3000) {
      return NextResponse.json({ error: "Commission BPS must be between 0 and 3000 (0%–30%)." }, { status: 400 });
    }
    const { error } = await supabase
      .from("platform_settings")
      .update({ freelance_commission_bps: bps, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "update_commission",
      entity_type: "platform_settings",
      entity_id: "1",
      after_data: { freelance_commission_bps: bps },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown admin action." }, { status: 400 });
}
