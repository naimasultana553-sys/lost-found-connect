import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

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
    { label: "Unread notifications", value: unreadCount },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-800 text-2xl font-bold text-white sm:h-16 sm:w-16">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
            <p className="mt-1 text-xs text-slate-400">Joined {formatDate(user.createdAt)}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center sm:p-4">
              <p className="text-xl font-bold text-slate-900 sm:text-2xl">{s.value}</p>
              <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        <form action="/api/auth/logout" method="post" className="mt-6">
          <button
            type="submit"
            className="w-full rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
