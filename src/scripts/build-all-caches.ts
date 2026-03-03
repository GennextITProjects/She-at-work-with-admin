/*eslint-disable @typescript-eslint/no-explicit-any */
/**
 * scripts/build-all-caches.ts
 *
 * Run ONCE at build time via package.json:
 *   "prebuild": "tsx scripts/build-all-caches.ts"
 *
 * Outputs:
 *   public/cache/blogs-cache.json
 *   public/cache/entrechat-cache.json
 *   public/cache/news-cache.json
 *
 * ALL heavy processing (mapping, sorting, indexing, string ops) happens here.
 * API routes just do JSON.parse() on cold start — microseconds, not seconds.
 */

import * as fs from "fs";
import * as path from "path";

// ── Adjust these import paths to match your project structure ────────────────
import { blogsData } from "../data/Blogs";
import { entrechatData } from "../data/Entrechat";
import { newsData } from "../data/news";

import {
  BlogItem,
  calculateReadTime as blogReadTime,
  extractAuthor,
  extractExcerpt as blogExcerpt,
  formatDate as blogFormatDate,
  getCategoryFromContent as blogCategory,
  getLocationData as blogLocation,
  getProficiencyLevel,
  getReadingTimeCategory,
} from "../components/blogs/helper";

import {
  EntreChatItem,
  calculateReadTime as chatReadTime,
  extractExcerpt as chatExcerpt,
  extractInterviewee,
  formatDate as chatFormatDate,
  getBusinessStage,
  getCategoryFromContent as chatCategory,
  getFounderRegion,
  getIndustrySector,
  getInterviewFormat,
  getLocationData as chatLocation,
  getSuccessFactor,
} from "../components/enterchat/helper";

import {
  calculateReadTime as newsReadTime,
  extractExcerpt as newsExcerpt,
  formatDate as newsFormatDate,
  getCategoryAndTagsFromContent,
  getLocationData as newsLocation,
  getSourceFromUrl,
  getSourceType,
} from "../components/news/helper";

// ─── Shared utility ───────────────────────────────────────────────────────────

const OUT_DIR = path.join(process.cwd(), "public", "cache");

function write(filename: string, data: unknown): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const filePath = path.join(OUT_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data), "utf-8");
  const kb = (fs.statSync(filePath).size / 1024).toFixed(1);
  console.log(`  ✅  ${filename} — ${kb} KB`);
}

function push<T>(map: Record<string, T[]>, key: string | undefined, val: T) {
  if (!key) return;
  (map[key] ??= []).push(val);
}

// ─── 1. BLOGS ─────────────────────────────────────────────────────────────────

