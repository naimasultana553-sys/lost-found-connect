"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

export function BackHeader({ title }: { title: string }) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 w-full bg-surface shadow-sm">
      <div className="mx-auto flex w-full max-w-[600px] items-center justify-between px-5 py-3.5">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-variant"
        >
          <Icon name="arrow_back" />
        </button>
        <div className="font-display-md text-display-md tracking-tight text-primary">
          {title}
        </div>
        <div className="w-10" aria-hidden />
      </div>
    </header>
  );
}
