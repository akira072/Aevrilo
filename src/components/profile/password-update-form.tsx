"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function PasswordUpdateForm() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ type: "idle" | "saving" | "done" | "error"; msg?: string }>({
    type: "idle",
  });

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "saving" });
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setStatus({ type: "error", msg: "Supabase not configured." });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus({ type: "error", msg: error.message });
      return;
    }
    setPassword("");
    setStatus({ type: "done", msg: "Password updated successfully." });
  }

  return (
    <form onSubmit={handleUpdate} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="new_password">New Password</Label>
        <Input
          id="new_password"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {status.type === "error" ? <p className="text-xs text-rose-600">{status.msg}</p> : null}
      {status.type === "done" ? <p className="text-xs text-teal-800">{status.msg}</p> : null}
      <Button type="submit" size="sm" disabled={status.type === "saving"}>
        {status.type === "saving" ? "Updating..." : "Update Password"}
      </Button>
    </form>
  );
}
