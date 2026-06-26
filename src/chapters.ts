import { load } from "cheerio";
import type { Chapter } from "./types.js";

const CHAPTER_PATH_PATTERN = /^\/chapters\/(?<id>\d+)\/(?<slug>[^/?#]+)$/;
const ONE_PIECE_CHAPTER_SLUG_PATTERN = /^one-piece-chapter-\d+/;

export function parseChapterList(html: string, baseUrl: string): Chapter[] {
  const $ = load(html);
  const chapters = new Map<string, Chapter>();

  $("a[href^='/chapters/']").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;

    const url = new URL(href, baseUrl);
    const match = url.pathname.match(CHAPTER_PATH_PATTERN);
    if (!match?.groups) return;

    const id = match.groups.id;
    const slug = match.groups.slug;
    if (!id || !slug || chapters.has(slug)) return;
    if (!ONE_PIECE_CHAPTER_SLUG_PATTERN.test(slug)) return;

    const card = $(element).closest(".bg-card");
    const title = cleanText($(element).text()) || titleFromSlug(slug);
    const publishedAt = card.find("time-ago").attr("datetime");

    chapters.set(slug, {
      id,
      slug,
      title,
      url: url.toString(),
      publishedAt,
    });
  });

  return [...chapters.values()];
}

export function parseChapterImages(html: string, pageUrl: string): string[] {
  const $ = load(html);
  const urls: string[] = [];

  $("picture img.fixed-ratio-content[src], .fixed-ratio img[src]").each((_, element) => {
    const src = $(element).attr("src");
    if (src) urls.push(new URL(src, pageUrl).toString());
  });

  if (urls.length === 0) {
    $("img[src*='cdn.onepiecechapters.com']").each((_, element) => {
      const src = $(element).attr("src");
      if (src) urls.push(new URL(src, pageUrl).toString());
    });
  }

  return dedupe(urls);
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}
