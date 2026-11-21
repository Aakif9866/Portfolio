import type { MetadataRoute } from "next";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { getPosts } from "@/lib/journal";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = [
    "",
    "/projects",
    "/backend",
    "/ai",
    "/journal",
    ...projects.map((p) => `/projects/${p.slug}`),
    ...(await getPosts()).map((p) => `/journal/${p.slug}`),
  ];
  return paths.map((p) => ({ url: `${profile.siteUrl}${p}` }));
}
