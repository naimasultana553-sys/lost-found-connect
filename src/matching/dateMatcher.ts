/**
 * Date matching. The dates of a lost and a found report rarely line up
 * exactly, so a soft tolerance window is used.
 */
export function dateSimilarity(a: Date, b: Date): number {
  const days = Math.abs(a.getTime() - b.getTime()) / 86_400_000;
  if (days <= 3) return 100;
  if (days <= 7) return 75;
  if (days <= 14) return 50;
  if (days <= 30) return 25;
  return 0;
}
