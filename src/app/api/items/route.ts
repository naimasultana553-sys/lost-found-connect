import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { createItemSchema } from "@/lib/validators";
import { computeImageHashFromUrl } from "@/matching/imageMatcher";
import { computeMatchScore } from "@/matching/score";
import {
  processFoundItemMatches,
  processLostItemMatches,
} from "@/matching/matchService";
import type { FoundItem, LostItem } from "@prisma/client";

export const runtime = "nodejs";

function serializeLost(item: LostItem) {
  return {
    id: item.id,
    type: "lost",
    imageUrl: item.imageUrl,
    itemName: item.itemName,
    category: item.category,
    description: item.description,
    location: item.location,
    date: item.dateLost,
    status: item.status,
    createdAt: item.createdAt,
  };
}

function serializeFound(item: FoundItem) {
  return {
    id: item.id,
    type: "found",
    imageUrl: item.imageUrl,
    itemName: item.itemName,
    category: item.category,
    description: item.description,
    location: item.location,
    date: item.dateFound,
    status: item.status,
    createdAt: item.createdAt,
  };
}

/**
 * Enrich each match result with a summary of the matched (opposite-type)
 * item and the full score breakdown, so the UI can render both images side
 * by side and show the "Match Information" details.
 */
async function enrichMatches(
  matches: { matchId: string; itemId: string; similarityScore: number }[],
  type: "lost" | "found",
  createdItem: LostItem | FoundItem,
) {
  return Promise.all(
    matches.map(async (m) => {
      const matched =
        type === "lost"
          ? await prisma.foundItem.findUnique({ where: { id: m.itemId } })
          : await prisma.lostItem.findUnique({ where: { id: m.itemId } });
      if (!matched) return { ...m, matchedItem: null, breakdown: null };

      const isLostType = type === "lost";
      const createdDate = isLostType
        ? (createdItem as LostItem).dateLost
        : (createdItem as FoundItem).dateFound;
      const matchedDate = isLostType
        ? (matched as FoundItem).dateFound
        : (matched as LostItem).dateLost;

      const breakdown = computeMatchScore({
        imageHashA: createdItem.imageHash,
        imageHashB: matched.imageHash,
        nameA: createdItem.itemName,
        nameB: matched.itemName,
        categoryA: createdItem.category,
        categoryB: matched.category,
        locationA: createdItem.location,
        locationB: matched.location,
        dateA: createdDate,
        dateB: matchedDate,
      });

      return {
        ...m,
        matchedItem: {
          id: matched.id,
          imageUrl: matched.imageUrl,
          itemName: matched.itemName,
          location: matched.location,
          date:
            isLostType
              ? (matched as FoundItem).dateFound
              : (matched as LostItem).dateLost,
        },
        breakdown: {
          image: breakdown.image,
          category: breakdown.category,
          location: breakdown.location,
          date: breakdown.date,
        },
      };
    }),
  );
}

/**
 * POST /api/items
 * Create a lost or found report, then immediately run the matching process
 * against existing reports of the opposite type. Returns the created item
 * plus any possible matches that were found and persisted.
 */
export async function POST(req: NextRequest) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fix the highlighted fields.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { type, imageUrl, itemName, category, location, description, date } = parsed.data;

  try {
    // Compute the perceptual hash from the stored image. Best-effort: a
    // failure (e.g. unreachable image) just means the image contributes 0.
    const imageHash = await computeImageHashFromUrl(imageUrl);

    if (type === "lost") {
      const item = await prisma.lostItem.create({
        data: {
          userId: user.id,
          imageUrl,
          imageHash,
          itemName,
          category,
          description: description || null,
          location,
          dateLost: new Date(date),
        },
      });
      const matches = await processLostItemMatches(item);
      if (matches.length > 0) item.status = "POSSIBLE_MATCH";
      return NextResponse.json({ item: serializeLost(item), matches: await enrichMatches(matches, "lost", item) });
    }

    const item = await prisma.foundItem.create({
      data: {
        userId: user.id,
        imageUrl,
        imageHash,
        itemName,
        category,
        description: description || null,
        location,
        dateFound: new Date(date),
      },
    });
    const matches = await processFoundItemMatches(item);
    return NextResponse.json({ item: serializeFound(item), matches: await enrichMatches(matches, "found", item) });
  } catch (err) {
    console.error("[create item]", err);
    return NextResponse.json({ error: "Could not save your report. Please try again." }, { status: 500 });
  }
}

/**
 * GET /api/items?type=lost|found&q=...&category=...
 * Public browse/search endpoint. Items are returned with their best match
 * score (for lost items) so cards can show "Possible Match: 91%".
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() ?? "";

  const where = {
    AND: [
      type === "lost" || type === "found" ? ({} as Record<string, unknown>) : {},
      q
        ? {
            OR: [
              { itemName: { contains: q } },
              { location: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : {},
      category ? { category } : {},
    ],
  };

  const [lostItems, foundItems] = await Promise.all([
    prisma.lostItem.findMany({
      where: {
        ...(type === "lost" ? where.AND[0] : {}),
        ...(q ? where.AND[1] : {}),
        ...(category ? { category } : {}),
        status: { not: "RETURNED" },
      },
      include: { matches: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.foundItem.findMany({
      where: {
        ...(type === "found" ? where.AND[0] : {}),
        ...(q ? where.AND[1] : {}),
        ...(category ? { category } : {}),
        status: { not: "RETURNED" },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const lostSerialized = lostItems.map((item) => ({
    ...serializeLost(item),
    bestMatchScore: item.matches.length
      ? Math.max(...item.matches.map((m) => m.similarityScore))
      : null,
  }));
  const foundSerialized = foundItems.map(serializeFound);

  return NextResponse.json({
    items: [...lostSerialized, ...foundSerialized].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  });
}
