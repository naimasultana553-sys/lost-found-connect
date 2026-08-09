import Link from "next/link";
import { Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ItemCard } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { toFoundCardData, toLostCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "My History" };
export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const user = await requireUser();
  const type = searchParams.type === "lost" || searchParams.type === "found" ? searchParams.type : "all";

  const [lostItems, foundItems] = await Promise.all([
    prisma.lostItem.findMany({
      where: { userId: user.id },
      include: { matches: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.foundItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const items = [
    ...lostItems.map((i) => toLostCardData(i, i.matches)),
    ...foundItems.map(toFoundCardData),
  ]
    .filter((i) => (type === "all" ? true : i.type === type))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const tabs = [
    { key: "all", label: "All" },
    { key: "lost", label: "Lost" },
    { key: "found", label: "Found" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My History</h1>
        <p className="mt-1 text-slate-500">
          Everything you&apos;ve reported — lost and found — in one place.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/history" : `?type=${tab.key}`}
            className={cn(
              "flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors",
              type === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState
            title={type === "all" ? "No History Yet" : `No ${type} items Yet`}
            description={
              type === "all"
                ? "When you report a lost or found item, it will show up here so you can track it."
                : `You haven't reported any ${type} items yet.`
            }
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/report/lost"
                  className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Report a lost item
                </Link>
                <Link
                  href="/report/found"
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Report a found item
                </Link>
              </div>
            }
          />
        ) : (
          <>
            <p className="mb-4 flex items-center gap-1.5 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              {items.length} {items.length === 1 ? "report" : "reports"}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <ItemCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
