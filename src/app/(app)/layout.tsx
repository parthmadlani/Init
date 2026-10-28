import { ActivityObserver } from "@/components/activity-observer";
import { trackingEnabled } from "@/lib/insights/events";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileMenu } from "@/components/profile-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppNavigation, SectionLabel } from "@/components/app-navigation";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Your learning", robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // Name/photo edits on /profile don't touch the JWT session, so the header
  // re-reads both fresh from the DB rather than showing stale sign-in-time
  // values until the next login.
  const freshUser = session?.user
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, imageUrl: true, role: true } })
    : null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-[#fffafb] text-brand-dark">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-4">Skip to main content</a>
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-52 flex-col border-r border-black/[0.07] bg-[#fff2f7] lg:flex">
          <Link href="/dashboard" aria-label="Init home" className="px-7 pb-12 pt-9"><Image src="/brand/logo.png" alt="Init" width={90} height={43} className="h-8 w-auto" priority /></Link>
          <p className="mb-3 px-7 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/55">Your workspace</p>
          <AppNavigation owner={freshUser?.role === "ADMIN"} />
          <div className="mt-auto p-6"><p className="font-serif text-lg">A little, every day.</p><p className="mt-2 text-xs leading-relaxed text-black/55">Make room for what you want to learn.</p><Link href="/help" className="mt-5 inline-block py-2 text-xs font-medium text-black/60 hover:text-brand-pink">How Init works ↗</Link></div>
        </aside>
        <div className="lg:pl-52">
          <header className="border-b border-black/[0.07] bg-[#fffafb]">
            <div className="flex h-20 items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
              <Link href="/dashboard" aria-label="Init home" className="lg:hidden"><Image src="/brand/logo.png" alt="Init" width={90} height={43} className="h-7 w-auto" priority /></Link>
              <div className="hidden lg:block"><SectionLabel /></div>
              <div className="flex items-center gap-3"><span className="hidden text-xs text-black/55 sm:block">{freshUser?.name ?? session.user.name}</span><ProfileMenu user={{ ...session.user, name: freshUser?.name ?? session.user.name, imageUrl: freshUser?.imageUrl }} onSignOut={logout} /></div>
            </div>
            <div className="lg:hidden"><AppNavigation owner={freshUser?.role === "ADMIN"} /></div>
          </header>
          <div id="main-content">{children}</div>
          {trackingEnabled() && <><ActivityObserver /><p className="px-6 py-5 text-xs text-black/60">Init records learning activity to improve lessons. <Link href="/activity-privacy" className="underline">What we collect</Link></p></>}
        </div>
      </div>
      <Toaster position="bottom-right" />
    </TooltipProvider>
  );
}
