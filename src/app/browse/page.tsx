import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { lostItemsWithMatches } from "@/lib/queries";
import { ItemCard } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
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
    type === "found"
      ? Promise.resolve([])
      : lostItemsWithMatches({
          where: {
            status: { not: "RETURNED" },
            ...textFilter,
            ...(category ? { category } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
    type === "lost"
      ? Promise.resolve([])
      : prisma.foundItem.findMany({
          where: {
            status: { not: "RETURNED" },
            ...textFilter,
            ...(category ? { category } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
  ]);

  const items = [
    ...lostItems.map((i) => toLostCardData(i, i.matches)),
    ...foundItems.map((f) => toFoundCardData(f)),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const tabs = [
    { key: "all", label: "All Items" },
    { key: "lost", label: "Lost" },
    { key: "found", label: "Found" },
  ];

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-[600px] px-5 pb-32 pt-4">
        <div className="mb-5">
          <h1 className="font-display-lg text-display-lg text-on-surface">Browse reports</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Explore recently reported items. Found something?{" "}
            <Link href="/report/found" className="font-semibold text-primary hover:underline">
              Report it
            </Link>{" "}
            instead.
          </p>
        </div>

        {/* Tabs */}
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const href = `?type=${tab.key}${q ? `&q=${encodeURIComponent(q)}` : ""}${category ? `&category=${encodeURIComponent(category)}` : ""}`;
            return (
              <Link
                key={tab.key}
                href={href}
                className={cn(
                  "whitespace-nowrap rounded-full px-6 py-2 font-label-md text-label-md transition-transform active:scale-95",
                  type === tab.key
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-variant",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Filters */}
        <form method="get" className="mb-6 space-y-3">
          <input type="hidden" name="type" value={type} />
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by item name or location…"
              className="w-full rounded-full border border-secondary-fixed-dim bg-surface-bright py-3.5 pl-12 pr-6 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-3">
            <select
              name="category"
              defaultValue={category}
              className="flex-1 rounded-full border border-secondary-fixed-dim bg-surface-bright px-5 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-full bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-md transition-opacity hover:opacity-90"
            >
              Filter
            </button>
          </div>
        </form>

        {/* Results */}
        {items.length === 0 ? (
          <EmptyState
            title="No reports found"
            description="Try a different search, or be the first to report this item."
            action={
              <Link
                href="/report/lost"
                className="rounded-full bg-error px-6 py-3 font-label-md text-label-md text-on-error shadow-md transition-opacity hover:opacity-90"
              >
                Report a lost item
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {items.map((item) => (
              <ItemCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
