import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ChatClient } from "@/components/messages/chat-client";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Messages",
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const session = await requireAuthenticatedUser("/login?next=/messages");
  const supabase = await createServerSupabaseClient();

  if (!supabase || !session.userId) {
    return (
      <DashboardShell title="Messages">
        <p className="text-sm text-slate-600">Supabase credentials are required.</p>
      </DashboardShell>
    );
  }

  const { data: convoRows } = await supabase
    .from("conversations")
    .select(
      "id, project_id, participant_one_id, participant_two_id, last_message_at, p1:profiles!conversations_participant_one_id_fkey(full_name), p2:profiles!conversations_participant_two_id_fkey(full_name), project:projects(title)"
    )
    .or(`participant_one_id.eq.${session.userId},participant_two_id.eq.${session.userId}`)
    .order("last_message_at", { ascending: false });

  const conversations = (convoRows ?? []).map((row: Record<string, unknown>) => {
    const isP1 = row.participant_one_id === session.userId;
    const other = (isP1 ? row.p2 : row.p1) as { full_name?: string } | null;
    const project = row.project as { title?: string } | null;
    return {
      id: String(row.id),
      project_id: (row.project_id as string | null) ?? null,
      last_message_at: String(row.last_message_at),
      otherName: other?.full_name || "Aevrilo User",
      projectTitle: project?.title || "Direct Project Thread",
    };
  });

  const activeId =
    c && conversations.some((x) => x.id === c) ? c : conversations[0]?.id ?? null;

  let initialMessages: Array<{
    id: string;
    conversation_id: string;
    sender_id: string;
    body: string;
    attachment_name: string | null;
    created_at: string;
  }> = [];

  if (activeId) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, attachment_name, created_at")
      .eq("conversation_id", activeId)
      .order("created_at", { ascending: true });
    initialMessages = msgs ?? [];

    await supabase
      .from("messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("conversation_id", activeId)
      .neq("sender_id", session.userId)
      .eq("is_read", false);
  }

  return (
    <DashboardShell
      isAdmin={session.isAdmin}
      title="Messages"
      subtitle="Realtime project collaboration threads with secure attachments."
    >
      <ChatClient
        key={activeId ?? "none"}
        userId={session.userId}
        conversations={conversations}
        initialConversationId={activeId}
        initialMessages={initialMessages}
      />
    </DashboardShell>
  );
}
