"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Sparkles } from "lucide-react";
import { StudioAiChat } from "@/components/site/studio-ai-chat";
import { Badge } from "@/components/ui/badge";
import { getCommunityPosts, getProfile, type CommunityPost } from "@/lib/community";

export default function StudioPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    const profile = getProfile();
    if (!profile) {
      router.replace("/signup");
      return;
    }

    setPosts(getCommunityPosts());
  }, [router]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <StudioAiChat onPublished={() => setPosts(getCommunityPosts())} />

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