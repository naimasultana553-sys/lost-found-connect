/**
 * Matching service — the public entry point the rest of the app calls.
 *
 *   findPossibleMatchesFor(lostItem)  →  [{ foundItemId, similarityScore }]
 *   findPossibleMatchesFor(foundItem) →  [{ lostItemId, similarityScore }]
 *
 * When a report is created the service runs the comparison against items of
 * the opposite type, persists Match records and creates in-app
 * notifications for the owner of each lost item. Image similarity uses the
 * Gemini vision model (AI) with a free local perceptual-hash (dHash) fallback
 * when the API is not configured or fails; name/category/location/date
 * heuristics are computed locally. The interface is stable so a different
 * model can be dropped in without changing callers.
 */
import type { LostItem, FoundItem } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMatchesWithItems } from "@/lib/queries";
import { MATCHING_CONFIG } from "@/matching/config";
import { getGeminiImageScores } from "@/matching/gemini";
import { computeMatchScore, type ScoreBreakdown } from "@/matching/score";

export interface PossibleMatchResult {
  matchId: string;
  itemId: string; // the id of the opposite-type item
  similarityScore: number;
  imageScore: number | null;
}

interface CandidateInput {
  id: string;
  userId: string;
  imageUrl: string;
  imageHash: string | null;
  name: string;
  category: string;
  location: string;
  date: Date;
}

function lostInput(item: LostItem): CandidateInput {
  return {
    id: item.id,
    userId: item.userId,
    imageUrl: item.imageUrl,
    imageHash: item.imageHash,
    name: item.itemName,
    category: item.category,
    location: item.location,
    date: item.dateLost,
  };
}

function foundInput(item: FoundItem): CandidateInput {
  return {
    id: item.id,
    userId: item.userId,
    imageUrl: item.imageUrl,
    imageHash: item.imageHash,
    name: item.itemName,
    category: item.category,
    location: item.location,
    date: item.dateFound,
  };
}

/** Shared scoring for one candidate pair. `imageScore` is the AI-provided
 * image similarity (0-100); null falls back to dHash. */
function scorePair(lost: CandidateInput, found: CandidateInput, imageScore: number | null): number {
  if (lost.userId === found.userId) return 0; // never match a user against themselves
  return computeMatchScore({
    imageScore,
    imageHashA: lost.imageHash,
    imageHashB: found.imageHash,
    nameA: lost.name,
    nameB: found.name,
    categoryA: lost.category,
    categoryB: found.category,
    locationA: lost.location,
    locationB: found.location,
    dateA: lost.date,
    dateB: found.date,
  }).total;
}

/**
 * Compare a newly reported lost item against existing found items and return
 * candidates that clear the threshold, best-first.
 */
export async function findMatchesForLostItem(lost: LostItem) {
  const foundItems = await prisma.foundItem.findMany({
    where: { status: { not: "RETURNED" } },
  });

  const opponents = foundItems.filter((f) => f.userId !== lost.userId);

  // AI image similarity for every candidate (one batched Gemini flow).
  const imageScores = await getGeminiImageScores(
    lost.imageUrl,
    opponents.map((f) => ({ itemId: f.id, imageUrl: f.imageUrl })),
  );

  const candidates: { foundItemId: string; similarityScore: number; imageScore: number | null }[] = [];
  for (const found of opponents) {
    const imageScore = imageScores.get(found.id) ?? null;
    const score = scorePair(lostInput(lost), foundInput(found), imageScore);
    if (score >= MATCHING_CONFIG.matchThreshold) {
      candidates.push({ foundItemId: found.id, similarityScore: score, imageScore });
    }
  }

  return candidates
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, MATCHING_CONFIG.maxResults);
}

/**
 * Compare a newly reported found item against existing lost items and return
 * candidates that clear the threshold, best-first.
 */
export async function findMatchesForFoundItem(found: FoundItem) {
  const lostItems = await prisma.lostItem.findMany({
    where: { status: { not: "RETURNED" } },
  });

  const opponents = lostItems.filter((l) => l.userId !== found.userId);

  const imageScores = await getGeminiImageScores(
    found.imageUrl,
    opponents.map((l) => ({ itemId: l.id, imageUrl: l.imageUrl })),
  );

  const candidates: { lostItemId: string; similarityScore: number; imageScore: number | null }[] = [];
  for (const lost of opponents) {
    const imageScore = imageScores.get(lost.id) ?? null;
    const score = scorePair(lostInput(lost), foundInput(found), imageScore);
    if (score >= MATCHING_CONFIG.matchThreshold) {
      candidates.push({ lostItemId: lost.id, similarityScore: score, imageScore });
    }
  }

  return candidates
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, MATCHING_CONFIG.maxResults);
}

