"use client";

import Link from "next/link";
import { useMemo } from "react";
import { format } from "date-fns";
import { ArrowRight, Clock3 } from "lucide-react";

import { PostCard } from "@/components/site/post-card";
import { ResearchChat } from "@/components/site/research-chat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SiteContent } from "@/lib/content";

type LandingPageProps = {
  content: SiteContent;
};

export function LandingPage({ content }: LandingPageProps) {
  const featuredPost = content.posts.find((post) => post.featured) ?? content.posts[0];

  const sortedPosts = useMemo(
    () =>
      [...content.posts].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      ),
    [content.posts],
  );

  const latestPosts = sortedPosts.slice(0, 8);

  return (
    <div className="relative overflow-hidden pb-12">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-35" />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="panel panel-strong hero-spotlight relative overflow-hidden rounded-[2.2rem] px-6 py-8 sm:px-10 lg:px-12 lg:py-12">
          <div className="absolute right-[-60px] top-[-60px] h-56 w-56 rounded-full bg-[rgba(37,99,235,0.18)] blur-3xl" />
          <div className="absolute bottom-[-80px] left-[-40px] h-64 w-64 rounded-full bg-[rgba(20,184,166,0.16)] blur-3xl" />
          <div className="min-w-0">
              <p className="eyebrow text-xs text-[color:var(--muted)]">Featured magazine</p>
              <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.06em] [text-wrap:balance] sm:text-6xl lg:text-7xl">
                {content.site.hero.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[color:var(--muted)] sm:text-xl">
                {content.site.hero.summary}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={`/${featuredPost.slug}`}>
                    Read featured story
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/latest">Browse all articles</Link>
                </Button>
              </div>
            </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="panel rounded-[2rem] p-6 sm:p-8">
            <p className="eyebrow text-xs text-[color:var(--muted)]">Feature article</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-0.04em] [text-wrap:balance] sm:text-5xl">
              {featuredPost.title}
            </h2>
            <p className="mt-4 text-base leading-8 text-[color:var(--muted)]">{featuredPost.excerpt}</p>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-[color:var(--muted)]">
              <Badge>{featuredPost.category}</Badge>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5" />
                {featuredPost.readTime}
              </span>
              <span>{format(new Date(featuredPost.publishedAt), "MMM d, yyyy")}</span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {featuredPost.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>

            <Button asChild className="mt-6">
              <Link href={`/${featuredPost.slug}`}>
                Open article
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <aside className="panel rounded-[2rem] p-6">
            <p className="eyebrow text-xs text-[color:var(--muted)]">Editor picks</p>
            <div className="mt-4 space-y-3">
              {sortedPosts
                .filter((post) => post.slug !== featuredPost.slug)
                .slice(0, 4)
                .map((post) => (
                  <Link
                    key={post.slug}
                    href={`/${post.slug}`}
                    className="block rounded-2xl border border-[color:var(--line)] bg-white/80 p-4 transition hover:border-slate-400"
                  >
                    <p className="text-xs font-medium text-[color:var(--accent-cool)]">{post.category}</p>
                    <h3 className="mt-1 text-lg font-semibold leading-7">{post.title}</h3>
                    <p className="mt-2 text-xs text-[color:var(--muted)]">{format(new Date(post.publishedAt), "MMM d, yyyy")}</p>
                  </Link>
                ))}
            </div>
          </aside>
        </section>

        <ResearchChat />

        <section className="panel rounded-[2rem] px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-xs text-[color:var(--muted)]">Latest articles</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Fresh tech and AI stories</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/latest">View archive</Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {latestPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
