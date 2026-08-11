import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { lostItemsWithMatches } from "@/lib/queries";
import { ItemCard } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { TopBar } from "@/components/TopBar";
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
    lostItemsWithMatches({
      where: { userId: user.id },
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
    { key: "all", label: "All Items" },
    { key: "lost", label: "Lost" },
    { key: "found", label: "Found" },
  ];

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-[600px] px-5 pb-32 pt-4">
        <h2 className="mb-5 font-display-lg text-display-lg text-on-surface">My History</h2>

        {/* Filter tabs */}
        <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.key === "all" ? "/history" : `?type=${tab.key}`}
              className={cn(
                "whitespace-nowrap rounded-full px-6 py-2 font-label-md text-label-md transition-transform active:scale-95",
                type === tab.key
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-variant",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Items list */}
        {items.length === 0 ? (
          <EmptyState
            title={type === "all" ? "No History Yet" : `No ${type} items Yet`}
            description={
              type === "all"
                ? "When you report a lost or found item, it will show up here so you can track it."
                : `You haven't reported any ${type} items yet.`
            }
            action={
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/report/lost"
                  className="rounded-full bg-error px-6 py-3 font-label-md text-label-md text-on-error shadow-md transition-opacity hover:opacity-90"
                >
                  Report a lost item
                </Link>
                <Link
                  href="/report/found"
                  className="rounded-full bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-md transition-opacity hover:opacity-90"
                >
                  Report a found item
                </Link>
              </div>
            }
          />
        ) : (
          <div className="flex flex-col gap-6">
            {items.map((item) => (
              <ItemCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
