"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ImageUploader } from "@/components/ImageUploader";
import { CATEGORIES } from "@/lib/categories";
import { cn, formatDate } from "@/lib/utils";

type Phase = "idle" | "submitting" | "done";

interface MatchedItem {
  id: string;
  imageUrl: string;
  itemName: string;
  location: string;
  date: string;
}

interface MatchResult {
  matchId: string;
  itemId: string;
  similarityScore: number;
  matchedItem: MatchedItem | null;
  breakdown: { image: number; category: number; location: number; date: number } | null;
}

interface CreatedItem {
  id: string;
  imageUrl: string;
  itemName: string;
}

const pillInput =
  "w-full rounded-full border border-secondary-fixed-dim bg-surface-bright px-6 py-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export function ItemForm({ type }: { type: "lost" | "found" }) {
  const isLost = type === "lost";

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [phase, setPhase] = useState<Phase>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [createdItem, setCreatedItem] = useState<CreatedItem | null>(null);

  const canSubmit = useMemo(
    () => imageUrl && itemName.trim() && category && location.trim() && date,
    [imageUrl, itemName, category, location, date],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const errors: Record<string, string> = {};
    if (!imageUrl) errors.image = "Please upload an image of the item.";
    if (!itemName.trim()) errors.itemName = "Please enter the item name.";
    if (!category) errors.category = "Please choose a category.";
    if (!location.trim()) errors.location = "Please enter a location.";
    if (!date) errors.date = "Please pick a date.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPhase("submitting");
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          imageUrl,
          itemName: itemName.trim(),
          category,
          location: location.trim(),
          description: description.trim(),
          date,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const issues = data?.issues;
        const nextErrors: Record<string, string> = {};
        if (issues) {
          for (const [key, msgs] of Object.entries(issues)) {
            if (Array.isArray(msgs) && msgs[0]) nextErrors[key] = String(msgs[0]);
          }
        }
        setFieldErrors(nextErrors);
        setServerError(data?.error ?? "Could not save your report. Please try again.");
        setPhase("idle");
        return;
      }

      setCreatedItem({ id: data.item.id, imageUrl: data.item.imageUrl, itemName: data.item.itemName });
      setMatches(data.matches ?? []);
      setPhase("done");
    } catch {
      setServerError("Could not reach the server. Check your connection and try again.");
      setPhase("idle");
    }
  }

  const buttonLabel = isLost ? "Report Lost Item" : "Report Found Item";
  const successMessage = isLost
    ? "Your lost item has been successfully reported."
    : "Thank you for reporting the found item.";

  return (
    <div className="mx-auto w-full max-w-[600px] px-5 pb-32 pt-6">
      {/* Header & Illustration */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-48 w-full items-center justify-center overflow-hidden rounded-xl bg-primary-fixed-dim/20">
          <Icon name={isLost ? "manage_search" : "inventory_2"} className="text-[96px] text-primary/30" />
        </div>
        <h1 className="font-display-lg text-display-lg text-on-surface">
          {isLost ? "What did you lose?" : "What did you find?"}
        </h1>
        <p className="mx-auto max-w-[80%] font-body-md text-body-md text-on-surface-variant">
          {isLost
            ? "Tell us a little about your item so we can help find a possible match."
            : "Tell us a little about your item so we can help connect it with its owner."}
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className={cn("space-y-4 rounded-[24px] bg-surface-container-lowest p-5 shadow-soft", phase === "done" && "hidden")}
        noValidate
      >
        <ImageUploader
          value={imageUrl}
          onChange={(url) => {
            setImageUrl(url);
            setFieldErrors((f) => ({ ...f, image: "" }));
          }}
          error={fieldErrors.image}
        />

        <div>
          <label className="sr-only" htmlFor="itemName">Item Name</label>
          <input
            id="itemName"
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Item Name (e.g. Blue Yeti Rambler)"
            className={pillInput}
          />
          {fieldErrors.itemName && <FieldError message={fieldErrors.itemName} />}
        </div>

        <div className="relative">
          <label className="sr-only" htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={cn(pillInput, "appearance-none pr-12")}
          >
            <option value="" disabled>
              Select Category
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Icon name="expand_more" className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          {fieldErrors.category && <FieldError message={fieldErrors.category} />}
        </div>

        <div className="relative">
          <label className="sr-only" htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={isLost ? "Where did you last see it?" : "Where did you find it?"}
            className={cn(pillInput, "pr-12")}
          />
          <Icon name="my_location" className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-primary" />
          {fieldErrors.location && <FieldError message={fieldErrors.location} />}
        </div>

        <div>
          <label className="sr-only" htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className={cn(pillInput, "text-on-surface-variant")}
          />
          {fieldErrors.date && <FieldError message={fieldErrors.date} />}
        </div>

        <div>
          <label className="sr-only" htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Any distinguishing marks? (e.g. scratch on the bottom left corner)"
            className="w-full resize-none rounded-xl border border-secondary-fixed-dim bg-surface-bright px-6 py-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {serverError && (
          <p className="flex items-center gap-2 rounded-xl bg-error-container/50 px-4 py-3 text-sm text-on-error-container">
            <Icon name="error" className="text-[18px] shrink-0" />
            {serverError}
          </p>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit || phase === "submitting"}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-md text-label-md text-on-primary shadow-md transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {phase === "submitting" ? "Saving your report…" : buttonLabel}
            {phase !== "submitting" && <Icon name="send" filled className="text-[20px]" />}
          </button>
        </div>
      </form>

      {phase === "done" && createdItem && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-[24px] bg-secondary-container/40 p-5">
            <Icon name="check_circle" filled className="mt-0.5 text-[24px] text-secondary" />
            <div>
              <p className="font-label-bold text-label-bold text-on-surface">{successMessage}</p>
              <p className="mt-0.5 text-sm text-on-surface-variant">
                {isLost
                  ? "We compared your report with existing found reports."
                  : "We compared your report with existing lost reports."}
              </p>
            </div>
          </div>

          {matches.length > 0 ? (
            <MatchFoundScreen isLost={isLost} item={createdItem} matches={matches} />
          ) : (
            <NoMatchScreen isLost={isLost} />
          )}
        </div>
      )}
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="mt-2 pl-4 text-sm text-error">{message}</p>;
}

