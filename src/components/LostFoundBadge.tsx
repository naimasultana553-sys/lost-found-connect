import { cn } from "@/lib/utils";

export function LostFoundBadge({ type, className }: { type: "lost" | "found"; className?: string }) {
  const isLost = type === "lost";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        isLost ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700",
        className,
      )}
    >
      {isLost ? "Lost" : "Found"}
    </span>
  );
}
