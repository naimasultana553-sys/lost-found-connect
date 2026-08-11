"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

export function ClaimForm({ matchId, mode, previousDetail }: {
  matchId: string;
  mode: "claim" | "retry";
  previousDetail?: string;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState(previousDetail ?? "");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!detail.trim()) {
      setError("Please describe what identifies this item as yours.");
      return;
    }
    setState("loading");
    setError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }
      setState("done");
      router.refresh();
      router.push(`/matches/${matchId}`);
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-secondary-container/40 px-4 py-6 text-center">
        <Icon name="check_circle" filled className="text-[32px] text-secondary" />
        <p className="font-label-bold text-label-bold text-secondary">
          {mode === "retry" ? "Claim resent" : "Claim sent"}
        </p>
        <p className="text-sm text-on-surface-variant">
          The finder has been notified and will review your claim shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="claim-detail" className="mb-1.5 block font-label-md text-label-md text-on-surface-variant">
          What identifies this as yours?
        </label>
        <textarea
          id="claim-detail"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={4}
          placeholder="e.g. Blue backpack with a silver keyring and a water bottle in the front pocket"
          className="w-full rounded-2xl border border-surface-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-on-surface-variant">
          Only the finder can see this. Don&apos;t share personal contact details — you&apos;ll be able to
          message privately after they confirm.
        </p>
      </div>

      {error && <p className="rounded-2xl bg-error-container px-4 py-2.5 text-sm text-on-error-container">{error}</p>}

      <button
        onClick={onSubmit}
        disabled={state === "loading"}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-label-md text-label-md text-on-primary shadow-md transition-transform active:scale-95 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "loading" ? (
          <>
            <Icon name="hourglass_top" className="animate-spin text-[18px]" />
            Sending claim…
          </>
        ) : (
          <>
            <Icon name="how_to_reg" className="text-[18px]" />
            Send Claim Request
          </>
        )}
      </button>
      <p className="text-center text-xs text-on-surface-variant">
        The finder must confirm before you can connect — claiming does not confirm ownership.
      </p>
    </div>
  );
}
