/** Category matching: identical categories score 100, everything else 0. */
export function categorySimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  return a.toLowerCase() === b.toLowerCase() ? 100 : 0;
}
