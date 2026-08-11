import { cn } from "@/lib/utils";

export function ScorePill({ score, className }: { score: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1 text-xs font-bold text-secondary",
        className,
      )}
    >
      {score}% match
    </span>
  );
}
