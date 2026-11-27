import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendMessageSchema } from "@/lib/validation/schemas";
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

  const body = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid message payload." },
      { status: 400 }
    );
  }

  const { conversation_id, body: rawBody } = parsed.data;
  const { data: convo } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversation_id)
    .single();

  if (!convo) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }
  if (convo.participant_one_id !== user.id && convo.participant_two_id !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id,
      sender_id: user.id,
      body: sanitizeText(rawBody),
      attachment_path: body?.attachment_path || null,
      attachment_name: body?.attachment_name || null,
      attachment_mime: body?.attachment_mime || null,
      attachment_size: body?.attachment_size || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const recipientId =
    convo.participant_one_id === user.id ? convo.participant_two_id : convo.participant_one_id;

  await Promise.all([
    supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation_id),
    supabase.from("notifications").insert({
      user_id: recipientId,
      type: "new_message",
      title: "New project message",
      body: sanitizeText(rawBody).slice(0, 120),
      link_url: `/messages?c=${conversation_id}`,
    }),
  ]);

  return NextResponse.json({ message }, { status: 201 });
}
