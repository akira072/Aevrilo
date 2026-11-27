import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createRequestSchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/utils";

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

  const rl = checkRateLimit(`create-request:${user.id}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry in ${rl.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("id", user.id)
    .single();
  if (profile?.account_status !== "active") {
    return NextResponse.json({ error: "Account is restricted or suspended." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid request payload." },
      { status: 400 }
    );
  }

  const v = parsed.data;
  const { data: created, error } = await supabase
    .from("requests")
    .insert({
      client_id: user.id,
      title: sanitizeText(v.title),
      description: sanitizeText(v.description),
      category_id: v.category_id,
      required_skills: v.required_skills.map(sanitizeText),
      budget_inr: v.budget_inr,
      payment_type: v.payment_type,
      deadline: new Date(v.deadline).toISOString(),
      freelancers_needed: v.freelancers_needed,
      additional_requirements: sanitizeText(v.additional_requirements || ""),
      status: "OPEN",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ request: created }, { status: 201 });
}
