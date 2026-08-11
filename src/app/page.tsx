import Link from "next/link";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden">
      {/* Ambient decorative shapes */}
      <div className="pointer-events-none fixed -left-[10%] -top-[10%] z-0 h-[50%] w-[50%] rounded-full bg-primary-fixed opacity-20 blur-[100px] mix-blend-multiply" />
      <div className="pointer-events-none fixed -right-[10%] bottom-[20%] z-0 h-[40%] w-[40%] rounded-full bg-secondary-fixed opacity-20 blur-[100px] mix-blend-multiply" />

      {/* Top section: brand & intro */}
      <div className="relative z-10 mt-10 flex flex-col items-center px-5 text-center">
        <div className="flex items-center gap-2">
          <Icon name="manage_search" filled className="text-[32px] text-primary" />
          <h1 className="font-display-md text-display-md tracking-tight text-primary">FindBack</h1>
        </div>

        {/* Illustration area */}
        <div className="relative mb-4 mt-10 flex aspect-square w-full max-w-[280px] items-center justify-center rounded-full bg-surface-container shadow-[0_12px_24px_0_rgba(0,104,95,0.06)]">
          <div className="absolute inset-0 -z-10 rounded-full bg-primary-fixed opacity-30 blur-2xl" />
          <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary-container/15 to-secondary-container/30">
            <div className="relative">
              <Icon name="manage_search" className="text-[120px] text-primary" />
              <span className="absolute -right-4 -top-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container shadow-card">
                <Icon name="check_circle" filled className="text-[24px] text-secondary" />
              </span>
            </div>
          </div>
        </div>

        {/* Intro text */}
        <div className="mt-4 px-4">
          <h2 className="font-display-lg text-display-lg text-on-surface">Hello! Welcome to FindBack</h2>
          <p className="mx-auto max-w-[400px] font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
            Lost something or found something? Let&apos;s help connect it.
          </p>
        </div>
      </div>

      {/* Bottom panel: actions */}
      <div className="relative z-20 mt-12 w-full px-5 pb-32 pt-8">
        <div className="mx-auto flex w-full max-w-[600px] flex-col items-center space-y-6 rounded-3xl border border-surface-variant/50 bg-surface-container-lowest p-8 shadow-[0_-8px_32px_0_rgba(0,104,95,0.08)]">
          <h3 className="mb-2 w-full text-center font-headline-sm text-headline-sm text-on-surface">
            What brings you here?
          </h3>

          <div className="flex w-full flex-col gap-4">
            {/* Lost Something */}
            <Link
              href="/report/lost"
              className="group flex w-full items-center overflow-hidden rounded-full border border-error-container bg-error-container/30 p-4 pl-6 shadow-sm transition-all duration-300 hover:bg-error-container/50 hover:shadow-md active:scale-[0.98]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-error text-on-error">
                <Icon name="search_off" className="text-[24px]" />
              </span>
              <span className="flex-grow pl-4 text-left">
                <span className="block font-label-bold text-label-bold text-on-error-container">I Lost Something</span>
                <span className="block font-caption text-caption text-on-surface-variant">Help me find my item</span>
              </span>
              <span className="pr-4 text-error">
                <Icon name="arrow_forward" className="text-[24px] transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>

            {/* Found Something */}
            <Link
              href="/report/found"
              className="group flex w-full items-center overflow-hidden rounded-full border border-primary-container/20 bg-primary-container/10 p-4 pl-6 shadow-sm transition-all duration-300 hover:bg-primary-container/20 hover:shadow-md active:scale-[0.98]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                <Icon name="inventory_2" className="text-[24px]" />
              </span>
              <span className="flex-grow pl-4 text-left">
                <span className="block font-label-bold text-label-bold text-on-surface">I Found Something</span>
                <span className="block font-caption text-caption text-on-surface-variant">Report a found item</span>
              </span>
              <span className="pr-4 text-primary">
                <Icon name="arrow_forward" className="text-[24px] transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
