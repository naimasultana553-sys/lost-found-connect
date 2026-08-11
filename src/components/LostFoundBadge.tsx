import { cn } from "@/lib/utils";

export function LostFoundBadge({ type, className }: { type: "lost" | "found"; className?: string }) {
  const isLost = type === "lost";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-wider text-on-error",
        isLost ? "bg-error/90" : "bg-primary/90 text-on-primary",
        className,
      )}
    >
      {isLost ? "Lost" : "Found"}
    </span>
  );
}
