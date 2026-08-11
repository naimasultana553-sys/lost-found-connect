"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

export interface NotificationItemData {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  conversationId: string | null;
  match: {
    id: string;
    similarityScore: number;
    lostItem: { itemName: string };
    foundItem: { itemName: string; location: string };
  } | null;
}

export function NotificationsList({
  notifications,
  initialUnread,
}: {
  notifications: NotificationItemData[];
  initialUnread: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [items, setItems] = useState(notifications);
  const [unread, setUnread] = useState(initialUnread);

  async function markRead(id: string) {
    setBusy(id);
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } finally {
      setBusy(null);
    }
  }

  async function markAllRead() {
    setBusy("all");
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-on-surface-variant">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </p>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              disabled={busy === "all"}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-label-md text-label-md text-primary hover:bg-primary/5 disabled:opacity-60"
            >
              {busy === "all" ? (
                <Icon name="hourglass_top" className="animate-spin text-[16px]" />
              ) : (
                <Icon name="done_all" className="text-[16px]" />
              )}
              Mark all as read
            </button>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[24px] border border-dashed border-tertiary-fixed-dim bg-surface-container-lowest/60 px-6 py-16 text-center">
          <Icon name="notifications_none" className="text-[40px] text-on-surface-variant" />
          <p className="font-label-bold text-label-bold text-on-surface">No notifications yet</p>
          <p className="max-w-sm text-sm text-on-surface-variant">
            When a possible match is found, you&apos;ll be notified here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => {
            const match = n.match;
            return (
              <li
                key={n.id}
                className={cn(
                  "rounded-[24px] border bg-surface-container-lowest p-5 shadow-card transition-colors",
                  n.isRead ? "border-surface-variant/50" : "border-secondary-container bg-secondary-container/20",
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {!n.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                      )}
                      <p className={cn("font-label-bold text-label-bold", n.isRead ? "text-on-surface" : "text-on-surface")}>
                        {n.title}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-on-surface-variant">{n.message}</p>

                    {n.match && (
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-on-surface-variant">
                        <span className="rounded-full bg-secondary-container px-3 py-0.5 font-label-md text-label-md text-secondary">
                          {n.match.similarityScore}% Similar
                        </span>
                        <span>Location: {n.match.foundItem.location || "Unknown"}</span>
                      </div>
                    )}

                    <p className="mt-2 text-xs text-on-surface-variant/70">{n.createdAt}</p>
                  </div>

                  {match && (
                    <button
                      onClick={async () => {
                        if (!n.isRead) await markRead(n.id);
                        if (n.type === "MESSAGE" && n.conversationId) {
                          router.push(`/chat/${n.conversationId}`);
                        } else {
                          router.push(`/matches/${match.id}`);
                        }
                      }}
                      disabled={busy === n.id}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 font-label-md text-label-md text-on-primary shadow-md transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto sm:shrink-0"
                    >
                      {busy === n.id ? (
                        <Icon name="hourglass_top" className="animate-spin text-[16px]" />
                      ) : n.type === "MESSAGE" ? (
                        "Open Chat"
                      ) : n.type === "CLAIM" ? (
                        "Review Claim"
                      ) : (
                        "View Match"
                      )}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
