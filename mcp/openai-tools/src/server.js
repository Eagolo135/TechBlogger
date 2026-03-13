import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import OpenAI from "openai";
import { chromium } from "playwright";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const currentFilePath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFilePath), "..");
const websiteRoot = path.resolve(projectRoot, "..", "..");
dotenv.config({ path: path.join(projectRoot, ".env") });

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const visionModel = process.env.OPENAI_VISION_MODEL || model;
const serverName = process.env.MCP_SERVER_NAME || "techblogger-openai-tools";
const screenshotDir = path.join(projectRoot, "screenshots");

if (!apiKey) {
  console.error("Missing OPENAI_API_KEY in environment.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

const server = new McpServer({
  name: serverName,
  version: "0.1.0",
});

async function callModel(systemPrompt, userPrompt) {
  const response = await openai.responses.create({
    model,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return response.output_text || "No output returned by model.";
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

async function performWebSearch(query, maxResults = 5) {
  const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TechBlogger-MCP/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Search request failed with status ${response.status}`);
  }

  const html = await response.text();
  const linkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const results = [];
  const seenUrls = new Set();
  let match;

  while ((match = linkRegex.exec(html)) !== null && results.length < maxResults) {
    const rawUrl = match[1];
    const title = stripHtml(match[2]);
    const url = decodeSearchHref(rawUrl);

    if (!url || seenUrls.has(url)) {
      continue;
    }

    seenUrls.add(url);
    const snippetWindow = html.slice(match.index, match.index + 1200);
    const snippetMatch = snippetWindow.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>|class="result__snippet"[^>]*>([\s\S]*?)<\/div>/i);
    const snippet = stripHtml((snippetMatch?.[1] || snippetMatch?.[2] || "").trim());

    results.push({
      title,
      url,
      snippet,
    });
  }

  return results;
}

function sanitizeFileName(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
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
  const results = [];

  for (const operation of operations) {
    const action = operation.action;

    if (action === "write") {
      if (typeof operation.content !== "string") {
        throw new Error(`Write operation requires string content for path: ${operation.path}`);
      }

      const target = resolveWebsitePath(operation.path);
      await mkdir(path.dirname(target.absolutePath), { recursive: true });
      await writeFile(target.absolutePath, operation.content, "utf8");
      results.push({ action, path: target.relativePath, status: "written" });
      continue;
    }

    if (action === "delete") {
      const target = resolveWebsitePath(operation.path);
      await rm(target.absolutePath, { recursive: true, force: true });
      results.push({ action, path: target.relativePath, status: "deleted" });
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
      results.push({
        action,
        path: from.relativePath,
        newPath: to.relativePath,
        status: "renamed",
      });
      continue;
    }

    throw new Error(`Unsupported action: ${String(action)}`);
  }

  return results;
}

async function planWebsiteOperations(changeRequest) {
  const output = await callModel(
    "You are a senior Next.js engineer planning codebase modifications.",
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
          tests: ["commands to validate"],
        },
        null,
        2,
      ),
      "Use write actions with full file content when proposing changes.",
      "Do not include markdown fences.",
    ].join("\n\n"),
  );

  try {
    return JSON.parse(output);
  } catch {
    return {
      summary: "Could not parse structured plan from model output.",
      raw: output,
      operations: [],
      tests: [],
    };
  }
}

async function captureFullPageScreenshot({
  url,
  fullPage = true,
  viewportWidth = 1440,
  viewportHeight = 1800,
  timeoutMs = 45000,
}) {
  await mkdir(screenshotDir, { recursive: true });
  const urlObj = new URL(url);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `${sanitizeFileName(urlObj.hostname)}-${stamp}.png`;
  const filePath = path.join(screenshotDir, fileName);

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: {
        width: viewportWidth,
        height: viewportHeight,
      },
    });

    await page.goto(url, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.screenshot({ path: filePath, fullPage });

    return {
      filePath,
      fileName,
      url,
      viewport: `${viewportWidth}x${viewportHeight}`,
      fullPage,
    };
  } finally {
    await browser.close();
  }
}

function getMimeTypeFromPath(filePath) {
  const lower = filePath.toLowerCase();

  if (lower.endsWith(".png")) {
    return "image/png";
  }

  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (lower.endsWith(".webp")) {
    return "image/webp";
  }

  throw new Error("Unsupported image format. Use PNG, JPG, JPEG, or WEBP.");
}

async function readImageWithModel({ imagePath, prompt }) {
  const absolutePath = path.isAbsolute(imagePath) ? imagePath : path.join(process.cwd(), imagePath);
  const imageBytes = await readFile(absolutePath);
  const mimeType = getMimeTypeFromPath(absolutePath);
  const dataUrl = `data:${mimeType};base64,${imageBytes.toString("base64")}`;

  const response = await openai.responses.create({
    model: visionModel,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt || "Describe this screenshot and extract key factual information.",
          },
          {
            type: "input_image",
            image_url: dataUrl,
          },
        ],
      },
    ],
  });

  return {
    absolutePath,
    analysis: response.output_text || "No output returned by model.",
  };
}

async function generateSearchQueries(userRequest, maxQueries = 3) {
  const raw = await callModel(
    "You create concise internet search queries for research tasks.",
    [
      `User request: ${userRequest}`,
      `Return only valid JSON array of strings with at most ${maxQueries} items.`,
      "No markdown. No explanation.",
    ].join("\n\n"),
  );

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item).trim())
        .filter(Boolean)
        .slice(0, maxQueries);
    }
  } catch {
    return [userRequest];
  }

  return [userRequest];
}

server.registerTool(
  "website_change_operator",
  {
    title: "Website Change Operator",
    description:
      "Plan and apply website code changes (visual updates, content edits, tools, pages, additions, removals, and refactors) across the TechBlogger repo.",
    inputSchema: {
      changeRequest: z.string().min(4),
      mode: z.enum(["plan", "apply"]).default("plan"),
      operations: z
        .array(
          z.object({
            action: z.enum(["write", "delete", "rename"]),
            path: z.string().min(1),
            newPath: z.string().optional(),
            content: z.string().optional(),
          }),
        )
        .optional(),
    },
  },
  async ({ changeRequest, mode, operations }) => {
    if (mode === "plan") {
      const plan = await planWebsiteOperations(changeRequest);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                mode,
                changeRequest,
                plan,
                note:
                  "To apply changes, call this tool with mode='apply' and pass explicit operations.",
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    if (!operations || operations.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "No operations were provided.",
                hint:
                  "First call mode='plan' to generate a proposed operation list, then call mode='apply' with reviewed operations.",
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    const applied = await applyWebsiteOperations(operations);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              mode,
              changeRequest,
              applied,
              websiteRoot,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

server.registerTool(
  "summarize_text",
  {
    title: "Summarize Text",
    description: "Summarize technical text into concise bullet points.",
    inputSchema: {
      text: z.string().min(1),
      maxBullets: z.number().int().min(3).max(12).default(5),
      audience: z.string().default("software engineers"),
    },
  },
  async ({ text, maxBullets, audience }) => {
    const systemPrompt =
      "You are a technical editor. Provide clear and accurate summaries. Avoid hype and do not invent facts.";

    const userPrompt = [
      `Audience: ${audience}`,
      `Limit: ${maxBullets} bullets`,
      "Return markdown bullets only.",
      "Text:",
      text,
    ].join("\n\n");

    const output = await callModel(systemPrompt, userPrompt);

    return {
      content: [{ type: "text", text: output }],
    };
  },
);

server.registerTool(
  "generate_blog_ideas",
  {
    title: "Generate Blog Ideas",
    description: "Generate actionable tech blog post ideas from a topic.",
    inputSchema: {
      topic: z.string().min(2),
      count: z.number().int().min(3).max(15).default(6),
      tone: z.enum(["practical", "analytical", "opinionated"]).default("practical"),
    },
  },
  async ({ topic, count, tone }) => {
    const systemPrompt =
      "You are a senior technology editor creating strong blog ideas with clear angles and outcomes.";

    const userPrompt = [
      `Topic: ${topic}`,
      `Number of ideas: ${count}`,
      `Tone: ${tone}`,
      "Return a markdown table with columns: Title | Angle | Why It Matters | Outline (3 points).",
    ].join("\n\n");

    const output = await callModel(systemPrompt, userPrompt);

    return {
      content: [{ type: "text", text: output }],
    };
  },
);

server.registerTool(
  "create_blog_post_draft",
  {
    title: "Create Blog Post Draft",
    description:
      "Create a high-quality, in-depth blog post draft from either a vague topic or a detailed brief, with an engaging title and publication-ready structure.",
    inputSchema: {
      request: z.string().min(3),
      audience: z.string().default("software engineers and technical decision-makers"),
      tone: z.enum(["practical", "analytical", "story-driven", "opinionated"]).default("practical"),
      depth: z.enum(["auto", "standard", "deep"]).default("auto"),
      categoryHint: z.string().default("AI Systems"),
      includeSeoFields: z.boolean().default(true),
    },
  },
  async ({ request, audience, tone, depth, categoryHint, includeSeoFields }) => {
    const systemPrompt = [
      "You are an elite technology editor and long-form writer.",
      "Your job is to turn any user input, from vague to very detailed, into an excellent blog post draft.",
      "Always produce an engaging title with a clear editorial angle.",
      "If the request is vague, infer a credible angle and explicitly state assumptions.",
      "Write with substance: practical examples, implementation detail, trade-offs, and actionable guidance.",
      "Avoid fluff and avoid fabricated specific facts. If uncertain, mark it as a reasoned assumption.",
      "Output must be valid JSON only (no markdown fences).",
    ].join(" ");

    const userPrompt = [
      `Request: ${request}`,
      `Audience: ${audience}`,
      `Tone: ${tone}`,
      `Depth mode: ${depth}`,
      `Category hint: ${categoryHint}`,
      `Include SEO fields: ${includeSeoFields}`,
      "Return JSON with this schema exactly:",
      JSON.stringify(
        {
          title: "string",
          deck: "string",
          excerpt: "string",
          slug: "kebab-case-string",
          category: "string",
          tags: ["string"],
          readTime: "string",
          assumptions: ["string"],
          keyTakeaways: ["string"],
          sections: [
            {
              heading: "string",
              body: "multi-paragraph string",
              bullets: ["string"],
            },
          ],
          postMarkdown: "full blog post markdown",
          seo: {
            metaTitle: "string",
            metaDescription: "string",
            focusKeyword: "string",
          },
        },
        null,
        2,
      ),
      "Constraints:",
      "1) 4-7 main sections.",
      "2) Each section body should be rich and specific, not generic.",
      "3) Include at least one practical implementation block in the markdown draft (as a numbered list or checklist).",
      "4) Keep title compelling but professional.",
      "5) If includeSeoFields=false, set seo to null.",
      "6) Keep JSON parseable.",
    ].join("\n\n");

    const output = await callModel(systemPrompt, userPrompt);

    let parsed;
    try {
      parsed = JSON.parse(output);
    } catch {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "Model did not return valid JSON.",
                raw: output,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(parsed, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "format_blog_post_for_publish",
  {
    title: "Format Blog Post For Publish",
    description:
      "Convert a rough draft or notes into a professional, publish-ready structured post with subsections and visual ideas.",
    inputSchema: {
      topic: z.string().min(3),
      draft: z.string().min(20),
      categoryHint: z.string().default("AI Systems"),
      includeVisualIdeas: z.boolean().default(true),
    },
  },
  async ({ topic, draft, categoryHint, includeVisualIdeas }) => {
    const systemPrompt = [
      "You are a senior technical editor who formats blog content for publication.",
      "Transform the input into professional editorial structure.",
      "Output valid JSON only.",
    ].join(" ");

    const userPrompt = [
      `Topic: ${topic}`,
      `Category hint: ${categoryHint}`,
      `Include visual ideas: ${includeVisualIdeas}`,
      "Draft content:",
      draft,
      "Return JSON schema:",
      JSON.stringify(
        {
          title: "string",
          deck: "string",
          excerpt: "string",
          readTime: "string",
          category: "string",
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
      "No markdown fences. Keep JSON parseable.",
    ].join("\n\n");

    const output = await callModel(systemPrompt, userPrompt);
    try {
      const parsed = JSON.parse(output);
      return {
        content: [{ type: "text", text: JSON.stringify(parsed, null, 2) }],
      };
    } catch {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "Model did not return valid JSON.",
                raw: output,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  },
);

server.registerTool(
  "web_search",
  {
    title: "Web Search",
    description: "Search the internet and return top result links with snippets.",
    inputSchema: {
      query: z.string().min(2),
      maxResults: z.number().int().min(1).max(15).default(5),
    },
  },
  async ({ query, maxResults }) => {
    const results = await performWebSearch(query, maxResults);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ query, count: results.length, results }, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "screenshot_full_page",
  {
    title: "Screenshot Full Page",
    description: "Capture a screenshot of an entire web page and save it locally.",
    inputSchema: {
      url: z.string().url(),
      fullPage: z.boolean().default(true),
      viewportWidth: z.number().int().min(800).max(3840).default(1440),
      viewportHeight: z.number().int().min(600).max(3840).default(1800),
      timeoutMs: z.number().int().min(5000).max(120000).default(45000),
    },
  },
  async ({ url, fullPage, viewportWidth, viewportHeight, timeoutMs }) => {
    const shot = await captureFullPageScreenshot({
      url,
      fullPage,
      viewportWidth,
      viewportHeight,
      timeoutMs,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(shot, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "read_screenshot_image",
  {
    title: "Read Screenshot Image",
    description: "Analyze an image (such as a screenshot) using the OpenAI vision model.",
    inputSchema: {
      imagePath: z.string().min(3),
      prompt: z.string().default("Extract key facts, headings, and any important numerical values from this screenshot."),
    },
  },
  async ({ imagePath, prompt }) => {
    const result = await readImageWithModel({ imagePath, prompt });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "agentic_research_chat",
  {
    title: "Agentic Research Chat",
    description:
      "End-to-end research tool that searches the web, optionally captures page screenshots, reads screenshots, and returns a final answer.",
    inputSchema: {
      userRequest: z.string().min(4),
      maxQueries: z.number().int().min(1).max(6).default(3),
      maxResultsPerQuery: z.number().int().min(1).max(8).default(4),
      includeScreenshots: z.boolean().default(true),
      maxScreenshots: z.number().int().min(0).max(4).default(2),
    },
  },
  async ({
    userRequest,
    maxQueries,
    maxResultsPerQuery,
    includeScreenshots,
    maxScreenshots,
  }) => {
    const queries = await generateSearchQueries(userRequest, maxQueries);
    const collected = [];
    const seen = new Set();

    for (const query of queries) {
      const results = await performWebSearch(query, maxResultsPerQuery);
      for (const result of results) {
        if (seen.has(result.url)) {
          continue;
        }

        seen.add(result.url);
        collected.push({ ...result, query });
      }
    }

    const screenshots = [];
    const screenshotAnalyses = [];

    if (includeScreenshots && maxScreenshots > 0) {
      const targets = collected.slice(0, maxScreenshots);
      for (const target of targets) {
        try {
          const shot = await captureFullPageScreenshot({ url: target.url });
          screenshots.push(shot);

          const imageRead = await readImageWithModel({
            imagePath: shot.filePath,
            prompt:
              "Extract factual information from this webpage screenshot that is useful for answering a user research request.",
          });

          screenshotAnalyses.push({
            url: target.url,
            filePath: shot.filePath,
            analysis: imageRead.analysis,
          });
        } catch (error) {
          screenshotAnalyses.push({
            url: target.url,
            filePath: "",
            analysis: `Screenshot or vision analysis failed: ${String(error)}`,
          });
        }
      }
    }

    const synthesisPrompt = [
      `User request: ${userRequest}`,
      "Search results:",
      JSON.stringify(collected.slice(0, 15), null, 2),
      "Screenshot analyses:",
      JSON.stringify(screenshotAnalyses, null, 2),
      "Write a concise answer with a 'Sources' section. Use numbered citations [1], [2], etc. mapped to source URLs.",
      "If data is uncertain, explicitly say so.",
    ].join("\n\n");

    const finalAnswer = await callModel(
      "You are a careful research assistant who must stay factual and cite sources from provided material.",
      synthesisPrompt,
    );

    const sourceList = collected.slice(0, 15).map((item, index) => ({
      id: index + 1,
      title: item.title,
      url: item.url,
      query: item.query,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              answer: finalAnswer,
              generatedQueries: queries,
              sources: sourceList,
              screenshots,
              screenshotAnalyses,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
