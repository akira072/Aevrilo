import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createHackathonSchema } from "@/lib/validation/schemas";
import { sanitizeText, slugify } from "@/lib/utils";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  const roles = (roleRows ?? []).map((r) => r.role);
  if (!roles.includes("organizer") && !roles.includes("admin")) {
    return NextResponse.json(
      { error: "Organizer or Admin role is required to create hackathons. Request organizer access from an admin." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createHackathonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid hackathon data." },
      { status: 400 }
    );
  }

  const v = parsed.data;
  const slug = `${slugify(v.title)}-${Date.now().toString(36)}`;

  const { data: hackathon, error } = await supabase
    .from("hackathons")
    .insert({
      organizer_id: user.id,
      title: sanitizeText(v.title),
      slug,
      tagline: sanitizeText(v.tagline || ""),
      description: sanitizeText(v.description),
      eligibility: sanitizeText(v.eligibility),
      mode: v.mode,
      venue: sanitizeText(v.venue || ""),
      min_team_size: v.min_team_size,
      max_team_size: v.max_team_size,
      registration_deadline: new Date(v.registration_deadline).toISOString(),
      start_date: new Date(v.start_date).toISOString(),
      end_date: new Date(v.end_date).toISOString(),
      prize_pool_inr: v.prize_pool_inr,
      funding_source: sanitizeText(v.funding_source),
      status: v.status,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ hackathon }, { status: 201 });
}
