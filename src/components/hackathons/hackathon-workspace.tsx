"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";

interface ProblemRow {
  id: string;
  code: string;
  title: string;
  track: string;
}

interface SubmissionRow {
  id: string;
  team_id: string;
  project_title: string;
  summary: string;
  github_url: string | null;
  live_demo_url: string | null;
  total_score: number | null;
  rank: number | null;
  team?: { name?: string } | null;
}

export function HackathonActionsPanel({
  hackathonId,
  isRegistered,
  myTeam,
  pendingInvites,
  problems,
  isOrganizerOrJudge,
  isOrganizer,
  submissions,
  resultsPublished,
}: {
  hackathonId: string;
  isRegistered: boolean;
  myTeam: { id: string; name: string; invite_code: string; leader_id: string } | null;
  pendingInvites: Array<{ team_id: string; teams?: { name?: string } | null }>;
  problems: ProblemRow[];
  isOrganizerOrJudge: boolean;
  isOrganizer: boolean;
  submissions: SubmissionRow[];
  resultsPublished: boolean;
}) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteUsername, setInviteUsername] = useState("");
  const [selectedProblemId, setSelectedProblemId] = useState(problems[0]?.id || "");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectSummary, setProjectSummary] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");

  // Organizer additions
  const [psCode, setPsCode] = useState("PS-01");
  const [psTitle, setPsTitle] = useState("");
  const [psTrack, setPsTrack] = useState("AI & Campus");
  const [psDesc, setPsDesc] = useState("");
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");

  // Judging state
  const [judgeSubId, setJudgeSubId] = useState(submissions[0]?.id || "");
  const [innovation, setInnovation] = useState(8);
  const [execution, setExecution] = useState(8);
  const [design, setDesign] = useState(8);
  const [impact, setImpact] = useState(8);
  const [judgeFeedback, setJudgeFeedback] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function callApi(url: string, method: string, payload?: unknown, okMsg?: string) {
    setBusy(true);
    setErr(null);
    setMsg(null);
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(json.error || "Action failed.");
      return false;
    }
    if (okMsg) setMsg(okMsg);
    router.refresh();
    return true;
  }

  return (
    <div className="space-y-6">
      {err ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {err}
        </div>
      ) : null}
      {msg ? (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          {msg}
        </div>
      ) : null}

      {/* Pending Team Invites */}
      {pendingInvites.length > 0 ? (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-indigo-950">Pending Team Invitations</h3>
          {pendingInvites.map((inv) => (
            <div key={inv.team_id} className="flex items-center justify-between gap-3 text-sm">
              <span>Team: <strong>{inv.teams?.name || inv.team_id}</strong></span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="accent"
                  disabled={busy}
                  onClick={() =>
                    callApi(`/api/hackathons/${hackathonId}/teams`, "PATCH", {
                      action: "respond_invite",
                      team_id: inv.team_id,
                      decision: "accepted",
                    }, "Joined team!")
                  }
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    callApi(`/api/hackathons/${hackathonId}/teams`, "PATCH", {
                      action: "respond_invite",
                      team_id: inv.team_id,
                      decision: "rejected",
                    })
                  }
                >
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Registration & Team Formation */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <h3 className="text-base font-semibold text-slate-950">1. Registration & Team</h3>
          {!isRegistered ? (
            <Button
              variant="accent"
              disabled={busy}
              onClick={() =>
                callApi(`/api/hackathons/${hackathonId}/register`, "POST", {
                  registration_type: "individual",
                }, "Registered for hackathon!")
              }
            >
              Register Individually Now
            </Button>
          ) : (
            <p className="text-xs font-medium text-teal-800">✓ Your registration is confirmed.</p>
          )}

          {myTeam ? (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <p>
                Team: <strong>{myTeam.name}</strong>
              </p>
              <p className="text-xs text-slate-600">
                Share invite code: <code className="rounded bg-white px-1.5 py-0.5 font-mono font-semibold">{myTeam.invite_code}</code>
              </p>
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Invite teammate by @username"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || !inviteUsername}
                  onClick={() =>
                    callApi(`/api/hackathons/${hackathonId}/teams`, "PATCH", {
                      action: "invite_username",
                      team_id: myTeam.id,
                      username: inviteUsername,
                    }, "Invitation sent!")
                  }
                >
                  Invite
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
                <Button
                  size="sm"
                  disabled={busy || teamName.length < 2}
                  onClick={() =>
                    callApi(`/api/hackathons/${hackathonId}/teams`, "POST", {
                      name: teamName,
                      problem_statement_id: selectedProblemId,
                    }, "Team created!")
                  }
                >
                  Create Team
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Or enter team invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || !inviteCode}
                  onClick={() =>
                    callApi(`/api/hackathons/${hackathonId}/teams`, "PATCH", {
                      action: "join_by_code",
                      invite_code: inviteCode,
                    }, "Joined team!")
                  }
                >
                  Join Team
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Project Submission */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <h3 className="text-base font-semibold text-slate-950">2. Project Submission</h3>
          {!myTeam ? (
            <p className="text-sm text-slate-600">
              Create or join a team first to submit your hackathon project.
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                callApi(`/api/hackathons/${hackathonId}/submissions`, "POST", {
                  team_id: myTeam.id,
                  problem_statement_id: selectedProblemId,
                  project_title: projectTitle,
                  summary: projectSummary,
                  github_url: githubUrl,
                  live_demo_url: demoUrl,
                }, "Project submitted!");
              }}
              className="space-y-3"
            >
              {problems.length > 0 ? (
                <div className="space-y-1">
                  <Label>Problem Statement</Label>
                  <NativeSelect
                    value={selectedProblemId}
                    onChange={(e) => setSelectedProblemId(e.target.value)}
                  >
                    {problems.map((ps) => (
                      <option key={ps.id} value={ps.id}>
                        {ps.code} — {ps.title}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              ) : null}
              <Input
                placeholder="Project title"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                required
                minLength={3}
              />
              <Textarea
                placeholder="Describe your solution, architecture, and impact..."
                value={projectSummary}
                onChange={(e) => setProjectSummary(e.target.value)}
                required
                minLength={20}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  type="url"
                  placeholder="GitHub repository URL"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
                <Input
                  type="url"
                  placeholder="Live demo / video URL"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                />
              </div>
              <Button type="submit" variant="accent" disabled={busy}>
                {busy ? "Submitting..." : "Submit Project"}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Organizer Controls: Problem Statements & Announcements */}
      {isOrganizer ? (
        <div className="grid gap-6 md:grid-cols-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              callApi(`/api/hackathons/${hackathonId}/problems`, "POST", {
                code: psCode,
                title: psTitle,
                track: psTrack,
                difficulty: "intermediate",
                description: psDesc,
              }, "Problem statement added!");
            }}
            className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
          >
            <h3 className="text-base font-semibold text-slate-950">Organizer: Add Problem Statement</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder="Code (e.g. PS-01)" value={psCode} onChange={(e) => setPsCode(e.target.value)} required />
              <Input placeholder="Track" value={psTrack} onChange={(e) => setPsTrack(e.target.value)} required />
            </div>
            <Input placeholder="Problem Title" value={psTitle} onChange={(e) => setPsTitle(e.target.value)} required />
            <Textarea placeholder="Problem details & expectations" value={psDesc} onChange={(e) => setPsDesc(e.target.value)} required minLength={15} />
            <Button type="submit" size="sm" disabled={busy}>Add Problem Statement</Button>
          </form>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              callApi(`/api/hackathons/${hackathonId}/problems`, "POST", {
                kind: "announcement",
                title: annTitle,
                body: annBody,
              }, "Announcement posted!");
            }}
            className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
          >
            <h3 className="text-base font-semibold text-slate-950">Organizer: Post Announcement</h3>
            <Input placeholder="Announcement title" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} required />
            <Textarea placeholder="Announcement details for participants..." value={annBody} onChange={(e) => setAnnBody(e.target.value)} required />
            <Button type="submit" size="sm" variant="outline" disabled={busy}>Post Announcement</Button>
          </form>
        </div>
      ) : null}

      {/* Confidential Organizer & Judge Scoring Interface */}
      {isOrganizerOrJudge ? (
        <div className="rounded-xl border border-teal-200 bg-white p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Confidential Judging & Results Console
              </h3>
              <p className="text-xs text-slate-600">
                Scores and judge feedback remain strictly hidden from students until results are published.
              </p>
            </div>
            {isOrganizer && !resultsPublished ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  callApi(`/api/hackathons/${hackathonId}/judge`, "PATCH", undefined, "Results published & leaderboard ranked!")
                }
              >
                Publish Final Results & Rankings
              </Button>
            ) : null}
          </div>

          {submissions.length === 0 ? (
            <p className="text-sm text-slate-500">No team submissions yet.</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                callApi(`/api/hackathons/${hackathonId}/judge`, "POST", {
                  submission_id: judgeSubId,
                  innovation_score: innovation,
                  execution_score: execution,
                  design_score: design,
                  impact_score: impact,
                  feedback: judgeFeedback,
                  is_finalized: true,
                }, "Evaluation saved!");
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <Label>Select Submission to Evaluate</Label>
                <NativeSelect value={judgeSubId} onChange={(e) => setJudgeSubId(e.target.value)}>
                  {submissions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.project_title} ({s.team?.name || "Team"}) — Current Score: {s.total_score ?? "Unscored"}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <Label>Innovation (0–10)</Label>
                  <Input type="number" min={0} max={10} step="0.5" value={innovation} onChange={(e) => setInnovation(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label>Execution (0–10)</Label>
                  <Input type="number" min={0} max={10} step="0.5" value={execution} onChange={(e) => setExecution(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label>Design (0–10)</Label>
                  <Input type="number" min={0} max={10} step="0.5" value={design} onChange={(e) => setDesign(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label>Impact (0–10)</Label>
                  <Input type="number" min={0} max={10} step="0.5" value={impact} onChange={(e) => setImpact(Number(e.target.value))} />
                </div>
              </div>
              <Textarea
                placeholder="Confidential judge feedback..."
                value={judgeFeedback}
                onChange={(e) => setJudgeFeedback(e.target.value)}
                required
                minLength={5}
              />
              <Button type="submit" variant="accent" disabled={busy}>
                Save Judge Evaluation
              </Button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
