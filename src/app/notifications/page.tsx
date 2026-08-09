import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/utils";
import { NotificationsList, type NotificationItemData } from "@/components/NotificationsList";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        match: {
          include: { lostItem: true, foundItem: true },
        },
      },
    }),
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
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-1 text-slate-500">
          Updates about possible matches for your lost items.
        </p>
      </div>

      <NotificationsList notifications={items} initialUnread={unreadCount} />
    </div>
  );
}
