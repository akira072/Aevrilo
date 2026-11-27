import Link from "next/link";
import { Briefcase, Calendar, Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, NativeSelect } from "@/components/ui/input";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/utils";
import type { Category, FreelanceRequest } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Explore Projects",
};

interface ExploreSearchParams {
  q?: string;
  category?: string;
  minBudget?: string;
  maxBudget?: string;
  skill?: string;
  sort?: string;
  page?: string;
}

const PAGE_SIZE = 9;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<ExploreSearchParams>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const categorySlug = (params.category || "").trim();
  const minBudget = params.minBudget ? Number(params.minBudget) : undefined;
  const maxBudget = params.maxBudget ? Number(params.maxBudget) : undefined;
  const skillFilter = (params.skill || "").trim();
  const sort = params.sort || "newest";
  const page = Math.max(1, Number(params.page || 1));

  const supabase = await createServerSupabaseClient();
  let categories: Category[] = [];
  let requests: FreelanceRequest[] = [];
  let totalCount = 0;

  if (supabase) {
    const { data: catData } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    categories = (catData ?? []) as Category[];

    const selectedCat = categories.find((c) => c.slug === categorySlug);

    let query = supabase
      .from("requests")
      .select(
        "*, category:categories(id, name, slug, icon_name), client:profiles(id, full_name, username, college_or_org, rating_avg)",
        { count: "exact" }
      )
      .in("status", ["OPEN", "UNDER REVIEW"]);

    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }
    if (selectedCat) {
      query = query.eq("category_id", selectedCat.id);
    }
    if (minBudget && !Number.isNaN(minBudget)) {
      query = query.gte("budget_inr", minBudget);
    }
    if (maxBudget && !Number.isNaN(maxBudget)) {
      query = query.lte("budget_inr", maxBudget);
    }
    if (skillFilter) {
      query = query.contains("required_skills", [skillFilter]);
    }

    if (sort === "budget_high") {
      query = query.order("budget_inr", { ascending: false });
    } else if (sort === "budget_low") {
      query = query.order("budget_inr", { ascending: true });
    } else if (sort === "deadline") {
      query = query.order("deadline", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count } = await query.range(from, to);

    requests = (data ?? []) as unknown as FreelanceRequest[];
    totalCount = count ?? 0;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            CREATE Marketplace
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Explore Freelance Projects
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Discover scoped project requests in INR across creative, design, 3D, and engineering disciplines.
          </p>
        </div>
        <Button asChild>
          <Link href="/requests/new">Post a Request</Link>
        </Button>
      </div>

      {/* Filters */}
      <form
        method="GET"
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search projects..."
            className="pl-9"
          />
        </div>
        <NativeSelect name="category" defaultValue={categorySlug}>
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </NativeSelect>
        <Input
          name="minBudget"
          type="number"
          min={0}
          defaultValue={params.minBudget || ""}
          placeholder="Min ₹"
        />
        <Input
          name="skill"
          defaultValue={skillFilter}
          placeholder="Skill (e.g. Figma)"
        />
        <div className="flex gap-2">
          <NativeSelect name="sort" defaultValue={sort}>
            <option value="newest">Newest</option>
            <option value="budget_high">Budget: High to Low</option>
            <option value="budget_low">Budget: Low to High</option>
            <option value="deadline">Soonest Deadline</option>
          </NativeSelect>
          <Button type="submit" variant="secondary" size="icon" aria-label="Apply filters">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Results */}
      {requests.length > 0 ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((req) => (
              <Card key={req.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="indigo">{req.category?.name ?? "Creative"}</Badge>
                    <span className="font-mono text-sm font-semibold text-slate-950">
                      {formatINR(req.budget_inr)}
                    </span>
                  </div>
                  <CardTitle className="mt-2 line-clamp-2 text-lg">
                    <Link href={`/explore/${req.id}`} className="hover:text-indigo-700">
                      {req.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-3 text-sm text-slate-600">{req.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {req.required_skills.slice(0, 4).map((skill) => (
                      <Badge key={skill} variant="default" className="text-[11px]">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 pt-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Due {formatDate(req.deadline)}
                    </span>
                    <span>{req.applications_count} proposals</span>
                  </div>
                </CardContent>
                <CardFooter className="text-xs text-slate-500">
                  <span className="truncate">
                    By {req.client?.full_name || "Client"}
                  </span>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/explore/${req.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-slate-200 pt-6">
              <p className="text-sm text-slate-600">
                Page {page} of {totalPages} ({totalCount} total requests)
              </p>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/explore?page=${page - 1}&q=${encodeURIComponent(q)}&category=${encodeURIComponent(categorySlug)}&sort=${sort}`}>
                      Previous
                    </Link>
                  </Button>
                ) : null}
                {page < totalPages ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/explore?page=${page + 1}&q=${encodeURIComponent(q)}&category=${encodeURIComponent(categorySlug)}&sort=${sort}`}>
                      Next
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No matching freelance requests"
          description="Try clearing your search filters or post a new project request to invite student creators."
          actionLabel="Post a Request"
          actionHref="/requests/new"
        />
      )}
    </div>
  );
}
