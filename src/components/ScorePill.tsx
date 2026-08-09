import { cn } from "@/lib/utils";

export function ScorePill({ score, className }: { score: number; className?: string }) {
  const strong = score >= 85;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        strong ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-amber-50 text-amber-700 ring-amber-200",
        className,
      )}
    >
      {score}% match
    </span>
  );
}
