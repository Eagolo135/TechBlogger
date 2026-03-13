import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Clock3, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPostBySlug, getSiteContent } from "@/lib/content";

type PostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  const content = getSiteContent();

  return content.posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post not found | TechBlogger",
    };
  }

  return {
    title: `${post.title} | TechBlogger`,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const content = getSiteContent();
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = content.posts.filter(
    (entry) => entry.slug !== post.slug && entry.category === post.category,
  );

  return (
    <main className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" />
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="panel panel-strong relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(15,118,110,0.14),transparent_70%)]" />
          <Link
            href="/"
            className="eyebrow inline-flex items-center gap-2 text-xs text-[color:var(--muted)] transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to the signal desk
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Badge variant="secondary">{post.category}</Badge>
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.04em] [text-wrap:balance] sm:text-5xl lg:text-6xl">
            {post.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[color:var(--muted)] sm:text-xl">
            {post.deck}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-[color:var(--muted)]">
            <span>{post.author.name}</span>
            <span>{post.author.role}</span>
            <span>{format(new Date(post.publishedAt), "MMMM d, yyyy")}</span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              {post.readTime}
            </span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="panel rounded-[2rem] px-6 py-8 sm:px-10">
            <p className="text-lg leading-8 text-[color:var(--muted)]">{post.excerpt}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {post.metrics.map((metric) => (
                <Card key={metric.label} className="rounded-[1.5rem] border-0 bg-white/60 shadow-none">
                  <CardContent className="p-5">
                    <p className="eyebrow text-[11px] text-[color:var(--muted)]">{metric.label}</p>
                    <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-10 rounded-[1.75rem] border border-[color:var(--line)] bg-white/70 p-6">
              <div className="flex items-center gap-3 text-sm font-medium text-[color:var(--accent-ink)]">
                <Sparkles className="h-4 w-4" />
                Key takeaways
              </div>
              <ul className="mt-4 grid gap-3 text-sm leading-7 text-[color:var(--muted)] sm:grid-cols-2">
                {post.keyTakeaways.map((takeaway) => (
                  <li key={takeaway} className="rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3">
                    {takeaway}
                  </li>
                ))}
              </ul>
            </div>

            <div className="prose-copy mt-10 space-y-8">
              {post.sections.map((section) => (
                <section key={section.heading} className="space-y-4 rounded-[1.75rem] border border-[color:var(--line)] bg-white/70 p-6">
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">{section.heading}</h2>
                  {section.callout ? (
                    <div className="rounded-2xl border border-[color:var(--line)] bg-[rgba(239,123,69,0.08)] px-4 py-3 text-sm leading-7 text-[color:var(--accent-ink)]">
                      {section.callout}
                    </div>
                  ) : null}
                  {section.body.split("\n\n").map((paragraph) => (
                    <p key={paragraph} className="text-base leading-8 text-[color:var(--muted)] sm:text-lg">
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets?.length ? (
                    <ul className="grid gap-3 text-sm leading-7 text-[color:var(--muted)] sm:grid-cols-2">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </article>

          <aside className="space-y-6">
            <Card className="panel rounded-[2rem] border-0 shadow-none">
              <CardContent className="p-6">
                <p className="eyebrow text-xs text-[color:var(--muted)]">About the author</p>
                <h2 className="mt-3 text-2xl font-semibold">{post.author.name}</h2>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{post.author.bio}</p>
              </CardContent>
            </Card>
            <Card className="panel rounded-[2rem] border-0 shadow-none">
              <CardContent className="p-6">
                <p className="eyebrow text-xs text-[color:var(--muted)]">Continue reading</p>
                <div className="mt-4 space-y-4">
                  {relatedPosts.map((entry) => (
                    <Link
                      key={entry.slug}
                      href={`/${entry.slug}`}
                      className="block rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-4 transition hover:-translate-y-0.5"
                    >
                      <p className="text-sm font-medium text-[color:var(--accent-cool)]">{entry.category}</p>
                      <h3 className="mt-2 text-lg font-semibold">{entry.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{entry.excerpt}</p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="panel rounded-[2rem] border-0 shadow-none">
              <CardContent className="p-6">
                <p className="eyebrow text-xs text-[color:var(--muted)]">Publishing loop</p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                  Every page on this site is generated from one YAML file. Update content, run the build,
                  and publish without touching generated HTML.
                </p>
                <Button asChild className="mt-4 w-full">
                  <Link href="/">
                    Review the workflow
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}