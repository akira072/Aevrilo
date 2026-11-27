import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/utils";
import type { ProjectRecord } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Projects",
};

export default async function ProjectsListPage() {
  const session = await requireAuthenticatedUser("/login?next=/projects");
  const supabase = await createServerSupabaseClient();

  let projects: ProjectRecord[] = [];
  if (supabase && session.userId) {
    const { data } = await supabase
      .from("projects")
      .select(
        "*, client:profiles!projects_client_id_fkey(id, full_name, username), freelancer:profiles!projects_freelancer_id_fkey(id, full_name, username)"
      )
      .or(`client_id.eq.${session.userId},freelancer_id.eq.${session.userId}`)
      .order("updated_at", { ascending: false });
    projects = (data ?? []) as unknown as ProjectRecord[];
  }

  return (
    <DashboardShell
      isAdmin={session.isAdmin}
      title="My Projects"
      subtitle="Collaborate, submit deliverables, request revisions, and track INR payment status."
    >
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No active or completed projects"
          description="Projects are created automatically when a client accepts a freelancer's proposal."
          actionLabel="Explore Requests"
          actionHref="/explore"
        />
      ) : (
        <div className="space-y-4">
          {projects.map((p) => {
            const isClient = p.client_id === session.userId;
            return (
              <Card key={p.id}>
                <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={p.status === "COMPLETED" ? "teal" : "indigo"}>
                        {p.status}
                      </Badge>
                      <Badge variant="outline">{isClient ? "Role: Client" : "Role: Freelancer"}</Badge>
                      <Badge variant={p.payment_status === "successful" ? "teal" : "amber"} className="capitalize">
                        Payment: {p.payment_status}
                      </Badge>
                    </div>
                    <CardTitle className="mt-2 text-lg">
                      <Link href={`/projects/${p.id}`} className="hover:text-indigo-700">
                        {p.title}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      Agreed: {formatINR(p.agreed_budget_inr)} · Deadline {formatDate(p.deadline)} ·{" "}
                      {isClient
                        ? `Freelancer: ${p.freelancer?.full_name}`
                        : `Client: ${p.client?.full_name}`}
                    </CardDescription>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/projects/${p.id}`}>Open Workspace</Link>
                  </Button>
                </CardHeader>
                <CardContent className="text-xs text-slate-500">
                  Net Freelancer Payout: {formatINR(p.freelancer_payout_inr)} (Platform commission{" "}
                  {(p.commission_bps / 100).toFixed(1)}%: {formatINR(p.commission_amount_inr)})
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
