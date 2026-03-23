// In-memory mock WordPress data store
// Persists across requests within the same server process, resets on restart

import { NextRequest } from "next/server";

export interface MockCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  description: string;
  parent: number;
}

export interface MockTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface MockPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  link: string;
  status: string;
  date: string;
  slug: string;
  categories: number[];
  tags: number[];
  featured_media: number;
}

export interface MockMedia {
  id: number;
  source_url: string;
  title: { rendered: string };
  media_type: string;
}

// --- Hardcoded categories ---
const categories: MockCategory[] = [
  { id: 1, name: "Technology", slug: "technology", count: 0, description: "", parent: 0 },
  { id: 2, name: "Business & Strategy", slug: "business-strategy", count: 0, description: "", parent: 0 },
  { id: 3, name: "Digital Marketing", slug: "digital-marketing", count: 0, description: "", parent: 0 },
  { id: 4, name: "Content Marketing", slug: "content-marketing", count: 0, description: "", parent: 0 },
  { id: 5, name: "SEO & Analytics", slug: "seo-analytics", count: 0, description: "", parent: 0 },
  { id: 6, name: "Social Media", slug: "social-media", count: 0, description: "", parent: 0 },
  { id: 7, name: "E-Commerce", slug: "e-commerce", count: 0, description: "", parent: 0 },
  { id: 8, name: "Startup Life", slug: "startup-life", count: 0, description: "", parent: 0 },
  { id: 9, name: "AI & Machine Learning", slug: "ai-machine-learning", count: 0, description: "", parent: 0 },
  { id: 10, name: "Design & UX", slug: "design-ux", count: 0, description: "", parent: 0 },
  { id: 11, name: "Industry News", slug: "industry-news", count: 0, description: "", parent: 0 },
  { id: 12, name: "Case Studies", slug: "case-studies", count: 0, description: "", parent: 0 },
];

// --- Pre-seeded tags ---
const tags: MockTag[] = [
  { id: 1, name: "marketing", slug: "marketing", count: 0 },
  { id: 2, name: "seo", slug: "seo", count: 0 },
  { id: 3, name: "content-strategy", slug: "content-strategy", count: 0 },
  { id: 4, name: "digital-transformation", slug: "digital-transformation", count: 0 },
  { id: 5, name: "analytics", slug: "analytics", count: 0 },
  { id: 6, name: "branding", slug: "branding", count: 0 },
  { id: 7, name: "growth", slug: "growth", count: 0 },
  { id: 8, name: "automation", slug: "automation", count: 0 },
  { id: 9, name: "best-practices", slug: "best-practices", count: 0 },
  { id: 10, name: "trends", slug: "trends", count: 0 },
];

const posts: Map<number, MockPost> = new Map();
const media: Map<number, MockMedia> = new Map();

let nextTagId = 11;
let nextPostId = 1;
let nextMediaId = 1;

// --- Exported functions ---

export function getCategories(): MockCategory[] {
  return categories;
}

export function getTags(search?: string): MockTag[] {
  if (!search) return tags;
  const term = search.toLowerCase();
  return tags.filter((t) => t.name.toLowerCase().includes(term));
}

export function createTag(name: string): MockTag {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const tag: MockTag = { id: nextTagId++, name, slug, count: 0 };
  tags.push(tag);
  return tag;
}

export function getPosts(perPage = 20, page = 1): MockPost[] {
  const all = Array.from(posts.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const start = (page - 1) * perPage;
  return all.slice(start, start + perPage);
}

export function createPost(
  data: {
    title: string;
    content: string;
    status: string;
    categories?: number[];
    tags?: number[];
    excerpt?: string;
    slug?: string;
    featured_media?: number;
  },
  baseUrl: string
): MockPost {
  const id = nextPostId++;
  const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const post: MockPost = {
    id,
    title: { rendered: data.title },
    content: { rendered: data.content },
    excerpt: { rendered: data.excerpt || "" },
    link: `${baseUrl}/api/mock-wp/blog/${id}`,
    status: data.status,
    date: new Date().toISOString(),
    slug,
    categories: data.categories || [],
    tags: data.tags || [],
    featured_media: data.featured_media || 0,
  };
  posts.set(id, post);
  return post;
}

export function getPostById(id: number): MockPost | undefined {
  return posts.get(id);
}

export function createMedia(filename: string): MockMedia {
  const id = nextMediaId++;
  const entry: MockMedia = {
    id,
    source_url: `https://placeholder.example/wp-content/uploads/${filename}`,
    title: { rendered: filename },
    media_type: "image",
  };
  media.set(id, entry);
  return entry;
}

export function getSiteInfo() {
  return {
    name: "Demo WordPress Site",
    description: "A demo site for testing the Content Command Center publishing flow",
    url: "",
    version: "6.7.1",
    namespaces: ["wp/v2"],
    authentication: {
      "application-passwords": {
        endpoints: { authorization: "" },
      },
    },
  };
}

export function validateMockAuth(req: NextRequest): boolean {
  return !!req.headers.get("authorization");
}

export function getBaseUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}
