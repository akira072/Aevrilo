import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectWorkspaceControls } from "@/components/marketplace/project-workspace";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/utils";
import type { ProjectRecord } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuthenticatedUser(`/login?next=/projects/${id}`);
  const supabase = await createServerSupabaseClient();

  if (!supabase || !session.userId) {
    return (
      <DashboardShell title="Project Workspace">
        <p className="text-sm text-slate-600">Supabase credentials are required.</p>
      </DashboardShell>
    );
  }

  const [{ data: projectData }, { data: deliverables }, { data: conversation }, { data: myReview }] =
    await Promise.all([
      supabase
        .from("projects")
        .select(
          "*, client:profiles!projects_client_id_fkey(id, full_name, username), freelancer:profiles!projects_freelancer_id_fkey(id, full_name, username)"
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("project_deliverables")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("conversations").select("id").eq("project_id", id).maybeSingle(),
      supabase
        .from("reviews")
        .select("id")
        .eq("project_id", id)
        .eq("reviewer_id", session.userId)
        .maybeSingle(),
    ]);

  if (!projectData) {
    notFound();
  }

  const project = projectData as unknown as ProjectRecord;

  return (
    <DashboardShell
      isAdmin={session.isAdmin}
      title={project.title}
      subtitle={`Project ID: ${project.id.slice(0, 8)} · Revisions: ${project.revision_count}`}
      actions={
        <Button asChild size="sm" variant="outline">
          <Link href={conversation?.id ? `/messages?c=${conversation.id}` : "/messages"}>
            <MessageSquare className="h-4 w-4" /> Project Chat
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Project Lifecycle Status</CardDescription>
            <CardTitle>
              <Badge variant={project.status === "COMPLETED" ? "teal" : "indigo"} className="text-sm">
                {project.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-600">
            Deadline: {formatDate(project.deadline)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Financial Breakdown (INR)</CardDescription>
            <CardTitle className="font-mono text-xl">{formatINR(project.agreed_budget_inr)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-600">
            Fee ({(project.commission_bps / 100).toFixed(1)}%): {formatINR(project.commission_amount_inr)} ·
            Freelancer Net: <strong>{formatINR(project.freelancer_payout_inr)}</strong>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Participants & Settlement</CardDescription>
            <CardTitle className="text-sm">
              Client: {project.client?.full_name} <br />
              Creator: {project.freelancer?.full_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 capitalize">
            Payment Record: {project.payment_status}
          </CardContent>
        </Card>
      </div>

      <ProjectWorkspaceControls
        project={project}
        userId={session.userId}
        deliverables={deliverables ?? []}
        hasReviewed={Boolean(myReview)}
      />
    </DashboardShell>
  );
}
