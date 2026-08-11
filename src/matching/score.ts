/**
 * Score composition.
 *
 * Combines the individual matchers into a single 0-99 similarity score using
 * the weights in matching/config.ts. The score is capped at 99 on purpose:
 * the system must never claim 100% certainty that a found item belongs to a
 * given owner.
 */
import { MATCHING_CONFIG } from "@/matching/config";
import { imageSimilarity } from "@/matching/imageMatcher";
import { textSimilarity } from "@/matching/textMatcher";
import { locationSimilarity } from "@/matching/locationMatcher";
import { categorySimilarity } from "@/matching/categoryMatcher";
import { dateSimilarity } from "@/matching/dateMatcher";

export interface ScoreInput {
  imageHashA: string | null;
  imageHashB: string | null;
  /** Optional AI-provided image similarity (0-100). Falls back to dHash when null. */
  imageScore?: number | null;
  nameA: string;
  nameB: string;
  categoryA: string;
  categoryB: string;
  locationA: string;
  locationB: string;
  dateA: Date;
  dateB: Date;
}

export interface ScoreBreakdown {
  total: number;
  image: number;
  name: number;
  category: number;
  location: number;
  date: number;
}

export function computeMatchScore(input: ScoreInput): ScoreBreakdown {
  const parts = {
    image:
      input.imageScore != null
        ? input.imageScore
        : imageSimilarity(input.imageHashA, input.imageHashB),
    name: textSimilarity(input.nameA, input.nameB),
    category: categorySimilarity(input.categoryA, input.categoryB),
    location: locationSimilarity(input.locationA, input.locationB),
    date: dateSimilarity(input.dateA, input.dateB),
  };

  const w = MATCHING_CONFIG.weights;
  const total = Math.min(
    99,
    Math.round(
      parts.image * w.image +
        parts.name * w.name +
        parts.category * w.category +
        parts.location * w.location +
        parts.date * w.date,
    ),
  );

  return { total, ...parts };
}
