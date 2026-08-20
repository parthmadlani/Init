"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";
import { updateName } from "./actions";

export function EditNameForm({ name }: { name: string }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await updateName({}, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setEditing(false);
        router.refresh();
      }
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs font-semibold text-black/45 underline-offset-2 hover:text-brand-cyan hover:underline"
      >
        Edit name
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-2">
      <input
        ref={inputRef}
        name="name"
        type="text"
        defaultValue={name}
        required
        maxLength={120}
        autoFocus
        className="w-full rounded-control border border-black/15 px-3 py-1.5 text-center text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
      />
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={isPending} className={`px-3 py-1.5 text-xs ${PRIMARY_CTA_CLASS}`}>
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs font-semibold text-black/55 hover:text-black/80"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