/**
 * Persist matches + notifications for a newly reported lost item, and update
 * the lost item status to POSSIBLE_MATCH when a match exists. Both the lost
 * owner (reporter) and each matched found item's owner are notified.
 */
export async function processLostItemMatches(lost: LostItem): Promise<PossibleMatchResult[]> {
  const candidates = await findMatchesForLostItem(lost);
  const results: PossibleMatchResult[] = [];

  for (const candidate of candidates) {
    const found = await prisma.foundItem.findUnique({ where: { id: candidate.foundItemId } });
    if (!found) continue;

    const existing = await prisma.match.findUnique({
      where: {
        lostItemId_foundItemId: {
          lostItemId: lost.id,
          foundItemId: candidate.foundItemId,
        },
      },
    });

    if (existing) {
      results.push({
        matchId: existing.id,
        itemId: candidate.foundItemId,
        similarityScore: candidate.similarityScore,
        imageScore: candidate.imageScore,
      });
      continue;
    }

    const match = await prisma.match.create({
      data: {
        lostItemId: lost.id,
        foundItemId: candidate.foundItemId,
        similarityScore: candidate.similarityScore,
        imageScore: candidate.imageScore,
      },
    });

    await notifyLostOwner(match.id, lost);
    await notifyFoundOwner(match.id, found);

    results.push({
      matchId: match.id,
      itemId: candidate.foundItemId,
      similarityScore: candidate.similarityScore,
      imageScore: candidate.imageScore,
    });
  }

  if (results.length > 0) {
    await prisma.lostItem.update({
      where: { id: lost.id },
      data: { status: "POSSIBLE_MATCH" },
    });
  }

  return results;
}

/**
 * Persist matches + notifications for a newly reported found item. Both the
 * found owner (reporter) and each matched lost item's owner are notified, and
 * the lost item status becomes POSSIBLE_MATCH.
 */
export async function processFoundItemMatches(found: FoundItem): Promise<PossibleMatchResult[]> {
  const candidates = await findMatchesForFoundItem(found);
  const results: PossibleMatchResult[] = [];

  for (const candidate of candidates) {
    const lost = await prisma.lostItem.findUnique({ where: { id: candidate.lostItemId } });
    if (!lost) continue;

    const existing = await prisma.match.findUnique({
      where: {
        lostItemId_foundItemId: {
          lostItemId: lost.id,
          foundItemId: found.id,
        },
      },
    });

    if (existing) {
      results.push({
        matchId: existing.id,
        itemId: candidate.lostItemId,
        similarityScore: candidate.similarityScore,
        imageScore: candidate.imageScore,
      });
      continue;
    }

    const match = await prisma.match.create({
      data: {
        lostItemId: lost.id,
        foundItemId: found.id,
        similarityScore: candidate.similarityScore,
        imageScore: candidate.imageScore,
      },
    });

    await notifyLostOwner(match.id, lost);
    await notifyFoundOwner(match.id, found);

    await prisma.lostItem.update({
      where: { id: lost.id },
      data: { status: "POSSIBLE_MATCH" },
    });

    results.push({
      matchId: match.id,
      itemId: candidate.lostItemId,
      similarityScore: candidate.similarityScore,
      imageScore: candidate.imageScore,
    });
  }

  return results;
}

async function notifyLostOwner(matchId: string, lost: LostItem) {
  await prisma.notification.create({
    data: {
      userId: lost.userId,
      matchId,
      title: "Possible Match Found",
      message: `A found item looks similar to your lost ${lost.itemName}.`,
    },
  });
}

async function notifyFoundOwner(matchId: string, found: FoundItem) {
  await prisma.notification.create({
    data: {
      userId: found.userId,
      matchId,
      title: "Possible Match Found",
      message: `A lost item looks similar to the found ${found.itemName} you reported.`,
    },
  });
}

/** Recompute the score breakdown for display on the match details page. */
export async function getMatchBreakdown(matchId: string): Promise<ScoreBreakdown | null> {
  const [match] = await getMatchesWithItems([matchId]);
  if (!match) return null;

  return computeMatchScore({
    imageScore: match.imageScore,
    imageHashA: match.lostItem.imageHash,
    imageHashB: match.foundItem.imageHash,
    nameA: match.lostItem.itemName,
    nameB: match.foundItem.itemName,
    categoryA: match.lostItem.category,
    categoryB: match.foundItem.category,
    locationA: match.lostItem.location,
    locationB: match.foundItem.location,
    dateA: match.lostItem.dateLost,
    dateB: match.foundItem.dateFound,
  });
}
