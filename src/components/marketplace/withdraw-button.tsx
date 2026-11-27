"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function WithdrawApplicationButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function withdraw() {
    setLoading(true);
    const res = await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ application_id: applicationId, decision: "withdrawn" }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <Button size="sm" variant="outline" onClick={withdraw} disabled={loading}>
      {loading ? "Withdrawing..." : "Withdraw"}
    </Button>
  );
}
