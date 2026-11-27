import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordUpdateForm } from "@/components/profile/password-update-form";
import { requireAuthenticatedUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Account Settings",
};

export default async function SettingsPage() {
  const session = await requireAuthenticatedUser("/login?next=/settings");

  return (
    <DashboardShell
      isAdmin={session.isAdmin}
      title="Account Settings"
      subtitle="Manage authentication, verified email status, and active platform roles."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Identity & Roles</CardTitle>
            <CardDescription>Current permissions attached to your Aevrilo account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-slate-500">Primary Email:</span>{" "}
              <span className="font-medium text-slate-900">{session.email || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500">Email Verification:</span>{" "}
              <Badge variant={session.emailConfirmed ? "teal" : "amber"}>
                {session.emailConfirmed ? "Verified" : "Pending Verification"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-slate-500">Assigned Roles:</span>
              {session.roles.map((r) => (
                <Badge key={r} variant="indigo" className="capitalize">
                  {r}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Password</CardTitle>
            <CardDescription>Set a new strong password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordUpdateForm />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
