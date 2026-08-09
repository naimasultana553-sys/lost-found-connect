"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BellRing, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NotificationItemData {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
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
          <p className="text-sm text-slate-500">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </p>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              disabled={busy === "all"}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-60"
            >
              {busy === "all" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Mark all as read
            </button>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center">
          <BellRing className="h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-800">No notifications yet</p>
          <p className="max-w-sm text-sm text-slate-500">
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
                "rounded-2xl border bg-white p-5 shadow-card transition-colors",
                n.isRead ? "border-slate-200" : "border-amber-200 bg-amber-50/40",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.isRead && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-label="Unread" />
                    )}
                    <p className={cn("font-semibold", n.isRead ? "text-slate-800" : "text-slate-900")}>
                      {n.title}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{n.message}</p>

                  {n.match && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span className="font-semibold text-amber-700">
                        {n.match.similarityScore}% Similar
                      </span>
                      <span>
                        Location: {n.match.foundItem.location || "Unknown"}
                      </span>
                    </div>
                  )}

                  <p className="mt-2 text-xs text-slate-400">{n.createdAt}</p>
                </div>

                {match && (
                  <button
                    onClick={async () => {
                      if (!n.isRead) await markRead(n.id);
                      router.push(`/matches/${match.id}`);
                    }}
                    disabled={busy === n.id}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60 sm:w-auto sm:shrink-0"
                  >
                    {busy === n.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "View Match"}
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
