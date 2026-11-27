import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

describe("Database Schema, RLS Policies & Seed Integrity", () => {
  const migrationsDir = path.resolve(__dirname, "../supabase/migrations");
  const rlsSql = fs.readFileSync(path.join(migrationsDir, "0007_rls_policies.sql"), "utf8");
  const seedSql = fs.readFileSync(path.resolve(__dirname, "../supabase/seed.sql"), "utf8");

  const requiredTables = [
    "platform_settings",
    "profiles",
    "user_roles",
    "skills",
    "user_skills",
    "categories",
    "portfolios",
    "portfolio_media",
    "requests",
    "request_attachments",
    "applications",
    "projects",
    "project_milestones",
    "project_deliverables",
    "reviews",
    "hackathons",
    "hackathon_rules",
    "problem_statements",
    "hackathon_announcements",
    "teams",
    "registrations",
    "team_members",
    "submissions",
    "judges",
    "evaluations",
    "prizes",
    "conversations",
    "messages",
    "notifications",
    "payment_records",
    "payouts",
    "reports",
    "audit_logs",
  ];

  it("enables Row Level Security on every sensitive table", () => {
    for (const table of requiredTables) {
      expect(rlsSql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }
  });

  it("restricts confidential evaluations to judges, organizer, and admin only", () => {
    expect(rlsSql).toContain("CREATE POLICY \"evaluations_confidential_read\" ON public.evaluations");
    expect(rlsSql).toContain("auth.uid() = judge_id");
  });

  it("seeds ₹0 freelancer joining fee, 500 bps (5%) commission, and all 10 required categories", () => {
    expect(seedSql).toContain("VALUES (1, 500, 'INR', 0,");
    const expectedCategories = [
      "Video Editing",
      "Photo Editing",
      "Graphic Design",
      "Blender and 3D Modelling",
      "Animation and VFX",
      "Game Development",
      "Web Development",
      "Programming",
      "UI/UX Design",
      "Other Creative Services",
    ];
    for (const cat of expectedCategories) {
      expect(seedSql).toContain(cat);
    }
  });
});
