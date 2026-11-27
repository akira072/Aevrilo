import Link from "next/link";
import { ArrowRight, Briefcase, CheckCircle2, FolderKanban, MessageSquare, Trophy, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/utils";
import type { FreelanceRequest, ProjectRecord } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard",
};

function computeProfileCompleteness(profile: {
  full_name?: string;
  headline?: string;
  bio?: string;
  college_or_org?: string;
  specialization?: string;
} | null) {
  if (!profile) return 0;
  const fields = [
    profile.full_name,
    profile.headline,
    profile.bio,
    profile.college_or_org,
    profile.specialization,
  ];
  const filled = fields.filter((v) => Boolean(v && v.trim().length > 1)).length;
  return Math.round((filled / fields.length) * 100);
}

export default async function DashboardPage() {
  const session = await requireAuthenticatedUser("/login?next=/dashboard");
  const supabase = await createServerSupabaseClient();

  if (session.unconfigured || !supabase || !session.userId) {
    return (
      <DashboardShell title="Workspace Dashboard" subtitle="Connect Supabase to activate live project & hackathon data.">
        <Card>
          <CardHeader>
            <CardTitle>Configuration Required</CardTitle>
            <CardDescription>
              Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>.
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardShell>
    );
  }

  const uid = session.userId;

  const [
    { count: myAppsCount },
    { count: myRequestsCount },
    { data: myProjectsData },
    { data: paymentsData },
    { data: recommendedRequestsData },
    { count: hackathonRegsCount },
  ] = await Promise.all([
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("freelancer_id", uid),
    supabase.from("requests").select("id", { count: "exact", head: true }).eq("client_id", uid),
    supabase
      .from("projects")
      .select("*, client:profiles!projects_client_id_fkey(full_name), freelancer:profiles!projects_freelancer_id_fkey(full_name)")
      .or(`client_id.eq.${uid},freelancer_id.eq.${uid}`)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("payment_records")
      .select("net_amount_inr, gross_amount_inr, status, payee_id, payer_id")
      .or(`payee_id.eq.${uid},payer_id.eq.${uid}`),
    supabase
      .from("requests")
      .select("*, category:categories(name)")
      .eq("status", "OPEN")
      .neq("client_id", uid)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("registrations").select("id", { count: "exact", head: true }).eq("user_id", uid),
  ]);

  const projects = (myProjectsData ?? []) as unknown as ProjectRecord[];
  const activeProjects = projects.filter((p) =>
    ["ASSIGNED", "IN PROGRESS", "DELIVERED"].includes(p.status)
  );
  const completedProjects = projects.filter((p) => p.status === "COMPLETED");

  const earningsTotal = (paymentsData ?? [])
    .filter((p) => p.payee_id === uid && p.status === "successful")
    .reduce((acc, p) => acc + Number(p.net_amount_inr || 0), 0);

  const pendingPayoutsTotal = (paymentsData ?? [])
    .filter((p) => p.payee_id === uid && ["pending", "processing"].includes(p.status))
    .reduce((acc, p) => acc + Number(p.net_amount_inr || 0), 0);

  const completeness = computeProfileCompleteness(session.profile);
  const recommended = (recommendedRequestsData ?? []) as unknown as FreelanceRequest[];

  return (
    <DashboardShell
      isAdmin={session.isAdmin}
      title={`Welcome, ${session.profile?.full_name || "Creator"}`}
      subtitle="Unified overview across your freelance projects, client requests, and hackathon entries."
      actions={
        <>
          <Button asChild variant="outline" size="sm">
            <Link href="/explore">Explore Work</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/requests/new">Post a Request</Link>
          </Button>
        </>
      }
    >
      {/* Profile completeness alert */}
      {completeness < 100 ? (
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-indigo-950">
              Profile completeness: {completeness}%
            </p>
            <p className="text-xs text-indigo-800">
              Complete your headline, college/organization, specialization, and bio to stand out to clients.
            </p>
          </div>
          <Button asChild size="sm" variant="default">
            <Link href="/profile">Complete Profile</Link>
          </Button>
        </div>
      ) : null}

      {/* Real Database Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Active Projects</span>
              <FolderKanban className="h-4 w-4 text-indigo-700" />
            </CardDescription>
            <CardTitle className="font-mono text-2xl">{activeProjects.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            {completedProjects.length} completed total
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Proposals & Requests</span>
              <Briefcase className="h-4 w-4 text-slate-600" />
            </CardDescription>
            <CardTitle className="font-mono text-2xl">
              {myAppsCount ?? 0} / {myRequestsCount ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            Applications sent / Requests posted
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Verified Earnings (INR)</span>
              <Wallet className="h-4 w-4 text-teal-700" />
            </CardDescription>
            <CardTitle className="font-mono text-2xl">{formatINR(earningsTotal)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            Pending settlement: {formatINR(pendingPayoutsTotal)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Hackathons Joined</span>
              <Trophy className="h-4 w-4 text-teal-700" />
            </CardDescription>
            <CardTitle className="font-mono text-2xl">{hackathonRegsCount ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            <Link href="/hackathons" className="text-teal-800 hover:underline">
              Browse hackathons →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Projects</CardTitle>
              <CardDescription>Projects where you are client or freelancer</CardDescription>
            </div>
            <Link href="/projects" className="text-xs font-medium text-indigo-700 hover:underline">
              All projects →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-sm text-slate-500">
                No active projects yet. Apply to requests or accept a proposal to start collaborating.
              </p>
            ) : (
              projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <div className="min-w-0 pr-3">
                    <p className="truncate text-sm font-medium text-slate-900">{p.title}</p>
                    <p className="text-xs text-slate-500">
                      {p.client_id === uid ? "Client" : "Freelancer"} · Due {formatDate(p.deadline)}
                    </p>
                  </div>
                  <Badge variant={p.status === "COMPLETED" ? "teal" : "indigo"}>{p.status}</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recommended Opportunities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Open Opportunities</CardTitle>
              <CardDescription>Latest freelance requests you can apply to</CardDescription>
            </div>
            <Link href="/explore" className="text-xs font-medium text-indigo-700 hover:underline">
              Explore all →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommended.length === 0 ? (
              <p className="text-sm text-slate-500">No open requests from other users right now.</p>
            ) : (
              recommended.map((req) => (
                <Link
                  key={req.id}
                  href={`/explore/${req.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <div className="min-w-0 pr-3">
                    <p className="truncate text-sm font-medium text-slate-900">{req.title}</p>
                    <p className="text-xs text-slate-500">
                      {req.category?.name} · Due {formatDate(req.deadline)}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold text-slate-900">
                    {formatINR(req.budget_inr)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/portfolio" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-indigo-700" />
            <span className="text-sm font-medium text-slate-900">Manage Portfolio</span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </Link>
        <Link href="/messages" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-teal-700" />
            <span className="text-sm font-medium text-slate-900">Project Messages</span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </Link>
        <Link href="/hackathons/create" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-teal-300">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-teal-700" />
            <span className="text-sm font-medium text-slate-900">Organize Hackathon</span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </Link>
      </div>
    </DashboardShell>
  );
}
