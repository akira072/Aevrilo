import Link from "next/link";
import { Calendar, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/utils";
import type { HackathonRecord } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hackathons",
};

export default async function HackathonsPage() {
  const supabase = await createServerSupabaseClient();
  let hackathons: HackathonRecord[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("hackathons")
      .select("*, organizer:profiles(id, full_name, username, college_or_org)")
      .neq("status", "draft")
      .order("start_date", { ascending: true });
    hackathons = (data ?? []) as unknown as HackathonRecord[];
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            COMPETE Ecosystem
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Hackathons & Innovation Challenges
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Form campus teams, pick problem statements, ship prototypes, and win sponsored INR prizes.
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href="/hackathons/create">Host a Hackathon</Link>
        </Button>
      </div>

      {hackathons.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No hackathons published yet"
          description="Organizers and campus clubs can launch a hackathon with problem statements, team limits, and judging rubrics."
          actionLabel="Host a Hackathon"
          actionHref="/hackathons/create"
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hackathons.map((hack) => (
            <Card key={hack.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="teal" className="capitalize">
                    {hack.status.replace("_", " ")}
                  </Badge>
                  <span className="font-mono text-sm font-semibold text-teal-800">
                    {formatINR(hack.prize_pool_inr)} Prize Pool
                  </span>
                </div>
                <CardTitle className="mt-2 text-lg">
                  <Link href={`/hackathons/${hack.id}`} className="hover:text-teal-800">
                    {hack.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p className="line-clamp-2">{hack.tagline || hack.description}</p>
                <div className="space-y-1 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Team size: {hack.min_team_size}–{hack.max_team_size} ·{" "}
                    <span className="capitalize">{hack.mode}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Register by {formatDate(hack.registration_deadline)}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="text-xs text-slate-500">
                <span className="truncate">
                  {hack.organizer?.college_or_org || hack.organizer?.full_name || "Organizer"}
                </span>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/hackathons/${hack.id}`}>Open Event</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
