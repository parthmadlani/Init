import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserResourceBookmarks } from "@/lib/services/bookmark-service";
import { BookmarkRow } from "./bookmark-row";

export default async function BookmarksPage() {
  const session = await auth();
  const userId = session!.user.id;

  const bookmarks = await getUserResourceBookmarks(userId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-serif text-display font-bold text-brand-dark">Bookmarks</h1>
      <p className="mt-1 text-sm text-black/65">Videos you saved to come back to later.</p>

      <div className="mt-8 flex flex-col gap-3">
        {bookmarks.length > 0 ? (
          bookmarks.map((b) => <BookmarkRow key={b.bookmarkId} {...b} />)
        ) : (
          <div className="rounded-card border border-dashed border-black/15 p-4 text-sm text-black/65">
            No bookmarks yet. Tap the bookmark icon next to any video on a{" "}
            <Link href="/dashboard" className="font-semibold text-brand-pink hover:underline">
              learning path
            </Link>{" "}
            to save it here.
          </div>
        )}
      </div>
    </main>
  );
}
