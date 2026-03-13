import { Bot, Sparkles } from "lucide-react";

export function AiMascot() {
  return (
    <div
      className="relative ml-auto hidden w-[220px] shrink-0 items-end justify-end lg:flex"
      aria-label="Byte, the TechBlogger AI mascot"
    >
      <div className="absolute -left-10 top-4 h-16 w-16 rounded-full bg-[rgba(56,189,248,0.25)] blur-2xl" />
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-[rgba(45,212,191,0.25)] blur-2xl" />

      <div className="relative w-full rounded-[2rem] border border-[color:var(--line)] bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.4rem] border border-[color:var(--line)] bg-[linear-gradient(145deg,#e0f2fe,#ccfbf1)]">
          <Bot className="h-10 w-10 text-[color:var(--accent-ink)]" />
        </div>

        <div className="mt-4 rounded-2xl border border-[color:var(--line)] bg-white/90 px-3 py-2 text-center text-xs font-medium text-[color:var(--muted)]">
          Hi, I'm Byte. Ask me what to read next.
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-[color:var(--accent-cool)]">
          <Sparkles className="h-3.5 w-3.5" />
          AI-curated post trail
        </div>
      </div>
    </div>
  );
}
