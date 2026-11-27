"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime, formatINR } from "@/lib/utils";

interface AdminConsoleProps {
  commissionBps: number;
  users: Array<{
    id: string;
    full_name: string;
    username: string;
    college_or_org: string;
    account_status: string;
    created_at: string;
  }>;
  reports: Array<{
    id: string;
    target_type: string;
    target_id: string;
    reason: string;
    status: string;
    created_at: string;
  }>;
  payments: Array<{
    id: string;
    flow: string;
    gross_amount_inr: number;
    net_amount_inr: number;
    external_reference: string;
    status: string;
    created_at: string;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    created_at: string;
  }>;
}

export function AdminConsoleClient({
  commissionBps,
  users,
  reports,
  payments,
  auditLogs,
}: AdminConsoleProps) {
  const router = useRouter();
  const [bps, setBps] = useState(commissionBps);
  const [utrMap, setUtrMap] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function adminCall(payload: Record<string, unknown>, okText: string) {
    setBusy(true);
    setMsg(null);
    setErr(null);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(json.error || "Admin action failed.");
      return;
    }
    setMsg(okText);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {err ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {err}
        </div>
      ) : null}
      {msg ? (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          {msg}
        </div>
      ) : null}

      {/* Configurable Commission Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Commission Configuration</CardTitle>
          <CardDescription>
            Configurable basis points (500 bps = 5%). Applies to newly created projects.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Input
            type="number"
            min={0}
            max={3000}
            value={bps}
            onChange={(e) => setBps(Number(e.target.value))}
            className="w-36"
          />
          <span className="text-sm text-slate-600">bps ({(bps / 100).toFixed(2)}%)</span>
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              adminCall({ action: "update_commission", commission_bps: bps }, "Commission setting updated.")
            }
          >
            Save Commission
          </Button>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">User Moderation & Roles</CardTitle>
          <CardDescription>Manage account status and grant organizer permissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm"
            >
              <div>
                <p className="font-medium text-slate-950">
                  {u.full_name} <span className="text-xs text-slate-500">@{u.username}</span>
                </p>
                <p className="text-xs text-slate-500">{u.college_or_org || "Independent"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={u.account_status === "active" ? "teal" : "rose"} className="capitalize">
                  {u.account_status}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    adminCall(
                      { action: "grant_role", user_id: u.id, role: "organizer" },
                      `Granted organizer role to @${u.username}.`
                    )
                  }
                >
                  Grant Organizer
                </Button>
                {u.account_status === "active" ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() =>
                      adminCall(
                        { action: "update_account_status", user_id: u.id, account_status: "suspended" },
                        `Suspended @${u.username}.`
                      )
                    }
                  >
                    Suspend
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="accent"
                    disabled={busy}
                    onClick={() =>
                      adminCall(
                        { action: "update_account_status", user_id: u.id, account_status: "active" },
                        `Activated @${u.username}.`
                      )
                    }
                  >
                    Activate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Records & UTR Verification</CardTitle>
          <CardDescription>
            Payments can only be marked successful once an external UPI/bank UTR reference is entered and verified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {payments.length === 0 ? (
            <p className="text-sm text-slate-500">No payment records queued.</p>
          ) : (
            payments.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.status === "successful" ? "teal" : "amber"} className="capitalize">
                      {p.status}
                    </Badge>
                    <span className="font-mono font-semibold">
                      {formatINR(p.gross_amount_inr)} (Net {formatINR(p.net_amount_inr)})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {p.flow} · Ref: {p.external_reference || "None"}
                  </p>
                </div>
                {p.status !== "successful" ? (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="UTR / Bank Reference"
                      value={utrMap[p.id] || ""}
                      onChange={(e) =>
                        setUtrMap((prev) => ({ ...prev, [p.id]: e.target.value }))
                      }
                      className="w-44"
                    />
                    <Button
                      size="sm"
                      variant="accent"
                      disabled={busy}
                      onClick={() =>
                        adminCall(
                          {
                            action: "verify_payment",
                            payment_id: p.id,
                            status: "successful",
                            external_reference: utrMap[p.id] || "",
                          },
                          "Payment verified as successful."
                        )
                      }
                    >
                      Verify Successful
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Reports & Disputes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reports & Disputes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reports.length === 0 ? (
            <p className="text-sm text-slate-500">No open reports or disputes.</p>
          ) : (
            reports.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === "open" ? "rose" : "default"} className="capitalize">
                      {r.status}
                    </Badge>
                    <span className="font-medium">{r.target_type}</span>
                  </div>
                  <p className="mt-1 text-slate-700">{r.reason}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      adminCall(
                        { action: "resolve_report", report_id: r.id, status: "resolved", resolution_notes: "Resolved by admin" },
                        "Report resolved."
                      )
                    }
                  >
                    Mark Resolved
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() =>
                      adminCall(
                        { action: "resolve_report", report_id: r.id, status: "dismissed", resolution_notes: "Dismissed" },
                        "Report dismissed."
                      )
                    }
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Audit Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {auditLogs.length === 0 ? (
            <p className="text-slate-500">No administrative actions recorded yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded border border-slate-100 px-3 py-2">
                <span className="font-mono text-slate-800">
                  {log.action} → {log.entity_type}:{log.entity_id.slice(0, 8)}
                </span>
                <span className="text-slate-400">{formatDateTime(log.created_at)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
