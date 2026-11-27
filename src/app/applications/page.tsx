import Link from "next/link";
import { Briefcase } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { WithdrawApplicationButton } from "@/components/marketplace/withdraw-button";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/utils";
import type { ApplicationRecord } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Applications",
};

export default async function MyApplicationsPage() {
  const session = await requireAuthenticatedUser("/login?next=/applications");
  const supabase = await createServerSupabaseClient();

  let apps: ApplicationRecord[] = [];
  if (supabase && session.userId) {
    const { data } = await supabase
      .from("applications")
      .select("*, request:requests(id, title, budget_inr, deadline, status)")
      .eq("freelancer_id", session.userId)
      .order("created_at", { ascending: false });
    apps = (data ?? []) as unknown as ApplicationRecord[];
  }

  return (
    <DashboardShell
      isAdmin={session.isAdmin}
      title="My Applications"
      subtitle="Track freelance proposals you have submitted."
      actions={
        <Button asChild size="sm">
          <Link href="/explore">Browse Requests</Link>
        </Button>
      }
    >
      {apps.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No proposals submitted yet"
          description="Explore open freelance opportunities and submit a tailored pitch."
          actionLabel="Explore Projects"
          actionHref="/explore"
        />
      ) : (
        <div className="space-y-4">
          {apps.map((app) => (
            <Card key={app.id}>
              <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        app.status === "accepted"
                          ? "teal"
                          : app.status === "rejected"
                          ? "rose"
                          : "indigo"
                      }
                      className="capitalize"
                    >
                      {app.status}
                    </Badge>
                    <span className="font-mono text-sm font-semibold text-slate-900">
                      {formatINR(app.proposed_price_inr)}
                    </span>
                    <span className="text-xs text-slate-500">· {app.estimated_days} days</span>
                  </div>
                  <CardTitle className="mt-2 text-base">
                    <Link href={`/explore/${app.request_id}`} className="hover:text-indigo-700">
                      {app.request?.title || "Freelance Request"}
                    </Link>
                  </CardTitle>
                  <CardDescription>Submitted {formatDate(app.created_at)}</CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/explore/${app.request_id}`}>View Request</Link>
                  </Button>
                  {["pending", "shortlisted"].includes(app.status) ? (
                    <WithdrawApplicationButton applicationId={app.id} />
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-slate-600">{app.cover_message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
