"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";

interface ClaimActionsProps {
  isLostOwner: boolean;
  matchId: string;
  claimId: string | null;
  claimStatus: string | null;
  claimDetail: string | null;
  lostItemName: string;
}

export function ClaimActions({
  isLostOwner,
  matchId,
  claimId,
  claimStatus,
  claimDetail,
  lostItemName,
}: ClaimActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "accept" | "reject") {
    if (!claimId) return;
    setBusy(decision);
    setError(null);
    try {
      const res = await fetch(`/api/claims/${claimId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        setBusy(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(null);
    }
  }

  if (isLostOwner) {
    return (
      <div className="space-y-2">
        {claimStatus === "PENDING" && (
          <p className="flex items-center justify-center gap-2 rounded-2xl bg-secondary-container/50 px-4 py-3 text-center font-label-md text-label-md text-secondary">
            <Icon name="hourglass_top" className="text-[18px]" />
            Claim sent — awaiting the finder&apos;s review
          </p>
        )}
        {claimStatus === "REJECTED" && (
          <div className="space-y-2">
            <p className="flex items-center justify-center gap-2 rounded-2xl bg-error-container/50 px-4 py-3 text-center font-label-md text-label-md text-on-error-container">
              <Icon name="close" className="text-[18px]" />
              The finder didn&apos;t confirm this item.
            </p>
            <Link
              href={`/matches/${matchId}/claim`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-label-md text-label-md text-on-primary shadow-md transition-transform active:scale-95 hover:opacity-90"
            >
              <Icon name="how_to_reg" className="text-[18px]" />
              Try Again
            </Link>
          </div>
        )}
        {claimStatus === null && (
          <>
            <Link
              href={`/matches/${matchId}/claim`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-label-md text-label-md text-on-primary shadow-md transition-transform active:scale-95 hover:opacity-90"
            >
              <Icon name="how_to_reg" className="text-[18px]" />
              This Is My Item
            </Link>
            <p className="text-center text-xs text-on-surface-variant">
              Claim this item and provide an identifying detail. The finder must confirm before you
              can connect.
            </p>
          </>
        )}
      </div>
    );
  }

  // Finder view
  if (claimStatus === "PENDING") {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-secondary-container bg-secondary-container/20 p-4">
          <p className="flex items-center gap-2 font-label-bold text-label-bold text-secondary">
            <Icon name="verified_user" className="text-[20px]" />
            Claim request from the owner
          </p>
          <p className="mt-2 text-sm text-on-surface-variant">
            The person who lost this item sent this identifying detail:
          </p>
          <p className="mt-2 rounded-2xl bg-surface-container-lowest px-4 py-3 text-sm text-on-surface ring-1 ring-surface-variant/50">
            &ldquo;{claimDetail ?? "No detail provided"}&rdquo;
          </p>
          <p className="mt-2 text-xs text-on-surface-variant">
            Does this sound right? Accepting connects you privately so you can arrange the return.
          </p>
        </div>

        {error && <p className="rounded-2xl bg-error-container px-4 py-2.5 text-sm text-on-error-container">{error}</p>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => decide("accept")}
            disabled={busy !== null}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-label-md text-label-md text-on-primary shadow-md transition-transform active:scale-95 hover:opacity-90 disabled:opacity-60"
          >
            {busy === "accept" ? (
              <Icon name="hourglass_top" className="animate-spin text-[18px]" />
            ) : (
              <Icon name="chat_bubble" className="text-[18px]" />
            )}
            Accept &amp; Connect
          </button>
          <button
            onClick={() => decide("reject")}
            disabled={busy !== null}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-error/30 bg-surface py-3.5 font-label-md text-label-md text-error transition-colors hover:bg-error/5 disabled:opacity-60"
          >
            {busy === "reject" ? (
              <Icon name="hourglass_top" className="animate-spin text-[18px]" />
            ) : (
              <Icon name="close" className="text-[18px]" />
            )}
            Reject
          </button>
        </div>
      </div>
    );
  }

  if (claimStatus === "ACCEPTED") {
    return (
      <p className="flex items-center justify-center gap-2 rounded-2xl bg-secondary-container/50 px-4 py-3 text-center font-label-md text-label-md text-secondary">
        <Icon name="check_circle" filled className="text-[18px]" />
        You confirmed this item&apos;s owner.
      </p>
    );
  }

  return (
    <p className="flex items-center justify-center gap-2 rounded-2xl bg-surface-container px-4 py-3 text-center font-label-md text-label-md text-on-surface-variant">
      <Icon name="hourglass_empty" className="text-[18px]" />
      Waiting for the owner to claim the {lostItemName}.
    </p>
  );
}
