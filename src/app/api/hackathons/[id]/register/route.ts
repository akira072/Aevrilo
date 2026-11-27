import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: hackathonId } = await context.params;
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

  const { data: hackathon } = await supabase
    .from("hackathons")
    .select("id, title, registration_deadline, status")
    .eq("id", hackathonId)
    .single();

  if (!hackathon) {
    return NextResponse.json({ error: "Hackathon not found." }, { status: 404 });
  }
  if (new Date() > new Date(hackathon.registration_deadline)) {
    return NextResponse.json({ error: "Registration deadline has passed." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { data: profile } = await supabase
    .from("profiles")
    .select("college_or_org")
    .eq("id", user.id)
    .single();

  const { data: reg, error } = await supabase
    .from("registrations")
    .upsert(
      {
        hackathon_id: hackathonId,
        user_id: user.id,
        registration_type: body?.registration_type === "team" ? "team" : "individual",
        college_name: body?.college_name || profile?.college_or_org || "",
        status: "confirmed",
      },
      { onConflict: "hackathon_id,user_id" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "hackathon_registration",
    title: "Hackathon registration confirmed",
    body: `You are registered for "${hackathon.title}". Form or join a team to submit your project.`,
    link_url: `/hackathons/${hackathonId}`,
  });

  return NextResponse.json({ registration: reg }, { status: 201 });
}
