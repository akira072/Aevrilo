import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export function ConfigBanner({ isConfigured }: { isConfigured: boolean }) {
  if (isConfigured) return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
          <span>
            <strong>Supabase credentials not configured.</strong> Set{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            and{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            in <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">.env.local</code> to enable database persistence, auth, and storage.
          </span>
        </div>
        <Link href="/about#setup" className="font-semibold underline hover:text-amber-950">
          Setup checklist
        </Link>
      </div>
    </div>
  );
}
