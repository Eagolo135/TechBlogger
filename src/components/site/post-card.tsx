import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Post } from "@/lib/content";

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <Card className="group relative overflow-hidden rounded-[1.75rem] border border-[color:var(--line)] bg-white/85 shadow-none transition duration-200 hover:-translate-y-1">
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[rgba(37,99,235,0.15)] blur-2xl" />
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>{post.category}</Badge>
          <span className="text-xs text-[color:var(--muted)]">{format(new Date(post.publishedAt), "MMM d, yyyy")}</span>
          <span className="inline-flex items-center gap-2 text-xs text-[color:var(--muted)]">
            <Clock3 className="h-3.5 w-3.5" />
            {post.readTime}
          </span>
        </div>
        <Link href={`/${post.slug}`} className="mt-4 block">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-2xl font-semibold tracking-[-0.04em] transition group-hover:text-[color:var(--accent)]">
              {post.title}
            </h3>
            <ArrowUpRight className="mt-1 h-5 w-5 text-[color:var(--muted)] transition group-hover:text-foreground" />
          </div>
        </Link>
        <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{post.excerpt}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}