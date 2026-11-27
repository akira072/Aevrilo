import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  FolderPlus,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CategoryIcon } from "@/components/shared/category-icon";
import { FREELANCE_CATEGORIES } from "@/lib/domain/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/utils";
import type { FreelanceRequest, HackathonRecord, Profile } from "@/types/database";

export const dynamic = "force-dynamic";

async function getHomeData() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      stats: { creators: 0, openRequests: 0, completedProjects: 0, hackathons: 0 },
      featuredRequests: [] as FreelanceRequest[],
      featuredHackathons: [] as HackathonRecord[],
      featuredCreators: [] as Profile[],
    };
  }

  const [
    { count: creatorsCount },
    { count: openReqCount },
    { count: completedCount },
    { count: hackathonsCount },
    { data: requestsData },
    { data: hackathonsData },
    { data: creatorsData },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_status", "active")
      .eq("is_freelancer_enabled", true),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "OPEN"),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "COMPLETED"),
    supabase
      .from("hackathons")
      .select("id", { count: "exact", head: true })
      .neq("status", "draft"),
    supabase
      .from("requests")
      .select(
        "*, category:categories(id, name, slug, icon_name), client:profiles(id, full_name, username, college_or_org, rating_avg)"
      )
      .in("status", ["OPEN", "UNDER REVIEW"])
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("hackathons")
      .select("*, organizer:profiles(id, full_name, username, college_or_org)")
      .in("status", ["published", "registration_open", "ongoing", "judging", "completed"])
      .order("start_date", { ascending: true })
      .limit(3),
    supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, headline, college_or_org, specialization, availability, rating_avg, reviews_count, completed_projects_count")
      .eq("account_status", "active")
      .eq("is_freelancer_enabled", true)
      .order("completed_projects_count", { ascending: false })
      .order("rating_avg", { ascending: false })
      .limit(4),
  ]);

  return {
    stats: {
      creators: creatorsCount ?? 0,
      openRequests: openReqCount ?? 0,
      completedProjects: completedCount ?? 0,
      hackathons: hackathonsCount ?? 0,
    },
    featuredRequests: (requestsData ?? []) as unknown as FreelanceRequest[],
    featuredHackathons: (hackathonsData ?? []) as unknown as HackathonRecord[],
    featuredCreators: (creatorsData ?? []) as unknown as Profile[],
  };
}

const FAQS = [
  {
    q: "Is there any joining fee for student freelancers?",
    a: "No. Registration, portfolio hosting, browsing projects, and applying for freelance work on Aevrilo are completely free (₹0 joining fee).",
  },
  {
    q: "How does Aevrilo pricing and commission work?",
    a: "Aevrilo uses INR accounting and applies a transparent 5% platform fee on successfully completed freelance projects (e.g., ₹250 on a ₹5,000 project; ₹4,750 goes to the freelancer before any applicable statutory deductions).",
  },
  {
    q: "Can one account both hire talent and work as a freelancer?",
    a: "Yes. Every account supports both Client and Freelancer capabilities without maintaining separate accounts.",
  },
  {
    q: "How are payments settled during the MVP?",
    a: "Client-to-freelancer and hackathon prize settlements occur through approved external UPI or bank transfer arrangements, tracked with verifiable UTR/reference records on Aevrilo. Aevrilo does not operate an internal wallet or custody user funds.",
  },
  {
    q: "How do campus hackathons and team submissions work?",
    a: "Organizers publish hackathons with problem statements, eligibility, and prize pools. Students register individually or form teams via invite codes, submit GitHub/demo links before the deadline, and judges score confidentially until results are published.",
  },
];

