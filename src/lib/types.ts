import type { LostItem, FoundItem } from "@prisma/client";

/** Shape shared by item cards, lists and API responses. */
export interface ItemCardData {
  id: string;
  type: "lost" | "found";
  imageUrl: string;
  itemName: string;
  category: string;
  description: string | null;
  location: string;
  date: Date;
  status: string;
  createdAt: Date;
  bestMatchScore: number | null;
  bestMatchId: string | null;
  conversationId: string | null;
}

/** Best match for a lost item (max score over its matches). */
export function bestMatchOf(matches: { id: string; similarityScore: number }[]): {
  id: string;
  score: number;
} | null {
  if (!matches.length) return null;
  const best = matches.reduce((a, b) => (b.similarityScore > a.similarityScore ? b : a));
  return { id: best.id, score: best.similarityScore };
}

export function toLostCardData(item: LostItem, matches: { id: string; similarityScore: number }[] = [], conversationId: string | null = null): ItemCardData {
  const best = bestMatchOf(matches);
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
    bestMatchScore: best?.score ?? null,
    bestMatchId: best?.id ?? null,
    conversationId,
  };
}

export function toFoundCardData(item: FoundItem, conversationId: string | null = null): ItemCardData {
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
    bestMatchScore: null,
    bestMatchId: null,
    conversationId,
  };
}
