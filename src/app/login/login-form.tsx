"use client";

import { useActionState, useState } from "react";
import { PasswordInput } from "@/components/password-input";
import { authenticate } from "./actions";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";

export function LoginForm({ returnTo = "/dashboard" }: { returnTo?: string }) {
  const [email, setEmail] = useState("");
  const [error, formAction, pending] = useActionState(authenticate, undefined);

  return (
    <form action={formAction} aria-busy={pending} className="flex flex-col gap-4">
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-brand-dark">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-describedby={error ? "login-error" : undefined}
          required
          className="rounded-control border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-brand-dark">
          Password
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          aria-describedby={error ? "login-error" : undefined}
          required
          className="rounded-control border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
        />
      </div>

      {error && <p id="login-error" role="alert" className="text-sm font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className={`mt-2 px-4 py-2.5 text-sm ${PRIMARY_CTA_CLASS}`}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
