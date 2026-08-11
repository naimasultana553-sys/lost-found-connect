import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { BackHeader } from "@/components/BackHeader";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();

  const [lostCount, foundCount, unreadCount] = await Promise.all([
    prisma.lostItem.count({ where: { userId: user.id } }),
    prisma.foundItem.count({ where: { userId: user.id } }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  const stats = [
    { label: "Lost items", value: lostCount },
    { label: "Found items", value: foundCount },
    { label: "Unread alerts", value: unreadCount },
  ];

  return (
    <>
      <BackHeader title="Profile" />
      <main className="mx-auto w-full max-w-[600px] px-5 pb-32 pt-6">
        <div className="rounded-[24px] border border-surface-variant/50 bg-surface-container-lowest p-6 shadow-card">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-on-primary">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="font-headline-sm text-headline-sm text-on-surface">{user.name}</h1>
              <p className="truncate text-sm text-on-surface-variant">{user.email}</p>
              <p className="mt-1 font-caption text-caption text-on-surface-variant/70">
                Joined {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-[24px] border border-surface-variant/50 bg-surface-container-low p-3 text-center">
                <p className="font-display-md text-display-md text-on-surface">{s.value}</p>
                <p className="mt-0.5 font-caption text-caption text-on-surface-variant">{s.label}</p>
              </div>
            ))}
          </div>

          <form action="/api/auth/logout" method="post" className="mt-6">
            <button
              type="submit"
              className="w-full rounded-full border border-secondary-fixed-dim bg-surface px-5 py-3 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low"
            >
              Sign out
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
