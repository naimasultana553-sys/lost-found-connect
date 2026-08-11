import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Icon } from "@/components/Icon";

export async function TopBar() {
  const user = await getCurrentUser();
  if (!user) return null;

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return (
    <header className="sticky top-0 z-40 w-full bg-surface">
      <div className="mx-auto flex w-full max-w-[600px] items-center justify-between px-5 py-3.5">
        <Link
          href="/browse"
          aria-label="Search"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-opacity hover:opacity-80"
        >
          <Icon name="search" className="text-[24px]" />
        </Link>
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.svg"
            alt=""
            className="h-8 w-8 rounded-full"
          />
          <span className="font-display-md text-display-md tracking-tight text-primary">FindBack</span>
        </Link>
        <Link
          href="/chat"
          aria-label="Messages"
          className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-opacity hover:opacity-80"
        >
          <Icon name="forum" className="text-[24px]" />
        </Link>
        <Link
          href="/notifications"
          aria-label={`Notifications (${unreadCount} unread)`}
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-opacity hover:opacity-80"
        >
          <Icon name="notifications" className="text-[24px]" />
          {unreadCount > 0 && (
            <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[11px] font-bold text-on-error">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
