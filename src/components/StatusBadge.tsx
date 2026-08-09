import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  SEARCHING: "bg-sky-50 text-sky-700 ring-sky-200",
  POSSIBLE_MATCH: "bg-amber-50 text-amber-700 ring-amber-200",
  AVAILABLE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  MATCHED: "bg-violet-50 text-violet-700 ring-violet-200",
  RETURNED: "bg-slate-100 text-slate-600 ring-slate-200",
  OWNER_INTERESTED: "bg-violet-50 text-violet-700 ring-violet-200",
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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_STYLES[status] ?? "bg-slate-50 text-slate-600 ring-slate-200",
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
