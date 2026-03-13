import Link from "next/link";
import { ArrowLeft, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSiteContent } from "@/lib/content";

export default function TopicsPage() {
  const content = getSiteContent();

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow text-xs text-[color:var(--muted)]">Topics</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Coverage themes and signals
            </h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back home
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {content.featuredTopics.map((topic) => (
            <article key={topic.slug} className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-[color:var(--accent-cool)]">
                  <Cpu className="h-4 w-4" />
                  Theme
                </div>
                <Badge variant="outline">{topic.metric}</Badge>
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{topic.name}</h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{topic.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
