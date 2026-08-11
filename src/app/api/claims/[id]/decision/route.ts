import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { getMatchesWithItems } from "@/lib/queries";
import { z } from "zod";

const decisionSchema = z.object({
  decision: z.enum(["accept", "reject"]),
});

/**
 * POST /api/claims/[id]/decision
 * The finder reviews the lost owner's claim and either accepts (creating a
 * private conversation and moving both sides to CONNECTED) or rejects it.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
  }

  const claim = await prisma.claim.findUnique({ where: { id: params.id } });
  if (!claim) {
    return NextResponse.json({ error: "Claim not found." }, { status: 404 });
  }
  if (claim.status !== "PENDING") {
    return NextResponse.json({ error: "This claim has already been reviewed." }, { status: 400 });
  }

  const [match] = await getMatchesWithItems([claim.matchId]);
  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }
  // Only the finder (found-item reporter) can review the claim.
  if (match.foundItem.userId !== user.id) {
    return NextResponse.json({ error: "Only the finder can review this claim." }, { status: 403 });
  }
  if (match.lostItem.status === "RETURNED" || match.foundItem.status === "RETURNED") {
    return NextResponse.json({ error: "This item has already been returned." }, { status: 400 });
  }

  const decision = parsed.data.decision;

  const result = await prisma.$transaction(async (tx) => {
    if (decision === "accept") {
      await tx.claim.update({ where: { id: claim.id }, data: { status: "ACCEPTED" } });
      await tx.match.update({ where: { id: match.id }, data: { status: "CONNECTED" } });
      await tx.lostItem.update({ where: { id: match.lostItemId }, data: { status: "CONNECTED" } });
      await tx.foundItem.update({ where: { id: match.foundItemId }, data: { status: "CONNECTED" } });

      const conversation = await tx.conversation.upsert({
        where: { matchId: match.id },
        create: { matchId: match.id },
        update: {},
      });

      await tx.notification.create({
        data: {
          userId: match.lostItem.userId,
          matchId: match.id,
          conversationId: conversation.id,
          type: "CLAIM_ACCEPTED",
          title: "You're connected!",
          message: `The finder accepted your claim for the ${match.lostItem.itemName}. You can now message them privately.`,
        },
      });

      return { conversationId: conversation.id, status: "ACCEPTED" };
    }

    await tx.claim.update({ where: { id: claim.id }, data: { status: "REJECTED" } });
    await tx.match.update({ where: { id: match.id }, data: { status: "POSSIBLE" } });
    await tx.lostItem.update({ where: { id: match.lostItemId }, data: { status: "POSSIBLE_MATCH" } });

    await tx.notification.create({
      data: {
        userId: match.lostItem.userId,
        matchId: match.id,
        type: "CLAIM_REJECTED",
        title: "Claim declined",
        message: `The finder did not confirm that the ${match.lostItem.itemName} is yours.`,
      },
    });

    return { conversationId: null, status: "REJECTED" };
  });

  return NextResponse.json({ ok: true, ...result });
}
