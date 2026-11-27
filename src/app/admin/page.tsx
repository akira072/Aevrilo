import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminConsoleClient } from "@/components/admin/admin-console";
import { requireAdminUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Console",
};

export default async function AdminPage() {
  const session = await requireAdminUser();
  const supabase = await createServerSupabaseClient();

  if (session.unconfigured || !supabase) {
    return (
      <DashboardShell isAdmin title="Admin Console">
        <p className="text-sm text-slate-600">Supabase credentials are required.</p>
      </DashboardShell>
    );
  }

  const [
    { count: usersCount },
    { count: requestsCount },
    { count: completedCount },
    { count: hackathonsCount },
    { count: openReportsCount },
    { data: settings },
    { data: users },
    { data: reports },
    { data: payments },
    { data: auditLogs },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("requests").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "COMPLETED"),
    supabase.from("hackathons").select("id", { count: "exact", head: true }),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("platform_settings").select("freelance_commission_bps").eq("id", 1).maybeSingle(),
    supabase
      .from("profiles")
      .select("id, full_name, username, college_or_org, account_status, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("payment_records").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(25),
  ]);

  return (
    <DashboardShell
      isAdmin
      title="Admin Console"
      subtitle="Platform moderation, hackathon oversight, payment UTR verification, analytics, and audit logs."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Registered Users", value: usersCount ?? 0 },
          { label: "Total Requests", value: requestsCount ?? 0 },
          { label: "Completed Projects", value: completedCount ?? 0 },
          { label: "Hackathons", value: hackathonsCount ?? 0 },
          { label: "Open Reports", value: openReportsCount ?? 0 },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-3">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="font-mono text-2xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <AdminConsoleClient
        commissionBps={settings?.freelance_commission_bps ?? 500}
        users={users ?? []}
        reports={reports ?? []}
        payments={payments ?? []}
        auditLogs={auditLogs ?? []}
      />
    </DashboardShell>
  );
}
