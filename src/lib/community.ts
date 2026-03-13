export type CommunityProfile = {
  name: string;
  email: string;
  createdAt: string;
  provider?: "local" | "google";
  avatarUrl?: string;
};

export type CommunityPost = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string[];
  createdAt: string;
  authorName: string;
};

const PROFILE_KEY = "techblogger_profile_v1";
const POSTS_KEY = "techblogger_posts_v1";

function hasWindow() {
  return typeof window !== "undefined";
}

export function getProfile(): CommunityProfile | null {
  if (!hasWindow()) {
    return null;
  }

  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CommunityProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: CommunityProfile) {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getCommunityPosts(): CommunityPost[] {
  if (!hasWindow()) {
    return [];
  }

  const raw = window.localStorage.getItem(POSTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const posts = JSON.parse(raw) as CommunityPost[];
    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export function getCommunityPostById(id: string): CommunityPost | null {
  const posts = getCommunityPosts();
  return posts.find((post) => post.id === id) ?? null;
}

export function saveCommunityPost(post: Omit<CommunityPost, "id" | "createdAt">): CommunityPost | null {
  if (!hasWindow()) {
    return null;
  }

  const nextPost: CommunityPost = {
    ...post,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };

  const current = getCommunityPosts();
  current.unshift(nextPost);
  window.localStorage.setItem(POSTS_KEY, JSON.stringify(current));
  return nextPost;
}