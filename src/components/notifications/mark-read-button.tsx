"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function markRead() {
    setBusy(true);
    await fetch("/api/notifications/read", { method: "PATCH" });
    setBusy(false);
    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" onClick={markRead} disabled={busy}>
      {busy ? "Updating..." : "Mark All Read"}
    </Button>
  );
}
