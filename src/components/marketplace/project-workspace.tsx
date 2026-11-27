"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ALLOWED_UPLOAD_TYPES } from "@/lib/domain/constants";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ProjectRecord } from "@/types/database";

interface DeliverableRow {
  id: string;
  summary: string;
  deliverable_url: string | null;
  file_name: string | null;
  status: "submitted" | "revision_requested" | "approved";
  client_feedback: string;
  created_at: string;
}

export function ProjectWorkspaceControls({
  project,
  userId,
  deliverables,
  hasReviewed,
}: {
  project: ProjectRecord;
  userId: string;
  deliverables: DeliverableRow[];
  hasReviewed: boolean;
}) {
  const router = useRouter();
  const isClient = project.client_id === userId;
  const isFreelancer = project.freelancer_id === userId;

  const [delivSummary, setDelivSummary] = useState("");
  const [delivUrl, setDelivUrl] = useState("");
  const [delivFile, setDelivFile] = useState<File | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(nextStatus: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/projects/${project.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Failed to update status.");
      return;
    }
    router.refresh();
  }

  async function submitDeliverable(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      let storagePayload: Record<string, unknown> = {};
      if (delivFile) {
        if (!(ALLOWED_UPLOAD_TYPES.deliverable.mimeTypes as readonly string[]).includes(delivFile.type)) {
          setError(`Unsupported file type. Allowed: ${ALLOWED_UPLOAD_TYPES.deliverable.label}`);
          setBusy(false);
          return;
        }
        if (delivFile.size > ALLOWED_UPLOAD_TYPES.deliverable.maxBytes) {
          setError("Deliverable file exceeds 50 MB limit.");
          setBusy(false);
          return;
        }
        const supabase = createBrowserSupabaseClient();
        if (supabase) {
          const path = `${userId}/${project.id}/${Date.now()}_${delivFile.name}`;
          const { error: upErr } = await supabase.storage
            .from("deliverables")
            .upload(path, delivFile, { contentType: delivFile.type });
          if (upErr) {
            setError(`Upload failed: ${upErr.message}`);
            setBusy(false);
            return;
          }
          storagePayload = {
            storage_path: path,
            file_name: delivFile.name,
            file_size_bytes: delivFile.size,
          };
        }
      }

      const res = await fetch(`/api/projects/${project.id}/deliverables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: delivSummary,
          deliverable_url: delivUrl,
          ...storagePayload,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Unable to submit deliverable.");
        setBusy(false);
        return;
      }
      setDelivSummary("");
      setDelivUrl("");
      setDelivFile(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function reviewDeliverable(deliverableId: string, decision: "approved" | "revision_requested") {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/projects/${project.id}/deliverables`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliverable_id: deliverableId,
        decision,
        client_feedback: feedbackMap[deliverableId] || "",
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Unable to review deliverable.");
      return;
    }
    router.refresh();
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/projects/${project.id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment: reviewComment }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Unable to submit review.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {/* Lifecycle Action Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <span className="text-sm font-medium text-slate-700">Project Actions:</span>
        {isFreelancer && project.status === "ASSIGNED" ? (
          <Button size="sm" onClick={() => updateStatus("IN PROGRESS")} disabled={busy}>
            Start Work (Move to In Progress)
          </Button>
        ) : null}
        {["ASSIGNED", "IN PROGRESS", "DELIVERED"].includes(project.status) ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => updateStatus("DISPUTED")}
            disabled={busy}
          >
            Raise Dispute
          </Button>
        ) : null}
        {isClient && ["ASSIGNED", "IN PROGRESS"].includes(project.status) ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateStatus("CANCELLED")}
            disabled={busy}
          >
            Cancel Project
          </Button>
        ) : null}
      </div>

      {/* Freelancer Deliverable Submission */}
      {isFreelancer && ["ASSIGNED", "IN PROGRESS", "DELIVERED"].includes(project.status) ? (
        <form
          onSubmit={submitDeliverable}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
        >
          <h3 className="text-base font-semibold text-slate-950">Submit Deliverable</h3>
          <div className="space-y-1.5">
            <Label htmlFor="deliv_summary">Work Summary & Notes</Label>
            <Textarea
              id="deliv_summary"
              value={delivSummary}
              onChange={(e) => setDelivSummary(e.target.value)}
              placeholder="Describe what was completed, export settings, or access notes..."
              required
              minLength={10}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="deliv_url">External Deliverable / Repo URL (optional)</Label>
              <Input
                id="deliv_url"
                type="url"
                value={delivUrl}
                onChange={(e) => setDelivUrl(e.target.value)}
                placeholder="https://drive.google.com/... or GitHub link"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deliv_file">Upload Deliverable File (optional, max 50MB)</Label>
              <Input
                id="deliv_file"
                type="file"
                onChange={(e) => setDelivFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Submitting..." : "Submit Deliverable for Review"}
          </Button>
        </form>
      ) : null}

      {/* Deliverable List & Client Review Controls */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-slate-950">
          Deliverables ({deliverables.length})
        </h3>
        {deliverables.length === 0 ? (
          <p className="text-sm text-slate-500">No deliverables submitted yet.</p>
        ) : (
          deliverables.map((d) => (
            <div key={d.id} className="rounded-lg border border-slate-200 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status: {d.status.replace("_", " ")}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(d.created_at).toLocaleDateString("en-IN")}
                </span>
              </div>
              <p className="text-sm text-slate-800">{d.summary}</p>
              <div className="flex flex-wrap gap-3 text-xs">
                {d.deliverable_url ? (
                  <a href={d.deliverable_url} target="_blank" rel="noreferrer" className="text-indigo-700 underline">
                    Open Deliverable Link
                  </a>
                ) : null}
                {d.file_name ? <span className="text-slate-600">File: {d.file_name}</span> : null}
              </div>
              {d.client_feedback ? (
                <p className="rounded bg-slate-50 p-2.5 text-xs text-slate-700">
                  <strong>Client feedback:</strong> {d.client_feedback}
                </p>
              ) : null}

              {isClient && d.status === "submitted" && project.status === "DELIVERED" ? (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <Input
                    placeholder="Feedback or revision notes (optional)"
                    value={feedbackMap[d.id] || ""}
                    onChange={(e) =>
                      setFeedbackMap((prev) => ({ ...prev, [d.id]: e.target.value }))
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="accent"
                      onClick={() => reviewDeliverable(d.id, "approved")}
                      disabled={busy}
                    >
                      Approve & Complete Project
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reviewDeliverable(d.id, "revision_requested")}
                      disabled={busy}
                    >
                      Request Revision
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      {/* Review Form after Completion */}
      {project.status === "COMPLETED" && !hasReviewed ? (
        <form
          onSubmit={submitReview}
          className="space-y-4 rounded-xl border border-teal-200 bg-white p-6"
        >
          <h3 className="text-base font-semibold text-slate-950">Leave a Review</h3>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="rating">Rating (1–5)</Label>
              <Input
                id="rating"
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-3">
              <Label htmlFor="reviewComment">Review Comment</Label>
              <Input
                id="reviewComment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share feedback on communication, quality, and timeliness..."
                required
                minLength={5}
              />
            </div>
          </div>
          <Button type="submit" variant="accent" disabled={busy}>
            Submit Review
          </Button>
        </form>
      ) : null}
    </div>
  );
}
