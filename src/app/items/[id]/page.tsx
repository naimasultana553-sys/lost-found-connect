import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { FoundItem, LostItem, Match } from "@prisma/client";
import { BackHeader } from "@/components/BackHeader";
import { Icon } from "@/components/Icon";
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
    { icon: "location_on", label: "Location", value: lostItem?.location ?? foundItem!.location },
    {
      icon: "calendar_today",
      label: isLost ? "Date lost" : "Date found",
      value: formatDate(lostItem?.dateLost ?? foundItem!.dateFound),
    },
    { icon: "category", label: "Category", value: lostItem?.category ?? foundItem!.category },
  ];

  return (
    <>
      <BackHeader title="Item" />
      <main className="mx-auto w-full max-w-[600px] px-5 pb-32 pt-6">
        {/* Image */}
        <div className="overflow-hidden rounded-[24px] border border-surface-variant/50 bg-surface-container-lowest shadow-card">
          <div className="relative h-[260px] w-full bg-surface-container-high">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lostItem?.imageUrl ?? foundItem!.imageUrl}
              alt={lostItem?.itemName ?? foundItem!.itemName}
              className="h-full w-full object-cover"
            />
            <LostFoundBadge type={isLost ? "lost" : "found"} className="absolute left-4 top-4" />
          </div>
          <div className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-headline-sm text-headline-sm text-on-surface">
                {lostItem?.itemName ?? foundItem!.itemName}
              </h1>
              <StatusBadge status={lostItem?.status ?? foundItem!.status} />
            </div>

            {lostItem && lostItem.matches.length > 0 && (
              <div className="rounded-[24px] bg-secondary-container/40 p-4">
                <p className="font-label-bold text-label-bold text-secondary">Possible matches found</p>
                <ul className="mt-2 space-y-2">
                  {lostItem.matches.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-sm text-on-surface-variant">
                        {m.foundItem.itemName} · {m.foundItem.location}
                      </span>
                      <div className="flex shrink-0 items-center gap-2">
                        <ScorePill score={m.similarityScore} />
                        <Link
                          href={`/matches/${m.id}`}
                          className="rounded-full bg-primary px-3 py-1.5 font-label-md text-label-md text-on-primary shadow-md transition-opacity hover:opacity-90"
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
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
                    <Icon name={d.icon} className="text-[18px]" />
                  </span>
                  <dt className="w-24 shrink-0 text-on-surface-variant">{d.label}</dt>
                  <dd className="font-medium text-on-surface">{d.value}</dd>
                </div>
              ))}
            </dl>

            {lostItem?.description || foundItem?.description ? (
              <div className="rounded-[24px] bg-surface-container-low p-4">
                <h2 className="font-label-md text-label-md text-on-surface-variant">Description</h2>
                <p className="mt-1 text-on-surface">{lostItem?.description ?? foundItem!.description}</p>
              </div>
            ) : null}

            {/* Side panel */}
            <div className="space-y-3 border-t border-surface-variant pt-4">
              <p className="font-label-bold text-label-bold text-on-surface">
                Reported by {lostItem?.user.name ?? foundItem!.user.name}
              </p>
              <p className="text-sm text-on-surface-variant">
                {isLost
                  ? "If you've seen this item, reporting it as found helps the owner find it."
                  : "If this looks like something you lost, our matching system may flag it."}
              </p>
              {isLost ? (
                <Link
                  href="/report/found"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-label-md text-label-md text-on-primary shadow-md transition-opacity hover:opacity-90"
                >
                  I found this item
                  <Icon name="arrow_forward" className="text-[18px]" />
                </Link>
              ) : (
                <Link
                  href="/report/lost"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-error py-3.5 font-label-md text-label-md text-on-error shadow-md transition-opacity hover:opacity-90"
                >
                  This might be mine
                  <Icon name="arrow_forward" className="text-[18px]" />
                </Link>
              )}
              <p className="rounded-[24px] bg-surface-container-low p-4 text-sm text-on-surface-variant">
                A &quot;possible match&quot; only means the reports look similar — it is never a
                guarantee that an item belongs to someone.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
