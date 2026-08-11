import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import type { ItemCardData } from "@/lib/types";

function TypeBadge({ type, className }: { type: "lost" | "found"; className?: string }) {
  return (
    <span
      className={cn(
        "px-3 py-1 text-[12px] font-bold uppercase tracking-wider text-on-error shadow-sm backdrop-blur-sm",
        type === "lost" ? "bg-error/90" : "bg-primary/90 text-on-primary",
        "rounded-full",
        className,
      )}
    >
      {type === "lost" ? "Lost" : "Found"}
    </span>
  );
}

export function ItemCard({ item }: { item: ItemCardData }) {
  const isLost = item.type === "lost";
  const returned = item.status === "RETURNED";
  const connected = item.status === "CONNECTED";
  const possibleMatch = item.bestMatchScore !== null;
  const searching = isLost && !possibleMatch && item.status === "SEARCHING";

  const status = returned
    ? { icon: "task_alt", label: "Returned ✓", tone: "success" as const }
    : connected
      ? { icon: "chat_bubble", label: "Connected", tone: "secondary" as const }
      : isLost
        ? possibleMatch
          ? { icon: "check_circle", label: `Possible Match · ${item.bestMatchScore}%`, tone: "secondary" as const }
          : { icon: "radar", label: "Searching...", tone: "plain" as const }
        : item.status === "POSSIBLE_MATCH"
          ? { icon: "check_circle", label: "Possible Match!", tone: "secondary" as const }
          : { icon: "inventory_2", label: "Available", tone: "plain" as const };

  return (
    <article className="relative overflow-hidden rounded-[24px] border border-surface-variant/50 bg-surface-container-lowest shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <TypeBadge type={item.type} className="absolute right-4 top-4 z-10" />

      <Link href={`/items/${item.id}`} className="relative block h-[200px] w-full bg-surface-container-high">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl} alt={item.itemName} className="h-full w-full object-cover" />
      </Link>

      <div className="p-4">
        <Link href={`/items/${item.id}`} className="font-headline-sm text-headline-sm text-on-surface line-clamp-1 hover:text-primary">
          {item.itemName}
        </Link>

        <div className="mb-3 mt-2 flex flex-col gap-1 text-body-md text-on-surface-variant">
          <span className="flex items-center gap-2">
            <Icon name="location_on" className="text-[18px]" />
            <span className="line-clamp-1">{item.location}</span>
          </span>
          <span className="flex items-center gap-2">
            <Icon name="calendar_today" className="text-[18px]" />
            {isLost ? "Lost" : "Found"} on {formatDate(item.date)}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-surface-variant pt-3">
          <span
            className={cn(
              "flex items-center gap-2 font-label-md text-label-md",
              status.tone === "secondary"
                ? "rounded-full bg-secondary-container px-3 py-1 text-secondary"
                : status.tone === "success"
                  ? "rounded-full bg-secondary-container px-3 py-1 text-secondary"
                  : "text-primary",
            )}
          >
            <Icon
              name={status.icon}
              className={cn("text-[20px]", searching && "animate-pulse")}
            />
            {status.label}
          </span>

          {connected && item.conversationId ? (
            <Link
              href={`/chat/${item.conversationId}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-label-md text-label-md text-on-primary shadow-md transition-opacity hover:opacity-90"
            >
              <Icon name="chat_bubble" className="text-[18px]" />
              Open Chat
            </Link>
          ) : possibleMatch && item.bestMatchId ? (
            <Link
              href={`/matches/${item.bestMatchId}`}
              className="rounded-full px-4 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-primary-container/10"
            >
              Review
            </Link>
          ) : (
            <Link
              href={`/items/${item.id}`}
              className="rounded-full px-4 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-primary-container/10"
            >
              Details
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
