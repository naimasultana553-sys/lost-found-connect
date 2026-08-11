import Link from "next/link";
import { Bell, CircleHelp, PackageCheck, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { lostItemsWithMatches } from "@/lib/queries";
import { ItemCard } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Items</h1>
          <p className="mt-1 text-slate-500">Welcome back, {user.name.split(" ")[0]}.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/report/lost"
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
          >
            <CircleHelp className="h-4 w-4" />
            Report Lost
          </Link>
          <Link
            href="/report/found"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <PackageCheck className="h-4 w-4" />
            Report Found
          </Link>
        </div>
      </div>

      {/* Notifications banner */}
      <Link
        href="/notifications"
        className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-card transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </span>
          <div>
            <p className="font-semibold text-slate-900">Notifications</p>
            <p className="text-sm text-slate-500">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
                : "You're all caught up."}
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-slate-400" />
      </Link>

      {/* Lost items */}
      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-100 text-xs font-bold text-rose-700">
            {lost.length}
          </span>
          <h2 className="text-lg font-bold text-slate-900">My Lost Items</h2>
        </div>
        {lost.length === 0 ? (
          <EmptyState
            title="No lost items reported"
            description="Report an item you lost and our matching system will watch for found items that resemble it."
            action={
              <Link href="/report/lost" className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">
                Report a lost item
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lost.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Found items */}
      <section className="mt-12">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-xs font-bold text-emerald-700">
            {found.length}
          </span>
          <h2 className="text-lg font-bold text-slate-900">My Found Items</h2>
        </div>
        {found.length === 0 ? (
          <EmptyState
            title="No found items reported"
            description="Found something? Report it so we can try to reunite it with its owner."
            action={
              <Link href="/report/found" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                Report a found item
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {found.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
