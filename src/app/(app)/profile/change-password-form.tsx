"use client";

import { useActionState, useEffect, useRef } from "react";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";
import { changePassword } from "./actions";

const initialState: { error?: string; ok?: boolean } = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="currentPassword" className="text-sm font-semibold text-brand-dark">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          className="rounded-control border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="newPassword" className="text-sm font-semibold text-brand-dark">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="rounded-control border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
        />
        <p className="text-xs text-black/65">At least 8 characters.</p>
      </div>

      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm font-medium text-brand-cyan">Password updated.</p>}

      <button type="submit" disabled={pending} className={`self-start px-4 py-2.5 text-sm ${PRIMARY_CTA_CLASS}`}>
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
