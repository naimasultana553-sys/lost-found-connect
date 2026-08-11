import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMatchDetail } from "@/lib/queries";
import { getMatchBreakdown } from "@/matching/matchService";
import { BackHeader } from "@/components/BackHeader";
import { Icon } from "@/components/Icon";
import { ClaimActions } from "@/components/ClaimActions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function reasonFor(breakdown: { image: number; category: number; location: number; date: number }) {
  const reasons: { icon: string; title: string; detail: string }[] = [];
  reasons.push({
    icon: "photo_camera",
    title: "High visual similarity",
    detail: `Our AI detected a ${breakdown.image}% visual match.`,
  });
  reasons.push({
    icon: "category",
    title: breakdown.category === 100 ? "Same category" : "Related category",
    detail:
      breakdown.category === 100
        ? "Both reports were listed under the same category."
        : "Both reports were listed under a closely related category.",
  });
  reasons.push({
    icon: "near_me",
    title: breakdown.location >= 70 ? "Nearby location" : "Location in range",
    detail:
      breakdown.location >= 70
        ? "Found near your reported loss area."
        : "Reported at a related location.",
  });
  reasons.push({
    icon: "schedule",
    title: breakdown.date >= 70 ? "Similar timeframe" : "Close reporting date",
    detail:
      breakdown.date >= 70
        ? "Both were reported around the same time."
        : "The reports were made within a comparable window.",
  });
  return reasons;
}

