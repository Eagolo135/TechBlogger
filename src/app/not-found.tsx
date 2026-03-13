import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="panel panel-strong max-w-xl rounded-[2rem] px-8 py-10 text-center">
        <p className="eyebrow text-xs text-[color:var(--muted)]">404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">That post does not exist.</h1>
        <p className="mt-4 text-base leading-8 text-[color:var(--muted)]">
          The route was not generated from the content source. Head back to the homepage to browse the
          latest articles.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" />
          Return home
        </Link>
      </div>
    </main>
  );
}