"use client";

import { useActionState, useState } from "react";
import { PasswordInput } from "@/components/password-input";
import { register } from "./actions";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
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
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
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
          autoComplete="new-password"
          aria-describedby="password-help"
          required
          minLength={8}
          className="rounded-control border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
        />
        <p id="password-help" className="text-xs text-black/65">At least 8 characters.</p>
      </div>

      {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}

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
