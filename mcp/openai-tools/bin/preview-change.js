#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const currentFile = new URL(import.meta.url).pathname;
const projectRoot = path.resolve(path.dirname(currentFile), '..');
const websiteRoot = path.resolve(projectRoot, '..', '..');

const discoveryDirs = ['src', 'content', 'public'];
const discoveryBlocklist = new Set(['node_modules', 'out', '.next', '.git', '.turbo']);

async function getProjectFileTree(maxFiles = 400) {
  const files = [];

  async function walk(relDir, depth) {
    if (depth > 8 || files.length >= maxFiles) return;
    const absolute = path.join(websiteRoot, relDir);
    let entries;
    try {
      entries = await readdir(absolute, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      if (entry.name.startsWith('.')) continue;
      const relPath = `${relDir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!discoveryBlocklist.has(entry.name)) await walk(relPath, depth + 1);
      } else {
        files.push(relPath);
      }
    }
  }

  for (const dir of discoveryDirs) await walk(dir, 0);

  // root-level files
  try {
    const rootEntries = await readdir(websiteRoot, { withFileTypes: true });
    for (const entry of rootEntries) {
      if (entry.isFile() && /\.(ts|tsx|js|json|yaml|yml|md|css)$/.test(entry.name)) files.push(entry.name);
    }
  } catch {
    // ignore
  }

  return files.slice(0, maxFiles);
}

function keywordsFromRequest(req) {
  return Array.from(new Set(String(req || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean))).slice(0, 8);
}

function scoreSnippet(snippet, keywords) {
  return keywords.reduce((s, k) => (snippet.toLowerCase().includes(k) ? s + 1 : s), 0);
}

async function extractCandidatesForPath(relPath, content, keywords, max = 6) {
  const lines = content.split(/\r?\n/);
  const windows = [];
  for (let i = 0; i < lines.length; i++) {
    const start = Math.max(0, i - 3);
    const end = Math.min(lines.length, i + 4);
    const snippet = lines.slice(start, end).join('\n');
    const score = scoreSnippet(snippet, keywords);
    windows.push({ start: start + 1, end, snippet, score });
  }
  windows.sort((a, b) => b.score - a.score);
  if (windows.every((w) => w.score === 0)) {
    return windows.slice(0, Math.min(max, windows.length)).map((w) => ({ lineStart: w.start, lineEnd: w.end, snippet: w.snippet }));
  }
  return windows.slice(0, max).map((w) => ({ lineStart: w.start, lineEnd: w.end, snippet: w.snippet }));
}

function makeLineContextDiff(before, after, context = 3) {
  const bLines = before.split(/\r?\n/);
  const aLines = after.split(/\r?\n/);
  // very small fuzzy diff: find first differing line index
  let si = 0;
  while (si < bLines.length && si < aLines.length && bLines[si] === aLines[si]) si++;
  let eiB = bLines.length - 1;
  let eiA = aLines.length - 1;
  while (eiB >= 0 && eiA >= 0 && bLines[eiB] === aLines[eiA]) { eiB--; eiA--; }

  const start = Math.max(0, si - context);
  const endB = Math.min(bLines.length, eiB + context + 1);
  const endA = Math.min(aLines.length, eiA + context + 1);

  const out = [];
  for (let i = start; i < endB; i++) out.push('- ' + bLines[i]);
  for (let i = start; i < endA; i++) out.push('+ ' + aLines[i]);
  return out.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: preview-change "change request" [--ops path/to/ops.json]');
    process.exit(1);
  }

  const changeRequest = args[0];
  const opsIdx = args.indexOf('--ops');
  const opsPath = opsIdx !== -1 ? args[opsIdx + 1] : null;

  const files = await getProjectFileTree(400);
  const keywords = keywordsFromRequest(changeRequest);
  const discovered = [];

  for (const relPath of files) {
    try {
      const absolute = path.resolve(websiteRoot, relPath);
      const content = await readFile(absolute, 'utf8');
      discovered.push({ path: relPath, content: content.slice(0, 15000) });
    } catch {
      // skip
    }
  }

  const candidates = {};
  for (const entry of discovered) {
    candidates[entry.path] = await extractCandidatesForPath(entry.path, entry.content, keywords, 6);
  }

  const diffs = [];
  if (opsPath) {
    try {
      const raw = await readFile(path.resolve(process.cwd(), opsPath), 'utf8');
      const ops = JSON.parse(raw);
      for (const op of ops) {
        try {
          const targetAbs = path.resolve(websiteRoot, op.path || '');
          const before = (await readFile(targetAbs, 'utf8'));
          if (op.find && op.replace !== undefined) {
            const idx = before.indexOf(op.find);
            if (idx === -1) {
              diffs.push({ path: op.path, error: 'find string not found' });
              continue;
            }
            const after = before.replace(op.find, op.replace);
            const snippetBefore = before.slice(Math.max(0, idx - 200), idx + op.find.length + 200);
            const snippetAfter = after.slice(Math.max(0, idx - 200), idx + op.replace.length + 200);
            diffs.push({ path: op.path, diff: makeLineContextDiff(snippetBefore, snippetAfter) });
          } else {
            diffs.push({ path: op.path, note: 'no find/replace provided' });
          }
        } catch (e) {
          diffs.push({ path: op.path, error: String(e) });
        }
      }
    } catch (e) {
      console.error('Failed to read ops file:', e.message || e);
    }
  }

  console.log(JSON.stringify({ changeRequest, keywords, discoveredCount: discovered.length, candidates, diffs }, null, 2));
}

main().catch((e) => {
  console.error('Preview failed:', e);
  process.exit(1);
});
