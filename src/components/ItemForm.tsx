"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Loader2, Target, CircleCheck, MapPin, CalendarDays } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { CATEGORIES } from "@/lib/categories";
import { cn, formatDate } from "@/lib/utils";

type Phase = "idle" | "submitting" | "matching" | "done";

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

const MATCH_MESSAGES = [
  "Analyzing image…",
  "Comparing with reported items…",
  "Looking for similarities…",
];

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

      // Short "matching in progress" beat so the user sees the staged animation.
      setPhase("matching");
      await new Promise((r) => setTimeout(r, 2400));
      setPhase("done");
    } catch {
      setServerError("Could not reach the server. Check your connection and try again.");
      setPhase("idle");
    }
  }

  const heading = isLost ? "Report Lost Item" : "Report Found Item";
  const buttonLabel = isLost ? "Report Lost Item" : "Report Found Item";
  const successMessage = isLost
    ? "Your lost item has been successfully reported."
    : "Thank you for reporting the found item.";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{heading}</h1>
        <p className="mt-1 text-slate-500">
          {isLost
            ? "Tell us about the item you lost so we can look for a possible match."
            : "Tell us about the item you found so we can help connect it with its owner."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={cn("space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8", phase === "done" && "hidden")}
        noValidate
      >
        {/* Image */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Upload Photo</label>
          <ImageUploader value={imageUrl} onChange={(url) => { setImageUrl(url); setFieldErrors((f) => ({ ...f, image: "" })); }} error={fieldErrors.image} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Name */}
          <div>
            <label htmlFor="itemName" className="mb-2 block text-sm font-semibold text-slate-700">
              Item Name
            </label>
            <input
              id="itemName"
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Black Leather Wallet"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            {fieldErrors.itemName && <FieldError message={fieldErrors.itemName} />}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="mb-2 block text-sm font-semibold text-slate-700">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {fieldErrors.category && <FieldError message={fieldErrors.category} />}
          </div>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="mb-2 block text-sm font-semibold text-slate-700">
            {isLost ? "Location Lost" : "Location Found"}
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Southeast University Library"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <p className="mt-1.5 text-xs text-slate-400">A map picker will be added in a future version.</p>
          {fieldErrors.location && <FieldError message={fieldErrors.location} />}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-semibold text-slate-700">
            Description <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={
              isLost
                ? "e.g. Black leather wallet with a small silver logo and a scratch on the front."
                : "e.g. Black wallet found near the library entrance."
            }
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className="mb-2 block text-sm font-semibold text-slate-700">
            {isLost ? "Date Lost" : "Date Found"}
          </label>
          <input
            id="date"
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:w-56"
          />
          {fieldErrors.date && <FieldError message={fieldErrors.date} />}
        </div>

        {serverError && (
          <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit || phase === "submitting" || phase === "matching"}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto",
            isLost ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700",
          )}
        >
          {phase === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving your report…
            </>
          ) : (
            <>
              {buttonLabel}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {phase === "matching" && <MatchingScreen isLost={isLost} imageUrl={createdItem?.imageUrl ?? null} />}

      {phase === "done" && createdItem && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900">{successMessage}</p>
              <p className="mt-0.5 text-sm text-emerald-700">
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
  return <p className="mt-1.5 text-sm text-rose-600">{message}</p>;
}

function MatchingScreen({ isLost, imageUrl }: { isLost: boolean; imageUrl: string | null }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % MATCH_MESSAGES.length), 800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-match-100" />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-match-600 text-white">
          <Target className="h-6 w-6" />
        </span>
      </div>

      <h2 className="text-xl font-bold text-slate-900">Looking for a possible match…</h2>

      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-200">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Reported item" className="h-full w-full object-cover" />
        ) : (
          <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        )}
      </div>

      <div className="flex flex-col items-center gap-1.5">
        {MATCH_MESSAGES.map((msg, i) => (
          <p
            key={msg}
            className={cn(
              "text-sm transition-all duration-300",
              i === step ? "font-medium text-slate-700" : "text-slate-300",
            )}
          >
            {msg}
          </p>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        Comparing against existing {isLost ? "found" : "lost"} reports.
      </p>
    </div>
  );
}

function NoMatchScreen({ isLost }: { isLost: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Target className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900">No Possible Match Yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        We couldn&apos;t find a strong match right now. Your report will remain active and can be
        matched with future {isLost ? "found" : "lost"} reports.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/history"
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          View My History
        </Link>
        <Link
          href="/browse"
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
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

  return (
    <div className="overflow-hidden rounded-2xl border border-match-200 bg-white shadow-card">
      <div className="border-b border-match-100 bg-match-50 px-6 py-5">
        <p className="flex items-center gap-2 font-bold text-match-700">
          <Target className="h-5 w-5" />
          Possible Match Found
        </p>
        <p className="mt-1 text-sm text-match-700/80">
          {isLost
            ? "A found item looks similar to what you reported."
            : "Your found item looks similar to a reported lost item. Its owner has been notified."}
        </p>
      </div>

      <div className="p-6">
        <div className="flex flex-col items-center">
          <p className="text-5xl font-extrabold text-slate-900">{top.similarityScore}%</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Similar
          </p>
        </div>

        {/* Side-by-side images */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <MatchImage
            label={isLost ? "Your Lost Item" : "Your Found Item"}
            imageUrl={item.imageUrl}
            name={item.itemName}
            accent={isLost ? "rose" : "emerald"}
          />
          <MatchImage
            label={isLost ? "Possible Found Item" : "Possible Lost Item"}
            imageUrl={matched?.imageUrl ?? null}
            name={matched?.itemName ?? ""}
            location={matched?.location}
            date={matched?.date ? formatDate(matched.date) : undefined}
            accent="match"
          />
        </div>

        {matched && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span className="font-semibold">{matched.itemName}</span>
            {matched.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-slate-400" />
                {matched.location}
              </span>
            )}
            {matched.date && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                {formatDate(matched.date)}
              </span>
            )}
          </div>
        )}

        {b && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-900">Match Information</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <InfoChip label="Image similarity" value={`${b.image}%`} />
              <InfoChip label="Category" value={b.category === 100 ? "Same" : "Different"} />
              <InfoChip label="Location" value={b.location >= 70 ? "Nearby" : b.location > 0 ? "Partially" : "Different"} />
              <InfoChip label="Date" value={b.date >= 70 ? "Similar" : b.date > 0 ? "Partially similar" : "Different"} />
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            {matches.length > 1 ? `${matches.length} possible matches found` : "This is a possible match, not a confirmed one."}
          </p>
          <Link
            href={`/matches/${top.matchId}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-match-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-match-700"
          >
            View Match
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function MatchImage({
  label,
  imageUrl,
  name,
  location,
  date,
  accent,
}: {
  label: string;
  imageUrl: string | null;
  name: string;
  location?: string;
  date?: string;
  accent: "rose" | "emerald" | "match";
}) {
  const ring = {
    rose: "ring-rose-200",
    emerald: "ring-emerald-200",
    match: "ring-match-200",
  }[accent];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="relative aspect-[4/3] bg-slate-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>
      <div className={cn("border-t-4 p-3", ring)}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{name}</p>
        {(location || date) && (
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {[location, date].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
