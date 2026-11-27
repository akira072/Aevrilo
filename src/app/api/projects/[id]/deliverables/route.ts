import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { reviewDeliverableSchema, submitDeliverableSchema } from "@/lib/validation/schemas";
import { sanitizeText } from "@/lib/utils";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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
  const parsed = submitDeliverableSchema.safeParse({ ...body, project_id: id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid deliverable payload." },
      { status: 400 }
    );
  }

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  if (project.freelancer_id !== user.id) {
    return NextResponse.json({ error: "Only the assigned freelancer can submit deliverables." }, { status: 403 });
  }
  if (!["ASSIGNED", "IN PROGRESS", "DELIVERED"].includes(project.status)) {
    return NextResponse.json({ error: "Project is not open for deliverable submission." }, { status: 400 });
  }

  const { data: deliverable, error } = await supabase
    .from("project_deliverables")
    .insert({
      project_id: id,
      submitted_by: user.id,
      summary: sanitizeText(parsed.data.summary),
      deliverable_url: parsed.data.deliverable_url || null,
      storage_path: body?.storage_path || null,
      file_name: body?.file_name || null,
      file_size_bytes: body?.file_size_bytes || null,
      status: "submitted",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await Promise.all([
    supabase.from("projects").update({ status: "DELIVERED" }).eq("id", id),
    supabase.from("requests").update({ status: "DELIVERED" }).eq("id", project.request_id),
    supabase.from("notifications").insert({
      user_id: project.client_id,
      type: "deliverable_submitted",
      title: "New deliverable submitted",
      body: `A deliverable was submitted for "${project.title}". Review and approve or request revisions.`,
      link_url: `/projects/${id}`,
    }),
  ]);

  return NextResponse.json({ deliverable }, { status: 201 });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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
  const parsed = reviewDeliverableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid deliverable review payload." }, { status: 400 });
  }

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  if (project.client_id !== user.id) {
    return NextResponse.json({ error: "Only the client can review deliverables." }, { status: 403 });
  }

  const { deliverable_id, decision, client_feedback } = parsed.data;
  const { data: updatedDeliverable, error } = await supabase
    .from("project_deliverables")
    .update({
      status: decision,
      client_feedback: sanitizeText(client_feedback || ""),
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", deliverable_id)
    .eq("project_id", id)
    .select("*")
    .single();

  if (error || !updatedDeliverable) {
    return NextResponse.json({ error: error?.message || "Deliverable not found." }, { status: 400 });
  }

  if (decision === "approved") {
    await Promise.all([
      supabase
        .from("projects")
        .update({ status: "COMPLETED", completed_at: new Date().toISOString() })
        .eq("id", id),
      supabase.from("requests").update({ status: "COMPLETED" }).eq("id", project.request_id),
      supabase.from("payment_records").insert({
        flow: "freelance_project",
        project_id: id,
        payer_id: project.client_id,
        payee_id: project.freelancer_id,
        gross_amount_inr: project.agreed_budget_inr,
        commission_bps: project.commission_bps,
        commission_amount_inr: project.commission_amount_inr,
        net_amount_inr: project.freelancer_payout_inr,
        currency: "INR",
        settlement_method: "external_upi_or_bank",
        status: "pending",
        notes: "Generated upon client approval. Awaiting external UPI/bank UTR reference verification.",
      }),
      supabase.from("notifications").insert({
        user_id: project.freelancer_id,
        type: "project_approved",
        title: "Work approved!",
        body: `Your deliverable for "${project.title}" was approved. Net payout ₹${project.freelancer_payout_inr} queued for settlement record.`,
        link_url: `/projects/${id}`,
      }),
    ]);
  } else {
    await Promise.all([
      supabase
        .from("projects")
        .update({
          status: "IN PROGRESS",
          revision_count: (project.revision_count ?? 0) + 1,
        })
        .eq("id", id),
      supabase.from("requests").update({ status: "IN PROGRESS" }).eq("id", project.request_id),
      supabase.from("notifications").insert({
        user_id: project.freelancer_id,
        type: "revision_requested",
        title: "Revision requested",
        body: `The client requested a revision on "${project.title}".`,
        link_url: `/projects/${id}`,
      }),
    ]);
  }

  return NextResponse.json({ deliverable: updatedDeliverable });
}
