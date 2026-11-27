import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateHackathonForm } from "@/components/hackathons/create-hackathon-form";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getFutureDateTimeLocal } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Host a Hackathon",
};

export default async function CreateHackathonPage() {
  const session = await requireAuthenticatedUser("/login?next=/hackathons/create");
  const defaultDates = {
    regDeadline: getFutureDateTimeLocal(7),
    startDate: getFutureDateTimeLocal(8),
    endDate: getFutureDateTimeLocal(10),
  };

  return (
    <DashboardShell
      isAdmin={session.isAdmin}
      title="Host a Hackathon"
      subtitle="Configure tracks, team sizes, deadlines, and prize pools for your campus event."
    >
      <Card>
        <CardHeader>
          <CardTitle>Hackathon Configuration</CardTitle>
          <CardDescription>
            Requires Organizer or Admin role. Admins can grant organizer permissions in the Admin Console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session.isOrganizer ? (
            <CreateHackathonForm defaultDates={defaultDates} />
          ) : (
            <p className="text-sm text-amber-800">
              Your account currently has Client & Freelancer roles. Ask an Aevrilo Administrator to grant the <strong>organizer</strong> role to publish hackathons.
            </p>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
