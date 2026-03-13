"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCommunityPosts, getProfile, saveCommunityPost, type CommunityPost } from "@/lib/community";

export default function StudioPage() {
  const router = useRouter();
  const [profileName, setProfileName] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("AI Systems");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("ai, engineering");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const profile = getProfile();
    if (!profile) {
      router.replace("/signup");
      return;
    }

    setProfileName(profile.name);
    setPosts(getCommunityPosts());
  }, [router]);

  function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!title.trim() || !excerpt.trim() || !body.trim()) {
      setMessage("Title, excerpt, and body are required.");
      return;
    }

    saveCommunityPost({
      title: title.trim(),
      excerpt: excerpt.trim(),
      body: body.trim(),
      category: category.trim() || "AI Systems",
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      authorName: profileName,
    });

    setTitle("");
    setExcerpt("");
    setBody("");
    setTags("ai, engineering");
    setPosts(getCommunityPosts());
    setMessage("Post published to your local community feed.");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel panel-strong rounded-[2rem] p-8">
          <p className="eyebrow text-xs text-[color:var(--muted)]">Creator studio</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Publish your own tech and AI post</h1>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
            Signed in as <span className="font-semibold text-foreground">{profileName || "..."}</span>
          </p>

          <form onSubmit={submitPost} className="mt-6 grid gap-4">
            <label className="text-sm font-medium">
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3 outline-none ring-[color:var(--accent)] transition focus:ring-2"
                placeholder="How I reduced inference cost by 42%"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Category
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3 outline-none ring-[color:var(--accent)] transition focus:ring-2"
                  placeholder="AI Systems"
                />
              </label>
              <label className="text-sm font-medium">
                Tags (comma-separated)
                <input
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3 outline-none ring-[color:var(--accent)] transition focus:ring-2"
                  placeholder="ai, llm, ops"
                />
              </label>
            </div>

            <label className="text-sm font-medium">
              Excerpt
              <textarea
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3 outline-none ring-[color:var(--accent)] transition focus:ring-2"
                placeholder="A short summary that appears in the community feed"
              />
            </label>

            <label className="text-sm font-medium">
              Post body
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={8}
                className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3 outline-none ring-[color:var(--accent)] transition focus:ring-2"
                placeholder="Write your post..."
              />
            </label>

            {message ? <p className="text-sm text-[color:var(--accent-cool)]">{message}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" size="lg">
                Publish post
                <Send className="h-4 w-4" />
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  Back to blog
                </Link>
              </Button>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="panel rounded-[2rem] p-6">
            <div className="flex items-center gap-2 text-sm text-[color:var(--accent-ink)]">
              <Sparkles className="h-4 w-4" />
              Your community posts
            </div>
            <div className="mt-4 space-y-3">
              {posts.length === 0 ? (
                <p className="text-sm text-[color:var(--muted)]">No posts yet. Publish your first one.</p>
              ) : (
                posts.map((post) => (
                  <article key={post.id} className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{post.category}</Badge>
                      <span className="text-xs text-[color:var(--muted)]">
                        {format(new Date(post.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <Link href={`/community-post?id=${encodeURIComponent(post.id)}`} className="mt-2 block text-lg font-semibold transition hover:text-[color:var(--accent)]">
                      {post.title}
                    </Link>
                    <p className="mt-1 text-sm leading-7 text-[color:var(--muted)]">{post.excerpt}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}