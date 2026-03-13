import Link from "next/link";
import { ArrowLeft, CheckCircle2, ListChecks, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSiteContent } from "@/lib/content";

export default function AboutPage() {
  const content = getSiteContent();
  const mcpTools = [
    {
      name: "summarize_text",
      use: "Summarize long technical notes into concise bullets.",
    },
    {
      name: "generate_blog_ideas",
      use: "Generate high-quality topic ideas with angles and outlines.",
    },
    {
      name: "create_blog_post_draft",
      use: "Generate an in-depth draft from a vague prompt or detailed brief.",
    },
    {
      name: "format_blog_post_for_publish",
      use: "Convert rough draft text into publish-ready sections, takeaways, and visual ideas.",
    },
    {
      name: "website_change_operator",
      use: "Plan and apply code/content/tool/page changes across the website with controlled file operations.",
    },
    {
      name: "web_search",
      use: "Search the web and return source links for blog research.",
    },
    {
      name: "screenshot_full_page",
      use: "Capture full-page screenshots for evidence and visual analysis.",
    },
    {
      name: "read_screenshot_image",
      use: "Extract facts, headings, and numbers from screenshots.",
    },
    {
      name: "agentic_research_chat",
      use: "Run end-to-end research orchestration with sourced answers.",
    },
  ];

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
        <div className="flex items-center gap-2 text-sm text-[color:var(--accent-ink)]">
          <ListChecks className="h-4 w-4" />
          MCP tools and usage
        </div>
        <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
          These tools power AI research and publishing workflows across the site.
        </p>

        <div className="mt-4 grid gap-3">
          {mcpTools.map((tool) => (
            <article key={tool.name} className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
              <p className="font-mono text-xs text-[color:var(--accent-cool)]">{tool.name}</p>
              <p className="mt-1 text-sm leading-7 text-[color:var(--muted)]">{tool.use}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
          <h3 className="text-base font-semibold">How to run the MCP tools</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold">Setup</h4>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-7 text-[color:var(--muted)]">
                <li>Install dependencies for the MCP server:
                  <div className="mt-2"><code className="block rounded-xl bg-slate-950 px-3 py-2 text-xs text-white">cd mcp/openai-tools && npm install</code></div>
                </li>
                <li>Install Playwright browsers used for screenshots:
                  <div className="mt-2"><code className="block rounded-xl bg-slate-950 px-3 py-2 text-xs text-white">npx playwright install chromium</code></div>
                </li>
                <li>Copy the example env and set your OpenAI key:
                  <div className="mt-2"><code className="block rounded-xl bg-slate-950 px-3 py-2 text-xs text-white">copy .env.example .env</code></div>
                  <p className="mt-1 text-[color:var(--muted)]">Then edit <span className="font-mono text-xs">OPENAI_API_KEY</span> in <span className="font-mono text-xs">mcp/openai-tools/.env</span>.</p>
                </li>
              </ol>
            </div>

            <div>
              <h4 className="text-sm font-semibold">Run</h4>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-7 text-[color:var(--muted)]">
                <li>From the repository root (recommended):
                  <div className="mt-2"><code className="block rounded-xl bg-slate-950 px-3 py-2 text-xs text-white">npm run mcp:openai</code></div>
                  <p className="mt-1 text-[color:var(--muted)]">This command launches <span className="font-mono text-xs">mcp/openai-tools/src/server.js</span> using the root scripts.</p>
                </li>
                <li>Or run directly inside the MCP folder:
                  <div className="mt-2"><code className="block rounded-xl bg-slate-950 px-3 py-2 text-xs text-white">cd mcp/openai-tools && npm start</code></div>
                </li>
                <li>Run the research helper (optional):
                  <div className="mt-2"><code className="block rounded-xl bg-slate-950 px-3 py-2 text-xs text-white">npm run mcp:research-api</code></div>
                  <p className="mt-1 text-[color:var(--muted)]">Or from the MCP folder: <span className="font-mono text-xs">npm run research:api</span>.</p>
                </li>
              </ol>
            </div>
          </div>

          <div className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
            <p>For full details (tools list, example MCP client config, and security notes), see the MCP README:</p>
            <p className="mt-2"><a className="text-[color:var(--accent-cool)]" href="/mcp/openai-tools/README.md">mcp/openai-tools/README.md</a></p>
          </div>
        </div>
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
