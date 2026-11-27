import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewRequestForm } from "@/components/marketplace/new-request-form";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getFutureDateIso } from "@/lib/utils";
import type { Category } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Post a Request",
};

export default async function NewRequestPage() {
  const session = await requireAuthenticatedUser("/login?next=/requests/new");
  const supabase = await createServerSupabaseClient();

  let categories: Category[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    categories = (data ?? []) as Category[];
  }

  const defaultDeadline = getFutureDateIso(7);

  return (
    <DashboardShell
      isAdmin={session.isAdmin}
      title="Post a Freelance Request"
      subtitle="Describe your project scope, INR budget, required skills, and target deadline."
    >
      <Card>
        <CardHeader>
          <CardTitle>Project Requirement Details</CardTitle>
          <CardDescription>
            Freelancers across Aevrilo will submit proposals tailored to your scope.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session.unconfigured ? (
            <p className="text-sm text-amber-800">
              Configure Supabase credentials in <code>.env.local</code> to publish requests.
            </p>
          ) : (
            <NewRequestForm categories={categories} defaultDeadline={defaultDeadline} />
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
