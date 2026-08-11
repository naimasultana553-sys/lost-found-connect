import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getUserConversations } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const user = await requireUser();
  const conversations = await getUserConversations(user.id);

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-[600px] px-5 pb-32 pt-4">
        <div className="mb-6">
          <h1 className="font-display-lg text-display-lg text-on-surface">Messages</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Private conversations with people who found your items — or whose item you found.
          </p>
        </div>

        {conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[24px] border border-dashed border-tertiary-fixed-dim bg-surface-container-lowest/60 px-6 py-16 text-center">
            <Icon name="forum" className="text-[40px] text-on-surface-variant" />
            <p className="font-label-bold text-label-bold text-on-surface">No conversations yet</p>
            <p className="max-w-sm text-sm text-on-surface-variant">
              When a finder accepts your claim, a private conversation is created here so you can
              arrange the return.
            </p>
            <Link
              href="/browse"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-md transition-opacity hover:opacity-90"
            >
              Browse items
              <Icon name="arrow_forward" className="text-[18px]" />
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {conversations.map((c) => (
              <li key={c.conversationId}>
                <Link
                  href={`/chat/${c.conversationId}`}
                  className="flex items-center gap-4 rounded-[24px] border border-surface-variant/50 bg-surface-container-lowest p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-surface-container-high shadow-soft">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.itemImage} alt={c.itemName} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-label-bold text-label-bold text-on-surface">{c.otherUserName}</p>
                      {c.lastMessageAt && (
                        <span className="shrink-0 text-xs text-on-surface-variant/70">{timeAgo(c.lastMessageAt)}</span>
                      )}
                    </div>
                    <p className="truncate text-sm text-on-surface-variant">{c.lastMessage ?? "No messages yet"}</p>
                    <p className="mt-0.5 truncate text-xs text-primary">
                      {c.itemName} · {c.itemLocation}
                    </p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-on-primary">
                      {c.unreadCount > 9 ? "9+" : c.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
