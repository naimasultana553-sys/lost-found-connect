/**
 * Matching service — the public entry point the rest of the app calls.
 *
 *   findPossibleMatchesFor(lostItem)  →  [{ foundItemId, similarityScore }]
 *   findPossibleMatchesFor(foundItem) →  [{ lostItemId, similarityScore }]
 *
 * When a report is created the service runs the comparison against items of
 * the opposite type, persists Match records and creates in-app
 * notifications for the owner of each lost item. The initial implementation
 * uses perceptual image hashing plus name/category/location/date heuristics;
 * the interface is stable so a real AI/embedding model can be dropped in
 * without changing callers.
 */
import type { LostItem, FoundItem } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMatchesWithItems } from "@/lib/queries";
import { MATCHING_CONFIG } from "@/matching/config";
import { computeMatchScore, type ScoreBreakdown } from "@/matching/score";

export interface PossibleMatchResult {
  matchId: string;
  itemId: string; // the id of the opposite-type item
  similarityScore: number;
}

interface CandidateInput {
  imageHash: string | null;
  name: string;
  category: string;
  location: string;
  date: Date;
}

interface MatchRef {
  id: string;
  userId: string;
  itemName: string;
}

/** Shared scoring for one candidate pair. */
function scorePair(
  lost: CandidateInput & { id: string; userId: string },
  found: CandidateInput & { id: string; userId: string },
): number {
  if (lost.userId === found.userId) return 0; // never match a user against themselves
  return computeMatchScore({
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

  const candidates: { foundItemId: string; similarityScore: number }[] = [];
  for (const found of foundItems) {
    const score = scorePair(
      { id: lost.id, userId: lost.userId, imageHash: lost.imageHash, name: lost.itemName, category: lost.category, location: lost.location, date: lost.dateLost },
      { id: found.id, userId: found.userId, imageHash: found.imageHash, name: found.itemName, category: found.category, location: found.location, date: found.dateFound },
    );
    if (score >= MATCHING_CONFIG.matchThreshold) {
      candidates.push({ foundItemId: found.id, similarityScore: score });
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

  const candidates: { lostItemId: string; similarityScore: number }[] = [];
  for (const lost of lostItems) {
    const score = scorePair(
      { id: lost.id, userId: lost.userId, imageHash: lost.imageHash, name: lost.itemName, category: lost.category, location: lost.location, date: lost.dateLost },
      { id: found.id, userId: found.userId, imageHash: found.imageHash, name: found.itemName, category: found.category, location: found.location, date: found.dateFound },
    );
    if (score >= MATCHING_CONFIG.matchThreshold) {
      candidates.push({ lostItemId: lost.id, similarityScore: score });
    }
  }

  return candidates
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, MATCHING_CONFIG.maxResults);
}

/**
 * Persist matches + notifications for a newly reported lost item, and update
 * the lost item status to POSSIBLE_MATCH when a match exists.
 */
export async function processLostItemMatches(lost: LostItem): Promise<PossibleMatchResult[]> {
  const candidates = await findMatchesForLostItem(lost);
  const results: PossibleMatchResult[] = [];

  for (const candidate of candidates) {
    const existing = await prisma.match.findUnique({
      where: {
        lostItemId_foundItemId: {
          lostItemId: lost.id,
          foundItemId: candidate.foundItemId,
        },
      },
    });

    if (existing) {
      results.push({ matchId: existing.id, itemId: candidate.foundItemId, similarityScore: candidate.similarityScore });
      continue;
    }

    const match = await prisma.match.create({
      data: {
        lostItemId: lost.id,
        foundItemId: candidate.foundItemId,
        similarityScore: candidate.similarityScore,
      },
    });

    await notifyLostOwner(match.id, lost);

    results.push({ matchId: match.id, itemId: candidate.foundItemId, similarityScore: candidate.similarityScore });
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
 * Persist matches + notifications for a newly reported found item. Each
 * affected lost item's owner is notified, and the lost item status becomes
 * POSSIBLE_MATCH.
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
      results.push({ matchId: existing.id, itemId: candidate.lostItemId, similarityScore: candidate.similarityScore });
      continue;
    }

    const match = await prisma.match.create({
      data: {
        lostItemId: lost.id,
        foundItemId: found.id,
        similarityScore: candidate.similarityScore,
      },
    });

    await notifyLostOwner(match.id, lost);

    await prisma.lostItem.update({
      where: { id: lost.id },
      data: { status: "POSSIBLE_MATCH" },
    });

    results.push({ matchId: match.id, itemId: candidate.lostItemId, similarityScore: candidate.similarityScore });
  }

  return results;
}

async function notifyLostOwner(matchId: string, lost: MatchRef) {
  await prisma.notification.create({
    data: {
      userId: lost.userId,
      matchId,
      title: "Possible Match Found",
      message: `A found item looks similar to your lost ${lost.itemName}.`,
    },
  });
}

/** Recompute the score breakdown for display on the match details page. */
export async function getMatchBreakdown(matchId: string): Promise<ScoreBreakdown | null> {
  const [match] = await getMatchesWithItems([matchId]);
  if (!match) return null;

  return computeMatchScore({
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
