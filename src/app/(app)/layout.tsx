import Link from "next/link";
import { auth } from "@/lib/auth";
import { logout } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[#FBFAF7]">
      <header className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-4">
        <Link href="/dashboard" className="font-serif text-xl font-bold tracking-tight text-brand-dark">
          init
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <span className="text-black/50">{session?.user?.name}</span>
          <form action={logout}>
            <button type="submit" className="font-semibold text-black/60 hover:text-brand-dark">
              Sign out
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
