"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/browse", label: "Browse", icon: "explore" },
  { href: "/history", label: "History", icon: "history" },
  { href: "/notifications", label: "Alerts", icon: "notifications" },
] as const;

export function BottomNavClient() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex w-full max-w-[600px] items-center justify-around bg-surface-container px-3 pb-3 pt-2 shadow-[0_-4px_20px_0_rgba(0,106,97,0.08)]"
      style={{ borderRadius: "1rem 1rem 0 0" }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 rounded-full px-5 py-1.5 transition-colors",
              active
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant hover:bg-surface-variant",
            )}
          >
            <Icon name={item.icon} filled={active} className="text-[24px]" />
            <span className="text-[10px] font-semibold leading-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
