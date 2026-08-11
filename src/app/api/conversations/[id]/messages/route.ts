import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { getConversationForUser } from "@/lib/queries";
import { z } from "zod";

const sendSchema = z.object({
  text: z.string().trim().min(1, "Message cannot be empty").max(2000),
});

/**
 * GET /api/conversations/[id]/messages?after=<ISO datetime>
 * Polling endpoint for the chat screen. Only the two participants may read
 * the thread. Pass `after` (ISO timestamp of the newest message already
 * shown) to fetch only newer messages — used for polling.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const detail = await getConversationForUser(params.id, user.id);
  if (!detail) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const afterRaw = req.nextUrl.searchParams.get("after");
  const after = afterRaw ? new Date(afterRaw) : null;
  const take = Math.min(Number(req.nextUrl.searchParams.get("take")) || 100, 200);

  const messages = await prisma.message.findMany({
    where: {
      conversationId: detail.id,
      ...(after && !Number.isNaN(after.getTime()) ? { createdAt: { gt: after } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take,
  });

  // Mark incoming messages as read when the owner opens the thread.
  const incoming = messages.filter((m) => m.senderId !== user.id && !m.isRead);
  if (incoming.length > 0) {
    await prisma.message.updateMany({
      where: { id: { in: incoming.map((m) => m.id) } },
      data: { isRead: true },
    });
    await prisma.notification.updateMany({
      where: { userId: user.id, conversationId: detail.id, type: "MESSAGE", isRead: false },
      data: { isRead: true },
    });
  }

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      text: m.text,
      createdAt: m.createdAt,
      isMine: m.senderId === user.id,
    })),
    returned: detail.returned,
  });
}

/**
 * POST /api/conversations/[id]/messages
 * Send a message in a private conversation. Only the two participants may
 * send; a returned item locks the thread.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const detail = await getConversationForUser(params.id, user.id);
  if (!detail) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }
  if (detail.returned) {
    return NextResponse.json({ error: "This item has already been returned." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: detail.id,
      senderId: user.id,
      text: parsed.data.text,
    },
  });

  await prisma.notification.create({
    data: {
      userId: detail.otherUserId,
      matchId: detail.match.id,
      conversationId: detail.id,
      type: "MESSAGE",
      title: "New message",
      message: `${user.name}: ${message.text.slice(0, 120)}`,
    },
  });

  return NextResponse.json({
    message: {
      id: message.id,
      senderId: message.senderId,
      text: message.text,
      createdAt: message.createdAt,
      isMine: true,
    },
  });
}
