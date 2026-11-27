import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { evaluationSchema } from "@/lib/validation/schemas";
import { sanitizeText } from "@/lib/utils";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: hackathonId } = await context.params;
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

  const [{ data: hackathon }, { data: judgeRow }, { data: adminRole }] = await Promise.all([
    supabase.from("hackathons").select("id, organizer_id").eq("id", hackathonId).single(),
    supabase.from("judges").select("id").eq("hackathon_id", hackathonId).eq("user_id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
  ]);

  if (!hackathon) {
    return NextResponse.json({ error: "Hackathon not found." }, { status: 404 });
  }

  const isOrganizer = hackathon.organizer_id === user.id || Boolean(adminRole);
  if (!isOrganizer && !judgeRow) {
    return NextResponse.json(
      { error: "Confidential judging access is restricted to assigned judges and organizers." },
      { status: 403 }
    );
  }

  // Ensure organizer can score by registering them as a judge if needed
  if (isOrganizer && !judgeRow) {
    await supabase.from("judges").upsert(
      { hackathon_id: hackathonId, user_id: user.id, title: "Lead Organizer", assigned_by: user.id },
      { onConflict: "hackathon_id,user_id" }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = evaluationSchema.safeParse({ ...body, hackathon_id: hackathonId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid evaluation score." },
      { status: 400 }
    );
  }

  const v = parsed.data;
  const { data: evaluation, error } = await supabase
    .from("evaluations")
    .upsert(
      {
        hackathon_id: hackathonId,
        submission_id: v.submission_id,
        judge_id: user.id,
        innovation_score: v.innovation_score,
        execution_score: v.execution_score,
        design_score: v.design_score,
        impact_score: v.impact_score,
        feedback: sanitizeText(v.feedback),
        is_finalized: v.is_finalized,
      },
      { onConflict: "submission_id,judge_id" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Recompute average total score on submission
  const { data: allEvals } = await supabase
    .from("evaluations")
    .select("total_score")
    .eq("submission_id", v.submission_id);

  if (allEvals && allEvals.length > 0) {
    const avg =
      allEvals.reduce((sum, item) => sum + Number(item.total_score || 0), 0) / allEvals.length;
    await supabase
      .from("submissions")
      .update({ total_score: Number(avg.toFixed(2)), status: "evaluated" })
      .eq("id", v.submission_id);
  }

  return NextResponse.json({ evaluation }, { status: 201 });
}

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: hackathonId } = await context.params;
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

  const [{ data: hackathon }, { data: adminRole }] = await Promise.all([
    supabase.from("hackathons").select("*").eq("id", hackathonId).single(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
  ]);

  if (!hackathon) {
    return NextResponse.json({ error: "Hackathon not found." }, { status: 404 });
  }
  if (hackathon.organizer_id !== user.id && !adminRole) {
    return NextResponse.json({ error: "Only the organizer or admin can publish results." }, { status: 403 });
  }

  const { data: rankedSubmissions } = await supabase
    .from("submissions")
    .select("id, team_id, submitted_by, project_title, total_score")
    .eq("hackathon_id", hackathonId)
    .order("total_score", { ascending: false, nullsFirst: false });

  if (rankedSubmissions) {
    for (let i = 0; i < rankedSubmissions.length; i++) {
      await supabase
        .from("submissions")
        .update({ rank: i + 1 })
        .eq("id", rankedSubmissions[i].id);
    }
  }

  await supabase
    .from("hackathons")
    .update({ results_published: true, status: "completed" })
    .eq("id", hackathonId);

  return NextResponse.json({ published: true, rankedCount: rankedSubmissions?.length ?? 0 });
}
