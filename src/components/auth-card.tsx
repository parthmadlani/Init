import Link from "next/link";

export function AuthCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#fffafb] px-5 py-10">
      <Link href="/" className="text-xl font-bold tracking-tight text-brand-pink" aria-label="Init home">init</Link>
      <div className="w-full max-w-[420px] surface p-6 sm:p-8">
        <h1 className="mb-2 page-title">{title}</h1>
        <p className="mb-7 text-sm text-black/65">{description}</p>
        {children}
      </div>
    </main>
  );
}
