import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { getMatchesWithItems } from "@/lib/queries";

/**
 * POST /api/matches/[id]/return
 * Either participant marks the item as returned. Both reports move to
 * RETURNED and both parties are notified.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const [match] = await getMatchesWithItems([params.id]);
  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  const isLostOwner = match.lostItem.userId === user.id;
  const isFinder = match.foundItem.userId === user.id;
  if (!isLostOwner && !isFinder) {
    return NextResponse.json({ error: "You can only update your own matches." }, { status: 403 });
  }
  if (match.lostItem.status === "RETURNED" || match.foundItem.status === "RETURNED") {
    return NextResponse.json({ error: "This item has already been returned." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.lostItem.update({ where: { id: match.lostItemId }, data: { status: "RETURNED" } });
    await tx.foundItem.update({ where: { id: match.foundItemId }, data: { status: "RETURNED" } });

    const otherUserId = isLostOwner ? match.foundItem.userId : match.lostItem.userId;
    await tx.notification.create({
      data: {
        userId: otherUserId,
        matchId: match.id,
        type: "RETURNED",
        title: "Item returned",
        message: `The ${match.lostItem.itemName} has been marked as returned. Great job reuniting it!`,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
