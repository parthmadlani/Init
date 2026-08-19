import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ProfileMenu } from "@/components/profile-menu";
import { logout } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[#FBFAF7]">
      <header className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-4">
        <Link href="/dashboard" aria-label="Init home">
          <Image src="/brand/logo.png" alt="Init" width={90} height={43} className="h-7 w-auto" priority />
        </Link>
        {session?.user && <ProfileMenu user={session.user} onSignOut={logout} />}
      </header>
      {children}
    </div>
  );
}
