import { z } from "zod";

const optionalHttpUrl = z
  .string()
  .trim()
  .refine((val) => val === "" || /^https?:\/\/.+/i.test(val), {
    message: "Enter a valid http(s) URL",
  })
  .optional()
  .or(z.literal(""));

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
  collegeOrOrg: z.string().trim().max(120).optional().default(""),
  primaryIntent: z.enum(["freelancer", "client", "both"]).default("both"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required").max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,32}$/, "Username must be 3-32 lowercase letters, numbers, or underscores"),
  headline: z.string().trim().max(140).optional().default(""),
  bio: z.string().trim().max(1500).optional().default(""),
  college_or_org: z.string().trim().max(120).optional().default(""),
  college_email: z
    .string()
    .trim()
    .email("Enter a valid college email")
    .optional()
    .or(z.literal("")),
  specialization: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  availability: z.enum(["available", "busy", "unavailable"]),
  is_client_enabled: z.boolean().default(true),
  is_freelancer_enabled: z.boolean().default(true),
  payout_preference_note: z.string().trim().max(240).optional().default(""),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export const portfolioSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().trim().min(10, "Add a concise description (10+ characters)").max(2000),
  category_id: z.string().uuid("Select a valid category"),
  video_url: optionalHttpUrl,
  github_url: optionalHttpUrl,
  live_demo_url: optionalHttpUrl,
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
});

export const createRequestSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(140),
  description: z.string().trim().min(20, "Describe your scope in at least 20 characters").max(4000),
  category_id: z.string().uuid("Select a category"),
  required_skills: z.array(z.string().trim().min(1).max(40)).min(1, "Add at least one required skill").max(12),
  budget_inr: z.coerce.number().min(100, "Minimum budget is ₹100").max(10000000),
  payment_type: z.enum(["fixed", "milestone", "hourly"]),
  deadline: z.string().refine((val) => !Number.isNaN(Date.parse(val)) && new Date(val) > new Date(), {
    message: "Deadline must be a valid future date",
  }),
  freelancers_needed: z.coerce.number().int().min(1).max(20).default(1),
  additional_requirements: z.string().trim().max(1500).optional().default(""),
});

export const createApplicationSchema = z.object({
  request_id: z.string().uuid(),
  cover_message: z.string().trim().min(20, "Write a thoughtful proposal (20+ characters)").max(2500),
  relevant_skills: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  portfolio_links: z.array(z.string().trim().url("Must be a valid URL")).max(5).default([]),
  proposed_price_inr: z.coerce.number().min(100, "Minimum proposed price is ₹100").max(10000000),
  estimated_days: z.coerce.number().int().min(1, "At least 1 day").max(365),
});

export const submitDeliverableSchema = z.object({
  project_id: z.string().uuid(),
  summary: z.string().trim().min(10, "Summarize what you delivered (10+ characters)").max(2000),
  deliverable_url: optionalHttpUrl,
});

export const reviewDeliverableSchema = z.object({
  deliverable_id: z.string().uuid(),
  decision: z.enum(["approved", "revision_requested"]),
  client_feedback: z.string().trim().max(1500).optional().default(""),
});

export const projectReviewSchema = z.object({
  project_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(5, "Write a short review").max(1000),
});

export const createHackathonSchema = z.object({
  title: z.string().trim().min(4, "Title must be at least 4 characters").max(140),
  tagline: z.string().trim().max(200).optional().default(""),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(5000),
  eligibility: z.string().trim().min(4).max(300),
  mode: z.enum(["online", "offline", "hybrid"]),
  venue: z.string().trim().max(200).optional().default("Campus Innovation Hub"),
  min_team_size: z.coerce.number().int().min(1).max(10),
  max_team_size: z.coerce.number().int().min(1).max(10),
  registration_deadline: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid registration deadline"),
  start_date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid start date"),
  end_date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid end date"),
  prize_pool_inr: z.coerce.number().min(0).max(100000000),
  funding_source: z.string().trim().min(2).max(200),
  status: z.enum(["draft", "published", "registration_open", "ongoing", "judging", "completed"]).default("registration_open"),
}).refine((d) => d.max_team_size >= d.min_team_size, {
  message: "Max team size must be >= min team size",
  path: ["max_team_size"],
}).refine((d) => new Date(d.end_date) > new Date(d.start_date), {
  message: "End date must be after start date",
  path: ["end_date"],
});

export const problemStatementSchema = z.object({
  hackathon_id: z.string().uuid(),
  code: z.string().trim().min(2).max(20),
  title: z.string().trim().min(4).max(160),
  description: z.string().trim().min(15).max(3000),
  track: z.string().trim().min(2).max(60),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  expected_deliverables: z.string().trim().max(1000).optional().default(""),
});

export const teamCreateSchema = z.object({
  hackathon_id: z.string().uuid(),
  name: z.string().trim().min(2, "Team name is required").max(60),
  problem_statement_id: z.string().uuid().optional().or(z.literal("")),
});

export const submissionSchema = z.object({
  hackathon_id: z.string().uuid(),
  team_id: z.string().uuid(),
  problem_statement_id: z.string().uuid().optional().or(z.literal("")),
  project_title: z.string().trim().min(3, "Project title is required").max(140),
  summary: z.string().trim().min(20, "Provide a project summary (20+ characters)").max(4000),
  github_url: optionalHttpUrl,
  live_demo_url: optionalHttpUrl,
});

export const evaluationSchema = z.object({
  hackathon_id: z.string().uuid(),
  submission_id: z.string().uuid(),
  innovation_score: z.coerce.number().min(0).max(10),
  execution_score: z.coerce.number().min(0).max(10),
  design_score: z.coerce.number().min(0).max(10),
  impact_score: z.coerce.number().min(0).max(10),
  feedback: z.string().trim().min(5, "Provide constructive judge feedback").max(2000),
  is_finalized: z.boolean().default(true),
});

export const sendMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  body: z.string().trim().min(1, "Message cannot be empty").max(3000),
});

export const createReportSchema = z.object({
  target_type: z.enum(["user", "request", "project", "hackathon", "submission", "message"]),
  target_id: z.string().uuid(),
  reason: z.string().trim().min(5, "Provide a clear reason").max(200),
  details: z.string().trim().max(2000).optional().default(""),
});
