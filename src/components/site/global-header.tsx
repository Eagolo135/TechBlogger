import Link from "next/link";
import { HeaderAuthControls } from "@/components/site/header-auth-controls";
import { getSiteContent } from "@/lib/content";

export function GlobalHeader() {
  const content = getSiteContent();

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="panel mx-auto flex max-w-7xl items-center justify-between rounded-full px-4 py-3 sm:px-6">
        <Link href="/" className="min-w-0">
          <p className="eyebrow truncate text-[11px] text-[color:var(--muted)]">{content.site.name}</p>
          <p className="truncate text-sm font-medium">{content.site.tagline}</p>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-[color:var(--muted)] md:flex">
          <Link href="/latest" className="transition hover:text-foreground">
            Latest
          </Link>
          <Link href="/topics" className="transition hover:text-foreground">
            Topics
          </Link>
          <Link href="/community" className="transition hover:text-foreground">
            Community
          </Link>
          <Link href="/about" className="transition hover:text-foreground">
            About
          </Link>
        </nav>

        <HeaderAuthControls />
      </div>
    </header>
  );
}
