import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink, GitBranch, MapPin, Star, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { PortfolioItem, Profile } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function FreelancerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-sm text-slate-600">
        Supabase is not configured yet.
      </div>
    );
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profileData) {
    notFound();
  }

  const profile = profileData as Profile;

  const [{ data: skillRows }, { data: portfolioRows }, { data: reviewRows }] = await Promise.all([
    supabase
      .from("user_skills")
      .select("proficiency, skill:skills(name)")
      .eq("user_id", profile.id),
    supabase
      .from("portfolios")
      .select("*, category:categories(name), media:portfolio_media(*)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("reviews")
      .select("*, reviewer:profiles!reviews_reviewer_id_fkey(full_name, username)")
      .eq("reviewee_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const skills = (skillRows ?? []).map((r: Record<string, unknown>) => ({
    name: (r.skill as { name?: string } | null)?.name ?? "",
    proficiency: String(r.proficiency ?? "intermediate"),
  })).filter((s) => s.name);

  const portfolios = (portfolioRows ?? []) as unknown as PortfolioItem[];
  const reviews = (reviewRows ?? []) as Array<{
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    reviewer?: { full_name?: string; username?: string } | null;
  }>;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <Card>
        <CardContent className="flex flex-col justify-between gap-6 pt-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-semibold text-indigo-800">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-slate-950">{profile.full_name}</h1>
                <Badge
                  variant={profile.availability === "available" ? "teal" : "default"}
                  className="capitalize"
                >
                  {profile.availability}
                </Badge>
                {profile.college_email_verified ? (
                  <Badge variant="teal">
                    <CheckCircle2 className="h-3 w-3" /> Verified Campus Student
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm font-medium text-slate-700">
                {profile.headline || profile.specialization || "Creator on Aevrilo"}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span>@{profile.username}</span>
                {profile.college_or_org ? <span>{profile.college_or_org}</span> : null}
                {profile.city ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {profile.city}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  {Number(profile.rating_avg || 0).toFixed(1)} ({profile.reviews_count} reviews) ·{" "}
                  {profile.completed_projects_count} projects completed
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/requests/new">Post a Request</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/messages">Message</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-slate-600">
              {profile.bio || "No bio added yet."}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skills & Tools</CardTitle>
            </CardHeader>
            <CardContent>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill.name} variant="indigo">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No skills listed yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Projects ({portfolios.length})</CardTitle>
              <CardDescription>Verified work samples, demos, and repositories.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {portfolios.length === 0 ? (
                <p className="text-sm text-slate-500">No portfolio projects uploaded yet.</p>
              ) : (
                portfolios.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-950">{item.title}</h3>
                      {item.category?.name ? <Badge variant="default">{item.category.name}</Badge> : null}
                    </div>
                    <p className="text-sm text-slate-600">{item.description}</p>
                    {item.media && item.media.length > 0 ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {item.media.map((m) => (
                          <img
                            key={m.id}
                            src={m.public_url}
                            alt={item.title}
                            className="h-44 w-full rounded-lg border border-slate-200 object-cover"
                          />
                        ))}
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-3 text-xs">
                      {item.live_demo_url ? (
                        <a
                          href={item.live_demo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-indigo-700 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Live Demo
                        </a>
                      ) : null}
                      {item.github_url ? (
                        <a
                          href={item.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-slate-800 hover:underline"
                        >
                          <GitBranch className="h-3.5 w-3.5" /> GitHub
                        </a>
                      ) : null}
                      {item.video_url ? (
                        <a
                          href={item.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-teal-800 hover:underline"
                        >
                          <Video className="h-3.5 w-3.5" /> Video Reel
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client & Peer Reviews ({reviews.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reviews.length === 0 ? (
                <p className="text-sm text-slate-500">No completed project reviews yet.</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="rounded-lg border border-slate-200 p-3.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium text-slate-900">
                        {rev.reviewer?.full_name || "Aevrilo User"}
                      </span>
                      <span>
                        {"★".repeat(rev.rating)} · {formatDate(rev.created_at)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-700">{rev.comment}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