export default async function HomePage() {
  const { stats, featuredRequests, featuredHackathons, featuredCreators } = await getHomeData();

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <section className="bg-subtle-grid border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="teal" className="mb-5 px-3 py-1 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Ideas meet talent. Projects become reality.
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-[56px] lg:leading-[1.08]">
              Turn Your Skills Into Opportunities.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              Discover projects, collaborate with talented creators, participate in hackathons and turn your ideas into reality. Built for college campuses and emerging creators across India.
            </p>

            {/* Search bar */}
            <form
              action="/explore"
              method="GET"
              className="mx-auto mt-8 flex max-w-2xl flex-col gap-2.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  name="q"
                  placeholder="Search video editing, Next.js, Blender 3D, UI/UX..."
                  className="h-11 border-0 pl-10 shadow-none focus:ring-0"
                  aria-label="Search freelance projects and opportunities"
                />
              </div>
              <Button type="submit" size="lg" className="h-11 px-6">
                Search Projects
              </Button>
            </form>

            {/* Primary CTAs */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/explore">
                  Explore Opportunities
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/requests/new">
                  <FolderPlus className="h-4 w-4" />
                  Post a Request
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Separate COMPETE and CREATE Ecosystems */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            One Unified Ecosystem
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Two engines designed for campus builders and creative talent
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-indigo-200/80 bg-white">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                <Layers className="h-5 w-5" />
              </div>
              <Badge variant="indigo" className="w-fit">CREATE · Freelance Marketplace</Badge>
              <CardTitle className="mt-2 text-2xl">Hire creators or get hired for real projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <p>
                Post scoped project requests in INR, compare proposals from verified student creators, collaborate in project workspaces, and review deliverables cleanly.
              </p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-700" /> ₹0 freelancer registration fee</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-700" /> Transparent 5% commission on completed projects</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-700" /> End-to-end milestone, deliverable, and revision tracking</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild variant="default" size="sm">
                <Link href="/explore">Browse Open Requests</Link>
              </Button>
              <Link href="/freelancers" className="text-sm font-medium text-indigo-700 hover:underline">
                Discover Talent →
              </Link>
            </CardFooter>
          </Card>

          <Card className="border-teal-200/80 bg-white">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <Trophy className="h-5 w-5" />
              </div>
              <Badge variant="teal" className="w-fit">COMPETE · Campus Hackathons</Badge>
              <CardTitle className="mt-2 text-2xl">Form teams, ship prototypes, and win prizes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <p>
                Organize internal campus hackathons and innovation challenges with structured problem statements, team invites, deadline enforcement, and blind judge scoring.
              </p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-700" /> Team formation with invite codes & size validation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-700" /> Confidential organizer & judge scoring rubrics</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-700" /> Verified prize distribution instructions & leaderboards</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild variant="accent" size="sm">
                <Link href="/hackathons">Explore Hackathons</Link>
              </Button>
              <Link href="/hackathons/create" className="text-sm font-medium text-teal-800 hover:underline">
                Host an Event →
              </Link>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* 3. Featured Freelance Categories */}
      <section className="border-y border-slate-200/80 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                Creative & Technical Disciplines
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                Explore by category
              </h2>
            </div>
            <Link href="/explore" className="text-sm font-medium text-indigo-700 hover:underline">
              View all opportunities →
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {FREELANCE_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/explore?category=${cat.slug}`}
                className="group rounded-xl border border-slate-200 bg-[#fafaf8] p-4 transition-colors hover:border-indigo-300 hover:bg-white"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 shadow-xs group-hover:bg-indigo-50 group-hover:text-indigo-700">
                  <CategoryIcon name={cat.iconName} className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{cat.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
                  {cat.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Live Open Requests (Popular Services / Opportunities) */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Live Marketplace Feed
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Recent freelance requests
            </h2>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/explore">Browse all requests</Link>
          </Button>
        </div>

        {featuredRequests.length > 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredRequests.map((req) => (
              <Card key={req.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="indigo">{req.category?.name ?? "Creative"}</Badge>
                    <span className="font-mono text-sm font-semibold text-slate-900">
                      {formatINR(req.budget_inr)}
                    </span>
                  </div>
                  <CardTitle className="mt-2 line-clamp-2 text-base">
                    <Link href={`/explore/${req.id}`} className="hover:text-indigo-700">
                      {req.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-2 text-sm text-slate-600">{req.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {req.required_skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="default" className="text-[11px]">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="text-xs text-slate-500">
                  <span>Due {formatDate(req.deadline)}</span>
                  <Link
                    href={`/explore/${req.id}`}
                    className="font-medium text-indigo-700 hover:underline"
                  >
                    View & Apply →
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm font-medium text-slate-900">No open requests published yet.</p>
            <p className="mt-1 text-sm text-slate-600">
              Be the first client to post a scoped project requirement on Aevrilo.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/requests/new">Post a Request</Link>
            </Button>
          </div>
        )}
      </section>

      {/* 5. Featured Hackathons */}
      <section className="border-y border-slate-200/80 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                COMPETE
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                Featured hackathons & challenges
              </h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/hackathons">All hackathons</Link>
            </Button>
          </div>

          {featuredHackathons.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {featuredHackathons.map((hack) => (
                <Card key={hack.id} className="flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="teal" className="capitalize">
                        {hack.status.replace("_", " ")}
                      </Badge>
                      <span className="font-mono text-sm font-semibold text-teal-800">
                        {formatINR(hack.prize_pool_inr)} Pool
                      </span>
                    </div>
                    <CardTitle className="mt-2 text-lg">
                      <Link href={`/hackathons/${hack.id}`} className="hover:text-teal-800">
                        {hack.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-slate-600">
                    <p className="line-clamp-2">{hack.tagline || hack.description}</p>
                    <p className="text-xs text-slate-500">
                      Team size: {hack.min_team_size}–{hack.max_team_size} · {hack.mode}
                    </p>
                  </CardContent>
                  <CardFooter className="text-xs text-slate-500">
                    <span>Starts {formatDate(hack.start_date)}</span>
                    <Link
                      href={`/hackathons/${hack.id}`}
                      className="font-medium text-teal-800 hover:underline"
                    >
                      Details & Register →
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-[#fafaf8] p-8 text-center">
              <p className="text-sm font-medium text-slate-900">No active hackathons right now.</p>
              <p className="mt-1 text-sm text-slate-600">
                Organizers and campus clubs can launch a hackathon with problem statements and judging rubrics.
              </p>
              <Button asChild variant="accent" size="sm" className="mt-4">
                <Link href="/hackathons/create">Create a Hackathon</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* 6. How Aevrilo Works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Workflow
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            How Aevrilo works
          </h2>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-4">
          {[
            {
              step: "01",
              title: "Build one unified profile",
              desc: "Sign up free, verify your email, showcase portfolio work, and switch seamlessly between Client and Creator.",
              icon: Users,
            },
            {
              step: "02",
              title: "Post or apply with clarity",
              desc: "Clients define INR budgets and deliverables; freelancers pitch with relevant skills and estimated timelines.",
              icon: Compass,
            },
            {
              step: "03",
              title: "Collaborate & ship deliverables",
              desc: "Track state transitions from Assigned to Delivered, exchange messages, and manage revision requests.",
              icon: ShieldCheck,
            },
            {
              step: "04",
              title: "Compete & grow reputation",
              desc: "Join campus hackathons, earn verified project reviews, and track INR payment & prize records.",
              icon: Award,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-indigo-700">
                    STEP {item.step}
                  </span>
                  <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Featured Creators */}
      <section className="border-y border-slate-200/80 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                Student & Creator Directory
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                Featured creators
              </h2>
            </div>
            <Link href="/freelancers" className="text-sm font-medium text-indigo-700 hover:underline">
              Explore all creators →
            </Link>
          </div>

          {featuredCreators.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredCreators.map((creator) => (
                <Card key={creator.id} className="flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-800">
                        {creator.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">
                          <Link href={`/freelancers/${creator.username}`} className="hover:text-indigo-700">
                            {creator.full_name}
                          </Link>
                        </CardTitle>
                        <p className="truncate text-xs text-slate-500">@{creator.username}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-slate-600">
                    <p className="line-clamp-2">{creator.headline || creator.specialization || "Creative & technical builder"}</p>
                    {creator.college_or_org ? (
                      <p className="text-xs text-slate-500">{creator.college_or_org}</p>
                    ) : null}
                  </CardContent>
                  <CardFooter className="text-xs text-slate-500">
                    <span>{creator.completed_projects_count} completed</span>
                    <Badge variant="teal" className="capitalize">
                      {creator.availability}
                    </Badge>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-[#fafaf8] p-8 text-center">
              <p className="text-sm font-medium text-slate-900">Creator profiles will appear here as builders join.</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/signup">Create your portfolio free</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* 8. Community & Impact (Live Real Database Counts Only) */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-slate-950 px-6 py-12 text-white sm:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">
              Live Platform Telemetry
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Real community activity, verified directly from our database
            </h2>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Active Creators", value: stats.creators },
              { label: "Open Requests", value: stats.openRequests },
              { label: "Completed Projects", value: stats.completedProjects },
              { label: "Live Hackathons", value: stats.hackathons },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="font-mono text-3xl font-semibold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ Section */}
      <section className="border-t border-slate-200/80 bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-950">
            Frequently asked questions
          </h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-slate-200 bg-[#fafaf8] p-5 open:bg-white"
              >
                <summary className="cursor-pointer list-none font-medium text-slate-950 flex items-center justify-between gap-4">
                  <span>{faq.q}</span>
                  <span className="text-slate-400 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
