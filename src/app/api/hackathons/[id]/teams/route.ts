import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { teamCreateSchema } from "@/lib/validation/schemas";
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
  const parsed = teamCreateSchema.safeParse({ ...body, hackathon_id: hackathonId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid team payload." },
      { status: 400 }
    );
  }

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      hackathon_id: hackathonId,
      name: sanitizeText(parsed.data.name),
      leader_id: user.id,
      problem_statement_id: parsed.data.problem_statement_id || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await Promise.all([
    supabase.from("team_members").insert({
      team_id: team.id,
      hackathon_id: hackathonId,
      user_id: user.id,
      role: "leader",
      invite_status: "accepted",
      joined_at: new Date().toISOString(),
    }),
    supabase.from("registrations").upsert(
      {
        hackathon_id: hackathonId,
        user_id: user.id,
        team_id: team.id,
        registration_type: "team",
        status: "confirmed",
      },
      { onConflict: "hackathon_id,user_id" }
    ),
  ]);

  return NextResponse.json({ team }, { status: 201 });
}

export async function PATCH(
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
  const action = body?.action;

  const { data: hackathon } = await supabase
    .from("hackathons")
    .select("id, title, max_team_size")
    .eq("id", hackathonId)
    .single();

  if (!hackathon) {
    return NextResponse.json({ error: "Hackathon not found." }, { status: 404 });
  }

  if (action === "join_by_code") {
    const code = String(body?.invite_code || "").trim();
    const { data: team } = await supabase
      .from("teams")
      .select("*")
      .eq("hackathon_id", hackathonId)
      .eq("invite_code", code)
      .maybeSingle();

    if (!team) {
      return NextResponse.json({ error: "Invalid team invite code." }, { status: 404 });
    }

    const { count } = await supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", team.id)
      .eq("invite_status", "accepted");

    if ((count ?? 0) >= hackathon.max_team_size) {
      return NextResponse.json(
        { error: `Team is already at max capacity (${hackathon.max_team_size}).` },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("team_members").upsert(
      {
        team_id: team.id,
        hackathon_id: hackathonId,
        user_id: user.id,
        role: "member",
        invite_status: "accepted",
        joined_at: new Date().toISOString(),
      },
      { onConflict: "team_id,user_id" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await supabase.from("registrations").upsert(
      {
        hackathon_id: hackathonId,
        user_id: user.id,
        team_id: team.id,
        registration_type: "team",
        status: "confirmed",
      },
      { onConflict: "hackathon_id,user_id" }
    );

    return NextResponse.json({ team });
  }

  if (action === "invite_username") {
    const teamId = String(body?.team_id || "");
    const username = String(body?.username || "").trim().toLowerCase();

    const { data: team } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .eq("leader_id", user.id)
      .maybeSingle();

    if (!team) {
      return NextResponse.json({ error: "Only the team leader can invite members." }, { status: 403 });
    }

    const { data: invitee } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("username", username)
      .maybeSingle();

    if (!invitee) {
      return NextResponse.json({ error: "User not found by that username." }, { status: 404 });
    }

    const { error } = await supabase.from("team_members").upsert(
      {
        team_id: team.id,
        hackathon_id: hackathonId,
        user_id: invitee.id,
        role: "member",
        invite_status: "invited",
      },
      { onConflict: "team_id,user_id" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await supabase.from("notifications").insert({
      user_id: invitee.id,
      type: "team_invitation",
      title: `Team invite: ${team.name}`,
      body: `You were invited to join team "${team.name}" in "${hackathon.title}".`,
      link_url: `/hackathons/${hackathonId}`,
    });

    return NextResponse.json({ invited: true });
  }

  if (action === "respond_invite") {
    const teamId = String(body?.team_id || "");
    const decision = body?.decision === "accepted" ? "accepted" : "rejected";

    if (decision === "accepted") {
      const { count } = await supabase
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("team_id", teamId)
        .eq("invite_status", "accepted");
      if ((count ?? 0) >= hackathon.max_team_size) {
        return NextResponse.json({ error: "Team is already full." }, { status: 400 });
      }
    }

    const { error } = await supabase
      .from("team_members")
      .update({
        invite_status: decision,
        joined_at: decision === "accepted" ? new Date().toISOString() : null,
      })
      .eq("team_id", teamId)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (decision === "accepted") {
      await supabase.from("registrations").upsert(
        {
          hackathon_id: hackathonId,
          user_id: user.id,
          team_id: teamId,
          registration_type: "team",
          status: "confirmed",
        },
        { onConflict: "hackathon_id,user_id" }
      );
    }

    return NextResponse.json({ decision });
  }

  return NextResponse.json({ error: "Unknown team action." }, { status: 400 });
}
