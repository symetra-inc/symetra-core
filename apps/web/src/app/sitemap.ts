import type { MetadataRoute } from "next";
import { POSTS } from "./blog/posts";

const BASE = "https://www.symetra.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.7 },
    ...POSTS.map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: p.date,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
