"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ALLOWED_UPLOAD_TYPES } from "@/lib/domain/constants";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn, formatDateTime } from "@/lib/utils";

interface ConvoItem {
  id: string;
  project_id: string | null;
  last_message_at: string;
  otherName: string;
  projectTitle: string;
}

interface MessageItem {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  attachment_name: string | null;
  created_at: string;
}

export function ChatClient({
  userId,
  conversations,
  initialConversationId,
  initialMessages,
}: {
  userId: string;
  conversations: ConvoItem[];
  initialConversationId: string | null;
  initialMessages: MessageItem[];
}) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to Realtime updates on the active conversation
  useEffect(() => {
    if (!initialConversationId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`convo:${initialConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${initialConversationId}`,
        },
        (payload) => {
          const incoming = payload.new as MessageItem;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialConversationId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!initialConversationId || (!body.trim() && !file)) return;
    setSending(true);
    setError(null);

    try {
      let attachment: Record<string, unknown> = {};
      if (file) {
        if (!(ALLOWED_UPLOAD_TYPES.document.mimeTypes as readonly string[]).includes(file.type)) {
          setError(`Unsupported attachment. Allowed: ${ALLOWED_UPLOAD_TYPES.document.label}`);
          setSending(false);
          return;
        }
        if (file.size > ALLOWED_UPLOAD_TYPES.document.maxBytes) {
          setError("Attachment exceeds 15 MB limit.");
          setSending(false);
          return;
        }
        const supabase = createBrowserSupabaseClient();
        if (supabase) {
          const path = `${userId}/${initialConversationId}/${Date.now()}_${file.name}`;
          const { error: upErr } = await supabase.storage
            .from("message-attachments")
            .upload(path, file, { contentType: file.type });
          if (upErr) {
            setError(`Upload failed: ${upErr.message}`);
            setSending(false);
            return;
          }
          attachment = {
            attachment_path: path,
            attachment_name: file.name,
            attachment_mime: file.type,
            attachment_size: file.size,
          };
        }
      }

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: initialConversationId,
          body: body.trim() || `Attached file: ${file?.name}`,
          ...attachment,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Unable to send message.");
        setSending(false);
        return;
      }
      setMessages((prev) =>
        prev.some((m) => m.id === json.message.id) ? prev : [...prev, json.message]
      );
      setBody("");
      setFile(null);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid min-h-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white md:grid-cols-3">
      <div className="border-b border-slate-200 md:border-b-0 md:border-r">
        <div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Conversations ({conversations.length})
        </div>
        <div className="divide-y divide-slate-100">
          {conversations.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">
              No active project threads yet. Threads open automatically when a proposal is accepted.
            </p>
          ) : (
            conversations.map((c) => (
              <Link
                key={c.id}
                href={`/messages?c=${c.id}`}
                className={cn(
                  "block px-4 py-3 transition-colors hover:bg-slate-50",
                  c.id === initialConversationId ? "bg-indigo-50/70" : ""
                )}
              >
                <p className="truncate text-sm font-medium text-slate-900">{c.otherName}</p>
                <p className="truncate text-xs text-slate-500">{c.projectTitle}</p>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col md:col-span-2">
        {!initialConversationId ? (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
            Select a conversation to view messages.
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-5 max-h-[420px]">
              {messages.length === 0 ? (
                <p className="text-sm text-slate-500">No messages yet. Say hello to start collaborating.</p>
              ) : (
                messages.map((m) => {
                  const mine = m.sender_id === userId;
                  return (
                    <div
                      key={m.id}
                      className={cn("flex flex-col", mine ? "items-end" : "items-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm",
                          mine
                            ? "bg-indigo-700 text-white"
                            : "border border-slate-200 bg-slate-50 text-slate-900"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        {m.attachment_name ? (
                          <p className="mt-1 text-xs underline opacity-90">
                            Attachment: {m.attachment_name}
                          </p>
                        ) : null}
                      </div>
                      <span className="mt-1 text-[11px] text-slate-400">
                        {formatDateTime(m.created_at)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSend} className="border-t border-slate-200 p-3 space-y-2">
              {error ? <p className="text-xs text-rose-600">{error}</p> : null}
              <div className="flex items-center gap-2">
                <label
                  className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  title="Attach file (max 15 MB)"
                >
                  <Paperclip className="h-4 w-4" />
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <Input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={file ? `Message (attached: ${file.name})` : "Write a project message..."}
                />
                <Button type="submit" disabled={sending} size="icon" aria-label="Send message">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
