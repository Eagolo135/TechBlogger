import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parse } from "yaml";

const contentPath = path.join(process.cwd(), "content", "site-content.yaml");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const raw = await readFile(contentPath, "utf8");
  const data = parse(raw);

  assert(data.site?.name, "site.name is required");
  assert(Array.isArray(data.feedFilters) && data.feedFilters.length > 0, "feedFilters must contain at least one entry");
  assert(Array.isArray(data.posts) && data.posts.length > 0, "posts must contain at least one entry");

  const seenSlugs = new Set();

  data.posts.forEach((post, index) => {
    assert(post.slug, `posts[${index}].slug is required`);
    assert(!seenSlugs.has(post.slug), `Duplicate slug found: ${post.slug}`);
    seenSlugs.add(post.slug);
    assert(post.title, `posts[${index}].title is required`);
    assert(post.excerpt, `posts[${index}].excerpt is required`);
    assert(Array.isArray(post.sections) && post.sections.length > 0, `posts[${index}].sections must not be empty`);
    post.sections.forEach((section, sectionIndex) => {
      assert(section.heading, `posts[${index}].sections[${sectionIndex}].heading is required`);
      assert(section.body, `posts[${index}].sections[${sectionIndex}].body is required`);
    });
  });

  console.log(`Validated ${data.posts.length} posts from ${contentPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});