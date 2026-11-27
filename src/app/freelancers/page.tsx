import Link from "next/link";
import { CheckCircle2, Search, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, NativeSelect } from "@/components/ui/input";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Explore Freelancers",
};

interface FreelancerSearchParams {
  q?: string;
  availability?: string;
}

export default async function FreelancersPage({
  searchParams,
}: {
  searchParams: Promise<FreelancerSearchParams>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const availability = (params.availability || "").trim();

  const supabase = await createServerSupabaseClient();
  let freelancers: Array<Profile & { skillsList?: string[] }> = [];

  if (supabase) {
    let query = supabase
      .from("profiles")
      .select(
        "id, full_name, username, avatar_url, headline, bio, college_or_org, college_email_verified, specialization, city, availability, rating_avg, reviews_count, completed_projects_count, user_skills(skill:skills(name))"
      )
      .eq("account_status", "active")
      .eq("is_freelancer_enabled", true);

    if (q) {
      query = query.or(
        `full_name.ilike.%${q}%,headline.ilike.%${q}%,specialization.ilike.%${q}%,college_or_org.ilike.%${q}%`
      );
    }
    if (availability && ["available", "busy", "unavailable"].includes(availability)) {
      query = query.eq("availability", availability);
    }

    const { data } = await query
      .order("completed_projects_count", { ascending: false })
      .order("rating_avg", { ascending: false })
      .limit(36);

    freelancers = (data ?? []).map((row: Record<string, unknown>) => {
      const rawSkills = (row.user_skills as Array<{ skill?: { name?: string } | null }> | null) ?? [];
      return {
        ...(row as unknown as Profile),
        skillsList: rawSkills
          .map((item) => item.skill?.name)
          .filter((n): n is string => Boolean(n)),
      };
    });
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Talent Directory
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Explore Student Creators & Freelancers
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse verified portfolios, skills, and project ratings across disciplines.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/requests/new">Post a Request</Link>
        </Button>
      </div>

      <form
        method="GET"
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4"
      >
        <div className="relative sm:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search by name, specialization, college..."
            className="pl-9"
          />
        </div>
        <NativeSelect name="availability" defaultValue={availability}>
          <option value="">Any Availability</option>
          <option value="available">Available Now</option>
          <option value="busy">Busy</option>
          <option value="unavailable">Unavailable</option>
        </NativeSelect>
        <Button type="submit" variant="secondary">
          Filter Talent
        </Button>
      </form>

      {freelancers.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {freelancers.map((creator) => (
            <Card key={creator.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-800">
                      {creator.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        <Link
                          href={`/freelancers/${creator.username}`}
                          className="hover:text-indigo-700"
                        >
                          {creator.full_name}
                        </Link>
                      </CardTitle>
                      <p className="truncate text-xs text-slate-500">
                        @{creator.username}
                        {creator.college_or_org ? ` · ${creator.college_or_org}` : ""}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={creator.availability === "available" ? "teal" : "default"}
                    className="capitalize shrink-0"
                  >
                    {creator.availability}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="line-clamp-2 text-sm text-slate-700">
                  {creator.headline || creator.specialization || "Multidisciplinary student creator"}
                </p>
                {creator.skillsList && creator.skillsList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {creator.skillsList.slice(0, 5).map((s) => (
                      <Badge key={s} variant="default" className="text-[11px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {creator.college_email_verified ? (
                  <p className="inline-flex items-center gap-1 text-xs font-medium text-teal-800">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified Campus Email
                  </p>
                ) : null}
              </CardContent>
              <CardFooter className="text-xs text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  {Number(creator.rating_avg || 0).toFixed(1)} ({creator.reviews_count}) ·{" "}
                  {creator.completed_projects_count} done
                </span>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/freelancers/${creator.username}`}>View Portfolio</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No matching creators found"
          description="Try broadening your search terms or join Aevrilo free to showcase your creative portfolio."
          actionLabel="Sign up free"
          actionHref="/signup"
        />
      )}
    </div>
  );
}
