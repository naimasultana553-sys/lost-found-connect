import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, CalendarDays, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { FoundItem, LostItem, Match } from "@prisma/client";
import { LostFoundBadge } from "@/components/LostFoundBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { ScorePill } from "@/components/ScorePill";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type LostItemWithRelations = LostItem & {
  user: { name: string };
  matches: (Match & { foundItem: FoundItem })[];
};

type FoundItemWithRelations = FoundItem & {
  user: { name: string };
};

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const [lostRow, foundRow] = await Promise.all([
    prisma.lostItem.findUnique({ where: { id: params.id } }),
    prisma.foundItem.findUnique({ where: { id: params.id } }),
  ]);

  let lostItem: LostItemWithRelations | null = null;
  if (lostRow) {
    const [user, matchRows] = await Promise.all([
      prisma.user.findUnique({ where: { id: lostRow.userId }, select: { name: true } }),
      prisma.match.findMany({ where: { lostItemId: lostRow.id } }),
    ]);
    const foundItems = matchRows.length
      ? await prisma.foundItem.findMany({ where: { id: { in: matchRows.map((m) => m.foundItemId) } } })
      : [];
    const foundById = new Map(foundItems.map((f) => [f.id, f]));
    lostItem = {
      ...lostRow,
      user: { name: user?.name ?? "Someone" },
      matches: matchRows.map((m) => ({ ...m, foundItem: foundById.get(m.foundItemId) as FoundItem })),
    };
  }

  let foundItem: FoundItemWithRelations | null = null;
  if (foundRow) {
    const user = await prisma.user.findUnique({ where: { id: foundRow.userId }, select: { name: true } });
    foundItem = { ...foundRow, user: { name: user?.name ?? "Someone" } };
  }

  const item = lostItem ?? foundItem;
  if (!item) notFound();

  const isLost = Boolean(lostItem);
  const details = [
    { icon: MapPin, label: "Location", value: lostItem?.location ?? foundItem!.location },
    {
      icon: CalendarDays,
      label: isLost ? "Date lost" : "Date found",
      value: formatDate(lostItem?.dateLost ?? foundItem!.dateFound),
    },
    { icon: Package, label: "Category", value: lostItem?.category ?? foundItem!.category },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        {/* Image */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
          <div className="relative aspect-[4/3] bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lostItem?.imageUrl ?? foundItem!.imageUrl} alt={lostItem?.itemName ?? foundItem!.itemName} className="h-full w-full object-cover" />
            <LostFoundBadge type={isLost ? "lost" : "found"} className="absolute left-4 top-4" />
          </div>
          <div className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{lostItem?.itemName ?? foundItem!.itemName}</h1>
              <StatusBadge status={lostItem?.status ?? foundItem!.status} />
            </div>

            {lostItem && lostItem.matches.length > 0 && (
              <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-inset ring-amber-200">
                <p className="text-sm font-semibold text-amber-900">Possible matches found</p>
                <ul className="mt-2 space-y-2">
                  {lostItem.matches.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-600">
                        {m.foundItem.itemName} · {m.foundItem.location}
                      </span>
                      <div className="flex items-center gap-2">
                        <ScorePill score={m.similarityScore} />
                        <Link
                          href={`/matches/${m.id}`}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                        >
                          View
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <dl className="space-y-3">
              {details.map((d) => (
                <div key={d.label} className="flex items-center gap-3 text-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <d.icon className="h-4 w-4" />
                  </span>
                  <dt className="w-24 shrink-0 text-slate-400">{d.label}</dt>
                  <dd className="font-medium text-slate-700">{d.value}</dd>
                </div>
              ))}
            </dl>

            {lostItem?.description || foundItem?.description ? (
              <div>
                <h2 className="text-sm font-semibold text-slate-500">Description</h2>
                <p className="mt-1 text-slate-700">{lostItem?.description ?? foundItem!.description}</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Side panel */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="font-semibold text-slate-900">
              Reported by {lostItem?.user.name ?? foundItem!.user.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isLost
                ? "If you've seen this item, reporting it as found helps the owner find it."
                : "If this looks like something you lost, our matching system may flag it."}
            </p>
            {isLost ? (
              <Link
                href="/report/found"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                I found this item
              </Link>
            ) : (
              <Link
                href="/report/lost"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
              >
                This might be mine
              </Link>
            )}
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-sm font-semibold text-amber-900">A note about matches</p>
            <p className="mt-1 text-sm text-amber-700">
              A &quot;possible match&quot; only means the reports look similar — it is never a
              guarantee that an item belongs to someone.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
