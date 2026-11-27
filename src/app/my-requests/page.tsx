import Link from "next/link";
import { FileText } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/utils";
import type { FreelanceRequest } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Requests",
};

export default async function MyRequestsPage() {
  const session = await requireAuthenticatedUser("/login?next=/my-requests");
  const supabase = await createServerSupabaseClient();

  let requests: FreelanceRequest[] = [];
  if (supabase && session.userId) {
    const { data } = await supabase
      .from("requests")
      .select("*, category:categories(name)")
      .eq("client_id", session.userId)
      .order("created_at", { ascending: false });
    requests = (data ?? []) as unknown as FreelanceRequest[];
  }

  return (
    <DashboardShell
      isAdmin={session.isAdmin}
      title="My Requests"
      subtitle="Manage freelance requirements you posted and review incoming proposals."
      actions={
        <Button asChild size="sm">
          <Link href="/requests/new">Post New Request</Link>
        </Button>
      }
    >
      {requests.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="You haven't posted any requests yet"
          description="Publish a scoped freelance request with an INR budget to receive proposals from student creators."
          actionLabel="Post a Request"
          actionHref="/requests/new"
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="indigo">{req.category?.name}</Badge>
                    <Badge variant="teal">{req.status}</Badge>
                  </div>
                  <CardTitle className="mt-2 text-lg">{req.title}</CardTitle>
                  <CardDescription>
                    Budget {formatINR(req.budget_inr)} · Deadline {formatDate(req.deadline)} ·{" "}
                    {req.applications_count} proposals
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/explore/${req.id}`}>View Proposals & Details</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-slate-600">{req.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
