import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const dateString = z
  .string()
  .min(1, "Date is required")
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "Enter a valid date");

export const createItemSchema = z.object({
  type: z.enum(["lost", "found"]),
  imageUrl: z.string().trim().min(1, "An image is required"),
  itemName: z.string().trim().min(1, "Item name is required").max(120),
  category: z.enum(CATEGORIES as unknown as [string, ...string[]]),
  location: z.string().trim().min(1, "Location is required").max(160),
  description: z.string().trim().max(1000).optional().default(""),
  date: dateString,
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
