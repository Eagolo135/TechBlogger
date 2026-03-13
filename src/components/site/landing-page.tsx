"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowRight,
  BookOpenText,
  Compass,
  Orbit,
  PanelTop,
  Play,
  Radar,
  Sparkles,
  Zap,
} from "lucide-react";
import { PostCard } from "@/components/site/post-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SiteContent } from "@/lib/content";

type LandingPageProps = {
  content: SiteContent;
};

const icons = [Orbit, Radar, Sparkles, Zap];

export function LandingPage({ content }: LandingPageProps) {
  const [activeFilter, setActiveFilter] = useState(content.feedFilters[0] ?? "All");

  const featuredPost = content.posts.find((post) => post.featured) ?? content.posts[0];
  const filteredPosts = useMemo(() => {
    if (activeFilter === "All") {
      return content.posts;
    }

    return content.posts.filter((post) => post.category === activeFilter);
  }, [activeFilter, content.posts]);

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
            {content.site.navigation.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
          <Button asChild size="sm">
            <a href={content.site.primaryAction.href}>{content.site.primaryAction.label}</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="panel panel-strong relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-8 lg:px-10">
            <div className="absolute -left-12 top-10 h-32 w-32 rounded-full bg-[rgba(239,123,69,0.18)] blur-3xl" />
            <div className="absolute right-0 top-0 h-48 w-48 bg-[radial-gradient(circle_at_center,rgba(15,118,110,0.22),transparent_70%)]" />
            <p className="eyebrow text-xs text-[color:var(--muted)]">{content.site.hero.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.06em] [text-wrap:balance] sm:text-6xl lg:text-7xl">
              {content.site.hero.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[color:var(--muted)] sm:text-xl">
              {content.site.hero.summary}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <a href={content.site.hero.primaryAction.href}>
                  {content.site.hero.primaryAction.label}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline">
                    <Play className="h-4 w-4" />
                    {content.site.hero.secondaryAction.label}
                  </Button>
                </DialogTrigger>
                <DialogContent className="panel border-[color:var(--line)] sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{content.workflow.title}</DialogTitle>
                    <DialogDescription>{content.workflow.summary}</DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 space-y-4">
                    {content.workflow.steps.map((step, index) => (
                      <div key={step.title} className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/75 p-5">
                        <p className="eyebrow text-[11px] text-[color:var(--muted)]">Step {index + 1}</p>
                        <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{step.description}</p>
                        <code className="mt-3 block rounded-xl bg-slate-950 px-4 py-3 font-mono text-xs text-slate-50">
                          {step.command}
                        </code>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {content.site.stats.map((stat) => (
                <div key={stat.label} className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/78 p-5">
                  <p className="eyebrow text-[11px] text-[color:var(--muted)]">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">{stat.value}</p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="panel rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow text-xs text-[color:var(--muted)]">Featured dispatch</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{featuredPost.title}</h2>
                </div>
                <Badge>{featuredPost.category}</Badge>
              </div>
              <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">{featuredPost.excerpt}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {featuredPost.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-[1.35rem] border border-[color:var(--line)] bg-white/75 p-4">
                    <p className="text-sm text-[color:var(--muted)]">{metric.label}</p>
                    <p className="mt-2 text-xl font-semibold">{metric.value}</p>
                  </div>
                ))}
              </div>
              <Button asChild className="mt-6 w-full">
                <Link href={`/${featuredPost.slug}`}>
                  Read the full post
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="panel relative overflow-hidden rounded-[2rem] p-6">
              <div className="absolute inset-y-0 right-0 w-24 bg-[radial-gradient(circle_at_center,rgba(239,123,69,0.12),transparent_70%)]" />
              <div className="flex items-center gap-3">
                <Compass className="h-5 w-5 text-[color:var(--accent-cool)]" />
                <p className="eyebrow text-xs text-[color:var(--muted)]">Signal radar</p>
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-[-0.05em]">{content.site.radar.title}</p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{content.site.radar.summary}</p>
              <div className="mt-6 space-y-3">
                {content.site.radar.items.map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-4 rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">{item.detail}</p>
                    </div>
                    <span className="text-sm font-semibold text-[color:var(--accent-ink)]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="panel overflow-hidden rounded-[2rem] py-4">
          <div className="marquee-track flex min-w-max gap-3 px-4">
            {[...content.site.marquee, ...content.site.marquee].map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-full border border-[color:var(--line)] bg-white/75 px-4 py-2 text-sm text-[color:var(--muted)]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section id="signals" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="panel rounded-[2rem] px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow text-xs text-[color:var(--muted)]">Latest signals</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Fresh analysis with no generated-page edits</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-[color:var(--muted)]">
                Every card below is rendered from the same YAML file that powers the article pages, stats,
                workflow, and FAQs.
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

          <div className="space-y-6">
            <div className="panel rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <PanelTop className="h-5 w-5 text-[color:var(--accent)]" />
                <p className="eyebrow text-xs text-[color:var(--muted)]">Publishing proof</p>
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{content.demo.title}</p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{content.demo.summary}</p>
              <div className="mt-5 space-y-3">
                {content.demo.steps.map((step, index) => (
                  <div key={step.title} className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/75 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{index + 1}. {step.title}</p>
                      <span className="eyebrow text-[10px] text-[color:var(--muted)]">{step.duration}</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <BookOpenText className="h-5 w-5 text-[color:var(--accent-cool)]" />
                <p className="eyebrow text-xs text-[color:var(--muted)]">Editorial cadence</p>
              </div>
              <div className="mt-5 space-y-4">
                {content.site.timeline.map((entry) => (
                  <div key={entry.phase} className="grid gap-1 rounded-[1.4rem] border border-[color:var(--line)] bg-white/75 px-4 py-4">
                    <p className="eyebrow text-[10px] text-[color:var(--muted)]">{entry.phase}</p>
                    <p className="text-lg font-semibold">{entry.title}</p>
                    <p className="text-sm leading-7 text-[color:var(--muted)]">{entry.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="topics" className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="panel rounded-[2rem] px-6 py-8 sm:px-8">
            <p className="eyebrow text-xs text-[color:var(--muted)]">Coverage map</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">A bento grid of themes the site tracks closely</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
              These topic cards are also content-driven, so you can expand the coverage map without touching the
              layout code.
            </p>
            <Separator className="my-6 bg-[color:var(--line)]" />
            <div className="space-y-4">
              {content.featuredTopics.map((topic, index) => {
                const Icon = icons[index % icons.length];

                return (
                  <div key={topic.slug} className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/75 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(15,118,110,0.12)] text-[color:var(--accent-cool)]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{topic.name}</p>
                          <p className="text-sm text-[color:var(--muted)]">{topic.metric}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{topic.slug}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{topic.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div id="workflow" className="panel rounded-[2rem] px-6 py-8 sm:px-8">
            <p className="eyebrow text-xs text-[color:var(--muted)]">Workflow FAQ</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Clear answers for setup, updates, and publishing</h2>
            <Accordion type="single" collapsible className="mt-6 space-y-3">
              {content.faq.map((item) => (
                <AccordionItem key={item.question} value={item.question} className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/75 px-5">
                  <AccordionTrigger className="text-left text-base font-medium">{item.question}</AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-7 text-[color:var(--muted)]">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="panel panel-strong rounded-[2rem] px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow text-xs text-[color:var(--muted)]">Ready to publish</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{content.site.footer.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">{content.site.footer.summary}</p>
              <p className="mt-4 text-sm text-[color:var(--muted)]">
                Last refreshed from source content on {format(new Date(content.site.lastUpdated), "MMMM d, yyyy")}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <a href={content.site.footer.primaryAction.href}>{content.site.footer.primaryAction.label}</a>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${featuredPost.slug}`}>
                  Open a featured article
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}