function NoMatchScreen({ isLost }: { isLost: boolean }) {
  return (
    <div className="rounded-[24px] border border-surface-variant/50 bg-surface-container-lowest p-8 text-center shadow-card">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
        <Icon name="search_off" className="text-[28px]" />
      </div>
      <h2 className="mt-4 font-headline-sm text-headline-sm text-on-surface">No Possible Match Yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
        We couldn&apos;t find a strong match right now. Your report will remain active and can be
        matched with future {isLost ? "found" : "lost"} reports.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/history"
          className="rounded-full bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-md transition-opacity hover:opacity-90"
        >
          View My History
        </Link>
        <Link
          href="/browse"
          className="rounded-full border border-secondary-fixed-dim bg-surface px-6 py-3 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low"
        >
          Browse reports
        </Link>
      </div>
    </div>
  );
}

function MatchFoundScreen({
  isLost,
  item,
  matches,
}: {
  isLost: boolean;
  item: CreatedItem;
  matches: MatchResult[];
}) {
  const top = matches[0];
  const matched = top.matchedItem;
  const b = top.breakdown;

  const reasons: { icon: string; title: string; detail: string }[] = [];
  if (b) {
    reasons.push({
      icon: "photo_camera",
      title: "High visual similarity",
      detail: `Our AI detected a ${b.image}% visual match.`,
    });
    reasons.push({
      icon: "category",
      title: b.category === 100 ? "Same category" : "Related category",
      detail: `Both listed under '${item.itemName}' ${b.category === 100 ? "category" : "with a close category match"}.`,
    });
    reasons.push({
      icon: "near_me",
      title: b.location >= 70 ? "Nearby location" : "Location in range",
      detail:
        b.location >= 70
          ? "Reported within a nearby area."
          : "Reported at a related location.",
    });
    reasons.push({
      icon: "schedule",
      title: b.date >= 70 ? "Similar timeframe" : "Close reporting date",
      detail:
        b.date >= 70
          ? "Both were reported around the same time."
          : "The reports were made within a comparable window.",
    });
  }

  return (
    <div className="overflow-hidden rounded-[24px] bg-surface-container-lowest shadow-soft animate-fade-in-up">
      {/* Header */}
      <div className="px-5 pb-2 pt-6 text-center">
        <h2 className="font-display-md text-display-md tracking-tight text-primary">Possible Match Found!</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          We&apos;ve identified an item that looks very similar to yours.
        </p>
      </div>

      {/* Success illustration */}
      <div className="flex justify-center px-5 py-4">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-surface-container shadow-soft">
          <span className="absolute inset-0 animate-ping-soft rounded-full bg-primary/10" />
          <span className="absolute inset-2 animate-pulse rounded-full bg-primary/20" />
          <Icon name="check_circle" filled className="relative z-10 text-[44px] text-primary" />
        </div>
      </div>

      {/* Comparison */}
      <div className="flex flex-col items-center px-5 py-4">
        <div className="relative flex w-full items-center justify-center gap-4">
          <div className="flex flex-col items-center">
            <div className="mb-2 h-24 w-24 overflow-hidden rounded-2xl border-4 border-surface bg-surface-container-high shadow-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={item.itemName} className="h-full w-full object-cover" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Your Item
            </span>
          </div>

          <div className="relative mt-[-24px] flex flex-1 flex-col items-center justify-center">
            <div className="absolute left-0 top-1/2 z-0 w-full -translate-y-1/2 border-t-2 border-dashed border-primary/30" />
            <div className="z-10 flex flex-col items-center rounded-full border border-primary/20 bg-surface px-3 py-1 shadow-soft">
              <span className="font-headline-sm text-headline-sm text-primary">{top.similarityScore}%</span>
              <span className="font-caption text-caption text-primary/80">Similar</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-2xl border-4 border-surface bg-surface-container-high shadow-soft">
              {matched ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={matched.imageUrl} alt={matched.itemName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-on-surface-variant">
                  <Icon name="image" className="text-[28px]" />
                </div>
              )}
              <span className="absolute right-1 top-1 h-3 w-3 animate-pulse rounded-full border-2 border-surface bg-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Possible Match
            </span>
          </div>
        </div>

        {/* Matched item details */}
        {matched && (
          <div className="mt-5 w-full rounded-2xl bg-surface-container-low p-4 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1">
                  {matched.itemName}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant line-clamp-1">
                  {matched.location}
                </p>
              </div>
              {matched.date && (
                <span className="shrink-0 rounded-full bg-surface-container px-3 py-1 font-caption text-caption text-on-surface-variant">
                  {formatDate(matched.date)}
                </span>
              )}
            </div>
          </div>
        )}

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
        <Link
          href={`/matches/${top.matchId}`}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-label-md text-label-md text-on-primary shadow-soft transition-opacity hover:opacity-90"
        >
          View Match
          <Icon name="arrow_forward" className="text-[18px]" />
        </Link>
        <Link
          href="/history"
          className="block w-full rounded-full py-3 text-center font-label-md text-label-md text-primary transition-colors hover:bg-primary/5"
        >
          Not my item
        </Link>
      </div>
    </div>
  );
}
