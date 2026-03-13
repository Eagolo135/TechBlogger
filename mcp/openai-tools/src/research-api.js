import { createServer } from "node:http";
import { mkdir, readdir, readFile as readFileAsync, rename, rm, writeFile } from "node:fs/promises";
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
const projectFacts = [
  "Framework: Next.js App Router",
  "Route files live under src/app/**/page.tsx (NOT pages/)",
  "UI components live under src/components/**",
  "Mascot component file is src/components/site/ai-mascot.tsx",
  "Core content source is content/site-content.yaml",
  "Styles are in src/app/globals.css and component-level classes",
  "Do not write to out/, node_modules/, .git/, or mcp/openai-tools/node_modules/",
].join("\n");

const retryContextFallbackPaths = [
  "src/components/site/ai-mascot.tsx",
  "src/components/site/landing-page.tsx",
  "src/app/studio/page.tsx",
  "src/app/globals.css",
  "content/site-content.yaml",
];

// Directories to crawl when building the file tree for discovery
const discoveryDirs = ["src", "content", "public"];
const discoveryBlocklist = new Set(["node_modules", "out", ".next", ".git", ".turbo"]);

async function getProjectFileTree(maxFiles = 400) {
  const files = [];

  async function walk(relDir, depth) {
    if (depth > 8 || files.length >= maxFiles) {
      return;
    }

    const absolute = path.join(websiteRoot, relDir);
    let entries;
    try {
      entries = await readdir(absolute, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= maxFiles) {
        break;
      }

      if (entry.name.startsWith(".")) {
        continue;
      }

      const relPath = `${relDir}/${entry.name}`;

      if (entry.isDirectory()) {
        if (!discoveryBlocklist.has(entry.name)) {
          await walk(relPath, depth + 1);
        }
      } else {
        files.push(relPath);
      }
    }
  }

  for (const dir of discoveryDirs) {
    await walk(dir, 0);
  }

  // Include root-level config and content files
  try {
    const rootEntries = await readdir(websiteRoot, { withFileTypes: true });
    for (const entry of rootEntries) {
      if (entry.isFile() && /\.(ts|tsx|js|json|yaml|yml|md|css)$/.test(entry.name)) {
        files.push(entry.name);
      }
    }
  } catch {
    // ignore
  }

  return files;
}

