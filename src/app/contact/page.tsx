import Link from "next/link";
import { Mail, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SupportReportForm } from "@/components/shared/support-report-form";
import { getCurrentUserContext } from "@/lib/auth/session";

export const metadata = {
  title: "Contact & Support",
};

export default async function ContactPage() {
  const session = await getCurrentUserContext();

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Support & Trust</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
          Contact & Dispute Resolution
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Need help with a project deliverable, payment reference verification, or hackathon rule? Submit a report or contact our campus operations team.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Submit a Platform Report or Support Ticket</CardTitle>
            <CardDescription>
              Logged-in users can file verifiable reports directly into the Admin Moderation Queue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {session.userId ? (
              <SupportReportForm userId={session.userId} />
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-sm text-slate-700">
                  Please log in to file a tracked dispute or safety report tied to your account.
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link href="/login?next=/contact">Log in to Submit Report</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Mail className="h-5 w-5 text-indigo-700" />
              <CardTitle className="mt-2 text-base">Direct Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>General inquiries & campus partnerships:</p>
              <p className="font-mono text-xs text-slate-900">support@aevrilo.in</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <ShieldAlert className="h-5 w-5 text-rose-700" />
              <CardTitle className="mt-2 text-base">Dispute Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-xs leading-relaxed text-slate-600">
              Every submitted report is logged with timestamps and reviewed by an administrator in our audit-logged moderation console.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
