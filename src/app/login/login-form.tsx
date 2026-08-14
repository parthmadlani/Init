"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";

export function LoginForm() {
  const [error, formAction, pending] = useActionState(authenticate, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-brand-dark">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-lg border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-brand-dark">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="rounded-lg border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
        />
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg border-2 border-brand-dark bg-brand-pink px-4 py-2.5 text-sm font-extrabold text-white shadow-[3px_3px_0_#111827] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#111827] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
