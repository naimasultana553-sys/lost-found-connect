import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  SEARCHING: "bg-surface-container text-on-surface-variant",
  POSSIBLE_MATCH: "bg-secondary-container text-secondary",
  AVAILABLE: "bg-secondary-container text-secondary",
  MATCHED: "bg-primary text-on-primary",
  RETURNED: "bg-surface-container-highest text-on-surface-variant",
  OWNER_INTERESTED: "bg-primary text-on-primary",
};

const STATUS_LABELS: Record<string, string> = {
  SEARCHING: "Searching",
  POSSIBLE_MATCH: "Possible Match",
  AVAILABLE: "Available",
  MATCHED: "Matched",
  RETURNED: "Returned",
  OWNER_INTERESTED: "Owner Interested",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        STATUS_STYLES[status] ?? "bg-surface-container text-on-surface-variant",
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
