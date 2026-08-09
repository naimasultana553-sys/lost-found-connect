import { PrismaClient } from "@prisma/client";
import { SCHEMA_STATEMENTS } from "@/lib/schema";

// Prevent multiple PrismaClient instances during hot reload in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const client = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;

let ensurePromise: Promise<void> | null = null;

/**
 * On writable-but-empty databases (SQLite on Vercel /tmp) the tables may not
 * exist yet on a cold start. The first DB call detects this and creates the
 * schema before the query runs. Local development is unaffected because
 * `npm run db:push` has already created prisma/dev.db.
 */
function ensureSchemaIfNeeded(): Promise<void> {
  if (!process.env.DATABASE_URL?.startsWith("file:")) return Promise.resolve();
  if (!ensurePromise) {
    ensurePromise = (async () => {
      try {
        await client.$executeRawUnsafe('SELECT 1 FROM "users" LIMIT 1');
        return;
      } catch {
        // Tables missing → create them below.
      }
      for (const statement of SCHEMA_STATEMENTS) {
        await client.$executeRawUnsafe(statement);
      }
    })().catch(() => {
      // If schema creation fails there is nothing sensible to do at query time.
    });
  }
  return ensurePromise;
}

function wrapAsync<T extends (...args: never[]) => unknown>(fn: T, receiver: object): T {
  return ((...args: never[]) => ensureSchemaIfNeeded().then(() => fn.apply(receiver, args))) as T;
}

/**
 * Proxy that lazily runs schema bootstrap before the first query, then
 * delegates to the real Prisma client. Handles both top-level methods
 * (e.g. `$queryRaw`, `$transaction`) and delegate objects
 * (e.g. `prisma.lostItem.findMany`).
 */
export const prisma = new Proxy(client, {
  get(target, prop) {
    const value = Reflect.get(target, prop);
    if (typeof value === "function") {
      return wrapAsync(value as never, target);
    }
    if (value && typeof value === "object") {
      return new Proxy(value as object, {
        get(t, p) {
          const v = Reflect.get(t, p);
          return typeof v === "function" ? wrapAsync(v as never, t) : v;
        },
      });
    }
    return value;
  },
});
