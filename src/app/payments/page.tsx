import { Wallet } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Payments & Rewards",
};

export default async function PaymentsPage() {
  const session = await requireAuthenticatedUser("/login?next=/payments");
  const supabase = await createServerSupabaseClient();

  let records: Array<{
    id: string;
    flow: string;
    gross_amount_inr: number;
    commission_bps: number;
    commission_amount_inr: number;
    net_amount_inr: number;
    status: string;
    settlement_method: string;
    external_reference: string;
    created_at: string;
    payer_id: string | null;
    payee_id: string | null;
  }> = [];

  if (supabase && session.userId) {
    const { data } = await supabase
      .from("payment_records")
      .select("*")
      .or(`payer_id.eq.${session.userId},payee_id.eq.${session.userId}`)
      .order("created_at", { ascending: false });
    records = data ?? [];
  }

  return (
    <DashboardShell
      isAdmin={session.isAdmin}
      title="Payments & Rewards"
      subtitle="Transparent INR settlement records for freelance projects and hackathon prizes."
    >
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600">
        <strong>Settlement Policy:</strong> Aevrilo tracks INR payment records across external UPI or bank transfer arrangements (verified by UTR/reference). Aevrilo does not hold user funds in internal wallets or custody crypto assets.
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payment records yet"
          description="Payment records are generated when freelance deliverables are approved or hackathon prizes are awarded."
          actionLabel="Explore Projects"
          actionHref="/explore"
        />
      ) : (
        <div className="space-y-3">
          {records.map((rec) => {
            const isPayee = rec.payee_id === session.userId;
            return (
              <Card key={rec.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rec.status === "successful" ? "teal" : "amber"} className="capitalize">
                        {rec.status}
                      </Badge>
                      <Badge variant="outline">
                        {rec.flow === "freelance_project" ? "Freelance Project" : "Hackathon Prize"}
                      </Badge>
                      <span className="text-xs text-slate-500">{isPayee ? "Incoming" : "Outgoing"}</span>
                    </div>
                    <CardTitle className="mt-2 font-mono text-lg">
                      Gross {formatINR(rec.gross_amount_inr)} → Net {formatINR(rec.net_amount_inr)}
                    </CardTitle>
                    <CardDescription>
                      Commission ({(rec.commission_bps / 100).toFixed(1)}%): {formatINR(rec.commission_amount_inr)} ·{" "}
                      {formatDate(rec.created_at)}
                    </CardDescription>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{rec.settlement_method}</p>
                    <p className="font-mono text-slate-800">
                      Ref: {rec.external_reference || "Awaiting UTR"}
                    </p>
                  </div>
                </CardHeader>
                <CardContent />
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
