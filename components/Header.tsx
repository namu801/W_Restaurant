import { Bookmark } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line/70 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-between px-5 py-4">
        <Link href="/" className="text-base font-semibold tracking-tight text-ink">
          청첩자리
        </Link>
        <Link
          href="/bookmarks"
          className="flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
        >
          <Bookmark className="h-4 w-4" />
          북마크함
        </Link>
      </div>
    </header>
  );
}
