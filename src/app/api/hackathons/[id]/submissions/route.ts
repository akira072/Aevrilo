import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateTeamSubmissionEligibility } from "@/lib/domain/state-machines";
import { submissionSchema } from "@/lib/validation/schemas";
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

  const body = await request.json().catch(() => null);
  const parsed = submissionSchema.safeParse({ ...body, hackathon_id: hackathonId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid submission payload." },
      { status: 400 }
    );
  }

  const v = parsed.data;
  const [{ data: hackathon }, { data: team }, { count: acceptedMemberCount }, { data: memberRow }] =
    await Promise.all([
      supabase.from("hackathons").select("*").eq("id", hackathonId).single(),
      supabase.from("teams").select("*").eq("id", v.team_id).eq("hackathon_id", hackathonId).single(),
      supabase
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("team_id", v.team_id)
        .eq("invite_status", "accepted"),
      supabase
        .from("team_members")
        .select("id")
        .eq("team_id", v.team_id)
        .eq("user_id", user.id)
        .eq("invite_status", "accepted")
        .maybeSingle(),
    ]);

  if (!hackathon || !team) {
    return NextResponse.json({ error: "Hackathon or team not found." }, { status: 404 });
  }
  if (!memberRow) {
    return NextResponse.json({ error: "Only accepted team members can submit." }, { status: 403 });
  }

  const eligibility = validateTeamSubmissionEligibility({
    endDate: hackathon.end_date,
    allowLateSubmission: hackathon.allow_late_submission,
    teamLateApproved: team.late_submission_approved,
    minTeamSize: hackathon.min_team_size,
    maxTeamSize: hackathon.max_team_size,
    acceptedMemberCount: acceptedMemberCount ?? 0,
  });

  if (!eligibility.allowed) {
    return NextResponse.json({ error: eligibility.reason }, { status: 400 });
  }

  const { data: submission, error } = await supabase
    .from("submissions")
    .upsert(
      {
        hackathon_id: hackathonId,
        team_id: v.team_id,
        problem_statement_id: v.problem_statement_id || team.problem_statement_id || null,
        submitted_by: user.id,
        project_title: sanitizeText(v.project_title),
        summary: sanitizeText(v.summary),
        github_url: v.github_url || null,
        live_demo_url: v.live_demo_url || null,
        deck_storage_path: body?.deck_storage_path || null,
        deck_file_name: body?.deck_file_name || null,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "hackathon_id,team_id" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "submission_confirmation",
    title: "Hackathon submission received",
    body: `Your project "${v.project_title}" was submitted for "${hackathon.title}".`,
    link_url: `/hackathons/${hackathonId}`,
  });

  return NextResponse.json({ submission }, { status: 201 });
}
