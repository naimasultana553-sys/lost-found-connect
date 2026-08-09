"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

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
      <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Marked as my item. Status updated to Matched.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={disabled || state === "loading"}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating…
          </>
        ) : (
          "Mark as My Item"
        )}
      </button>
      <p className="text-xs text-slate-400">
        This records your interest. The finder still needs to verify ownership before the item is
        returned.
      </p>
      {state === "error" && <p className="text-sm text-rose-600">Something went wrong. Please try again.</p>}
    </div>
  );
}
