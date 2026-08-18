"use client";

import { useActionState } from "react";
import { register } from "./actions";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";

export function RegisterForm() {
  const [error, formAction, pending] = useActionState(register, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-semibold text-brand-dark">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="rounded-control border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-brand-dark">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-control border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
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
          minLength={8}
          className="rounded-control border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
        />
        <p className="text-xs text-black/65">At least 8 characters.</p>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className={`mt-2 px-4 py-2.5 text-sm ${PRIMARY_CTA_CLASS}`}
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