function buildBlogsCache() {
  console.log(`\n📦  Blogs — processing ${blogsData.length} items…`);

  const items: object[] = [];

  for (const raw of blogsData as BlogItem[]) {
    if (!raw || (raw as any).post_status === "draft") continue;
    try {
      const rawDate = new Date(raw.post_date);
      if (isNaN(rawDate.getTime())) continue;

      const location = blogLocation(raw.ID, raw.post_content);

      items.push({
        id:                 String(raw.ID ?? Math.random()),
        category:           blogCategory(raw.post_content),
        title:              (raw.post_title ?? "Untitled").replace(/&amp;/g, "&"),
        excerpt:            raw.post_excerpt?.trim() ? raw.post_excerpt : blogExcerpt(raw.post_content),
        date:               blogFormatDate(raw.post_date),
        rawDate:            rawDate.toISOString(),
        readTime:           blogReadTime(raw.post_content),
        readingTimeCategory: getReadingTimeCategory(raw.post_content),
        proficiencyLevel:   getProficiencyLevel(raw.post_content),
        author:             extractAuthor(raw.post_content),
        image:              raw.featured_image_url?.trim() || null,
        slug:               raw.post_name ?? `blog-${raw.ID}`,
        state:              location.state   || undefined,
        country:            location.country || undefined,
        modifiedDate:       raw.post_modified ? blogFormatDate(raw.post_modified) : undefined,
      });
    } catch (e) {
      console.warn(`  ⚠️  Skipping blog ${raw.ID}:`, e);
    }
  }

  items.sort((a: any, b: any) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const byCategory:    Record<string, number[]> = {};
  const byCountry:     Record<string, number[]> = {};
  const byReadingTime: Record<string, number[]> = {};
  const byProficiency: Record<string, number[]> = {};
  const bySlug:        Record<string, number>   = {};

  (items as any[]).forEach((item, idx) => {
    push(byCategory,    item.category,            idx);
    push(byCountry,     item.country,             idx);
    push(byReadingTime, item.readingTimeCategory, idx);
    push(byProficiency, item.proficiencyLevel,    idx);
    if (item.slug) bySlug[item.slug] = idx;
  });

  write("blogs-cache.json", {
    items,
    byCategory,
    byCountry,
    byReadingTime,
    byProficiency,
    bySlug,
    countries:        Object.keys(byCountry).sort(),
    categories:       Object.keys(byCategory).sort(),
    readingTimes:     Object.keys(byReadingTime).sort(),
    proficiencyLevels: Object.keys(byProficiency).sort(),
    builtAt:          Date.now(),
    totalItems:       items.length,
  });
}

// ─── 2. ENTRECHAT ─────────────────────────────────────────────────────────────

function buildEntrechatCache() {
  console.log(`\n📦  EntreChat — processing ${entrechatData.length} items…`);

  const items: object[] = [];

  for (const raw of entrechatData as EntreChatItem[]) {
    if (!raw) continue;
    try {
      const rawDate = new Date(raw.post_date);
      if (isNaN(rawDate.getTime())) continue;

      const location = chatLocation(raw.ID, raw.post_content);
      const title    = (raw.post_title ?? "EntreChat Interview").replace(/&amp;/g, "&");

      items.push({
        id:              String(raw.ID ?? Math.random()),
        category:        chatCategory(raw.post_content),
        title,
        excerpt:         raw.post_excerpt?.trim() ? raw.post_excerpt : chatExcerpt(raw.post_content),
        date:            chatFormatDate(raw.post_date),
        rawDate:         rawDate.toISOString(),
        readTime:        chatReadTime(raw.post_content),
        interviewee:     extractInterviewee(title),
        image:           raw.featured_image_url?.trim() || null,
        slug:            raw.post_name ?? `entrechat-${raw.ID}`,
        state:           location.state   || undefined,
        country:         location.country || undefined,
        industrySector:  getIndustrySector(raw.post_content),
        businessStage:   getBusinessStage(raw.post_content),
        interviewFormat: getInterviewFormat(raw.post_content),
        founderRegion:   getFounderRegion(raw.post_content),
        successFactor:   getSuccessFactor(raw.post_content),
        modifiedDate:    raw.post_modified ? chatFormatDate(raw.post_modified) : undefined,
      });
    } catch (e) {
      console.warn(`  ⚠️  Skipping entrechat ${raw.ID}:`, e);
    }
  }

  items.sort((a: any, b: any) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const byCategory:      Record<string, number[]> = {};
  const byCountry:       Record<string, number[]> = {};
  const byIndustry:      Record<string, number[]> = {};
  const byStage:         Record<string, number[]> = {};
  const byFormat:        Record<string, number[]> = {};
  const byRegion:        Record<string, number[]> = {};
  const bySuccessFactor: Record<string, number[]> = {};
  const bySlug:          Record<string, number>   = {};
  const statesSet = new Set<string>();

  (items as any[]).forEach((item, idx) => {
    push(byCategory,      item.category,       idx);
    push(byCountry,       item.country,        idx);
    push(byIndustry,      item.industrySector, idx);
    push(byStage,         item.businessStage,  idx);
    push(byFormat,        item.interviewFormat,idx);
    push(byRegion,        item.founderRegion,  idx);
    push(bySuccessFactor, item.successFactor,  idx);
    if (item.slug)  bySlug[item.slug] = idx;
    if (item.state) statesSet.add(item.state);
  });

  write("entrechat-cache.json", {
    items,
    byCategory,
    byCountry,
    byIndustry,
    byStage,
    byFormat,
    byRegion,
    bySuccessFactor,
    bySlug,
    categories:       Object.keys(byCategory).sort(),
    countries:        Object.keys(byCountry).sort(),
    industrySectors:  Object.keys(byIndustry).sort(),
    businessStages:   Object.keys(byStage).sort(),
    interviewFormats: Object.keys(byFormat).sort(),
    founderRegions:   Object.keys(byRegion).sort(),
    successFactors:   Object.keys(bySuccessFactor).sort(),
    states:           Array.from(statesSet).sort(),
    builtAt:          Date.now(),
    totalItems:       items.length,
  });
}

// ─── 3. NEWS ──────────────────────────────────────────────────────────────────

function buildNewsCache() {
  console.log(`\n📦  News — processing ${newsData.length} items…`);

  const items: object[] = [];

  for (const raw of newsData as any[]) {
    if (!raw) continue;
    try {
      const rawDate = new Date(raw.post_date);
      if (isNaN(rawDate.getTime())) continue;

      const { category, topicTags } = getCategoryAndTagsFromContent(raw.post_content);
      const excerpt  = raw.post_excerpt?.trim() ? raw.post_excerpt : newsExcerpt(raw.post_content);
      const location = newsLocation(raw.post_content);

      items.push({
        id:          String(raw.ID ?? Math.random()),
        category,
        title:       (raw.post_title ?? "Untitled").replace(/&amp;/g, "&"),
        excerpt,
        date:        newsFormatDate(raw.post_date),
        rawDate:     rawDate.toISOString(),
        readTime:    newsReadTime(excerpt),
        source:      getSourceFromUrl(raw.external_url),
        sourceType:  getSourceType(raw.external_url, raw.post_content),
        image:       raw.featured_image_url?.trim() ? raw.featured_image_url : "/placeholder-news.jpg",
        externalUrl: raw.external_url?.trim() || null,
        slug:        raw.post_name ?? `news-${raw.ID}`,
        state:       location.state   || undefined,
        country:     location.country || undefined,
        city:        location.city    || undefined,
        region:      location.region  || undefined,
        topicTags,
        modifiedDate: raw.post_modified ? newsFormatDate(raw.post_modified) : undefined,
      });
    } catch (e) {
      console.warn(`  ⚠️  Skipping news ${raw.ID}:`, e);
    }
  }

  items.sort((a: any, b: any) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const byCategory: Record<string, number[]> = {};
  const byCountry:  Record<string, number[]> = {};
  const bySlug:     Record<string, number>   = {};

  (items as any[]).forEach((item, idx) => {
    push(byCategory, item.category, idx);
    push(byCountry,  item.country,  idx);
    if (item.slug) bySlug[item.slug] = idx;
  });

  write("news-cache.json", {
    items,
    byCategory,
    byCountry,
    bySlug,
    categories:  Object.keys(byCategory).sort(),
    countries:   Object.keys(byCountry).sort(),
    builtAt:     Date.now(),
    totalItems:  items.length,
  });
}

// ─── Run all ──────────────────────────────────────────────────────────────────

console.log("🚀  Building all static caches…");
const t = Date.now();
buildBlogsCache();
buildEntrechatCache();
buildNewsCache();
console.log(`\n✨  Done in ${Date.now() - t}ms\n`);