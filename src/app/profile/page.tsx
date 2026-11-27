import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Profile",
};

export default async function ProfilePage() {
  const session = await requireAuthenticatedUser("/login?next=/profile");
  const supabase = await createServerSupabaseClient();

  let currentSkills: string[] = [];
  if (supabase && session.userId) {
    const { data } = await supabase
      .from("user_skills")
      .select("skill:skills(name)")
      .eq("user_id", session.userId);
    currentSkills = (data ?? [])
      .map((r: Record<string, unknown>) => (r.skill as { name?: string } | null)?.name)
      .filter((n): n is string => Boolean(n));
  }

  return (
    <DashboardShell
      isAdmin={session.isAdmin}
      title="My Profile"
      subtitle="Manage your creator identity, campus verification, availability, and client/freelancer toggles."
      actions={
        session.profile?.username ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/freelancers/${session.profile.username}`}>View Public Profile</Link>
          </Button>
        ) : null
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>
            Changes update your public creator directory listing and proposal identity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session.profile ? (
            <ProfileEditor profile={session.profile} initialSkills={currentSkills} />
          ) : (
            <p className="text-sm text-slate-600">Profile record not found or Supabase not configured.</p>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
