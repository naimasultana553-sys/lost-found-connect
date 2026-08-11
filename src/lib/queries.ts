import type { Claim, Conversation, FoundItem, LostItem, Match, Notification, Prisma } from "@prisma/client";
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

export interface MatchDetail extends MatchWithItems {
  claim: Claim | null;
  conversation: Conversation | null;
}

export interface ConversationSummary {
  conversationId: string;
  matchId: string;
  otherUserId: string;
  otherUserName: string;
  itemImage: string;
  itemName: string;
  itemLocation: string;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
}

/**
 * Full detail for one match page render: the match, both items, the latest
 * claim (if any) and the conversation (once the claim is accepted).
 */
export async function getMatchDetail(matchId: string): Promise<MatchDetail | null> {
  const [matches] = await getMatchesWithItems([matchId]);
  if (!matches) return null;

  const [claim, conversation] = await Promise.all([
    prisma.claim.findFirst({
      where: { matchId: matches.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.conversation.findUnique({ where: { matchId: matches.id } }),
  ]);

  return { ...matches, claim, conversation };
}

/**
 * All conversations the user is part of (as either lost owner or finder),
 * with the other party's name and the latest message preview.
 */
export async function getUserConversations(userId: string): Promise<ConversationSummary[]> {
  const [lostIds, foundIds] = await Promise.all([lostItemIdsOf(userId), foundItemIdsOf(userId)]);

  const [matchesAsLost, matchesAsFound] = await Promise.all([
    lostIds.length
      ? prisma.match.findMany({ where: { lostItemId: { in: lostIds } } })
      : Promise.resolve([] as Match[]),
    foundIds.length
      ? prisma.match.findMany({ where: { foundItemId: { in: foundIds } } })
      : Promise.resolve([] as Match[]),
  ]);

  const matchIds = [...new Set([...matchesAsLost, ...matchesAsFound].map((m) => m.id))];
  if (matchIds.length === 0) return [];

  const conversations = await prisma.conversation.findMany({
    where: { matchId: { in: matchIds } },
    orderBy: { createdAt: "desc" },
  });
  if (conversations.length === 0) return [];

  const convByMatch = new Map(conversations.map((c) => [c.matchId, c]));
  const involvedMatches = await getMatchesWithItems(matchIds.filter((id) => convByMatch.has(id)));

  const userIds = [...new Set(involvedMatches.map((m) => [m.lostItem.userId, m.foundItem.userId]).flat())];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
  const userById = new Map(users.map((u) => [u.id, u]));

  const summaries = await Promise.all(
    conversations.map(async (c) => {
      const match = involvedMatches.find((m) => m.id === c.matchId);
      if (!match) return null;

      const isLostOwner = match.lostItem.userId === userId;
      const otherUser = userById.get(isLostOwner ? match.foundItem.userId : match.lostItem.userId);
      const otherItem = isLostOwner ? match.foundItem : match.lostItem;

      const [lastMessage, unreadCount] = await Promise.all([
        prisma.message.findFirst({
          where: { conversationId: c.id },
          orderBy: { createdAt: "desc" },
        }),
        prisma.message.count({
          where: { conversationId: c.id, senderId: { not: userId }, isRead: false },
        }),
      ]);

      return {
        conversationId: c.id,
        matchId: c.matchId,
        otherUserId: otherUser?.id ?? (isLostOwner ? match.foundItem.userId : match.lostItem.userId),
        otherUserName: otherUser?.name ?? "Someone",
        itemImage: otherItem.imageUrl,
        itemName: otherItem.itemName,
        itemLocation: otherItem.location,
        lastMessage: lastMessage?.text ?? null,
        lastMessageAt: lastMessage?.createdAt ?? null,
        unreadCount,
      } satisfies ConversationSummary;
    }),
  );

  return summaries.filter((s): s is ConversationSummary => s !== null);
}

async function lostItemIdsOf(userId: string): Promise<string[]> {
  const rows = await prisma.lostItem.findMany({ where: { userId }, select: { id: true } });
  return rows.map((r) => r.id);
}

async function foundItemIdsOf(userId: string): Promise<string[]> {
  const rows = await prisma.foundItem.findMany({ where: { userId }, select: { id: true } });
  return rows.map((r) => r.id);
}

export interface ConversationDetail extends Conversation {
  match: MatchWithItems;
  otherUserId: string;
  otherUserName: string;
  returned: boolean;
}

/**
 * Resolve a conversation for a specific user, enforcing that the user is one
 * of the two participants (lost reporter or found reporter). Returns null if
 * the user is not a participant.
 */
export async function getConversationForUser(
  conversationId: string,
  userId: string,
): Promise<ConversationDetail | null> {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return null;

  const match = (await getMatchesWithItems([conversation.matchId]))[0];
  if (!match) return null;

  const isLostOwner = match.lostItem.userId === userId;
  const isFinder = match.foundItem.userId === userId;
  if (!isLostOwner && !isFinder) return null;

  const otherUserId = isLostOwner ? match.foundItem.userId : match.lostItem.userId;
  const other = await prisma.user.findUnique({ where: { id: otherUserId }, select: { name: true } });

  return {
    ...conversation,
    match,
    otherUserId,
    otherUserName: other?.name ?? "Someone",
    returned: match.lostItem.status === "RETURNED" || match.foundItem.status === "RETURNED",
  };
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
