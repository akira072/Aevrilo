import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, IndianRupee, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplyForm } from "@/components/marketplace/apply-form";
import { ApplicationActions } from "@/components/marketplace/application-actions";
import { getCurrentUserContext } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/utils";
import type { ApplicationRecord, FreelanceRequest } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, supabase] = await Promise.all([
    getCurrentUserContext(),
    createServerSupabaseClient(),
  ]);

  if (!supabase) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-sm text-slate-600">Supabase credentials are not configured yet.</p>
      </div>
    );
  }

  const [{ data: reqData }, { data: settings }] = await Promise.all([
    supabase
      .from("requests")
      .select(
        "*, category:categories(id, name, slug), client:profiles(id, full_name, username, college_or_org, rating_avg, reviews_count)"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("platform_settings").select("freelance_commission_bps").eq("id", 1).maybeSingle(),
  ]);

  if (!reqData) {
    notFound();
  }

  const requestItem = reqData as unknown as FreelanceRequest;
  const isOwner = session.userId === requestItem.client_id;
  const commissionBps = settings?.freelance_commission_bps ?? 500;

  let existingApplication: ApplicationRecord | null = null;
  let incomingApplications: ApplicationRecord[] = [];

  if (session.userId) {
    if (isOwner) {
      const { data: apps } = await supabase
        .from("applications")
        .select(
          "*, freelancer:profiles(id, full_name, username, headline, college_or_org, rating_avg, completed_projects_count)"
        )
        .eq("request_id", id)
        .order("created_at", { ascending: false });
      incomingApplications = (apps ?? []) as unknown as ApplicationRecord[];
    } else {
      const { data: myApp } = await supabase
        .from("applications")
        .select("*")
        .eq("request_id", id)
        .eq("freelancer_id", session.userId)
        .maybeSingle();
      existingApplication = (myApp as ApplicationRecord | null) ?? null;
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/explore" className="hover:text-slate-900">
          Explore Projects
        </Link>
        <span>/</span>
        <span className="text-slate-800">{requestItem.category?.name ?? "Request"}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="indigo">{requestItem.category?.name}</Badge>
                <Badge variant="teal">{requestItem.status}</Badge>
                <Badge variant="outline" className="capitalize">
                  {requestItem.payment_type}
                </Badge>
              </div>
              <CardTitle className="mt-2 text-2xl">{requestItem.title}</CardTitle>
              <CardDescription>
                Posted {formatDate(requestItem.created_at)} by{" "}
                <Link
                  href={`/freelancers/${requestItem.client?.username}`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {requestItem.client?.full_name}
                </Link>
                {requestItem.client?.college_or_org ? ` · ${requestItem.client.college_or_org}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Project Scope</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {requestItem.description}
                </p>
              </div>

              {requestItem.additional_requirements ? (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Additional Requirements</h3>
                  <p className="mt-1.5 whitespace-pre-line text-sm text-slate-600">
                    {requestItem.additional_requirements}
                  </p>
                </div>
              ) : null}

              <div>
                <h3 className="text-sm font-semibold text-slate-900">Required Skills</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {requestItem.required_skills.map((skill) => (
                    <Badge key={skill} variant="default">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {isOwner ? (
            <Card>
              <CardHeader>
                <CardTitle>Incoming Proposals ({incomingApplications.length})</CardTitle>
                <CardDescription>
                  Compare proposals and accept a freelancer to automatically create a project workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {incomingApplications.length === 0 ? (
                  <p className="text-sm text-slate-600">No proposals submitted yet.</p>
                ) : (
                  incomingApplications.map((app) => (
                    <div
                      key={app.id}
                      className="rounded-xl border border-slate-200 p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/freelancers/${app.freelancer?.username}`}
                            className="font-semibold text-slate-950 hover:text-indigo-700"
                          >
                            {app.freelancer?.full_name}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {app.freelancer?.headline || app.freelancer?.college_or_org || "Student Creator"} ·{" "}
                            {app.freelancer?.completed_projects_count ?? 0} completed
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-base font-semibold text-slate-950">
                            {formatINR(app.proposed_price_inr)}
                          </p>
                          <p className="text-xs text-slate-500">{app.estimated_days} days</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-line">{app.cover_message}</p>
                      {app.portfolio_links.length > 0 ? (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {app.portfolio_links.map((link) => (
                            <a
                              key={link}
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-700 underline"
                            >
                              {link}
                            </a>
                          ))}
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <Badge variant={app.status === "accepted" ? "teal" : "default"} className="capitalize">
                          {app.status}
                        </Badge>
                        {["OPEN", "UNDER REVIEW"].includes(requestItem.status) &&
                        ["pending", "shortlisted"].includes(app.status) ? (
                          <ApplicationActions applicationId={app.id} />
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <IndianRupee className="h-4 w-4" /> Budget
                </span>
                <span className="font-mono font-semibold text-slate-950">
                  {formatINR(requestItem.budget_inr)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4" /> Deadline
                </span>
                <span className="font-medium text-slate-900">{formatDate(requestItem.deadline)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <Users className="h-4 w-4" /> Freelancers needed
                </span>
                <span className="font-medium text-slate-900">{requestItem.freelancers_needed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <Clock className="h-4 w-4" /> Proposals
                </span>
                <span className="font-medium text-slate-900">{requestItem.applications_count}</span>
              </div>
            </CardContent>
          </Card>

          {!isOwner ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Submit a Proposal</CardTitle>
                <CardDescription>Free to apply · 5% fee only on completed work</CardDescription>
              </CardHeader>
              <CardContent>
                {!session.userId ? (
                  <div className="space-y-3 text-sm text-slate-600">
                    <p>Sign in to apply for this project and message the client.</p>
                    <Button asChild className="w-full">
                      <Link href={`/login?next=/explore/${id}`}>Log in to Apply</Link>
                    </Button>
                  </div>
                ) : existingApplication ? (
                  <div className="space-y-2 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-950">
                    <p className="font-medium">
                      You already applied ({existingApplication.status}).
                    </p>
                    <p className="text-xs">
                      Proposed: {formatINR(existingApplication.proposed_price_inr)} in{" "}
                      {existingApplication.estimated_days} days.
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-2">
                      <Link href="/applications">View My Applications</Link>
                    </Button>
                  </div>
                ) : !["OPEN", "UNDER REVIEW"].includes(requestItem.status) ? (
                  <p className="text-sm text-slate-600">
                    This request is currently <strong>{requestItem.status}</strong> and is no longer accepting new proposals.
                  </p>
                ) : (
                  <ApplyForm
                    requestId={id}
                    defaultBudget={Number(requestItem.budget_inr)}
                    commissionBps={commissionBps}
                  />
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
