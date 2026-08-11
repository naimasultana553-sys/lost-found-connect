import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { getMatchesWithItems } from "@/lib/queries";
import { z } from "zod";

const claimSchema = z.object({
  detail: z.string().trim().min(1, "Please describe what identifies this item as yours").max(1000),
});

/**
 * POST /api/matches/[id]/claim
 * The lost-item owner sends an ownership claim (with an identifying detail)
 * to the finder. The match moves to OWNER_INTERESTED and the finder is
 * notified. Ownership is NOT confirmed until the finder accepts.
 */
export async function POST(
  req: NextRequest,
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
  if (match.lostItem.userId !== user.id) {
    return NextResponse.json({ error: "You can only claim matches for items you lost." }, { status: 403 });
  }
  if (match.lostItem.status === "RETURNED" || match.foundItem.status === "RETURNED") {
    return NextResponse.json({ error: "This item has already been returned." }, { status: 400 });
  }
  if (match.status === "CONNECTED") {
    return NextResponse.json({ error: "You're already connected for this match." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please describe what identifies this item as yours.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const claim = await prisma.$transaction(async (tx) => {
    const c = await tx.claim.create({
      data: {
        matchId: match.id,
        ownerUserId: user.id,
        detail: parsed.data.detail,
      },
    });

    await tx.match.update({
      where: { id: match.id },
      data: { status: "OWNER_INTERESTED" },
    });
    await tx.lostItem.update({
      where: { id: match.lostItemId },
      data: { status: "MATCHED" },
    });

    await tx.notification.create({
      data: {
        userId: match.foundItem.userId,
        matchId: match.id,
        type: "CLAIM",
        title: "Someone claims this item",
        message: `${user.name} says the ${match.lostItem.itemName} you found is theirs. Review their claim.`,
      },
    });

    return c;
  });

  return NextResponse.json({
    ok: true,
    claim: { id: claim.id, status: claim.status, detail: claim.detail },
    matchStatus: "OWNER_INTERESTED",
  });
}
