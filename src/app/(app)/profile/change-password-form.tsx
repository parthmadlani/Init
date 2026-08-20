"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";
import { changePassword } from "./actions";

export function ChangePasswordForm() {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await changePassword({}, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setEditing(false);
        toast("Password updated");
      }
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-control border border-black/15 px-4 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-black/5"
      >
        Update password
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="currentPassword" className="text-sm font-semibold text-brand-dark">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoFocus
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

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className={`px-4 py-2.5 text-sm ${PRIMARY_CTA_CLASS}`}>
          {isPending ? "Updating…" : "Save password"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-sm font-semibold text-black/55 hover:text-black/80"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
