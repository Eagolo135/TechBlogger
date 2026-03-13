import Link from "next/link";
import { ArrowLeft, CheckCircle2, ListChecks, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSiteContent } from "@/lib/content";

export default function AboutPage() {
  const content = getSiteContent();

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="panel panel-strong rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow text-xs text-[color:var(--muted)]">About</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              About TechBlogger and how it works
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
              Editorial mission, publishing workflow, and the operating model behind this blog.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back home
            </Link>
          </Button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {content.site.stats.map((stat) => (
          <article key={stat.label} className="panel rounded-[1.5rem] p-5">
            <p className="eyebrow text-[10px] text-[color:var(--muted)]">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{stat.value}</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="panel rounded-[2rem] p-6">
          <div className="flex items-center gap-2 text-sm text-[color:var(--accent-cool)]">
            <Sparkles className="h-4 w-4" />
            {content.workflow.title}
          </div>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{content.workflow.summary}</p>
          <div className="mt-4 space-y-3">
            {content.workflow.steps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
                <h2 className="text-base font-semibold">{step.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{step.description}</p>
                <code className="mt-3 block rounded-xl bg-slate-950 px-3 py-2 text-xs text-white">{step.command}</code>
              </div>
            ))}
          </div>
        </article>

        <article className="panel rounded-[2rem] p-6">
          <div className="flex items-center gap-2 text-sm text-[color:var(--accent-ink)]">
            <ListChecks className="h-4 w-4" />
            {content.demo.title}
          </div>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{content.demo.summary}</p>
          <div className="mt-4 space-y-3">
            {content.demo.steps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">{step.title}</h2>
                  <Badge variant="outline">{step.duration}</Badge>
                </div>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{step.description}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6 panel rounded-[2rem] p-6">
        <div className="flex items-center gap-2 text-sm text-[color:var(--accent-cool)]">
          <CheckCircle2 className="h-4 w-4" />
          FAQ
        </div>
        <Accordion type="single" collapsible className="mt-4">
          {content.faq.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </main>
  );
}
