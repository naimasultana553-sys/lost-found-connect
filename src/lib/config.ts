/**
 * Global application configuration.
 *
 * The most important value here is `matchThreshold` — the minimum combined
 * similarity score (0-100) required before the system creates a possible
 * match and notifies the owner of the lost item.
 */
export const APP_CONFIG = {
  appName: "FindBack",
  appDescription: "Reunite lost items with their owners.",
  maxUploadBytes: 5 * 1024 * 1024, // 5 MB
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  itemsPerPage: 12,
} as const;

export const ITEM_STATUS = {
  lost: {
    SEARCHING: "Searching",
    POSSIBLE_MATCH: "Possible Match",
    MATCHED: "Matched",
    RETURNED: "Returned",
  },
  found: {
    AVAILABLE: "Available",
    MATCHED: "Matched",
    RETURNED: "Returned",
  },
} as const;
