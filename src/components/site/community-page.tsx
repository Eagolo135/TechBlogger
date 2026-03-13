"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCommunityPosts, getProfile, type CommunityPost } from "@/lib/community";

export function CommunityPage() {
  const [profileName, setProfileName] = useState("");
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    const profile = getProfile();
    setProfileName(profile?.name ?? "");
    setCommunityPosts(getCommunityPosts());
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow text-xs text-[color:var(--muted)]">Community</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Community posts from contributors
            </h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back home
              </Link>
            </Button>
            <Button asChild>
              <Link href={profileName ? "/studio" : "/signup"}>
                {profileName ? "Open studio" : "Sign up"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {communityPosts.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-[color:var(--line)] bg-white/70 p-6 text-sm text-[color:var(--muted)] md:col-span-2 xl:col-span-3">
              No community posts yet. Sign up and publish your first post from the studio.
            </div>
          ) : (
            communityPosts.map((post) => (
              <article key={post.id} className="rounded-[1.75rem] border border-[color:var(--line)] bg-white/80 p-5">
                <div className="flex items-center gap-2">
                  <Badge>{post.category}</Badge>
                  <span className="text-xs text-[color:var(--muted)]">
                    {format(new Date(post.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em]">{post.title}</h2>
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
    </main>
  );
}
