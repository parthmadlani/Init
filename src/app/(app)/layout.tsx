import Link from "next/link";
import { auth } from "@/lib/auth";
import { ProfileMenu } from "@/components/profile-menu";
import { logout } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[#FBFAF7]">
      <header className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-4">
        <Link href="/dashboard" className="font-serif text-xl font-bold tracking-tight text-brand-dark">
          init
        </Link>
        {session?.user && <ProfileMenu user={session.user} onSignOut={logout} />}
      </header>
      {children}
    </div>
  );
}
