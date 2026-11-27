import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { canTransitionProjectStatus, type ActorRelation, type ProjectStatus } from "@/lib/domain/state-machines";

const statusSchema = z.object({
  status: z.enum(["ASSIGNED", "IN PROGRESS", "DELIVERED", "COMPLETED", "CANCELLED", "DISPUTED"]),
});

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
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid project status." }, { status: 400 });
  }

  const [{ data: project }, { data: adminRole }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
  ]);

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  let actor: ActorRelation | null = null;
  if (adminRole) actor = "admin";
  else if (project.client_id === user.id) actor = "client";
  else if (project.freelancer_id === user.id) actor = "freelancer";

  if (!actor) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const nextStatus = parsed.data.status as ProjectStatus;
  if (!canTransitionProjectStatus(project.status as ProjectStatus, nextStatus, actor)) {
    return NextResponse.json(
      { error: `Transition from ${project.status} to ${nextStatus} is not permitted for ${actor}.` },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = { status: nextStatus };
  if (nextStatus === "COMPLETED") {
    updates.completed_at = new Date().toISOString();
  }

  const { data: updated, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from("requests").update({ status: nextStatus }).eq("id", project.request_id);

  const recipientId = user.id === project.client_id ? project.freelancer_id : project.client_id;
  await supabase.from("notifications").insert({
    user_id: recipientId,
    type: "project_status",
    title: `Project updated to ${nextStatus}`,
    body: `"${project.title}" moved from ${project.status} to ${nextStatus}.`,
    link_url: `/projects/${id}`,
  });

  return NextResponse.json({ project: updated });
}
