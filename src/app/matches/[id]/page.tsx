import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, CalendarDays, Target, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getMatchBreakdown } from "@/matching/matchService";
import { LostFoundBadge } from "@/components/LostFoundBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { MarkInterestButton } from "@/components/MarkInterestButton";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function similarLabel(score: number) {
  return score >= 70 ? "Similar" : score > 0 ? "Partially similar" : "Different";
}

export default async function MatchDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: { lostItem: true, foundItem: true },
  });

  if (!match) notFound();
  if (match.lostItem.userId !== user.id) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-slate-300" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Not your match</h1>
        <p className="mt-2 text-sm text-slate-500">
          You can only view matches for lost items you reported.
        </p>
        <Link href="/history" className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
          Back to my history
        </Link>
      </div>
    );
  }

  const breakdown = await getMatchBreakdown(match.id);
  const score = breakdown?.total ?? match.similarityScore;

  const lost = match.lostItem;
  const found = match.foundItem;
  const alreadyInterested = match.status === "OWNER_INTERESTED" || lost.status === "MATCHED";
  const returned = lost.status === "RETURNED" || found.status === "RETURNED";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-match-100 text-match-700">
            <Target className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Possible Match</h1>
            <p className="text-sm text-slate-500">
              {lost.itemName} may have been found near {found.location}.
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-4xl font-bold text-slate-900">{score}%</p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Similar</p>
        </div>
      </div>

      {/* Side-by-side items */}
      <div className="grid gap-6 sm:grid-cols-2">
        {[
          {
            title: "Your Lost Item",
            badge: "lost" as const,
            name: lost.itemName,
            description: lost.description,
            location: lost.location,
            date: lost.dateLost,
            imageUrl: lost.imageUrl,
          },
          {
            title: "Possible Found Item",
            badge: "found" as const,
            name: found.itemName,
            description: found.description,
            location: found.location,
            date: found.dateFound,
            imageUrl: found.imageUrl,
          },
        ].map((side) => (
          <div key={side.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="relative aspect-[4/3] bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={side.imageUrl} alt={side.name} className="h-full w-full object-cover" />
              <LostFoundBadge type={side.badge} className="absolute left-4 top-4" />
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{side.title}</p>
              <h3 className="mt-0.5 text-lg font-bold text-slate-900">{side.name}</h3>
              {side.description && <p className="mt-1 text-sm text-slate-500">{side.description}</p>}
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                  {side.location}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                  {side.badge === "lost" ? "Lost" : "Found"} on {formatDate(side.date)}
                </div>
              </dl>
            </div>
          </div>
        ))}
      </div>

      {/* Score breakdown */}
      {breakdown && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="font-bold text-slate-900">Why these were matched</h2>
          <p className="mt-1 text-sm text-slate-500">
            This item appears similar to your lost item based on image and available report
            information.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <BreakdownRow label="Image similarity" value={`${breakdown.image}%`} />
            <BreakdownRow label="Category" value={similarLabel(breakdown.category)} />
            <BreakdownRow label="Location" value={similarLabel(breakdown.location)} />
            <BreakdownRow label="Date" value={similarLabel(breakdown.date)} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        {returned ? (
          <p className="text-sm font-medium text-slate-600">This item has already been returned.</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-600">
              {alreadyInterested ? (
                <>
                  You&apos;re interested in this match. <StatusBadge status={lost.status} className="ml-1" />
                </>
              ) : (
                "If this looks like your item, mark it as yours. We'll record your interest."
              )}
            </p>
            <MarkInterestButton matchId={match.id} disabled={alreadyInterested} />
          </>
        )}
        <Link href="/history" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800">
          ← Back to my history
        </Link>
      </div>
    </div>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
