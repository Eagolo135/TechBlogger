"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCommunityPostById } from "@/lib/community";

function CommunityPostPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  const post = useMemo(() => (id ? getCommunityPostById(id) : null), [id]);

  if (!post) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="panel panel-strong w-full rounded-[2rem] p-8 text-center">
          <p className="eyebrow text-xs text-[color:var(--muted)]">Community post</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Post not found</h1>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
            This post may have been removed from local storage, or the link is invalid.
          </p>
          <Button asChild className="mt-5">
            <Link href="/community">
              <ArrowLeft className="h-4 w-4" />
              Back to community
            </Link>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" />
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="panel panel-strong relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10">
          <Link
            href="/community"
            className="eyebrow inline-flex items-center gap-2 text-xs text-[color:var(--muted)] transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to community
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Badge>{post.category}</Badge>
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.04em] [text-wrap:balance] sm:text-5xl lg:text-6xl">
            {post.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[color:var(--muted)] sm:text-xl">{post.deck || post.excerpt}</p>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-[color:var(--muted)]">
            <span>{post.authorName}</span>
            <span>{format(new Date(post.createdAt), "MMMM d, yyyy")}</span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              {post.readTime || "Community post"}
            </span>
          </div>
        </header>

        <article className="panel rounded-[2rem] px-6 py-8 sm:px-10">
          {post.keyTakeaways?.length ? (
            <section className="mb-8 rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-5">
              <h2 className="text-xl font-semibold tracking-[-0.03em]">Key takeaways</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {post.keyTakeaways.map((item) => (
                  <li key={item} className="rounded-xl border border-[color:var(--line)] bg-white/85 px-3 py-2 text-sm leading-7 text-[color:var(--muted)]">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {post.sections?.length ? (
            <div className="space-y-6">
              {post.sections.map((section) => (
                <section key={section.heading} className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-5">
                  <h3 className="text-2xl font-semibold tracking-[-0.03em]">{section.heading}</h3>
                  <p className="mt-3 text-base leading-8 text-[color:var(--muted)] sm:text-lg">{section.body}</p>
                  {section.bullets?.length ? (
                    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-[color:var(--muted)]">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          ) : (
            <div className="prose-copy space-y-4">
              {post.body.split("\n\n").map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 24)}`} className="text-base leading-8 text-[color:var(--muted)] sm:text-lg">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {post.visualIdeas?.length ? (
            <section className="mt-8 rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-5">
              <h2 className="text-xl font-semibold tracking-[-0.03em]">Suggested graphics</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {post.visualIdeas.map((idea) => (
                  <article key={`${idea.type}-${idea.title}`} className="rounded-xl border border-[color:var(--line)] bg-white/85 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--accent-cool)]">{idea.type}</p>
                    <h3 className="mt-1 text-base font-semibold">{idea.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{idea.description}</p>
                    {idea.dataHint ? <p className="mt-2 text-xs text-[color:var(--muted)]">Data hint: {idea.dataHint}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </article>
      </div>
    </main>
  );
}

export default function CommunityPostPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <section className="panel panel-strong w-full rounded-[2rem] p-8 text-center">
            <p className="text-sm text-[color:var(--muted)]">Loading post...</p>
          </section>
        </main>
      }
    >
      <CommunityPostPageContent />
    </Suspense>
  );
}
