"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ApplicationActions({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(decision: "accepted" | "shortlisted" | "rejected") {
    setLoading(decision);
    setError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: applicationId, decision }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Action failed.");
        setLoading(null);
        return;
      }
      if (decision === "accepted" && json.project?.id) {
        router.push(`/projects/${json.project.id}`);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-1 text-right">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={loading !== null}
          onClick={() => act("shortlisted")}
        >
          Shortlist
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={loading !== null}
          onClick={() => act("rejected")}
        >
          Reject
        </Button>
        <Button
          size="sm"
          variant="accent"
          disabled={loading !== null}
          onClick={() => act("accepted")}
        >
          {loading === "accepted" ? "Creating Project..." : "Accept & Hire"}
        </Button>
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
