export const CATEGORIES = [
  "Electronics",
  "Wallet",
  "Bag",
  "Keys",
  "Documents",
  "Clothing",
  "Accessories",
  "Books",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}
