import { textSimilarity } from "@/matching/textMatcher";

/**
 * Location matching.
 *
 * "Southeast University" vs "Southeast University Library" should score high.
 * Exact matches are 100; substring containment is 90; otherwise fall back to
 * token overlap. A map/geocoding service can be added later to compare real
 * coordinates instead of strings.
 */
export function locationSimilarity(a: string, b: string): number {
  const na = (a ?? "").toLowerCase().trim();
  const nb = (b ?? "").toLowerCase().trim();
  if (!na || !nb) return 0;
  if (na === nb) return 100;
  if (na.includes(nb) || nb.includes(na)) return 90;
  return textSimilarity(na, nb);
}
