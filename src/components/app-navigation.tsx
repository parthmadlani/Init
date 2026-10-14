"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bookmark, Plus, Settings, BookOpen } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/bookmarks", label: "Saved lessons", icon: Bookmark },
  { href: "/wizard", label: "Build a path", icon: Plus },
  { href: "/profile", label: "Account", icon: Settings },
];

export function AppNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Main navigation" className="grid grid-cols-4 gap-1 px-3 pb-3 lg:flex lg:flex-col lg:px-4 lg:pb-0">
    {items.map(({ href, label, icon: Icon }) => {
      const active = pathname === href || (href === "/dashboard" && pathname.startsWith("/paths/"));
      return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-2 text-[10px] font-medium transition lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-0 lg:text-sm ${active ? "bg-brand-pink-light text-brand-pink" : "text-black/55 hover:bg-black/[0.035] hover:text-brand-dark"}`}><Icon size={17} strokeWidth={1.7} aria-hidden="true" /><span className="whitespace-nowrap">{label}</span></Link>;
    })}
  </nav>;
}

export function SectionLabel() {
  const pathname = usePathname();
  const label = pathname.startsWith("/paths/") ? "Your learning path" : items.find(item => pathname === item.href)?.label ?? "Your workspace";
  return <div className="flex items-center gap-2 text-xs text-black/55"><BookOpen size={15} strokeWidth={1.6} aria-hidden="true" />{label}</div>;
}
