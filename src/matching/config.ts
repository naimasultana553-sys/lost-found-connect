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
