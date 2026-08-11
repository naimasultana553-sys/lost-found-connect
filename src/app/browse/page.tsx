import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { lostItemsWithMatches } from "@/lib/queries";
import { ItemCard } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { CATEGORIES } from "@/lib/categories";
import { toFoundCardData, toLostCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "Browse" };
export const dynamic = "force-dynamic";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: { type?: string; q?: string; category?: string };
}) {
  const type = searchParams.type === "lost" || searchParams.type === "found" ? searchParams.type : "all";
  const q = searchParams.q?.trim() ?? "";
  const category = searchParams.category ?? "";

  const textFilter = q
    ? {
        OR: [
          { itemName: { contains: q } },
          { location: { contains: q } },
          { description: { contains: q } },
        ],
      }
    : {};

  const [lostItems, foundItems] = await Promise.all([
    lostItemsWithMatches({
      where: {
        status: { not: "RETURNED" },
        ...(type === "lost" || type === "all" ? textFilter : { id: "none" }),
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.foundItem.findMany({
      where: {
        status: { not: "RETURNED" },
        ...(type === "found" || type === "all" ? textFilter : { id: "none" }),
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const items = [
    ...lostItems.map((i) => toLostCardData(i, i.matches)),
    ...foundItems.map(toFoundCardData),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const tabs = [
    { key: "all", label: "All" },
    { key: "lost", label: "Lost" },
    { key: "found", label: "Found" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Browse reports</h1>
        <p className="mt-1 text-slate-500">
          Explore recently reported items. Found something?{" "}
          <Link href="/report/found" className="font-semibold text-emerald-700 hover:underline">
            Report it
          </Link>{" "}
          instead.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((tab) => {
          const href = `?type=${tab.key}${q ? `&q=${encodeURIComponent(q)}` : ""}${category ? `&category=${encodeURIComponent(category)}` : ""}`;
          return (
            <Link
              key={tab.key}
              href={href}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors",
                type === tab.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Filters */}
      <form method="get" className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input type="hidden" name="type" value={type} />
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by item name or location…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <select
          name="category"
          defaultValue={category}
          className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          Filter
        </button>
      </form>

      {/* Results */}
      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState
            title="No reports found"
            description="Try a different search, or be the first to report this item."
            action={
              <Link
                href="/report/lost"
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Report a lost item
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ItemCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
