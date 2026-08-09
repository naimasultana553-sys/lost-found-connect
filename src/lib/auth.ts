import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession, type SessionOptions } from "iron-session";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface SessionData {
  userId: string;
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? "dev-secret-change-me-please-12345",
  cookieName: "lnf_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession() {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}

/** Returns the logged-in User or null. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session.userId) return null;
  try {
    return await prisma.user.findUnique({ where: { id: session.userId } });
  } catch {
    return null;
  }
}

/** Server-side guard for protected pages/APIs. Redirects to /login for pages. */
export async function requireUser(nextPath = "/"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** API-route guard. Returns null (caller returns 401). */
export async function requireApiUser(): Promise<User | null> {
  return getCurrentUser();
}
