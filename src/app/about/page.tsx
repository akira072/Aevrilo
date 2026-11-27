import Link from "next/link";
import { ShieldCheck, Sparkles, Trophy, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "About Aevrilo",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">About Aevrilo</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Where student innovation and creative freelance talent meet.
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-slate-600">
          Aevrilo connects college creators, developers, designers, 3D artists, and campus hackathon organizers in one unified ecosystem—so great ideas never stall for lack of talent, and skilled students turn capabilities into real-world experience and earnings.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Sparkles className="h-5 w-5 text-indigo-700" />
            <CardTitle className="mt-2">CREATE — Freelance Marketplace</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-slate-600">
            Post structured project requirements across 10 creative and technical categories, review proposals, manage deliverables and revisions, and record verified INR project settlements.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Trophy className="h-5 w-5 text-teal-700" />
            <CardTitle className="mt-2">COMPETE — Hackathon Ecosystem</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-slate-600">
            Run campus hackathons end-to-end: problem statements, team formation with size validation, deadline-guarded submissions, confidential judging rubrics, and transparent winner prize tracking.
          </CardContent>
        </Card>
      </div>

      <section id="policies" className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex items-center gap-2 text-slate-950">
          <Wallet className="h-5 w-5 text-indigo-700" />
          <h2 className="text-xl font-semibold">India INR Revenue & Payment Policy</h2>
        </div>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
          <li><strong>Zero Freelancer Joining Fee:</strong> Creating an account, showcasing portfolios, and applying to requests is completely free (₹0).</li>
          <li><strong>Transparent Commission:</strong> Aevrilo charges a configurable 5% commission on successfully completed freelance projects (for example, ₹250 on a ₹5,000 project, leaving ₹4,750 before applicable statutory deductions).</li>
          <li><strong>External Settlement Records (MVP):</strong> Client-to-freelancer settlements and organizer-funded hackathon prizes occur via approved external UPI or bank transfer arrangements, tracked with verifiable UTR references. Aevrilo does not operate an internal wallet, hold customer funds in ordinary bank accounts, or provide crypto custody.</li>
        </ul>
      </section>

      <section id="privacy" className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex items-center gap-2 text-slate-950">
          <ShieldCheck className="h-5 w-5 text-teal-700" />
          <h2 className="text-xl font-semibold">Security, Privacy & Academic Integrity</h2>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          All data access is governed by PostgreSQL Row Level Security (RLS), Zod input validation, and server-side role verification. Confidential hackathon judge evaluations remain hidden from students until organizers publish official results.
        </p>
      </section>

      <section id="setup" className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-950">Environment Setup Checklist</h2>
        <p className="text-sm text-slate-600">
          To run Aevrilo with live persistence, copy <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">.env.example</code> to <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">.env.local</code>, apply the SQL migrations in <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">supabase/migrations/</code>, and run <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">supabase/seed.sql</code>.
        </p>
        <div className="pt-2">
          <Button asChild size="sm">
            <Link href="/explore">Explore Marketplace</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
