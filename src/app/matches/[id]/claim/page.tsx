import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMatchDetail } from "@/lib/queries";
import { BackHeader } from "@/components/BackHeader";
import { Icon } from "@/components/Icon";
import { ClaimForm } from "@/components/ClaimForm";

export const dynamic = "force-dynamic";

export default async function ClaimPage({ params }: { params: { id: string } }) {
  const user = await requireUser();

  const detail = await getMatchDetail(params.id);
  if (!detail) notFound();

  const match = detail;
  const { lostItem, foundItem } = detail;

  if (lostItem.userId !== user.id) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <h1 className="font-display-md text-display-md text-on-surface">Not your item</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Only the person who reported this item lost can claim it.
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

  if (match.status === "CONNECTED" || lostItem.status === "RETURNED" || foundItem.status === "RETURNED") {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <h1 className="font-display-md text-display-md text-on-surface">Claim not available</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          This item has already been connected or returned.
        </p>
        <Link
          href={`/matches/${match.id}`}
          className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-md hover:opacity-90"
        >
          Back to match
        </Link>
      </div>
    );
  }

  const pendingClaim = detail.claim && detail.claim.status === "PENDING";
  const rejectedClaim = detail.claim && detail.claim.status === "REJECTED";

  return (
    <>
      <BackHeader title="Claim Item" />
      <main className="mx-auto w-full max-w-[600px] px-5 pb-32 pt-2">
        <div className="overflow-hidden rounded-[24px] bg-surface-container-lowest shadow-soft animate-fade-in-up">
          {/* Comparison */}
          <div className="px-5 pt-6">
            <h1 className="text-center font-display-md text-display-md tracking-tight text-primary">
              This Is My Item
            </h1>
            <p className="mt-1 text-center font-body-md text-body-md text-on-surface-variant">
              Tell the finder what identifies this as yours so they can confirm.
            </p>

            <div className="mt-5 flex items-center justify-center gap-4">
              <div className="flex flex-col items-center">
                <div className="mb-2 h-20 w-20 overflow-hidden rounded-2xl border-4 border-surface bg-surface-container-high shadow-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={lostItem.imageUrl} alt={lostItem.itemName} className="h-full w-full object-cover" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Your Item
                </span>
              </div>
              <Icon name="arrow_forward" className="mt-4 text-[24px] text-primary/50" />
              <div className="flex flex-col items-center">
                <div className="mb-2 h-20 w-20 overflow-hidden rounded-2xl border-4 border-surface bg-surface-container-high shadow-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={foundItem.imageUrl} alt={foundItem.itemName} className="h-full w-full object-cover" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {foundItem.itemName}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 px-5 pb-6">
            {pendingClaim ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-secondary-container/40 px-4 py-6 text-center">
                <Icon name="hourglass_top" className="text-[32px] text-secondary" />
                <p className="font-label-bold text-label-bold text-secondary">Claim sent — awaiting review</p>
                <p className="text-sm text-on-surface-variant">
                  The finder has been notified and will review your claim. We&apos;ll update you here
                  once they respond.
                </p>
              </div>
            ) : rejectedClaim ? (
              <ClaimForm
                matchId={match.id}
                mode="retry"
                previousDetail={detail.claim!.detail}
              />
            ) : (
              <ClaimForm matchId={match.id} mode="claim" />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
