import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { problemStatementSchema } from "@/lib/validation/schemas";
import { sanitizeText } from "@/lib/utils";

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

  const [{ data: hackathon }, { data: adminRole }] = await Promise.all([
    supabase.from("hackathons").select("id, title, organizer_id").eq("id", hackathonId).single(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
  ]);

  if (!hackathon) {
    return NextResponse.json({ error: "Hackathon not found." }, { status: 404 });
  }
  if (hackathon.organizer_id !== user.id && !adminRole) {
    return NextResponse.json({ error: "Organizer access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  if (body?.kind === "announcement") {
    const title = sanitizeText(String(body.title || ""));
    const msg = sanitizeText(String(body.body || ""));
    if (title.length < 3 || msg.length < 5) {
      return NextResponse.json({ error: "Announcement title and body are required." }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("hackathon_announcements")
      .insert({ hackathon_id: hackathonId, author_id: user.id, title, body: msg })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ announcement: data }, { status: 201 });
  }

  if (body?.kind === "prize") {
    const rankLabel = sanitizeText(String(body.rank_label || ""));
    const amountInr = Number(body.amount_inr || 0);
    const rankOrder = Number(body.rank_order || 1);
    const { data, error } = await supabase
      .from("prizes")
      .insert({
        hackathon_id: hackathonId,
        rank_label: rankLabel,
        rank_order: rankOrder,
        amount_inr: amountInr,
        funding_source: sanitizeText(String(body.funding_source || "Organizer")),
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ prize: data }, { status: 201 });
  }

  const parsed = problemStatementSchema.safeParse({ ...body, hackathon_id: hackathonId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid problem statement." },
      { status: 400 }
    );
  }

  const v = parsed.data;
  const { data, error } = await supabase
    .from("problem_statements")
    .insert({
      hackathon_id: hackathonId,
      code: sanitizeText(v.code),
      title: sanitizeText(v.title),
      description: sanitizeText(v.description),
      track: sanitizeText(v.track),
      difficulty: v.difficulty,
      expected_deliverables: sanitizeText(v.expected_deliverables || ""),
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ problemStatement: data }, { status: 201 });
}
