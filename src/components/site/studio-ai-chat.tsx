"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, LoaderCircle, Mic, Send, Sparkles, Square, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfile, saveCommunityPost } from "@/lib/community";

const RESEARCH_API_URL = process.env.NEXT_PUBLIC_RESEARCH_API_URL || "http://localhost:8787/generate";
const SITE_CHANGE_API_URL = RESEARCH_API_URL.replace(/\/generate\/?$/i, "/site-change");
const TRANSCRIBE_API_URL = RESEARCH_API_URL.replace(/\/generate\/?$/i, "/transcribe");

type StructuredPost = {
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

type ResearchResponse = {
  topic: string;
  brief?: string;
  postDraft?: string;
  post?: StructuredPost;
  sources?: Array<{ title: string; url: string }>;
  error?: string;
};

type SiteChangeResponse = {
  request: string;
  mode: string;
  summary?: string;
  count?: number;
  applied?: Array<{
    action: string;
    path: string;
    newPath?: string;
    status: string;
  }>;
  commit?: {
    committed: boolean;
    sha?: string;
    message?: string;
    error?: string;
  };
  error?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  publishedPostId?: string;
};

type StudioAiChatProps = {
  onPublished: () => void;
};

type TranscribeResponse = {
  transcript?: string;
  error?: string;
};

function normalizeDraft(data: ResearchResponse) {
  if (data.post) {
    return {
      title: data.post.title || `AI Brief: ${data.topic}`,
      deck: data.post.deck || "",
      excerpt: data.post.excerpt || `A professional AI-generated post about ${data.topic}`,
      body: data.post.postMarkdown || data.postDraft || "",
      category: data.post.category || "AI Systems",
      tags: data.post.tags?.length ? data.post.tags : ["ai", "engineering", "strategy"],
      readTime: data.post.readTime || "8 min read",
      keyTakeaways: data.post.keyTakeaways || [],
      sections: data.post.sections || [],
      visualIdeas: data.post.visualIdeas || [],
      sources: data.post.sources || data.sources || [],
    };
  }

  const raw = (data.postDraft || "").trim();
  const plain = raw.replace(/(^#.*$)/gm, "").replace(/\s+/g, " ").trim();
  return {
    title: `AI Brief: ${data.topic}`,
    deck: "A concise brief prepared for publication.",
    excerpt: plain.slice(0, 220),
    body: raw,
    category: "AI Systems",
    tags: ["ai", "generated", "research"],
    readTime: "8 min read",
    keyTakeaways: [],
    sections: [],
    visualIdeas: [],
    sources: data.sources || [],
  };
}

export function StudioAiChat({ onPublished }: StudioAiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Share any rough idea, notes, or prompt. I will transform it into a polished blog post and publish it to your community feed automatically.",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [latestPost, setLatestPost] = useState<StructuredPost | null>(null);
  const [siteEditMode, setSiteEditMode] = useState(false);
  const [recordingSupported, setRecordingSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const canSubmit = useMemo(() => input.trim().length >= 3 && !pending && !isTranscribing, [input, pending, isTranscribing]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setRecordingSupported(Boolean(window.MediaRecorder && navigator.mediaDevices?.getUserMedia));

    return () => {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      mediaStreamRef.current = null;
    };
  }, []);

  async function transcribeAudioBlob(blob: Blob) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }
        reject(new Error("Could not read recorded audio."));
      };
      reader.onerror = () => reject(new Error("Could not process recorded audio."));
      reader.readAsDataURL(blob);
    });

    const audioBase64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    const response = await fetch(TRANSCRIBE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audioBase64,
        mimeType: blob.type || "audio/webm",
      }),
    });

    const data = (await response.json()) as TranscribeResponse;
    if (!response.ok || data.error) {
      throw new Error(data.error || "Audio transcription failed.");
    }

    const transcript = String(data.transcript || "").trim();
    if (!transcript) {
      throw new Error("No speech detected. Try speaking closer to the microphone.");
    }

    setInput((current) => (current ? `${current} ${transcript}`.trim() : transcript));
    textareaRef.current?.focus();
  }

  async function startRecording() {
    if (!recordingSupported || pending || isRecording || isTranscribing) {
      return;
    }

    try {
      setRecordingError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined,
      });

      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        const recordedChunks = [...audioChunksRef.current];
        audioChunksRef.current = [];

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        mediaStreamRef.current = null;

        if (recordedChunks.length === 0) {
          return;
        }

        try {
          setIsTranscribing(true);
          const blob = new Blob(recordedChunks, { type: recorder.mimeType || "audio/webm" });
          await transcribeAudioBlob(blob);
        } catch (transcribeError) {
          setRecordingError(
            transcribeError instanceof Error ? transcribeError.message : "Could not transcribe audio.",
          );
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.onerror = () => {
        setRecordingError("Recording failed. Please allow microphone access and try again.");
        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      textareaRef.current?.focus();
    } catch (recordError) {
      setRecordingError(
        recordError instanceof Error
          ? recordError.message
          : "Could not start recording. Please allow microphone access.",
      );
      setIsRecording(false);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = input.trim();

    if (isRecording || isTranscribing) {
      setError("Stop recording and wait for transcription before submitting.");
      return;
    }

    if (!prompt || pending) {
      return;
    }

    setError("");
    setInput("");
    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: prompt,
      },
    ]);

    setPending(true);

    try {
      if (siteEditMode) {
        const response = await fetch(SITE_CHANGE_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ request: prompt, mode: "auto" }),
        });

        const data = (await response.json()) as SiteChangeResponse;
        if (!response.ok || data.error) {
          throw new Error(data.error || "Website change request failed.");
        }

        const appliedSummary = Array.isArray(data.applied)
          ? data.applied
              .slice(0, 5)
              .map((entry) => `${entry.action}:${entry.path}`)
              .join(", ")
          : "";

        const commitNote = data.commit?.committed
          ? ` Committed to git (${data.commit.sha}).`
          : data.commit?.error
            ? ` (git commit failed: ${data.commit.error})`
            : "";

        setMessages((current) => [
          ...current,
          {
            id: `assistant-site-${Date.now()}`,
            role: "assistant",
            text: `Site update completed. ${data.summary || ""} Applied ${data.count || 0} changes.${appliedSummary ? ` (${appliedSummary})` : ""}${commitNote}`,
          },
        ]);
      } else {
        const response = await fetch(RESEARCH_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topic: prompt }),
        });

        const data = (await response.json()) as ResearchResponse;
        if (!response.ok || data.error) {
          throw new Error(data.error || "The AI publishing service is unavailable.");
        }

        const profile = getProfile();
        const authorName = profile?.name || "AI Desk";
        const draft = normalizeDraft(data);
        setLatestPost(data.post || null);

        const created = saveCommunityPost({
          title: draft.title,
          deck: draft.deck,
          excerpt: draft.excerpt,
          body: draft.body,
          category: draft.category,
          tags: draft.tags,
          authorName,
          readTime: draft.readTime,
          keyTakeaways: draft.keyTakeaways,
          sections: draft.sections,
          visualIdeas: draft.visualIdeas,
          sources: draft.sources,
        });

        if (!created) {
          throw new Error("Could not save the generated post to your local feed.");
        }

        onPublished();

        setMessages((current) => [
          ...current,
          {
            id: `assistant-${created.id}`,
            role: "assistant",
            text: `Published \"${draft.title}\". Your post is now live in the community feed.`,
            publishedPostId: created.id,
          },
        ]);
      }
    } catch (requestError) {
      const nextError =
        requestError instanceof Error
          ? requestError.message
          : "Unable to generate a blog post right now.";
      setError(nextError);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: `I could not publish that yet: ${nextError}`,
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="panel panel-strong rounded-[2rem] p-6 sm:p-8">
      <div className="flex items-center gap-2 text-sm text-[color:var(--accent-ink)]">
        <Sparkles className="h-4 w-4" />
        AI publishing assistant
      </div>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
        Chat to generate and publish professional posts
      </h1>
      <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
        Give any input: a sentence, rough notes, or a messy idea. The assistant turns it into a
        full, publication-ready article with structure, takeaways, and visual ideas.
      </p>

      <label className="mt-4 inline-flex items-center gap-2 text-xs text-[color:var(--muted)]">
        <input
          type="checkbox"
          checked={siteEditMode}
          onChange={(event) => setSiteEditMode(event.target.checked)}
          className="h-4 w-4 rounded border border-[color:var(--line)]"
        />
        Enable MCP site-edit mode (assistant can alter website files directly)
      </label>

      <div className="mt-6 max-h-[440px] space-y-3 overflow-y-auto rounded-[1.5rem] border border-[color:var(--line)] bg-white/85 p-4">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`rounded-2xl border p-4 ${
              message.role === "assistant"
                ? "border-[color:var(--line)] bg-white"
                : "ml-auto max-w-[90%] border-[color:var(--accent-cool)] bg-[rgba(37,99,235,0.1)]"
            }`}
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">
              {message.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}
              {message.role === "assistant" ? "Assistant" : "You"}
            </div>
            <p className="mt-2 text-sm leading-7 text-foreground">{message.text}</p>
            {message.publishedPostId ? (
              <Button asChild size="sm" className="mt-3">
                <Link href={`/community-post?id=${encodeURIComponent(message.publishedPostId)}`}>
                  Open published post
                </Link>
              </Button>
            ) : null}
          </article>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-5 grid gap-3">
        <label className="sr-only" htmlFor="studio-ai-prompt">
          Describe your post
        </label>
        <textarea
          id="studio-ai-prompt"
          ref={textareaRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-[color:var(--line)] bg-white/90 px-4 py-3 text-sm outline-none ring-[color:var(--accent)] transition focus:ring-2"
          placeholder="Example: I run a 5-person startup and want a post about choosing an AI coding assistant on a tight budget."
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!recordingSupported || pending || isTranscribing}
          >
            {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isRecording ? "Stop recording" : isTranscribing ? "Transcribing..." : "Record audio"}
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {pending
              ? siteEditMode
                ? "Applying site changes..."
                : "Generating and publishing..."
              : siteEditMode
                ? "Run site changes"
                : "Generate and publish post"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/community">View community feed</Link>
          </Button>
        </div>
        {!recordingSupported ? (
          <p className="text-xs text-[color:var(--muted)]">
            Voice input is unavailable in this browser. Use Chrome or Edge with microphone permission enabled.
          </p>
        ) : null}
        {isRecording ? (
          <p className="text-xs text-[color:var(--accent-cool)]">Recording... click Stop recording to transcribe into the Studio textbox.</p>
        ) : null}
        {isTranscribing ? (
          <p className="text-xs text-[color:var(--accent-cool)]">Transcribing audio and inserting text into the Studio prompt box...</p>
        ) : null}
        {recordingError ? <p className="text-xs text-red-600">{recordingError}</p> : null}
      </form>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {latestPost ? (
        <div className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] bg-white/85 p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">Latest generated preview</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{latestPost.title}</h2>
          {latestPost.deck ? <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{latestPost.deck}</p> : null}
          {latestPost.keyTakeaways?.length ? (
            <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {latestPost.keyTakeaways.map((item) => (
                <li key={item} className="rounded-xl border border-[color:var(--line)] bg-white px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
