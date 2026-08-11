import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { lostItemsWithMatches } from "@/lib/queries";
import { ItemCard } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { toFoundCardData, toLostCardData } from "@/lib/types";

export const metadata = { title: "My Items" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  const [lostItems, foundItems, unreadCount] = await Promise.all([
    lostItemsWithMatches({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.foundItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  const lost = lostItems.map((i) => toLostCardData(i, i.matches));
  const found = foundItems.map(toFoundCardData);

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-[600px] px-5 pb-32 pt-4">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface">My Items</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Welcome back, {user.name.split(" ")[0]}.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/report/lost"
              className="rounded-full bg-error px-5 py-2.5 font-label-md text-label-md text-on-error shadow-md transition-opacity hover:opacity-90"
            >
              Report Lost
            </Link>
            <Link
              href="/report/found"
              className="rounded-full bg-primary px-5 py-2.5 font-label-md text-label-md text-on-primary shadow-md transition-opacity hover:opacity-90"
            >
              Report Found
            </Link>
          </div>
        </div>

        {/* Notifications banner */}
        <Link
          href="/notifications"
          className="mb-8 flex items-center justify-between rounded-[24px] border border-surface-variant/50 bg-surface-container-lowest px-5 py-4 shadow-card transition-colors hover:bg-surface-container-low"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon name="notifications" className="text-[22px]" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[11px] font-bold text-on-error">
                  {unreadCount}
                </span>
              )}
            </span>
            <div>
              <p className="font-label-bold text-label-bold text-on-surface">Notifications</p>
              <p className="text-sm text-on-surface-variant">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
                  : "You're all caught up."}
              </p>
            </div>
          </div>
          <Icon name="arrow_forward" className="text-[22px] text-on-surface-variant" />
        </Link>

        {/* Lost items */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-error/10 text-xs font-bold text-error">
              {lost.length}
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">My Lost Items</h2>
          </div>
          {lost.length === 0 ? (
            <EmptyState
              title="No lost items reported"
              description="Report an item you lost and our matching system will watch for found items that resemble it."
              action={
                <Link href="/report/lost" className="rounded-full bg-error px-6 py-3 font-label-md text-label-md text-on-error shadow-md transition-opacity hover:opacity-90">
                  Report a lost item
                </Link>
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {lost.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* Found items */}
        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {found.length}
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">My Found Items</h2>
          </div>
          {found.length === 0 ? (
            <EmptyState
              title="No found items reported"
              description="Found something? Report it so we can try to reunite it with its owner."
              action={
                <Link href="/report/found" className="rounded-full bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-md transition-opacity hover:opacity-90">
                  Report a found item
                </Link>
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {found.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
