import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createApplicationSchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { calculateCommission } from "@/lib/payments/commission";
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

  const rl = checkRateLimit(`apply:${user.id}`, 15, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many applications submitted recently." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid proposal payload." },
      { status: 400 }
    );
  }

  const v = parsed.data;
  const { data: reqRow } = await supabase
    .from("requests")
    .select("id, client_id, title, status")
    .eq("id", v.request_id)
    .single();

  if (!reqRow) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  if (reqRow.client_id === user.id) {
    return NextResponse.json({ error: "You cannot apply to your own request." }, { status: 400 });
  }
  if (!["OPEN", "UNDER REVIEW"].includes(reqRow.status)) {
    return NextResponse.json({ error: "This request is no longer accepting proposals." }, { status: 400 });
  }

  const { data: appRow, error } = await supabase
    .from("applications")
    .insert({
      request_id: v.request_id,
      freelancer_id: user.id,
      cover_message: sanitizeText(v.cover_message),
      relevant_skills: v.relevant_skills.map(sanitizeText),
      portfolio_links: v.portfolio_links,
      proposed_price_inr: v.proposed_price_inr,
      estimated_days: v.estimated_days,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from("notifications").insert({
    user_id: reqRow.client_id,
    type: "new_application",
    title: "New proposal received",
    body: `A freelancer applied to "${reqRow.title}" with a proposal of ₹${v.proposed_price_inr}.`,
    link_url: `/my-requests`,
  });

  return NextResponse.json({ application: appRow }, { status: 201 });
}

const decisionSchema = z.object({
  application_id: z.string().uuid(),
  decision: z.enum(["accepted", "rejected", "shortlisted", "withdrawn"]),
  client_note: z.string().trim().max(500).optional().default(""),
});

export async function PATCH(request: Request) {
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

  const body = await request.json().catch(() => null);
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid application action." }, { status: 400 });
  }

  const { application_id, decision, client_note } = parsed.data;
  const { data: appRow } = await supabase
    .from("applications")
    .select("*, request:requests(*)")
    .eq("id", application_id)
    .single();

  if (!appRow || !appRow.request) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const reqRow = appRow.request;

  if (decision === "withdrawn") {
    if (appRow.freelancer_id !== user.id) {
      return NextResponse.json({ error: "Only the applicant can withdraw." }, { status: 403 });
    }
    const { error } = await supabase
      .from("applications")
      .update({ status: "withdrawn" })
      .eq("id", application_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ status: "withdrawn" });
  }

  // Client decisions: accepted, rejected, shortlisted
  if (reqRow.client_id !== user.id) {
    return NextResponse.json({ error: "Only the request client can review applications." }, { status: 403 });
  }

  if (decision === "accepted") {
    if (!["OPEN", "UNDER REVIEW"].includes(reqRow.status)) {
      return NextResponse.json({ error: "Request is already assigned or closed." }, { status: 400 });
    }

    const { data: settings } = await supabase
      .from("platform_settings")
      .select("freelance_commission_bps")
      .eq("id", 1)
      .maybeSingle();

    const commissionBps = settings?.freelance_commission_bps ?? 500;
    const breakdown = calculateCommission(Number(appRow.proposed_price_inr), commissionBps);

    const { error: updateAppErr } = await supabase
      .from("applications")
      .update({ status: "accepted", client_note: sanitizeText(client_note) })
      .eq("id", application_id);
    if (updateAppErr) {
      return NextResponse.json({ error: updateAppErr.message }, { status: 400 });
    }

    const { data: project, error: projErr } = await supabase
      .from("projects")
      .insert({
        request_id: reqRow.id,
        application_id: appRow.id,
        client_id: reqRow.client_id,
        freelancer_id: appRow.freelancer_id,
        title: reqRow.title,
        agreed_budget_inr: breakdown.grossAmountInr,
        commission_bps: breakdown.commissionBps,
        commission_amount_inr: breakdown.commissionAmountInr,
        freelancer_payout_inr: breakdown.netAmountInr,
        deadline: reqRow.deadline,
        status: "ASSIGNED",
        payment_status: "pending",
      })
      .select("*")
      .single();

    if (projErr) {
      return NextResponse.json({ error: projErr.message }, { status: 400 });
    }

    await Promise.all([
      supabase.from("requests").update({ status: "ASSIGNED" }).eq("id", reqRow.id),
      supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("request_id", reqRow.id)
        .neq("id", application_id)
        .in("status", ["pending", "shortlisted"]),
      supabase.from("conversations").insert({
        project_id: project.id,
        request_id: reqRow.id,
        participant_one_id: reqRow.client_id,
        participant_two_id: appRow.freelancer_id,
      }),
      supabase.from("notifications").insert({
        user_id: appRow.freelancer_id,
        type: "application_accepted",
        title: "Proposal accepted!",
        body: `Your proposal for "${reqRow.title}" was accepted. Your project workspace is ready.`,
        link_url: `/projects/${project.id}`,
      }),
    ]);

    return NextResponse.json({ status: "accepted", project });
  }

  const { error } = await supabase
    .from("applications")
    .update({ status: decision, client_note: sanitizeText(client_note) })
    .eq("id", application_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from("notifications").insert({
    user_id: appRow.freelancer_id,
    type: `application_${decision}`,
    title: decision === "rejected" ? "Proposal update" : "Proposal shortlisted",
    body: `Your proposal for "${reqRow.title}" was marked ${decision}.`,
    link_url: `/applications`,
  });

  return NextResponse.json({ status: decision });
}
