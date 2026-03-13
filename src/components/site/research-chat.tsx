"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, LoaderCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfile, saveCommunityPost } from "@/lib/community";

type ResearchResponse = {
  topic: string;
  brief?: string;
  postDraft?: string;
  post?: {
    title: string;
    deck?: string;
    excerpt?: string;
    readTime?: string;
    category?: string;
    tags?: string[];
    keyTakeaways?: string[];
    sections?: Array<{
      heading: string;
      body: string;
      bullets?: string[];
    }>;
    visualIdeas?: Array<{
      type: string;
      title: string;
      description: string;
      dataHint?: string;
    }>;
    postMarkdown?: string;
    sources?: Array<{ title: string; url: string }>;
  };
  sources?: Array<{ title: string; url: string }>;
  error?: string;
};

const RESEARCH_API_URL = process.env.NEXT_PUBLIC_RESEARCH_API_URL || "http://localhost:8787/generate";

export function ResearchChat() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<ResearchResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [publishMessage, setPublishMessage] = useState("");

  const sourceCount = useMemo(() => result?.sources?.length ?? 0, [result?.sources]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    const nextTopic = topic.trim();
    if (!nextTopic) {
      setError("Enter a topic to research.");
      return;
    }

    setPending(true);
    setPublishMessage("");
    try {
      const response = await fetch(RESEARCH_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: nextTopic }),
      });

      const data = (await response.json()) as ResearchResponse;

      if (!response.ok || data.error) {
        throw new Error(data.error || "Research request failed.");
      }

      setResult(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Research service is unavailable. Start the MCP research API and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  function buildPostFromDraft(data: ResearchResponse) {
    if (data.post) {
      return {
        title: data.post.title || `AI Draft: ${data.topic}`,
        deck: data.post.deck || "",
        body: data.post.postMarkdown || data.postDraft || "",
        excerpt: data.post.excerpt || `AI-generated draft about ${data.topic}`,
        tags: data.post.tags?.length ? data.post.tags : ["ai", "generated", "research"],
        category: data.post.category || "AI Systems",
        readTime: data.post.readTime || "8 min read",
        keyTakeaways: data.post.keyTakeaways || [],
        sections: data.post.sections || [],
        visualIdeas: data.post.visualIdeas || [],
        sources: data.post.sources || data.sources || [],
      };
    }

    const draft = (data.postDraft || "").trim();
    const lines = draft.split("\n").map((line) => line.trim());
    const heading = lines.find((line) => /^#\s+/.test(line)) || "";
    const title = heading ? heading.replace(/^#\s+/, "") : `AI Draft: ${data.topic}`;

    const cleanedBody = draft.replace(/^#\s+.*$/m, "").trim() || draft;
    const firstParagraph = cleanedBody.split("\n\n").find((part) => part.trim().length > 40) || cleanedBody;

    const excerpt = firstParagraph
      .replace(/\s+/g, " ")
      .replace(/^[\-#*\d.\s]+/, "")
      .trim()
      .slice(0, 220);

    const tags = ["ai", "generated", "research"];
    return {
      title,
      deck: "",
      body: draft,
      excerpt,
      tags,
      category: "AI Systems",
      readTime: "8 min read",
      keyTakeaways: [],
      sections: [],
      visualIdeas: [],
      sources: data.sources || [],
    };
  }

  function publishDraft() {
    if (!result?.postDraft) {
      setPublishMessage("Generate a draft first.");
      return;
    }

    const profile = getProfile();
    const authorName = profile?.name || "AI Desk";
    const parsed = buildPostFromDraft(result);

    const created = saveCommunityPost({
      title: parsed.title,
      deck: parsed.deck,
      excerpt: parsed.excerpt || `AI-generated draft about ${result.topic}`,
      body: parsed.body,
      category: parsed.category,
      tags: parsed.tags,
      authorName,
      readTime: parsed.readTime,
      keyTakeaways: parsed.keyTakeaways,
      sections: parsed.sections,
      visualIdeas: parsed.visualIdeas,
      sources: parsed.sources,
    });

    if (!created) {
      setPublishMessage("Unable to publish post right now.");
      return;
    }

    const postUrl = `community-post?id=${encodeURIComponent(created.id)}`;
    const absolutePostUrl = new URL(postUrl, window.location.href).toString();
    window.open(absolutePostUrl, "_blank", "noopener,noreferrer");
    setPublishMessage("Published. Opened post in a new tab.");
  }

  return (
    <section className="panel rounded-[2rem] p-6 sm:p-8">
      <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--accent-ink)]">
        <Bot className="h-4 w-4" />
        AI blog creation chat
      </div>
      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Request a new blog post and generate a full draft</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
        Describe a topic in one sentence or a full brief. The assistant searches the web, then writes an in-depth draft with sources.
      </p>

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="research-topic">
          Blog topic
        </label>
        <input
          id="research-topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="Example: latest AI coding agents for startup teams"
          className="h-11 w-full rounded-full border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none ring-slate-900/20 focus:ring-2"
        />
        <Button type="submit" size="default" className="min-w-[180px]">
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {pending ? "Researching..." : "Create blog post"}
        </Button>
      </form>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {result ? (
        <article className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white/85 p-5">
          <p className="text-sm text-[color:var(--muted)]">
            Topic: <span className="font-semibold text-foreground">{result.topic}</span>
          </p>
          {result.brief ? <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{result.brief}</p> : null}

          <h3 className="mt-5 text-xl font-semibold">Draft post</h3>
          {result.post ? (
            <div className="mt-3 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Headline</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{result.post.title}</p>
                {result.post.deck ? <p className="mt-2 text-sm leading-7 text-slate-700">{result.post.deck}</p> : null}
              </div>

              {result.post.keyTakeaways?.length ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Key takeaways</p>
                  <ul className="mt-2 grid gap-2 text-sm text-slate-800">
                    {result.post.keyTakeaways.map((item) => (
                      <li key={item} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result.post.sections?.length ? (
                <div className="space-y-3">
                  {result.post.sections.map((section) => (
                    <article key={section.heading} className="rounded-xl border border-slate-200 bg-white p-3">
                      <h4 className="text-base font-semibold text-slate-900">{section.heading}</h4>
                      <p className="mt-2 text-sm leading-7 text-slate-700">{section.body}</p>
                      {section.bullets?.length ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                          {section.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : null}

              {result.post.visualIdeas?.length ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Graphics ideas</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {result.post.visualIdeas.map((idea) => (
                      <article key={`${idea.type}-${idea.title}`} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--accent-cool)]">{idea.type}</p>
                        <h5 className="mt-1 text-sm font-semibold text-slate-900">{idea.title}</h5>
                        <p className="mt-1 text-xs leading-6 text-slate-700">{idea.description}</p>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <pre className="mt-3 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 font-sans text-sm leading-7 text-slate-900">
              {result.postDraft || "No draft generated."}
            </pre>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" onClick={publishDraft}>
              Publish to site
            </Button>
            {publishMessage ? <p className="text-sm text-[color:var(--accent-cool)]">{publishMessage}</p> : null}
          </div>

          {sourceCount > 0 ? (
            <div className="mt-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">Sources</h4>
              <ul className="mt-3 grid gap-2 text-sm text-slate-900">
                {result.sources?.map((source) => (
                  <li key={source.url}>
                    <a className="underline decoration-slate-300 underline-offset-4" href={source.url} target="_blank" rel="noreferrer">
                      {source.title || source.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}
