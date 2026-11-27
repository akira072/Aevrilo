import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/validation/schemas";
import { isCollegeEmail, sanitizeText, slugify } from "@/lib/utils";

export async function PATCH(request: Request) {
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

  const body = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid profile input." },
      { status: 400 }
    );
  }

  const v = parsed.data;
  const collegeEmail = v.college_email ? v.college_email.toLowerCase() : null;
  const collegeVerified =
    Boolean(collegeEmail && user.email?.toLowerCase() === collegeEmail && user.email_confirmed_at && isCollegeEmail(collegeEmail));

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({
      full_name: sanitizeText(v.full_name),
      username: v.username,
      headline: sanitizeText(v.headline || ""),
      bio: sanitizeText(v.bio || ""),
      college_or_org: sanitizeText(v.college_or_org || ""),
      college_email: collegeEmail,
      college_email_verified: collegeVerified,
      specialization: sanitizeText(v.specialization || ""),
      city: sanitizeText(v.city || ""),
      availability: v.availability,
      is_client_enabled: v.is_client_enabled,
      is_freelancer_enabled: v.is_freelancer_enabled,
      payout_preference_note: sanitizeText(v.payout_preference_note || ""),
    })
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Sync user skills cleanly
  await supabase.from("user_skills").delete().eq("user_id", user.id);

  for (const rawSkill of v.skills) {
    const cleanName = sanitizeText(rawSkill);
    const slug = slugify(cleanName);
    if (!slug) continue;

    let { data: skill } = await supabase.from("skills").select("id").eq("slug", slug).maybeSingle();
    if (!skill) {
      const inserted = await supabase
        .from("skills")
        .insert({ name: cleanName, slug })
        .select("id")
        .single();
      skill = inserted.data;
    }
    if (skill?.id) {
      await supabase
        .from("user_skills")
        .upsert({ user_id: user.id, skill_id: skill.id }, { onConflict: "user_id,skill_id" });
    }
  }

  return NextResponse.json({ profile: updated });
}
