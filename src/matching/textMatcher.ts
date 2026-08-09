/**
 * Text matching for item names and short fields.
 *
 * Uses normalized token overlap (a Jaccard-like measure) so "Black Wallet"
 * matches "black wallet" and "wallet black". Intententionally simple and
 * explainable for the MVP; swap for an embedding-based text matcher later.
 */
export function normalizeText(value: string): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value: string): string[] {
  return normalizeText(value).split(" ").filter(Boolean);
}

/** 0-100 overlap similarity between two short strings. */
export function textSimilarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (!ta.length || !tb.length) return 0;

  const [small, large] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  const matched = small.filter((token) => large.includes(token)).length;
  return Math.round((matched / small.length) * 100);
}
