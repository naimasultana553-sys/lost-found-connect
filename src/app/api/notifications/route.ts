import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { notificationsWithMatches } from "@/lib/queries";

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

  const notifications = await notificationsWithMatches(user.id);

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}
