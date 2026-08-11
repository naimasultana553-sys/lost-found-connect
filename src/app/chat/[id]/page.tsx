import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getConversationForUser } from "@/lib/queries";
import { ChatRoom } from "@/components/ChatRoom";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: { id: string } }) {
  const user = await requireUser();

  const detail = await getConversationForUser(params.id, user.id);
  if (!detail) notFound();

  const messages = await prisma.message.findMany({
    where: { conversationId: detail.id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  // Mark the other party's messages + related notifications as read on load.
  const incoming = messages.filter((m) => m.senderId !== user.id && !m.isRead);
  if (incoming.length > 0) {
    await Promise.all([
      prisma.message.updateMany({
        where: { id: { in: incoming.map((m) => m.id) } },
        data: { isRead: true },
      }),
      prisma.notification.updateMany({
        where: { userId: user.id, conversationId: detail.id, type: "MESSAGE", isRead: false },
        data: { isRead: true },
      }),
    ]);
  }

  const match = detail.match;
  const mine = match.lostItem.userId === user.id;

  return (
    <ChatRoom
      conversationId={detail.id}
      matchId={match.id}
      otherUserName={detail.otherUserName}
      itemImage={mine ? match.foundItem.imageUrl : match.lostItem.imageUrl}
      itemName={match.lostItem.itemName}
      itemLocation={mine ? match.foundItem.location : match.lostItem.location}
      returned={detail.returned}
      initialMessages={messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        text: m.text,
        createdAt: m.createdAt.toISOString(),
        isMine: m.senderId === user.id,
      }))}
    />
  );
}
