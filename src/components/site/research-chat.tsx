"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, LoaderCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type ResearchResponse = {
  topic: string;
  brief?: string;
  postDraft?: string;
  sources?: Array<{ title: string; url: string }>;
  error?: string;
};

const RESEARCH_API_URL = process.env.NEXT_PUBLIC_RESEARCH_API_URL || "http://localhost:8787/generate";

export function ResearchChat() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<ResearchResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

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
          <pre className="mt-3 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 font-sans text-sm leading-7 text-slate-900">
            {result.postDraft || "No draft generated."}
          </pre>

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