export default async function MatchDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();

  const detail = await getMatchDetail(params.id);
  if (!detail) notFound();

  const match = detail;
  const { lostItem, foundItem, claim, conversation } = detail;
  const isLostOwner = lostItem.userId === user.id;
  const isFinder = foundItem.userId === user.id;

  if (!isLostOwner && !isFinder) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <Icon name="lock" className="mx-auto text-[40px] text-on-surface-variant" />
        <h1 className="mt-4 font-display-md text-display-md text-on-surface">Not your match</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          You can only view matches for items you reported.
        </p>
        <Link
          href="/history"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-md hover:opacity-90"
        >
          Back to my history
        </Link>
      </div>
    );
  }

  const breakdown = await getMatchBreakdown(match.id);
  const score = breakdown?.total ?? match.similarityScore;
  const returned = lostItem.status === "RETURNED" || foundItem.status === "RETURNED";
  const connected = match.status === "CONNECTED" && Boolean(conversation);
  const reasons = breakdown ? reasonFor(breakdown) : [];

  const myItem = isLostOwner ? lostItem : foundItem;
  const otherItem = isLostOwner ? foundItem : lostItem;
  const myLabel = isLostOwner ? "Your Item" : "Your Find";
  const otherLabel = isLostOwner ? "Possible Match" : "Lost Item";

  return (
    <>
      <BackHeader title="Match" />
      <main className="mx-auto w-full max-w-[600px] px-5 pb-32 pt-2">
        <div className="overflow-hidden rounded-[24px] bg-surface-container-lowest shadow-soft animate-fade-in-up">
          {/* Header */}
          <div className="px-5 pb-2 pt-6 text-center">
            <h1 className="font-display-md text-display-md tracking-tight text-primary">
              {isLostOwner ? "Possible Match Found!" : "Someone may have found your item"}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {isLostOwner
                ? "We've identified an item that looks very similar to yours."
                : "A lost item looks very similar to the one you found."}
            </p>
          </div>

          {/* Success illustration */}
          <div className="flex justify-center px-5 py-4">
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-surface-container shadow-soft">
              <span className="absolute inset-0 animate-ping-soft rounded-full bg-primary/10" />
              <span className="absolute inset-2 animate-pulse rounded-full bg-primary/20" />
              <Icon name={connected ? "verified" : "check_circle"} filled className="relative z-10 text-[48px] text-primary" />
            </div>
          </div>

          {/* Comparison */}
          <div className="flex flex-col items-center px-5 py-4">
            <div className="relative flex w-full items-center justify-center gap-4">
              <div className="flex flex-col items-center">
                <div className="mb-2 h-24 w-24 overflow-hidden rounded-2xl border-4 border-surface bg-surface-container-high shadow-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={myItem.imageUrl} alt={myItem.itemName} className="h-full w-full object-cover" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {myLabel}
                </span>
              </div>

              <div className="relative mt-[-24px] flex flex-1 flex-col items-center justify-center">
                <div className="absolute left-0 top-1/2 z-0 w-full -translate-y-1/2 border-t-2 border-dashed border-primary/30" />
                <div className="z-10 flex flex-col items-center rounded-full border border-primary/20 bg-surface px-3 py-1 shadow-soft">
                  <span className="font-headline-sm text-headline-sm text-primary">{score}%</span>
                  <span className="font-caption text-caption text-primary/80">Similar</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-2xl border-4 border-surface bg-surface-container-high shadow-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={otherItem.imageUrl} alt={otherItem.itemName} className="h-full w-full object-cover" />
                  <span className="absolute right-1 top-1 h-3 w-3 animate-pulse rounded-full border-2 border-surface bg-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{otherLabel}</span>
              </div>
            </div>

            {/* Matched item details */}
            <div className="mt-5 w-full rounded-2xl bg-surface-container-low p-4 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1">
                    {otherItem.itemName}
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant line-clamp-1">
                    {isLostOwner ? "Found near" : "Lost near"} {otherItem.location}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-surface-container px-3 py-1 font-caption text-caption text-on-surface-variant">
                  {formatDate(isLostOwner ? foundItem.dateFound : lostItem.dateLost)}
                </span>
              </div>
            </div>

            {/* Why this may be a match */}
            {reasons.length > 0 && (
              <div className="mt-5 w-full">
                <h4 className="mb-3 font-label-md text-label-md text-on-surface-variant">
                  Why this may be a match
                </h4>
                <div className="flex flex-col gap-2">
                  {reasons.map((r) => (
                    <div
                      key={r.icon}
                      className="flex items-center gap-3 rounded-2xl border border-surface-container-highest bg-surface-container-lowest p-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon name={r.icon} className="text-[18px]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-label-md text-label-md text-on-surface">{r.title}</p>
                        <p className="font-caption text-caption text-on-surface-variant">{r.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-2 space-y-2 bg-surface-container-low px-5 py-6">
            {returned ? (
              <p className="rounded-2xl bg-surface-container-lowest px-4 py-3 text-center font-label-md text-label-md text-on-surface-variant">
                This item has already been returned.
              </p>
            ) : connected ? (
              <div className="space-y-2">
                <p className="flex items-center justify-center gap-2 rounded-2xl bg-secondary-container/50 px-4 py-3 text-center font-label-md text-label-md text-secondary">
                  <Icon name="verified" filled className="text-[18px]" />
                  You&apos;re connected!
                </p>
                <Link
                  href={`/chat/${conversation!.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-label-md text-label-md text-on-primary shadow-md transition-transform active:scale-95 hover:opacity-90"
                >
                  <Icon name="chat_bubble" className="text-[18px]" />
                  Open Chat
                </Link>
              </div>
            ) : (
              <ClaimActions
                isLostOwner={isLostOwner}
                matchId={match.id}
                claimId={claim?.id ?? null}
                claimStatus={claim?.status ?? null}
                claimDetail={claim?.detail ?? null}
                lostItemName={lostItem.itemName}
              />
            )}

            {!returned && !connected && (
              <Link
                href={`/items/${otherItem.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-secondary-fixed-dim bg-surface py-3.5 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low"
              >
                View Item
                <Icon name="arrow_forward" className="text-[18px]" />
              </Link>
            )}

            {isLostOwner && !returned && !connected && claim?.status !== "PENDING" && (
              <Link
                href="/history"
                className="block w-full rounded-full py-3 text-center font-label-md text-label-md text-primary transition-colors hover:bg-primary/5"
              >
                Not my item
              </Link>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
