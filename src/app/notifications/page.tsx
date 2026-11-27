import Link from "next/link";
import { Bell } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MarkAllReadButton } from "@/components/notifications/mark-read-button";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const session = await requireAuthenticatedUser("/login?next=/notifications");
  const supabase = await createServerSupabaseClient();

  let notifications: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    link_url: string;
    is_read: boolean;
    created_at: string;
  }> = [];

  if (supabase && session.userId) {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    notifications = data ?? [];
  }

  return (
    <DashboardShell
      isAdmin={session.isAdmin}
      title="Notifications"
      subtitle="Application updates, project milestones, team invites, and payout alerts."
      actions={notifications.some((n) => !n.is_read) ? <MarkAllReadButton /> : undefined}
    >
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up"
          description="You will receive notifications for new proposals, project messages, deliverables, and hackathon announcements."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className={n.is_read ? "opacity-80" : "border-indigo-200"}>
              <CardContent className="flex flex-col justify-between gap-2 py-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {!n.is_read ? <Badge variant="indigo">New</Badge> : null}
                    <span className="text-sm font-semibold text-slate-950">{n.title}</span>
                  </div>
                  <p className="text-sm text-slate-600">{n.body}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(n.created_at)}</p>
                </div>
                {n.link_url ? (
                  <Link
                    href={n.link_url}
                    className="shrink-0 text-xs font-medium text-indigo-700 hover:underline"
                  >
                    Open →
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
