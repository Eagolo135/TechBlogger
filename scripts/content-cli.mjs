import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parse, stringify } from "yaml";

const contentPath = path.join(process.cwd(), "content", "site-content.yaml");

function usage() {
  console.log("Usage:");
  console.log("  npm run content:list");
  console.log("  npm run content:get -- <path>");
  console.log('  npm run content:set -- <path> "<value>"');
}

function parsePathSegments(input) {
  return input
    .split(".")
    .flatMap((segment) => {
      const matches = [...segment.matchAll(/([^\[\]]+)|(\[(\d+)\])/g)];
      return matches.map((match) => (match[3] ? Number(match[3]) : match[1]));
    })
    .filter((segment) => segment !== undefined);
}

function getAtPath(root, inputPath) {
  return parsePathSegments(inputPath).reduce((value, segment) => value?.[segment], root);
}

function setAtPath(root, inputPath, nextValue) {
  const segments = parsePathSegments(inputPath);

  if (segments.length === 0) {
    throw new Error("A path is required.");
  }

  const leaf = segments.pop();
  let current = root;

  for (const segment of segments) {
    if (current?.[segment] === undefined) {
      current[segment] = typeof segment === "number" ? [] : {};
    }

    current = current[segment];
  }

  current[leaf] = nextValue;
}

function parseValue(rawValue) {
  if (rawValue === "true") {
    return true;
  }

  if (rawValue === "false") {
    return false;
  }

  if (rawValue === "null") {
    return null;
  }

  if (!Number.isNaN(Number(rawValue)) && rawValue.trim() !== "") {
    return Number(rawValue);
  }

  if (
    (rawValue.startsWith("[") && rawValue.endsWith("]")) ||
    (rawValue.startsWith("{") && rawValue.endsWith("}"))
  ) {
    return JSON.parse(rawValue);
  }

  return rawValue;
}

async function main() {
  const [command, inputPath, rawValue] = process.argv.slice(2);

  if (!command) {
    usage();
    process.exitCode = 1;
    return;
  }

  const raw = await readFile(contentPath, "utf8");
  const data = parse(raw);

  if (command === "list-posts") {
    data.posts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.slug} -> ${post.title}`);
    });
    return;
  }

  if (command === "get") {
    if (!inputPath) {
      usage();
      process.exitCode = 1;
      return;
    }

    console.log(JSON.stringify(getAtPath(data, inputPath), null, 2));
    return;
  }

  if (command === "set") {
    if (!inputPath || rawValue === undefined) {
      usage();
      process.exitCode = 1;
      return;
    }

    setAtPath(data, inputPath, parseValue(rawValue));
    await writeFile(contentPath, stringify(data), "utf8");
    console.log(`Updated ${inputPath}`);
    return;
  }

  usage();
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});