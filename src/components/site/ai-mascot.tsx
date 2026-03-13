import { Sparkles, Star } from "lucide-react";

export function AiMascot() {
  return (
    <div
      className="relative ml-auto hidden w-[220px] shrink-0 items-end justify-end lg:flex"
      aria-label="TB, the TechBlogger mascot"
    >
      <div className="absolute -left-10 top-8 h-20 w-20 rounded-full bg-[rgba(56,189,248,0.25)] blur-3xl" />
      <div className="absolute right-2 top-2 h-24 w-24 rounded-full bg-[rgba(99,102,241,0.25)] blur-3xl" />

      <div className="relative w-full rounded-[2rem] border border-[color:var(--line)] bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="mx-auto flex w-fit items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-white">
          <Star className="h-3 w-3" />
          CHIBI MODE
        </div>

        <div className="mx-auto mt-4 h-24 w-24 rounded-full border border-slate-200 bg-[linear-gradient(145deg,#dbeafe,#a7f3d0)] p-2 shadow-inner">
          <div className="relative h-full w-full rounded-full bg-[linear-gradient(145deg,#f8fafc,#cbd5e1)]">
            <div className="absolute left-2.5 top-5 h-2.5 w-2.5 rounded-full bg-pink-300/70" />
            <div className="absolute right-2.5 top-5 h-2.5 w-2.5 rounded-full bg-pink-300/70" />
            <div className="absolute left-2 top-7 flex h-5 w-8 items-center justify-center rounded-full bg-slate-900">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            </div>
            <div className="absolute right-2 top-7 flex h-5 w-8 items-center justify-center rounded-full bg-slate-900">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            </div>
            <div className="absolute left-[38px] top-[33px] h-1 w-4 bg-slate-900" />
            <div className="absolute left-[31px] top-[53px] h-2 w-2 rounded-full bg-slate-700" />
            <div className="absolute left-[43px] top-[53px] h-2 w-2 rounded-full bg-slate-700" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-[color:var(--accent-cool)]">
          <Sparkles className="h-3.5 w-3.5" />
          TB chibi drop
        </div>
      </div>
    </div>
  );
}
