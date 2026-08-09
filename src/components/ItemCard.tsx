import Link from "next/link";
import { MapPin, CalendarDays, Package, ArrowRight, Target } from "lucide-react";
import { LostFoundBadge } from "@/components/LostFoundBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { ItemCardData } from "@/lib/types";

export function ItemCard({ item }: { item: ItemCardData }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <Link href={`/items/${item.id}`} className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.itemName}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <LostFoundBadge type={item.type} className="absolute left-3 top-3 shadow-sm" />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/items/${item.id}`} className="font-semibold text-slate-900 line-clamp-1 hover:text-brand-700">
            {item.itemName}
          </Link>
          <StatusBadge status={item.status} />
        </div>

        <div className="flex flex-col gap-1 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="line-clamp-1">{item.location}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {item.type === "lost" ? "Lost" : "Found"} on {formatDate(item.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {item.category}
          </span>
        </div>

        {item.description && (
          <p className="line-clamp-2 text-sm text-slate-500">{item.description}</p>
        )}

        {item.type === "lost" && item.bestMatchScore !== null && (
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-match-50 px-2.5 py-0.5 text-xs font-semibold text-match-700 ring-1 ring-inset ring-match-200">
              <Target className="h-3 w-3" />
              Possible Match · {item.bestMatchScore}%
            </span>
            {item.bestMatchId && (
              <Link
                href={`/matches/${item.bestMatchId}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-match-700 hover:text-match-800"
              >
                View Match
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
