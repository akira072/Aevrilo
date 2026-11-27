import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createReportSchema } from "@/lib/validation/schemas";
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

  const rl = checkRateLimit(`report:${user.id}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many reports submitted." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid report payload." },
      { status: 400 }
    );
  }

  const v = parsed.data;
  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: user.id,
      target_type: v.target_type,
      target_id: v.target_id,
      reason: sanitizeText(v.reason),
      details: sanitizeText(v.details || ""),
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ report }, { status: 201 });
}
