"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initialsFor } from "@/lib/initials";

type User = { name?: string | null; email?: string | null; role: "STUDENT" | "ADMIN"; imageUrl?: string | null };

export function ProfileMenu({ user, onSignOut }: { user: User; onSignOut: () => void | Promise<void> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-brand-dark bg-brand-pink text-xs font-extrabold text-white transition hover:brightness-105"
          title={user.name ?? user.email ?? "Account"}
        >
          {user.imageUrl ? (
            <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initialsFor(user.name, user.email)
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-card border border-black/10 bg-white p-1.5 shadow-lg">
        <div className="px-3 py-2.5">
          <div className="truncate text-sm font-semibold text-brand-dark">{user.name}</div>
          <div className="truncate text-xs text-black/65">{user.email}</div>
          <div className="mt-1 inline-block rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black/65">
            {user.role.toLowerCase()}
          </div>
        </div>
        <DropdownMenuSeparator className="bg-black/10" />
        <DropdownMenuItem asChild className="cursor-pointer rounded-control px-3 py-2 text-sm font-semibold text-black/70 focus:bg-black/5 focus:text-black/70">
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer rounded-control px-3 py-2 text-sm font-semibold text-black/70 focus:bg-black/5 focus:text-black/70">
          <Link href="/bookmarks">Bookmarks</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSignOut()}
          className="mt-1 w-full cursor-pointer rounded-control px-3 py-2 text-sm font-semibold text-black/70 focus:bg-black/5 focus:text-black/70"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
