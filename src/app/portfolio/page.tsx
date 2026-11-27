import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PortfolioManager } from "@/components/profile/portfolio-manager";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Category, PortfolioItem } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Portfolio",
};

export default async function PortfolioPage() {
  const session = await requireAuthenticatedUser("/login?next=/portfolio");
  const supabase = await createServerSupabaseClient();

  let categories: Category[] = [];
  let items: PortfolioItem[] = [];

  if (supabase && session.userId) {
    const [{ data: catData }, { data: portData }] = await Promise.all([
      supabase.from("categories").select("*").eq("is_active", true).order("display_order", { ascending: true }),
      supabase
        .from("portfolios")
        .select("*, category:categories(id, name), media:portfolio_media(*)")
        .eq("user_id", session.userId)
        .order("created_at", { ascending: false }),
    ]);
    categories = (catData ?? []) as Category[];
    items = (portData ?? []) as unknown as PortfolioItem[];
  }

  return (
    <DashboardShell
      isAdmin={session.isAdmin}
      title="My Portfolio"
      subtitle="Upload work samples, video reels, GitHub repositories, and live demo links."
    >
      {session.userId ? (
        <PortfolioManager userId={session.userId} categories={categories} items={items} />
      ) : null}
    </DashboardShell>
  );
}
