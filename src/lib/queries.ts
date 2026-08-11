import type { FoundItem, LostItem, Match, Notification, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Manual relation helpers for Prisma's MongoDB connector, which has no
 * native relation support. These reproduce the nested shapes the UI expects
 * with a couple of batched queries each.
 */

export interface MatchSummary {
  id: string;
  similarityScore: number;
}

export interface LostItemWithMatches extends LostItem {
  matches: MatchSummary[];
}

export interface MatchWithItems extends Match {
  lostItem: LostItem;
  foundItem: FoundItem;
}

export interface NotificationWithMatch extends Notification {
  match: MatchWithItems | null;
}

/** Lost items with their matches attached (for best-match badges). */
export async function lostItemsWithMatches(
  args: Prisma.LostItemFindManyArgs = {},
): Promise<LostItemWithMatches[]> {
  const items = await prisma.lostItem.findMany(args);
  if (items.length === 0) return [];

  const matches = await prisma.match.findMany({
    where: { lostItemId: { in: items.map((i) => i.id) } },
    select: { id: true, similarityScore: true, lostItemId: true },
  });

  const byLost = new Map<string, MatchSummary[]>();
  for (const m of matches) {
    const arr = byLost.get(m.lostItemId) ?? [];
    arr.push({ id: m.id, similarityScore: m.similarityScore });
    byLost.set(m.lostItemId, arr);
  }

  return items.map((i) => ({ ...i, matches: byLost.get(i.id) ?? [] }));
}

/** Matches with both sides hydrated. */
export async function getMatchesWithItems(ids: string[]): Promise<MatchWithItems[]> {
  if (ids.length === 0) return [];

  const rows = await prisma.match.findMany({ where: { id: { in: ids } } });
  if (rows.length === 0) return [];

  const lostIds = [...new Set(rows.map((m) => m.lostItemId))];
  const foundIds = [...new Set(rows.map((m) => m.foundItemId))];

  const [lostItems, foundItems] = await Promise.all([
    lostIds.length ? prisma.lostItem.findMany({ where: { id: { in: lostIds } } }) : [],
    foundIds.length ? prisma.foundItem.findMany({ where: { id: { in: foundIds } } }) : [],
  ]);

  const lostById = new Map(lostItems.map((i) => [i.id, i]));
  const foundById = new Map(foundItems.map((i) => [i.id, i]));

  return rows.map((m) => ({
    ...m,
    lostItem: lostById.get(m.lostItemId) as LostItem,
    foundItem: foundById.get(m.foundItemId) as FoundItem,
  }));
}

/** Notifications with their match hydrated (lost + found item). */
export async function notificationsWithMatches(userId: string): Promise<NotificationWithMatch[]> {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const matchIds = notifications.filter((n) => n.matchId).map((n) => n.matchId as string);
  const matches = matchIds.length ? await getMatchesWithItems(matchIds) : [];
  const byId = new Map(matches.map((m) => [m.id, m]));

  return notifications.map((n) => ({
    ...n,
    match: n.matchId ? byId.get(n.matchId) ?? null : null,
  }));
}
