import { describe, expect, it } from "vitest";
import {
  createApplicationSchema,
  createRequestSchema,
  evaluationSchema,
  signUpSchema,
} from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { isCollegeEmail, sanitizeText } from "@/lib/utils";

describe("Validation, Campus Email Verification & Security Utilities", () => {
  it("validates sign-up passwords and college email suffixes", () => {
    expect(isCollegeEmail("student@iitb.ac.in")).toBe(true);
    expect(isCollegeEmail("creator@nitk.edu.in")).toBe(true);
    expect(isCollegeEmail("user@gmail.com")).toBe(false);

    const weak = signUpSchema.safeParse({
      fullName: "Aarav",
      email: "aarav@iitb.ac.in",
      password: "weak",
    });
    expect(weak.success).toBe(false);
  });

  it("validates freelance requests and rejects past deadlines or below-minimum budgets", () => {
    const bad = createRequestSchema.safeParse({
      title: "Logo",
      description: "Too short",
      category_id: "00000000-0000-0000-0000-000000000001",
      required_skills: ["Figma"],
      budget_inr: 50,
      payment_type: "fixed",
      deadline: "2020-01-01",
    });
    expect(bad.success).toBe(false);

    const app = createApplicationSchema.safeParse({
      request_id: "00000000-0000-0000-0000-000000000001",
      cover_message: "I have built three Next.js campus portals and can deliver in 5 days.",
      proposed_price_inr: 5000,
      estimated_days: 5,
    });
    expect(app.success).toBe(true);
  });

  it("validates judge scoring rubrics within 0-10 bounds", () => {
    const invalid = evaluationSchema.safeParse({
      hackathon_id: "00000000-0000-0000-0000-000000000001",
      submission_id: "00000000-0000-0000-0000-000000000002",
      innovation_score: 15,
      execution_score: 8,
      design_score: 8,
      impact_score: 8,
      feedback: "Strong prototype.",
    });
    expect(invalid.success).toBe(false);
  });

  it("enforces sliding-window rate limits and strips control characters", () => {
    const key = `test-rl-${Date.now()}`;
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(false);

    expect(sanitizeText("Hello\u0000World\u0007 ")).toBe("HelloWorld");
  });
});
