"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

const pillInput =
  "w-full rounded-full border border-secondary-fixed-dim bg-surface-bright px-6 py-3.5 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin ? { email, password } : { name, email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      router.push(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[440px] px-5 py-10">
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-2">
          <Icon name="manage_search" filled className="text-[32px] text-primary" />
          <span className="font-display-md text-display-md tracking-tight text-primary">FindBack</span>
        </div>
        <h1 className="mt-5 font-display-lg text-display-lg text-on-surface">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          {isLogin
            ? "Sign in to view your items and notifications."
            : "Join to report lost and found items and get matched."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-[24px] bg-surface-container-lowest p-6 shadow-soft"
        noValidate
      >
        {!isLogin && (
          <div>
            <label htmlFor="name" className="mb-1.5 block font-label-md text-label-md text-on-surface">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              required
              className={pillInput}
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block font-label-md text-label-md text-on-surface">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className={pillInput}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block font-label-md text-label-md text-on-surface">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isLogin ? "Your password" : "At least 8 characters"}
            required
            minLength={isLogin ? undefined : 8}
            className={pillInput}
          />
        </div>

        {error && (
          <p className="flex items-center gap-2 rounded-xl bg-error-container/50 px-4 py-3 text-sm text-on-error-container">
            <Icon name="error" className="text-[18px] shrink-0" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-label-md text-label-md text-on-primary shadow-md transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {busy && <Icon name="hourglass_top" className="animate-spin text-[18px]" />}
          {isLogin ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-on-surface-variant">
        {isLogin ? (
          <>
            New here?{" "}
            <Link href="/register" className="font-semibold text-primary hover:text-primary">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-primary">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
