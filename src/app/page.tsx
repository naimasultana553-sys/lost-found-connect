import Link from "next/link";
import { ArrowRight, SearchX, PackageSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { lostItemsWithMatches } from "@/lib/queries";
import { ItemCard } from "@/components/ItemCard";
import { toFoundCardData, toLostCardData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [recentLost, recentFound] = await Promise.all([
    lostItemsWithMatches({
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.foundItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const recent = [
    ...recentLost.map((i) => toLostCardData(i, i.matches)),
    ...recentFound.map(toFoundCardData),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  return (
    <div>
      {/* Choice screen */}
      <section className="mx-auto max-w-4xl px-4 pt-16 pb-6 sm:px-6 sm:pt-24">
        <div className="text-center animate-fadeUp">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            FindBack
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            What brings you here?
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-slate-500 sm:text-lg">
            Lost something or found something? Choose an option to get started.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6">
          {/* Lost card */}
          <Link
            href="/report/lost"
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift sm:p-8"
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-rose-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
              <SearchX className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-slate-900">I Lost Something</h2>
            <p className="mt-1.5 text-slate-500">Report an item you lost</p>
            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-rose-600">
              Report Lost Item
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </div>
          </Link>

          {/* Found card */}
          <Link
            href="/report/found"
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift sm:p-8"
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-emerald-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <PackageSearch className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-slate-900">I Found Something</h2>
            <p className="mt-1.5 text-slate-500">Report an item you found</p>
            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-emerald-600">
              Report Found Item
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* Recent reports */}
      {recent.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Recent reports</h2>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Browse all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((item) => (
              <ItemCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
