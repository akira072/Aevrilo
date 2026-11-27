"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";

export function SupportReportForm({ userId }: { userId: string }) {
  const [targetType, setTargetType] = useState("project");
  const [targetId, setTargetId] = useState(userId);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<{ type: "idle" | "submitting" | "success" | "error"; message?: string }>({
    type: "idle",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "submitting" });
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason,
          details,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", message: json.error || "Unable to submit report." });
        return;
      }
      setReason("");
      setDetails("");
      setStatus({ type: "success", message: "Report submitted to the moderation queue." });
    } catch {
      setStatus({ type: "error", message: "Network error submitting report." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="target_type">Issue Category</Label>
          <NativeSelect
            id="target_type"
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
          >
            <option value="project">Freelance Project / Dispute</option>
            <option value="request">Freelance Request</option>
            <option value="user">User Behaviour</option>
            <option value="hackathon">Hackathon / Team</option>
            <option value="submission">Hackathon Submission</option>
            <option value="message">Message Abuse</option>
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="target_id">Reference ID (UUID)</Label>
          <Input
            id="target_id"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reason">Summary / Reason</Label>
        <Input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Brief description of the issue"
          required
          minLength={5}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="details">Details</Label>
        <Textarea
          id="details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Include relevant dates, deliverables, or UTR references..."
        />
      </div>

      {status.type === "error" ? (
        <p className="text-sm text-rose-700">{status.message}</p>
      ) : null}
      {status.type === "success" ? (
        <p className="text-sm text-teal-800">{status.message}</p>
      ) : null}

      <Button type="submit" disabled={status.type === "submitting"}>
        {status.type === "submitting" ? "Submitting..." : "Submit Report"}
      </Button>
    </form>
  );
}
