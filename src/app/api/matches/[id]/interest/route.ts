import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { getMatchesWithItems } from "@/lib/queries";

/**
 * POST /api/matches/[id]/interest
 * The owner of the lost item marks a possible match as "my item".
 * Sets the match to OWNER_INTERESTED and both items to MATCHED.
 * (Verification / safe return is a V3 feature.)
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
  if (match.lostItem.userId !== user.id) {
    return NextResponse.json({ error: "You can only manage your own matches." }, { status: 403 });
  }
  if (match.lostItem.status === "RETURNED" || match.foundItem.status === "RETURNED") {
    return NextResponse.json({ error: "This item has already been returned." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: match.id },
      data: { status: "OWNER_INTERESTED" },
    });
    await tx.lostItem.update({
      where: { id: match.lostItemId },
      data: { status: "MATCHED" },
    });
    await tx.foundItem.update({
      where: { id: match.foundItemId },
      data: { status: "MATCHED" },
    });
  });

  return NextResponse.json({ ok: true, status: "OWNER_INTERESTED" });
}
