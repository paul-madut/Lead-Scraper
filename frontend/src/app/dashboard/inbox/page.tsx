"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Phone,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useWorkspace } from "@/components/WorkspaceProvider";
import {
  attachWorkspaceNumber,
  sendSmsMessage,
  subscribeConversations,
  subscribeMessages,
  subscribeWorkspaceNumbers,
} from "@/services/messaging";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Conversation, Message, WorkspaceNumber } from "@/lib/types";

export default function InboxPage() {
  const { user } = useAuth();
  const { workspaceId, loading: wsLoading } = useWorkspace();
  const [numbers, setNumbers] = useState<WorkspaceNumber[] | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    const unsubN = subscribeWorkspaceNumbers(workspaceId, setNumbers);
    const unsubC = subscribeConversations(workspaceId, setConversations);
    return () => {
      unsubN();
      unsubC();
    };
  }, [workspaceId]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  if (wsLoading || numbers === null) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 p-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="h-96 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (numbers.length === 0) {
    return <SetupNumber />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4 sm:px-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <MessageSquare className="h-6 w-6 text-primary" />
          Inbox
        </h1>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[320px_1fr]">
        <aside className="min-h-0 overflow-y-auto border-r">
          {conversations.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No conversations yet. Text a contact to start one.
            </p>
          ) : (
            <ul className="divide-y">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-muted/40",
                      selectedId === c.id && "bg-muted/60"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {c.contactPhone}
                      </span>
                      {c.unread && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {c.lastDirection === "outbound" ? "You: " : ""}
                      {c.lastMessagePreview}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="flex min-h-0 flex-col">
          {selected ? (
            <Thread
              conversation={selected}
              userIdTokenGetter={() => user!.getIdToken()}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Select a conversation
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Thread({
  conversation,
  userIdTokenGetter,
}: {
  conversation: Conversation;
  userIdTokenGetter: () => Promise<string>;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    const unsub = subscribeMessages(conversation.id, setMessages);
    return () => unsub();
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      const token = await userIdTokenGetter();
      await sendSmsMessage(token, {
        to: conversation.contactPhone,
        body: text.trim(),
        contactId: conversation.contactId ?? undefined,
      });
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Phone className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{conversation.contactPhone}</span>
        {conversation.contactId && (
          <Link
            href={`/dashboard/contacts/${conversation.contactId}`}
            className="ml-auto text-sm text-primary hover:underline"
          >
            View contact
          </Link>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex",
              m.direction === "outbound" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                m.direction === "outbound"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <p
                className={cn(
                  "mt-1 text-[10px]",
                  m.direction === "outbound"
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                )}
              >
                {m.createdAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {m.direction === "outbound" && ` · ${m.status}`}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3">
        {error && (
          <p className="mb-2 flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Type a message..."
            disabled={sending}
          />
          <Button onClick={onSend} disabled={sending || !text.trim()}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

function SetupNumber() {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAttach = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      await attachWorkspaceNumber(token, phone.trim(), label.trim() || undefined);
      // The realtime numbers listener will flip the inbox into its normal view.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to attach number.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Connect a phone number
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Attach a Twilio number you own so texts to it land in your inbox.
            Enter it in E.164 format (e.g. <code>+16135550123</code>). Sending
            also requires your Twilio credentials in the environment.
          </p>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Phone number</span>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+16135550123"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Label (optional)</span>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Main line"
            />
          </label>
          {error && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}
          <Button onClick={onAttach} disabled={saving || !phone.trim()}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Attach number
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
