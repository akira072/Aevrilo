"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Briefcase,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  PlusCircle,
  Settings,
  ShieldCheck,
  Trophy,
  User,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const WORKSPACE_LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/portfolio", label: "My Portfolio", icon: Briefcase },
  { href: "/requests/new", label: "Post a Request", icon: PlusCircle },
  { href: "/my-requests", label: "My Requests", icon: FileText },
  { href: "/applications", label: "My Applications", icon: Trophy },
  { href: "/projects", label: "My Projects", icon: FolderKanban },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/payments", label: "Payments & Rewards", icon: Wallet },
  { href: "/settings", label: "Account Settings", icon: Settings },
];

export function DashboardShell({
  children,
  isAdmin = false,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24 space-y-1 rounded-xl border border-slate-200 bg-white p-3">
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>
          {WORKSPACE_LINKS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-50 text-indigo-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}

          {isAdmin ? (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Administration
              </p>
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Admin Console
              </Link>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        {title || actions ? (
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
            <div>
              {title ? <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1> : null}
              {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