async function discoverRelevantFiles(changeRequest) {
  const fileTree = await getProjectFileTree(400);

  // Ask the AI which files are most likely relevant to this request
  const selectionOutput = await callModel(
    "You are a code-search assistant helping identify which files to read before making a change.",
    [
      `Change request: ${changeRequest}`,
      "Project facts:",
      projectFacts,
      "Full file tree:",
      fileTree.join("\n"),
      "Return valid JSON only (no markdown). Schema: { \"files\": [\"relative/path\", ...] }",
      "Select up to 10 most relevant files. Prioritize .tsx/.ts source files.",
      "Think step-by-step: what UI component, page, style, or config file would need to change?",
      "Always include any file whose name or path strongly matches keywords in the request.",
    ].join("\n\n"),
  );

  let selectedPaths = [];
  try {
    const parsed = JSON.parse(selectionOutput);
    selectedPaths = Array.isArray(parsed.files) ? parsed.files.slice(0, 10) : [];
  } catch {
    selectedPaths = retryContextFallbackPaths.slice(0, 5);
  }

  // Always ensure fallback paths are included so common files are always available
  const allPaths = Array.from(new Set([...selectedPaths, ...retryContextFallbackPaths])).slice(0, 12);

  const fileContents = [];
  for (const relPath of allPaths) {
    try {
      const target = resolveWebsitePath(relPath);
      const content = await readFileAsync(target.absolutePath, "utf8");
      fileContents.push({ path: relPath, content: content.slice(0, 15000) });
    } catch {
      // skip unreadable files
    }
  }

  return fileContents;
}

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
      try {
        await readFileAsync(target.absolutePath, "utf8");
        throw new Error(
          `Refusing to overwrite existing file '${target.relativePath}' with write action. Use replace action instead.`,
        );
      } catch (error) {
        if (!(error instanceof Error) || !/ENOENT/.test(String(error))) {
          throw error;
        }
      }

      await mkdir(path.dirname(target.absolutePath), { recursive: true });
      await writeFile(target.absolutePath, operation.content, "utf8");
      applied.push({ action, path: target.relativePath, status: "written" });
      continue;
    }

    if (action === "replace") {
      if (typeof operation.find !== "string" || operation.find.length === 0) {
        throw new Error(`Replace operation requires a non-empty find string for path: ${operation.path}`);
      }
      if (typeof operation.replace !== "string") {
        throw new Error(`Replace operation requires a replace string for path: ${operation.path}`);
      }

      const target = resolveWebsitePath(operation.path);
      const before = await readFileAsync(target.absolutePath, "utf8");
      if (!before.includes(operation.find)) {
        throw new Error(`Find string was not found in '${target.relativePath}'.`);
      }

      const after = before.replace(operation.find, operation.replace);
      await writeFile(target.absolutePath, after, "utf8");
      applied.push({ action, path: target.relativePath, status: "replaced" });
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

const operationSchema = JSON.stringify(
  {
    summary: "string",
    operations: [
      {
        action: "replace|write|rename|delete",
        path: "relative/path/from/repo/root",
        newPath: "relative/path/for-rename (rename only)",
        find: "EXACT substring from file content for replace action",
        replace: "new text for replace action",
        content: "full file content for write action",
        reason: "why this change is needed",
      },
    ],
  },
  null,
  2,
);

async function planWebsiteOperations(changeRequest) {
  // Discovery phase: find the real files before planning
  const fileContents = await discoverRelevantFiles(changeRequest);

  const output = await callModel(
    "You are a senior Next.js engineer who plans and applies codebase-level changes.",
    [
      `Website root: ${websiteRoot}`,
      "Project facts:",
      projectFacts,
      `Change request: ${changeRequest}`,
      "Relevant file contents discovered from the project:",
      JSON.stringify(fileContents, null, 2),
      "Return valid JSON only (no markdown fences).",
      "Output schema:",
      operationSchema,
      "Rules:",
      "- Use action=replace for edits to existing files. The 'find' field MUST be an exact verbatim substring copied from the file content shown above.",
      "- Use action=write ONLY for brand new files that do not appear in the file contents above.",
      "- Never guess a path — only use paths that appear in the file contents or the project file tree.",
      "- Never use pages/* paths because this project uses src/app/* routes.",
      "- Do not include markdown code fences.",
    ].join("\n\n"),
  );

  try {
    const parsed = JSON.parse(output);
    return {
      summary: String(parsed.summary || "Generated change plan."),
      operations: Array.isArray(parsed.operations) ? parsed.operations : [],
      discoveredFiles: fileContents,
    };
  } catch {
    return {
      summary: "Failed to parse model output for website operations.",
      operations: [],
      discoveredFiles: fileContents,
      raw: output,
    };
  }
}

async function planWebsiteOperationsWithContext(changeRequest, previousOperations, failureMessage, existingDiscoveredFiles) {
  // Re-use already discovered files, or re-run discovery if unavailable
  let fileContext = existingDiscoveredFiles;
  if (!Array.isArray(fileContext) || fileContext.length === 0) {
    fileContext = await discoverRelevantFiles(changeRequest);
  } else {
    // Also re-read any files that were referenced in previous operations but may be missing
    const referencedPaths = Array.from(
      new Set(
        (Array.isArray(previousOperations) ? previousOperations : [])
          .map((operation) => String(operation?.path || "").trim())
          .filter(Boolean),
      ),
    );
    const alreadyLoaded = new Set(fileContext.map((f) => f.path));
    for (const relPath of referencedPaths) {
      if (alreadyLoaded.has(relPath)) {
        continue;
      }

      try {
        const target = resolveWebsitePath(relPath);
        const content = await readFileAsync(target.absolutePath, "utf8");
        fileContext = [...fileContext, { path: relPath, content: content.slice(0, 15000) }];
      } catch {
        // skip
      }
    }
  }

  const output = await callModel(
    "You are a senior Next.js engineer fixing failed code edit operations.",
    [
      `Website root: ${websiteRoot}`,
      "Project facts:",
      projectFacts,
      `Original change request: ${changeRequest}`,
      `Previous failure: ${failureMessage}`,
      "Previous operations that failed:",
      JSON.stringify(previousOperations, null, 2),
      "Current file contents (use these exact paths and copy exact substrings for find):",
      JSON.stringify(fileContext, null, 2),
      "Return valid JSON only (no markdown fences) with schema:",
      operationSchema,
      "Rules:",
      "- The 'find' field for replace actions MUST be an exact verbatim substring copied from the file content shown above.",
      "- Only use paths that appear in the file contents or were referenced in previous operations.",
      "- Use action=write only for brand new files that do not appear in the file contents.",
      "- Never use pages/* paths.",
    ].join("\n\n"),
  );

  try {
    const parsed = JSON.parse(output);
    return {
      summary: String(parsed.summary || "Generated retry plan."),
      operations: Array.isArray(parsed.operations) ? parsed.operations : [],
      discoveredFiles: fileContext,
    };
  } catch {
    return {
      summary: "Failed to parse retry plan.",
      operations: [],
      discoveredFiles: fileContext,
      raw: output,
    };
  }
}

function validateWebsiteOperations(operations) {
  const blockedPrefixes = [".git/", "out/", "node_modules/", "mcp/openai-tools/node_modules/"];

  for (const operation of operations) {
    const opPath = String(operation?.path || "").replace(/\\/g, "/");
    const action = String(operation?.action || "");

    if (!opPath) {
      throw new Error("Planned operation is missing a path.");
    }

    if (opPath.startsWith("pages/")) {
      throw new Error(
        `Invalid path '${opPath}'. This project uses Next.js App Router under src/app, not pages/.`,
      );
    }

    if (blockedPrefixes.some((prefix) => opPath.startsWith(prefix))) {
      throw new Error(`Blocked path '${opPath}'.`);
    }

    if (action === "rename") {
      const newPath = String(operation?.newPath || "").replace(/\\/g, "/");
      if (!newPath) {
        throw new Error(`Rename operation for '${opPath}' is missing newPath.`);
      }

      if (newPath.startsWith("pages/")) {
        throw new Error(
          `Invalid rename target '${newPath}'. This project uses Next.js App Router under src/app, not pages/.`,
        );
      }

      if (blockedPrefixes.some((prefix) => newPath.startsWith(prefix))) {
        throw new Error(`Blocked rename target '${newPath}'.`);
      }
    }

    if (action === "replace") {
      if (typeof operation?.find !== "string" || operation.find.length === 0) {
        throw new Error(`Replace operation for '${opPath}' is missing a non-empty find value.`);
      }

      if (typeof operation?.replace !== "string") {
        throw new Error(`Replace operation for '${opPath}' is missing replace value.`);
      }
    }

    if (!["replace", "write", "rename", "delete"].includes(action)) {
      throw new Error(`Unsupported action '${action}' for path '${opPath}'.`);
    }
  }
}

async function checkReplaceOperationsApplicable(operations) {
  for (const operation of operations) {
    const action = String(operation?.action || "");
    if (action !== "replace") {
      continue;
    }

    const target = resolveWebsitePath(operation.path);
    let content = "";
    try {
      content = await readFileAsync(target.absolutePath, "utf8");
    } catch (error) {
      if (error instanceof Error && /ENOENT/.test(String(error))) {
        return {
          ok: false,
          reason: `Replace target file does not exist: '${target.relativePath}'. Use an existing file path or write action for a new file.`,
        };
      }

      throw error;
    }

    if (!content.includes(operation.find)) {
      return {
        ok: false,
        reason: `Replace find string not found in '${target.relativePath}'.`,
      };
    }
  }

  return { ok: true, reason: "" };
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
        validateWebsiteOperations(plan.operations);
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

      let currentPlan = plan;
      let applied;
      let retried = false;
      let retrySummary = "";
      let lastFailure = "";

      for (let attempt = 0; attempt < 3; attempt += 1) {
        validateWebsiteOperations(currentPlan.operations);
        const applicability = await checkReplaceOperationsApplicable(currentPlan.operations);

        if (!applicability.ok) {
          lastFailure = applicability.reason;
          const nextPlan = await planWebsiteOperationsWithContext(
            request,
            currentPlan.operations,
            applicability.reason,
            currentPlan.discoveredFiles,
          );
          currentPlan = nextPlan;
          retried = true;
          retrySummary = nextPlan.summary || "Generated retry plan.";
          continue;
        }

        try {
          applied = await applyWebsiteOperations(currentPlan.operations);
          break;
        } catch (applyError) {
          lastFailure = String(applyError);
          const nextPlan = await planWebsiteOperationsWithContext(
            request,
            currentPlan.operations,
            String(applyError),
            currentPlan.discoveredFiles,
          );
          currentPlan = nextPlan;
          retried = true;
          retrySummary = nextPlan.summary || "Generated retry plan after apply failure.";
        }
      }

      if (!applied) {
        throw new Error(lastFailure || "Failed to apply site change after retries.");
      }

      json(res, 200, {
        request,
        mode,
        summary: currentPlan.summary,
        operations: currentPlan.operations,
        applied,
        count: applied.length,
        retried,
        retrySummary,
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
