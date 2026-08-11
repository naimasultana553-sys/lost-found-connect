"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";

interface MessageData {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  isMine: boolean;
}

interface ChatRoomProps {
  conversationId: string;
  matchId: string;
  otherUserName: string;
  itemImage: string;
  itemName: string;
  itemLocation: string;
  returned: boolean;
  initialMessages: MessageData[];
}

const POLL_MS = 4000;

export function ChatRoom({
  conversationId,
  matchId,
  otherUserName,
  itemImage,
  itemName,
  itemLocation,
  returned: initiallyReturned,
  initialMessages,
}: ChatRoomProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [returned, setReturned] = useState(initiallyReturned);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef(initialMessages[initialMessages.length - 1]?.createdAt ?? null);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Poll for new messages while the chat is open.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/messages${afterRef.current ? `?after=${encodeURIComponent(afterRef.current)}` : ""}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data.messages.length > 0) {
            afterRef.current = data.messages[data.messages.length - 1].createdAt;
            setMessages((prev) => {
              const have = new Set(prev.map((m) => m.id));
              const fresh = data.messages.filter((m: MessageData) => !have.has(m.id));
              return fresh.length ? [...prev, ...fresh] : prev;
            });
          }
          if (data.returned) setReturned(true);
        }
      } catch {
        // transient network error — keep polling
      } finally {
        if (!cancelled) timer = setTimeout(poll, POLL_MS);
      }
    }

    timer = setTimeout(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [conversationId]);

  async function send() {
    const text = draft.trim();
    if (!text || sending || returned) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Could not send your message.");
        return;
      }
      const data = await res.json();
      afterRef.current = data.message.createdAt;
      setMessages((prev) => [...prev, data.message]);
      setDraft("");
    } catch {
      setError("Could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function markReturned() {
    setMarking(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/return`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Could not mark the item as returned.");
        return;
      }
      setReturned(true);
      setConfirmOpen(false);
      router.refresh();
    } catch {
      setError("Could not mark the item as returned.");
    } finally {
      setMarking(false);
    }
  }

  const timeLabel = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-surface shadow-sm">
        <div className="mx-auto flex w-full max-w-[600px] items-center gap-3 px-5 py-3">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-variant"
          >
            <Icon name="arrow_back" />
          </button>
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-container-high ring-2 ring-surface shadow-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={itemImage} alt={itemName} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-label-bold text-label-bold text-on-surface">{otherUserName}</p>
            <p className="truncate text-xs text-on-surface-variant">
              {itemName} · {itemLocation}
            </p>
          </div>
          <LinkBtn
            label="Conversations"
            icon="forum"
            onClick={() => router.push("/chat")}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[600px] flex-1 flex-col px-5">
        {/* Returned banner */}
        {returned && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-full bg-secondary-container px-4 py-2 font-label-md text-label-md text-secondary">
            <Icon name="check_circle" filled className="text-[18px]" />
            Item returned
          </div>
        )}

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-2 overflow-y-auto py-5"
          style={{ minHeight: 0 }}
        >
          {messages.length === 0 && (
            <p className="pt-10 text-center text-sm text-on-surface-variant">
              Say hello — this is your private conversation with {otherUserName}.
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn("flex", m.isMine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-[20px] px-4 py-2.5 shadow-soft",
                  m.isMine
                    ? "rounded-br-sm bg-primary text-on-primary"
                    : "rounded-bl-sm bg-surface-container-lowest text-on-surface ring-1 ring-surface-variant/50",
                )}
              >
                <p className="whitespace-pre-wrap break-words font-body-md text-body-md">{m.text}</p>
                <p
                  className={cn(
                    "mt-0.5 text-right text-[10px] leading-none",
                    m.isMine ? "text-on-primary/70" : "text-on-surface-variant/70",
                  )}
                >
                  {timeLabel(m.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="mb-2 rounded-2xl bg-error-container px-4 py-2.5 text-sm text-on-error-container">
            {error}
          </p>
        )}

        {/* Composer */}
        <div className="pb-5 pt-1">
          {returned ? (
            <div className="flex items-center justify-center gap-2 rounded-[20px] bg-surface-container px-4 py-3.5 text-sm font-medium text-on-surface-variant">
              <Icon name="task_alt" className="text-[20px] text-primary" />
              Returned ✓ — this conversation is closed.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmOpen(true)}
                  aria-label="Mark item as returned"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-surface-container-low text-primary transition-colors hover:bg-surface-container"
                >
                  <Icon name="check_circle" className="text-[24px]" />
                </button>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder={`Message ${otherUserName}…`}
                  className="min-w-0 flex-1 rounded-full border border-surface-variant bg-surface-container-lowest px-5 py-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none"
                />
                <button
                  onClick={send}
                  disabled={!draft.trim() || sending}
                  aria-label="Send message"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-md transition-transform active:scale-95 disabled:opacity-50"
                >
                  {sending ? (
                    <Icon name="hourglass_top" className="animate-spin text-[24px]" />
                  ) : (
                    <Icon name="send" filled className="text-[24px]" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-center text-xs text-on-surface-variant/70">
                Only you and {otherUserName} can see this conversation.
              </p>
            </>
          )}
        </div>
      </main>

      {/* Return confirmation dialog */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-[600px] rounded-t-[24px] bg-surface-container-lowest p-6 shadow-lift sm:rounded-[24px]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container text-secondary">
              <Icon name="task_alt" className="text-[28px]" />
            </div>
            <h2 className="text-center font-display-md text-display-md text-on-surface">Return this item?</h2>
            <p className="mt-2 text-center text-sm text-on-surface-variant">
              Mark the {itemName} as returned to {otherUserName}. This closes the conversation and
              updates both reports.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                onClick={markReturned}
                disabled={marking}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-label-md text-label-md text-on-primary shadow-md transition-transform active:scale-95 disabled:opacity-60"
              >
                {marking ? (
                  <Icon name="hourglass_top" className="animate-spin text-[18px]" />
                ) : (
                  "Yes, Item Returned"
                )}
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={marking}
                className="w-full rounded-full border border-surface-variant py-3.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LinkBtn({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-variant"
    >
      <Icon name={icon} className="text-[24px]" />
    </button>
  );
}
