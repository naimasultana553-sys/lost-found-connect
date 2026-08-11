import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getUserConversations } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";

/**
 * GET /api/conversations
 * Returns the current user's private conversations, newest first, with the
 * other party's name and a last-message preview for the inbox screen.
 */
export async function GET() {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const conversations = await getUserConversations(user.id);

  return NextResponse.json({
    conversations: conversations.map((c) => ({
      conversationId: c.conversationId,
      matchId: c.matchId,
      otherUserId: c.otherUserId,
      otherUserName: c.otherUserName,
      itemImage: c.itemImage,
      itemName: c.itemName,
      itemLocation: c.itemLocation,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt ? timeAgo(c.lastMessageAt) : null,
      unreadCount: c.unreadCount,
    })),
  });
}
