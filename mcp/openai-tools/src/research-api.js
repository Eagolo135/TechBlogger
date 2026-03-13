import { createServer } from "node:http";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import OpenAI from "openai";

const currentFilePath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFilePath), "..");
const websiteRoot = path.resolve(projectRoot, "..", "..");
dotenv.config({ path: path.join(projectRoot, ".env") });

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const port = Number(process.env.MCP_RESEARCH_API_PORT || 8787);
const corsOrigin = process.env.RESEARCH_CORS_ORIGIN || "*";

if (!apiKey) {
  console.error("Missing OPENAI_API_KEY in mcp/openai-tools/.env");
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

async function callModel(systemPrompt, userPrompt) {
  const response = await openai.responses.create({
    model,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return response.output_text || "";
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
}

function json(res, statusCode, payload) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function stripHtml(input) {
  return input.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function decodeSearchHref(rawHref) {
  if (!rawHref) {
    return "";
  }

  const normalizedHref = rawHref.startsWith("//") ? `https:${rawHref}` : rawHref;

  try {
    const maybeUrl = new URL(
      normalizedHref.startsWith("http://") || normalizedHref.startsWith("https://")
        ? normalizedHref
        : `https://duckduckgo.com${normalizedHref}`,
    );

    const target = maybeUrl.searchParams.get("uddg");
    if (target) {
      return decodeURIComponent(target);
    }

    return maybeUrl.toString();
  } catch {
    return "";
  }
}

function resolveWebsitePath(relativePath) {
  const normalizedRelative = String(relativePath || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  if (!normalizedRelative) {
    throw new Error("Path is required.");
  }

  const absolutePath = path.resolve(websiteRoot, normalizedRelative);
  if (!absolutePath.startsWith(websiteRoot)) {
    throw new Error(`Blocked path outside website root: ${relativePath}`);
  }

  return {
    relativePath: normalizedRelative,
    absolutePath,
  };
}

async function applyWebsiteOperations(operations) {
  const applied = [];

  for (const operation of operations) {
    const action = String(operation?.action || "");

    if (action === "write") {
      if (typeof operation.content !== "string") {
        throw new Error(`Write operation requires string content for path: ${operation.path}`);
      }

      const target = resolveWebsitePath(operation.path);
      await mkdir(path.dirname(target.absolutePath), { recursive: true });
      await writeFile(target.absolutePath, operation.content, "utf8");
      applied.push({ action, path: target.relativePath, status: "written" });
      continue;
    }

    if (action === "delete") {
      const target = resolveWebsitePath(operation.path);
      await rm(target.absolutePath, { recursive: true, force: true });
      applied.push({ action, path: target.relativePath, status: "deleted" });
      continue;
    }

    if (action === "rename") {
      if (!operation.newPath) {
        throw new Error(`Rename operation requires newPath for path: ${operation.path}`);
      }

      const from = resolveWebsitePath(operation.path);
      const to = resolveWebsitePath(operation.newPath);
      await mkdir(path.dirname(to.absolutePath), { recursive: true });
      await rename(from.absolutePath, to.absolutePath);
      applied.push({
        action,
        path: from.relativePath,
        newPath: to.relativePath,
        status: "renamed",
      });
      continue;
    }

    throw new Error(`Unsupported action: ${action}`);
  }

  return applied;
}

async function planWebsiteOperations(changeRequest) {
  const output = await callModel(
    "You are a senior Next.js engineer who plans and writes codebase-level changes.",
    [
      `Website root: ${websiteRoot}`,
      `Change request: ${changeRequest}`,
      "Return valid JSON only.",
      "Output schema:",
      JSON.stringify(
        {
          summary: "string",
          operations: [
            {
              action: "write|rename|delete",
              path: "relative/path/from/repo/root",
              newPath: "relative/path/for-rename",
              content: "full file content for write action",
              reason: "why this change is needed",
            },
          ],
        },
        null,
        2,
      ),
      "When using action=write, include full file content.",
      "Do not include markdown code fences.",
    ].join("\n\n"),
  );

  try {
    const parsed = JSON.parse(output);
    return {
      summary: String(parsed.summary || "Generated change plan."),
      operations: Array.isArray(parsed.operations) ? parsed.operations : [],
    };
  } catch {
    return {
      summary: "Failed to parse model output for website operations.",
      operations: [],
      raw: output,
    };
  }
}

async function performWebSearch(query, maxResults = 6) {
  const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TechBlogger-MCP-Research/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Search request failed with status ${response.status}`);
  }

  const html = await response.text();
  const linkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const results = [];
  const seen = new Set();
  let match;

  while ((match = linkRegex.exec(html)) !== null && results.length < maxResults) {
    const title = stripHtml(match[2]);
    const url = decodeSearchHref(match[1]);
    if (!url || seen.has(url)) {
      continue;
    }

    seen.add(url);
    results.push({ title, url });
  }

  return results;
}

function fallbackStructuredPost(topic, sources, draftText) {
  const clean = String(draftText || "").trim();
  const firstParagraph = clean.split("\n\n").find((entry) => entry.trim().length > 20) || clean;

  return {
    title: `AI Brief: ${topic}`,
    deck: "A practical, research-backed take on the topic.",
    excerpt: firstParagraph.replace(/\s+/g, " ").trim().slice(0, 220),
    readTime: "8 min read",
    category: "AI Systems",
    tags: ["ai", "research", "engineering"],
    keyTakeaways: [
      "Start with the core decision this topic affects.",
      "Tie implementation choices to measurable outcomes.",
      "Use a staged rollout and capture signals early.",
    ],
    sections: [
      {
        heading: "Overview",
        body: clean || `This draft summarizes the topic: ${topic}.`,
        bullets: ["Context", "Current patterns", "Practical implications"],
      },
    ],
    visualIdeas: [
      {
        type: "chart",
        title: "Impact over time",
        description: "Compare adoption, quality, and delivery speed over three release cycles.",
        dataHint: "Collect internal sprint metrics and incident counts.",
      },
    ],
    sources,
    postMarkdown: clean,
  };
}

async function generateBlogDraft(topic, sources) {
  const prompt = [
    `Topic: ${topic}`,
    "Write a high-quality, professional tech/AI blog post package.",
    "No matter how rough, short, or non-technical the user topic is, transform it into a credible and engaging technology-focused article angle.",
    "Use an editorial voice suitable for a modern tech publication: clear, specific, and practical.",
    "Make the output visually rich by including concrete visual ideas suitable for charts, diagrams, timelines, or comparison tables.",
    "Each section must be substantial (not filler), and include actionable guidance where relevant.",
    "Keep claims grounded in the provided sources.",
    "Return VALID JSON only (no markdown fences).",
    "Structure must include title, deck, excerpt, readTime, tags, keyTakeaways, sections, visualIdeas, and postMarkdown.",
    "Provide at least 4 sections, at least 4 keyTakeaways, and at least 3 visualIdeas.",
    "No headings with '#' in final structured fields.",
    "Use sources for factual grounding and avoid made-up facts.",
    "Source list:",
    JSON.stringify(sources, null, 2),
    "JSON schema:",
    JSON.stringify(
      {
        title: "string",
        deck: "string",
        excerpt: "string",
        readTime: "string",
        category: "AI Systems",
        tags: ["string"],
        keyTakeaways: ["string"],
        sections: [
          {
            heading: "string",
            body: "multi-paragraph string",
            bullets: ["string"],
          },
        ],
        visualIdeas: [
          {
            type: "chart|diagram|table|timeline",
            title: "string",
            description: "string",
            dataHint: "string",
          },
        ],
        postMarkdown: "string",
      },
      null,
      2,
    ),
  ].join("\n\n");

  const response = await openai.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "You are a senior technology editor writing for a premium engineering publication. Produce polished, engaging, scannable, and professional articles with strong structure and practical value. Use only source-backed claims and avoid fluff.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const output = response.output_text || "";

  try {
    const parsed = JSON.parse(output);
    return {
      ...parsed,
      sources,
      postMarkdown: parsed.postMarkdown || output,
    };
  } catch {
    return fallbackStructuredPost(topic, sources, output);
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("Request body too large."));
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    json(res, 400, { error: "Missing URL." });
    return;
  }

  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    json(res, 200, { ok: true, model });
    return;
  }

  if (req.method === "POST" && req.url === "/generate") {
    try {
      const rawBody = await readBody(req);
      const body = rawBody ? JSON.parse(rawBody) : {};
      const topic = String(body.topic || "").trim();

      if (topic.length < 3) {
        json(res, 400, { error: "Topic must be at least 3 characters." });
        return;
      }

      const sources = await performWebSearch(topic, 6);
      const structuredPost = await generateBlogDraft(topic, sources);

      json(res, 200, {
        topic,
        brief: `Found ${sources.length} web sources and generated a draft post.`,
        post: structuredPost,
        postDraft: structuredPost.postMarkdown,
        sources,
      });
      return;
    } catch (error) {
      json(res, 500, { error: `Research generation failed: ${String(error)}` });
      return;
    }
  }

  if (req.method === "POST" && req.url === "/site-change") {
    try {
      const rawBody = await readBody(req);
      const body = rawBody ? JSON.parse(rawBody) : {};
      const request = String(body.request || "").trim();
      const mode = String(body.mode || "auto").toLowerCase();

      if (request.length < 4) {
        json(res, 400, { error: "Request must be at least 4 characters." });
        return;
      }

      const plan = await planWebsiteOperations(request);
      if (mode === "plan") {
        json(res, 200, {
          request,
          mode,
          websiteRoot,
          summary: plan.summary,
          operations: plan.operations,
          count: plan.operations.length,
        });
        return;
      }

      const applied = await applyWebsiteOperations(plan.operations);
      json(res, 200, {
        request,
        mode,
        summary: plan.summary,
        operations: plan.operations,
        applied,
        count: applied.length,
      });
      return;
    } catch (error) {
      json(res, 500, { error: `Website change failed: ${String(error)}` });
      return;
    }
  }

  json(res, 404, { error: "Not found." });
});

server.listen(port, () => {
  console.log(`MCP research API listening on http://localhost:${port}`);
});
