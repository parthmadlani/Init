import Link from "next/link";

export function BackToHomeLink() {
  return (
    <Link
      href="/dashboard"
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-black/55 transition hover:text-brand-dark"
    >
      <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12.5 4.5 7 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back to home
    </Link>
  );
}
