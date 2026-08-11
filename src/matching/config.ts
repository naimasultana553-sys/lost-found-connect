/**
 * Matching configuration.
 *
 * These weights determine how much each signal contributes to the final
 * similarity score. The image is the primary signal; name, category,
 * location and date are supporting evidence.
 *
 * Change `matchThreshold` to tune how strict the system is before it
 * notifies an owner (0-100).
 */
export const MATCHING_CONFIG = {
  /** Minimum combined similarity (0-100) before a possible match is created. */
  matchThreshold: 80,

  weights: {
    image: 0.55,
    name: 0.15,
    category: 0.1,
    location: 0.15,
    date: 0.05,
  },

  /** Maximum number of possible matches returned per report. */
  maxResults: 5,
} as const;

/**
 * AI vision-model settings for image similarity (Gemini).
 * Requires a GEMINI_API_KEY env var; without one the app falls back to the
 * free local perceptual hash (dHash) matcher.
 */
export const IMAGE_AI = {
  /** Gemini model used to compare photos. */
  model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite",

  /** Total candidate photos considered per report (capped). */
  maxCandidates: 30,

  /** Photos sent per Gemini request (keeps each request well under size limits). */
  chunkSize: 8,
} as const;
