/**
 * [DEMO ONLY] Optional Sample Data Seeder for Aevrilo
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in `.env.local` or environment.
 * Creates clearly labeled `[DEMO]` accounts, portfolio projects, freelance requests, and a hackathon.
 * Usage: node scripts/seed-demo.mjs
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them before running demo seed."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureUser(email, password, metadata, roles) {
  const { data: existing } = await supabase.auth.admin.listUsers();
  let user = existing?.users?.find((u) => u.email === email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw error;
    user = data.user;
  }

  for (const role of roles) {
    await supabase
      .from("user_roles")
      .upsert({ user_id: user.id, role }, { onConflict: "user_id,role" });
  }

  return user;
}

async function run() {
  console.log("Seeding [DEMO] Aevrilo dataset...");

  const client = await ensureUser(
    "demo.client@nitk.edu.in",
    "DemoPass123!",
    { full_name: "[DEMO] Priya Nair (Client)", college_or_org: "NITK Surathkal" },
    ["client", "freelancer"]
  );

  const freelancer = await ensureUser(
    "demo.creator@iitb.ac.in",
    "DemoPass123!",
    { full_name: "[DEMO] Rohan Verma (Creator)", college_or_org: "IIT Bombay" },
    ["client", "freelancer"]
  );

  const organizerAdmin = await ensureUser(
    "demo.organizer@aevrilo.in",
    "DemoPass123!",
    { full_name: "[DEMO] Aevrilo Campus Organizer", college_or_org: "Aevrilo Campus Labs" },
    ["client", "freelancer", "organizer", "admin"]
  );

  await supabase
    .from("profiles")
    .update({
      headline: "Full-Stack Next.js Developer & UI Designer [DEMO]",
      specialization: "Web Development",
      bio: "[DEMO] Building campus marketplaces, dashboards, and interactive web apps.",
      city: "Mumbai",
      college_email_verified: true,
    })
    .eq("id", freelancer.id);

  const { data: categories } = await supabase.from("categories").select("id, slug");
  const webCat = categories?.find((c) => c.slug === "web-development");
  const videoCat = categories?.find((c) => c.slug === "video-editing");

  if (webCat) {
    await supabase.from("portfolios").insert({
      user_id: freelancer.id,
      title: "[DEMO] Campus Event Ticketing Portal",
      description: "[DEMO] Responsive Next.js + PostgreSQL ticketing app handling 1,200+ student passes.",
      category_id: webCat.id,
      github_url: "https://github.com/example/campus-portal",
      tags: ["Next.js", "TypeScript", "PostgreSQL"],
    });

    await supabase.from("requests").insert({
      client_id: client.id,
      title: "[DEMO] Build a Department Symposium Microsite",
      description:
        "[DEMO] Looking for a student web developer to build a clean 4-page symposium website with schedule, speaker cards, and registration link.",
      category_id: webCat.id,
      required_skills: ["Next.js", "Tailwind CSS", "TypeScript"],
      budget_inr: 5000,
      payment_type: "fixed",
      deadline: new Date(Date.now() + 14 * 86400_000).toISOString(),
      status: "OPEN",
    });
  }

  if (videoCat) {
    await supabase.from("requests").insert({
      client_id: client.id,
      title: "[DEMO] 60-Second Aftermovie Edit for Design Club",
      description:
        "[DEMO] Need crisp colour grading, beat-synced transitions, and clean title cards for our annual design showcase recap.",
      category_id: videoCat.id,
      required_skills: ["Premiere Pro", "After Effects", "DaVinci Resolve"],
      budget_inr: 3500,
      payment_type: "fixed",
      deadline: new Date(Date.now() + 10 * 86400_000).toISOString(),
      status: "OPEN",
    });
  }

  const { data: hack } = await supabase
    .from("hackathons")
    .upsert(
      {
        organizer_id: organizerAdmin.id,
        title: "[DEMO] Aevrilo Campus Buildathon 2026",
        slug: "demo-aevrilo-campus-buildathon-2026",
        tagline: "[DEMO] 48-hour student innovation sprint for campus productivity & creative tooling",
        description:
          "[DEMO] Collaborate in teams of 1–4 students to prototype practical tools solving real campus workflows.",
        eligibility: "Open to verified college students across India",
        mode: "hybrid",
        venue: "Campus Innovation Hub & Online",
        min_team_size: 1,
        max_team_size: 4,
        registration_deadline: new Date(Date.now() + 10 * 86400_000).toISOString(),
        start_date: new Date(Date.now() + 11 * 86400_000).toISOString(),
        end_date: new Date(Date.now() + 13 * 86400_000).toISOString(),
        prize_pool_inr: 50000,
        funding_source: "[DEMO] Campus Innovation Cell",
        status: "registration_open",
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (hack?.id) {
    await supabase.from("problem_statements").upsert(
      {
        hackathon_id: hack.id,
        code: "PS-01",
        title: "[DEMO] Smart Lab Equipment Booking & Maintenance Tracker",
        description:
          "[DEMO] Design a fast reservation workflow with conflict prevention and maintenance alerts for campus labs.",
        track: "Campus Ops",
        difficulty: "intermediate",
      },
      { onConflict: "hackathon_id,code" }
    );
  }

  console.log("Demo seed complete!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
