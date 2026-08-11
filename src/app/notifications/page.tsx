import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { notificationsWithMatches } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { NotificationsList, type NotificationItemData } from "@/components/NotificationsList";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();

  const [notifications, unreadCount] = await Promise.all([
    notificationsWithMatches(user.id),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  const items: NotificationItemData[] = notifications.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    createdAt: timeAgo(n.createdAt),
    match: n.match
      ? {
          id: n.match.id,
          similarityScore: n.match.similarityScore,
          lostItem: { itemName: n.match.lostItem.itemName },
          foundItem: {
            itemName: n.match.foundItem.itemName,
            location: n.match.foundItem.location,
          },
        }
      : null,
  }));

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-[600px] px-5 pb-32 pt-4">
        <div className="mb-6">
          <h1 className="font-display-lg text-display-lg text-on-surface">Alerts</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Updates about possible matches for your lost items.
          </p>
        </div>

        <NotificationsList notifications={items} initialUnread={unreadCount} />
      </main>
    </>
  );
}
