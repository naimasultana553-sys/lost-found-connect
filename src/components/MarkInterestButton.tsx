"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

export function MarkInterestButton({ matchId, disabled }: { matchId: string; disabled: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function onClick() {
    setState("loading");
    try {
      const res = await fetch(`/api/matches/${matchId}/interest`, { method: "POST" });
      if (!res.ok) {
        setState("error");
        return;
      }
      setState("done");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-secondary-container/50 px-4 py-3 text-sm font-medium text-secondary ring-1 ring-inset ring-secondary-container">
        <Icon name="check_circle" filled className="text-[18px] shrink-0" />
        Marked as my item. Status updated to Matched.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={disabled || state === "loading"}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-label-md text-label-md text-on-primary shadow-md transition-transform active:scale-95 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "loading" ? (
          <>
            <Icon name="hourglass_top" className="animate-spin text-[18px]" />
            Updating…
          </>
        ) : (
          "Mark as My Item"
        )}
      </button>
      <p className="text-xs text-on-surface-variant">
        This records your interest. The finder still needs to verify ownership before the item is
        returned.
      </p>
      {state === "error" && <p className="text-sm text-error">Something went wrong. Please try again.</p>}
    </div>
  );
}
