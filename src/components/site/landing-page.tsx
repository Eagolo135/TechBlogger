"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowRight,
  CirclePlus,
  Clock3,
  Cpu,
  Sparkles,
  UserRound,
} from "lucide-react";
import { PostCard } from "@/components/site/post-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCommunityPosts, getProfile, type CommunityPost } from "@/lib/community";
import type { SiteContent } from "@/lib/content";

type LandingPageProps = {
  content: SiteContent;
};

export function LandingPage({ content }: LandingPageProps) {
  const [activeFilter, setActiveFilter] = useState(content.feedFilters[0] ?? "All");
  const [profileName, setProfileName] = useState("");
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    const profile = getProfile();
    setProfileName(profile?.name ?? "");
    setCommunityPosts(getCommunityPosts());
  }, []);

  const featuredPost = content.posts.find((post) => post.featured) ?? content.posts[0];

  const latestSignals = useMemo(
    () =>
      [...content.posts]
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 6),
    [content.posts],
  );

  const filteredPosts = useMemo(() => {
    if (activeFilter === "All") {
      return latestSignals;
    }

    return latestSignals.filter((post) => post.category === activeFilter);
  }, [activeFilter, latestSignals]);

  return (
    <div className="relative overflow-hidden pb-12">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-35" />

      <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="panel mx-auto flex max-w-7xl items-center justify-between rounded-full px-4 py-3 sm:px-6">
          <div>
            <p className="eyebrow text-[11px] text-[color:var(--muted)]">{content.site.name}</p>
            <p className="text-sm font-medium">{content.site.tagline}</p>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-[color:var(--muted)] md:flex">
            <a href="#latest" className="transition hover:text-foreground">
              Latest
            </a>
            <a href="#community" className="transition hover:text-foreground">
              Community
            </a>
            <a href="#topics" className="transition hover:text-foreground">
              Topics
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {profileName ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/studio">Studio</Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href="/signup">Sign up</Link>
              </Button>
            )}
            <Button asChild size="sm">
              <a href="#latest">Read now</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="panel panel-strong hero-spotlight relative overflow-hidden rounded-[2.2rem] px-6 py-8 sm:px-10 lg:px-12 lg:py-12">
          <div className="absolute right-[-60px] top-[-60px] h-56 w-56 rounded-full bg-[rgba(37,99,235,0.18)] blur-3xl" />
          <div className="absolute bottom-[-80px] left-[-40px] h-64 w-64 rounded-full bg-[rgba(20,184,166,0.16)] blur-3xl" />
          <p className="eyebrow text-xs text-[color:var(--muted)]">Latest tech + AI dispatches</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.06em] [text-wrap:balance] sm:text-6xl lg:text-7xl">
            {content.site.hero.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[color:var(--muted)] sm:text-xl">
            {content.site.hero.summary}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href="#latest">
                Explore latest posts
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={profileName ? "/studio" : "/signup"}>
                {profileName ? "Publish in studio" : "Join and publish"}
                <CirclePlus className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {content.site.stats.map((stat) => (
              <div key={stat.label} className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/80 p-5">
                <p className="eyebrow text-[10px] text-[color:var(--muted)]">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{stat.value}</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{stat.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="latest" className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="panel rounded-[2rem] px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow text-xs text-[color:var(--muted)]">Latest coverage</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Fresh tech and AI analysis</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-[color:var(--muted)]">
                Curated posts focused on AI systems, platform engineering, developer tools, and delivery.
              </p>
            </div>

            <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mt-6">
              <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
                {content.feedFilters.map((filter) => (
                  <TabsTrigger key={filter} value={filter} className="rounded-full">
                    {filter}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {filteredPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="panel rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="eyebrow text-xs text-[color:var(--muted)]">Featured</p>
                <Badge>{featuredPost.category}</Badge>
              </div>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{featuredPost.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{featuredPost.excerpt}</p>
              <div className="mt-4 flex items-center gap-3 text-xs text-[color:var(--muted)]">
                <Clock3 className="h-3.5 w-3.5" />
                {featuredPost.readTime}
                <span>/</span>
                {format(new Date(featuredPost.publishedAt), "MMM d, yyyy")}
              </div>
              <Button asChild className="mt-5 w-full">
                <Link href={`/${featuredPost.slug}`}>
                  Read featured post
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div id="topics" className="panel rounded-[2rem] p-6">
              <div className="flex items-center gap-2 text-sm text-[color:var(--accent-cool)]">
                <Cpu className="h-4 w-4" />
                Coverage themes
              </div>
              <div className="mt-4 space-y-3">
                {content.featuredTopics.map((topic) => (
                  <article key={topic.slug} className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-base font-semibold">{topic.name}</h4>
                      <Badge variant="outline">{topic.metric}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{topic.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section id="community" className="panel rounded-[2rem] px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-xs text-[color:var(--muted)]">Community publishing</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Writers can sign up and publish from the studio</h2>
            </div>
            <Button asChild>
              <Link href={profileName ? "/studio" : "/signup"}>
                {profileName ? "Open studio" : "Sign up now"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {communityPosts.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-[color:var(--line)] bg-white/70 p-6 text-sm text-[color:var(--muted)] md:col-span-2 xl:col-span-3">
                No community posts yet. Sign up and publish your first post from the studio.
              </div>
            ) : (
              communityPosts.map((post) => (
                <article key={post.id} className="rounded-[1.75rem] border border-[color:var(--line)] bg-white/80 p-5">
                  <div className="flex items-center gap-2">
                    <Badge>{post.category}</Badge>
                    <span className="text-xs text-[color:var(--muted)]">{format(new Date(post.createdAt), "MMM d, yyyy")}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em]">{post.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{post.excerpt}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-[color:var(--muted)]">
                    <UserRound className="h-3.5 w-3.5" />
                    {post.authorName}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="panel panel-strong rounded-[2rem] px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-[color:var(--accent-ink)]">
                <Sparkles className="h-4 w-4" />
                Editorial quality loop
              </div>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{content.site.footer.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">{content.site.footer.summary}</p>
            </div>
            <Button asChild size="lg">
              <a href="#latest">
                Continue reading
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
