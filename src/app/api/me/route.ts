import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";

/** GET /api/me — current user profile plus dashboard counts. */
export async function GET() {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const [lostCount, foundCount, unreadNotifications] = await Promise.all([
    prisma.lostItem.count({ where: { userId: user.id } }),
    prisma.foundItem.count({ where: { userId: user.id } }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    stats: { lostCount, foundCount, unreadNotifications },
  });
}
