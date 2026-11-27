import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { projectReviewSchema } from "@/lib/validation/schemas";
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
  const parsed = projectReviewSchema.safeParse({ ...body, project_id: id });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review payload." }, { status: 400 });
  }

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  if (project.status !== "COMPLETED") {
    return NextResponse.json({ error: "Reviews can only be submitted after project completion." }, { status: 400 });
  }

  let revieweeId: string | null = null;
  if (project.client_id === user.id) revieweeId = project.freelancer_id;
  else if (project.freelancer_id === user.id) revieweeId = project.client_id;

  if (!revieweeId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      project_id: id,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating: parsed.data.rating,
      comment: sanitizeText(parsed.data.comment),
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ review }, { status: 201 });
}
