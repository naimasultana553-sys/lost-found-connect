import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";

/**
 * GET /api/notifications
 * Returns the current user's notifications (newest first), each with enough
 * data to render the "View Match" flow.
 */
export async function GET(_req: NextRequest) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      match: {
        include: {
          lostItem: true,
          foundItem: true,
        },
      },
    },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}
