"use client";

import { useEffect, useRef, useState } from "react";

type User = { name?: string | null; email?: string | null; role: "STUDENT" | "ADMIN" };

function initialsFor(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function ProfileMenu({ user, onSignOut }: { user: User; onSignOut: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand-dark bg-brand-pink text-xs font-extrabold text-white transition hover:brightness-105"
        title={user.name ?? user.email ?? "Account"}
      >
        {initialsFor(user.name, user.email)}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-10 w-56 rounded-xl border border-black/10 bg-white p-1.5 shadow-lg">
          <div className="border-b border-black/10 px-3 py-2.5">
            <div className="truncate text-sm font-semibold text-brand-dark">{user.name}</div>
            <div className="truncate text-xs text-black/50">{user.email}</div>
            <div className="mt-1 inline-block rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black/50">
              {user.role.toLowerCase()}
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-black/70 transition hover:bg-black/5"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
