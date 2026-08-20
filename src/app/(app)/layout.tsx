import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileMenu } from "@/components/profile-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { logout } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // Name/photo edits on /profile don't touch the JWT session, so the header
  // re-reads both fresh from the DB rather than showing stale sign-in-time
  // values until the next login.
  const freshUser = session?.user
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, imageUrl: true } })
    : null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-[#FBFAF7]">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-black/10 bg-white px-6 py-4">
          <Link href="/dashboard" aria-label="Init home">
            <Image src="/brand/logo.png" alt="Init" width={90} height={43} className="h-7 w-auto" priority />
          </Link>
          {session?.user && (
            <ProfileMenu
              user={{ ...session.user, name: freshUser?.name ?? session.user.name, imageUrl: freshUser?.imageUrl }}
              onSignOut={logout}
            />
          )}
        </header>
        {children}
      </div>
      <Toaster position="bottom-right" />
    </TooltipProvider>
  );
}
