import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, Calendar, MapPin, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HackathonActionsPanel } from "@/components/hackathons/hackathon-workspace";
import { getCurrentUserContext } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/utils";
import type { HackathonRecord } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function HackathonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, supabase] = await Promise.all([
    getCurrentUserContext(),
    createServerSupabaseClient(),
  ]);

  if (!supabase) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-sm text-slate-600">
        Supabase credentials are required.
      </div>
    );
  }

  const [
    { data: hackData },
    { data: problems },
    { data: rules },
    { data: announcements },
    { data: prizes },
    { count: regCount },
    { count: teamCount },
  ] = await Promise.all([
    supabase
      .from("hackathons")
      .select("*, organizer:profiles(id, full_name, username, college_or_org)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("problem_statements").select("*").eq("hackathon_id", id).order("code"),
    supabase.from("hackathon_rules").select("*").eq("hackathon_id", id).order("display_order"),
    supabase
      .from("hackathon_announcements")
      .select("*")
      .eq("hackathon_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("prizes").select("*").eq("hackathon_id", id).order("rank_order"),
    supabase.from("registrations").select("id", { count: "exact", head: true }).eq("hackathon_id", id),
    supabase.from("teams").select("id", { count: "exact", head: true }).eq("hackathon_id", id),
  ]);

  if (!hackData) {
    notFound();
  }

  const hackathon = hackData as unknown as HackathonRecord;
  const isOrganizer = Boolean(
    session.userId && (hackathon.organizer_id === session.userId || session.isAdmin)
  );

  let isJudge = false;
  let isRegistered = false;
  let myTeam: { id: string; name: string; invite_code: string; leader_id: string } | null = null;
  let pendingInvites: Array<{ team_id: string; teams?: { name?: string } | null }> = [];
  let visibleSubmissions: Array<{
    id: string;
    team_id: string;
    project_title: string;
    summary: string;
    github_url: string | null;
    live_demo_url: string | null;
    total_score: number | null;
    rank: number | null;
    team?: { name?: string } | null;
  }> = [];

  if (session.userId) {
    const [{ data: judgeRow }, { data: regRow }, { data: memberRows }] = await Promise.all([
      supabase
        .from("judges")
        .select("id")
        .eq("hackathon_id", id)
        .eq("user_id", session.userId)
        .maybeSingle(),
      supabase
        .from("registrations")
        .select("id")
        .eq("hackathon_id", id)
        .eq("user_id", session.userId)
        .maybeSingle(),
      supabase
        .from("team_members")
        .select("team_id, invite_status, teams(id, name, invite_code, leader_id)")
        .eq("hackathon_id", id)
        .eq("user_id", session.userId),
    ]);

    isJudge = Boolean(judgeRow);
    isRegistered = Boolean(regRow);

    const acceptedRow = (memberRows ?? []).find((m) => m.invite_status === "accepted");
    if (acceptedRow?.teams) {
      myTeam = acceptedRow.teams as unknown as {
        id: string;
        name: string;
        invite_code: string;
        leader_id: string;
      };
    }
    pendingInvites = ((memberRows ?? []).filter((m) => m.invite_status === "invited") ?? []) as unknown as typeof pendingInvites;
  }

  if (isOrganizer || isJudge || hackathon.results_published) {
    const { data: subs } = await supabase
      .from("submissions")
      .select("*, team:teams(name)")
      .eq("hackathon_id", id)
      .order("rank", { ascending: true, nullsFirst: false })
      .order("total_score", { ascending: false, nullsFirst: false });
    visibleSubmissions = (subs ?? []) as unknown as typeof visibleSubmissions;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="teal" className="capitalize">
            {hackathon.status.replace("_", " ")}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {hackathon.mode}
          </Badge>
          <span className="font-mono text-sm font-semibold text-teal-800">
            {formatINR(hackathon.prize_pool_inr)} Prize Pool
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {hackathon.title}
        </h1>
        {hackathon.tagline ? (
          <p className="mt-1.5 text-base text-slate-600">{hackathon.tagline}</p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-6 border-t border-slate-100 pt-5 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-teal-700" />
            {formatDate(hackathon.start_date)} – {formatDate(hackathon.end_date)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4 text-teal-700" />
            Team size {hackathon.min_team_size}–{hackathon.max_team_size} · {regCount ?? 0} participants ·{" "}
            {teamCount ?? 0} teams
          </span>
          {hackathon.venue ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-teal-700" />
              {hackathon.venue}
            </span>
          ) : null}
        </div>
      </div>

      {/* Overview, Problem Statements, Announcements */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>About & Eligibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-slate-700">
            <p className="whitespace-pre-line">{hackathon.description}</p>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
              <strong>Eligibility:</strong> {hackathon.eligibility} ·{" "}
              <strong>Prize Funding:</strong> {hackathon.funding_source}
            </div>
            {(rules ?? []).length > 0 ? (
              <div className="space-y-2 pt-2">
                <h4 className="font-semibold text-slate-900">Rules</h4>
                <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
                  {(rules ?? []).map((r) => (
                    <li key={r.id}>
                      <strong>{r.title}:</strong> {r.description}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-teal-700" /> Announcements & Prizes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {(prizes ?? []).length > 0 ? (
              <div className="space-y-2">
                {(prizes ?? []).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs">
                    <span className="font-medium">{p.rank_label}</span>
                    <span className="font-mono font-semibold text-teal-800">{formatINR(p.amount_inr)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Total Prize Pool: {formatINR(hackathon.prize_pool_inr)}
              </p>
            )}

            <div className="border-t border-slate-100 pt-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Updates
              </p>
              {(announcements ?? []).length === 0 ? (
                <p className="text-xs text-slate-500">No announcements yet.</p>
              ) : (
                (announcements ?? []).map((a) => (
                  <div key={a.id} className="rounded-lg bg-slate-50 p-3 text-xs">
                    <p className="font-semibold text-slate-900">{a.title}</p>
                    <p className="mt-1 text-slate-600">{a.body}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Problem Statements */}
      <Card>
        <CardHeader>
          <CardTitle>Problem Statements ({(problems ?? []).length})</CardTitle>
          <CardDescription>Select a problem statement when forming your team or submitting.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {(problems ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No problem statements added yet.</p>
          ) : (
            (problems ?? []).map((ps) => (
              <div key={ps.id} className="rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="indigo">{ps.code} · {ps.track}</Badge>
                  <span className="text-xs capitalize text-slate-500">{ps.difficulty}</span>
                </div>
                <h4 className="font-semibold text-slate-950">{ps.title}</h4>
                <p className="text-sm text-slate-600">{ps.description}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Interactive Participation, Team, Submission, and Judging Panel */}
      {session.userId ? (
        <HackathonActionsPanel
          hackathonId={id}
          isRegistered={isRegistered}
          myTeam={myTeam}
          pendingInvites={pendingInvites}
          problems={problems ?? []}
          isOrganizerOrJudge={isOrganizer || isJudge}
          isOrganizer={isOrganizer}
          submissions={visibleSubmissions}
          resultsPublished={hackathon.results_published}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
            <p className="text-sm text-slate-700">
              Log in or sign up free to register, form a team, and submit your hackathon project.
            </p>
            <Button asChild variant="accent">
              <Link href={`/login?next=/hackathons/${id}`}>Log in to Participate</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Published Leaderboard & Results */}
      {hackathon.results_published ? (
        <Card className="border-teal-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-teal-700" /> Official Leaderboard & Results
            </CardTitle>
            <CardDescription>Ranked submissions published by the organizer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleSubmissions.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4"
              >
                <div>
                  <span className="font-mono text-xs font-semibold text-teal-800">
                    RANK #{s.rank ?? "—"}
                  </span>
                  <h4 className="font-semibold text-slate-950">{s.project_title}</h4>
                  <p className="text-xs text-slate-500">Team: {s.team?.name || "Team"}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-semibold text-slate-950">
                    {s.total_score ?? 0} / 40
                  </p>
                  {s.github_url ? (
                    <a href={s.github_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-700 underline">
                      GitHub Repo
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
