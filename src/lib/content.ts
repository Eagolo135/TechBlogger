import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

export type NavigationItem = {
  label: string;
  href: string;
};

export type Action = {
  label: string;
  href: string;
};

export type Stat = {
  label: string;
  value: string;
  detail: string;
};

export type RadarItem = {
  label: string;
  value: string;
  detail: string;
};

export type TimelineEntry = {
  phase: string;
  title: string;
  description: string;
};

export type FeaturedTopic = {
  slug: string;
  name: string;
  metric: string;
  description: string;
};

export type Metric = {
  label: string;
  value: string;
};

export type PostSection = {
  heading: string;
  body: string;
  callout?: string;
  bullets?: string[];
};

export type Author = {
  name: string;
  role: string;
  bio: string;
};

export type Post = {
  slug: string;
  title: string;
  deck: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTime: string;
  featured: boolean;
  tags: string[];
  metrics: Metric[];
  keyTakeaways: string[];
  author: Author;
  sections: PostSection[];
};

export type WorkflowStep = {
  title: string;
  description: string;
  command: string;
};

export type DemoStep = {
  title: string;
  duration: string;
  description: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type SiteContent = {
  site: {
    name: string;
    tagline: string;
    description: string;
    lastUpdated: string;
    navigation: NavigationItem[];
    primaryAction: Action;
    marquee: string[];
    hero: {
      eyebrow: string;
      title: string;
      summary: string;
      primaryAction: Action;
      secondaryAction: Action;
    };
    stats: Stat[];
    radar: {
      title: string;
      summary: string;
      items: RadarItem[];
    };
    timeline: TimelineEntry[];
    footer: {
      title: string;
      summary: string;
      primaryAction: Action;
    };
  };
  feedFilters: string[];
  featuredTopics: FeaturedTopic[];
  workflow: {
    title: string;
    summary: string;
    steps: WorkflowStep[];
  };
  demo: {
    title: string;
    summary: string;
    steps: DemoStep[];
  };
  faq: FaqItem[];
  posts: Post[];
};

const contentPath = path.join(process.cwd(), "content", "site-content.yaml");

function parseContent(): SiteContent {
  const raw = readFileSync(contentPath, "utf8");
  const parsed = parse(raw) as SiteContent;

  if (!parsed?.site || !Array.isArray(parsed?.posts)) {
    throw new Error("The site content file is missing required sections.");
  }

  return parsed;
}

export function getSiteContent() {
  return parseContent();
}

export function getPostBySlug(slug: string) {
  return getSiteContent().posts.find((post) => post.slug === slug);
}