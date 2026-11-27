import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountSuspendedPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-semibold text-slate-950">Account Restricted or Suspended</h1>
      <p className="mt-2 text-sm text-slate-600">
        Your Aevrilo account currently has a moderation hold. Contact support if you believe this was applied in error.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/contact">Contact Support</Link>
      </Button>
    </div>
  );
}
