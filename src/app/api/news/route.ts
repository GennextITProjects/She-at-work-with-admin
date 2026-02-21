/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/news/route.ts
//
// PERFORMANCE STRATEGY:
//   1. Module-level cache  – processedNews is built ONCE on first request,
//      then reused for every subsequent call (O(1) lookup).
//   2. Index maps          – country / category / state lookup via Map instead
//      of repeated .filter() over the full array.
//   3. Lightweight payload – fullContent is stripped before sending to client;
//      only fields the UI actually renders are included.
//   4. HTTP Cache-Control  – CDN/browser can cache for 60 s (adjust freely).

import {
  calculateReadTime,
  extractExcerpt,
  formatDate,
  getCategoryAndTagsFromContent,
  getLocationData,
  getSourceFromUrl,
  getSourceType,
  ITEMS_PER_PAGE,
} from "@/components/news/helper";
import { newsData } from "@/data/news";
import { NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProcessedItem {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  rawDate: Date;
  readTime: string;
  source: string;
  sourceType: string;
  image: string;
  externalUrl: string | null;
  slug: string;
  state?: string;
  country?: string;
  city?: string;
  region?: string;
  topicTags: string[];
  modifiedDate?: string;
}

interface CacheStore {
  items: ProcessedItem[];
  /** country → indices into `items` */
  byCountry: Map<string, number[]>;
  /** category → indices into `items` */
  byCategory: Map<string, number[]>;
  /** sorted unique country list */
  countries: string[];
  /** sorted unique category list */
  categories: string[];
  builtAt: number;
}

// ─── Module-level singleton cache ────────────────────────────────────────────

let _cache: CacheStore | null = null;
// Re-build cache if data is stale (10 min). Set to 0 to disable TTL.
const CACHE_TTL_MS = 10 * 60 * 1000;

function buildCache(): CacheStore {
  const items: ProcessedItem[] = newsData.map((item: any) => {
    const { category, topicTags } = getCategoryAndTagsFromContent(item.post_content);

    const excerpt =
      item.post_excerpt?.trim()
        ? item.post_excerpt
        : extractExcerpt(item.post_content);

    const title = item.post_title
      ? item.post_title.replace(/&amp;/g, "&")
      : "Untitled";

    const location = getLocationData(item.post_content);

    return {
      id: String(item.ID ?? Math.random()),
      category,
      title,
      excerpt,
      date: formatDate(item.post_date),
      rawDate: new Date(item.post_date),
      readTime: calculateReadTime(excerpt),
      source: getSourceFromUrl(item.external_url),
      sourceType: getSourceType(item.external_url, item.post_content),
      image:
        item.featured_image_url?.trim()
          ? item.featured_image_url
          : "/placeholder-news.jpg",
      externalUrl: item.external_url?.trim() ? item.external_url : null,
      slug: item.post_name ?? `news-${item.ID}`,
      state: location.state,
      country: location.country,
      city: location.city,
      region: location.region,
      topicTags,
      modifiedDate: item.post_modified
        ? formatDate(item.post_modified)
        : undefined,
    };
  });

  // Sort newest-first once
  items.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

  // Build index maps for O(1) filtered lookups
  const byCountry = new Map<string, number[]>();
  const byCategory = new Map<string, number[]>();

  items.forEach((item, idx) => {
    if (item.country) {
      const list = byCountry.get(item.country) ?? [];
      list.push(idx);
      byCountry.set(item.country, list);
    }
    {
      const list = byCategory.get(item.category) ?? [];
      list.push(idx);
      byCategory.set(item.category, list);
    }
  });

  const countries = Array.from(byCountry.keys()).sort();
  const categories = Array.from(byCategory.keys()).sort();

  return { items, byCountry, byCategory, countries, categories, builtAt: Date.now() };
}

function getCache(): CacheStore {
  if (!_cache || (CACHE_TTL_MS > 0 && Date.now() - _cache.builtAt > CACHE_TTL_MS)) {
    _cache = buildCache();
  }
  return _cache;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const category = searchParams.get("category") ?? "All News";
  const search = (searchParams.get("search") ?? "").toLowerCase().trim();
  const country = searchParams.get("country") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const sourceTypesParam = searchParams.get("sourceTypes") ?? "";
  const statesParam = searchParams.get("states") ?? "";
  const regionsParam = searchParams.get("regions") ?? "";
  // Special mode: return metadata only (countries list etc.)
  const metaOnly = searchParams.get("meta") === "1";

  try {
    const cache = getCache();

    // ── Metadata-only response (for populating filter dropdowns) ──────────
    if (metaOnly) {
      return NextResponse.json(
        { countries: cache.countries, categories: cache.categories },
        { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } }
      );
    }

    // ── Determine candidate indices ───────────────────────────────────────
    let indices: number[];

    if (category !== "All News" && cache.byCategory.has(category)) {
      indices = cache.byCategory.get(category)!;
    } else if (country && cache.byCountry.has(country)) {
      indices = cache.byCountry.get(country)!;
    } else {
      // All items – use an index array to keep it lazy
      indices = Array.from({ length: cache.items.length }, (_, i) => i);
    }

    // ── Apply remaining filters in a single pass ───────────────────────────
    const sourceTypes = sourceTypesParam ? sourceTypesParam.split(",") : [];
    const states = statesParam ? statesParam.split(",") : [];
    const regions = regionsParam ? regionsParam.split(",") : [];

    let fromDate: Date | null = null;
    let toDate: Date | null = null;
    if (dateFrom) { fromDate = new Date(dateFrom); fromDate.setHours(0, 0, 0, 0); }
    if (dateTo) { toDate = new Date(dateTo); toDate.setHours(23, 59, 59, 999); }

    const filtered: ProcessedItem[] = [];

    for (const idx of indices) {
      const item = cache.items[idx];

      // Category (when indices already narrowed, skip re-check)
      if (category !== "All News" && item.category !== category) continue;

      // Country (when indices already narrowed, skip re-check)
      if (country && item.country !== country) continue;

      // Date range
      if (fromDate && item.rawDate < fromDate) continue;
      if (toDate && item.rawDate > toDate) continue;

      // States
      if (states.length > 0 && (!item.state || !states.includes(item.state))) continue;

      // Regions
      if (regions.length > 0 && (!item.region || !regions.includes(item.region))) continue;

      // Source types
      if (sourceTypes.length > 0 && !sourceTypes.includes(item.sourceType)) continue;

      // Full-text search (last — most expensive)
      if (search) {
        const hit =
          item.title.toLowerCase().includes(search) ||
          item.excerpt.toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search) ||
          item.source.toLowerCase().includes(search) ||
          (item.state?.toLowerCase().includes(search) ?? false) ||
          (item.country?.toLowerCase().includes(search) ?? false) ||
          (item.city?.toLowerCase().includes(search) ?? false) ||
          (item.region?.toLowerCase().includes(search) ?? false) ||
          item.topicTags.some((t) => t.toLowerCase().includes(search));
        if (!hit) continue;
      }

      filtered.push(item);
    }

    // ── Pagination ────────────────────────────────────────────────────────
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

    // ── Serialise (strip rawDate Date objects, omit fullContent) ──────────
    const news = pageItems.map(({ rawDate, ...rest }) => ({
      ...rest,
      rawDate: rawDate.toISOString(),
    }));

    return NextResponse.json(
      {
        news,
        totalPages,
        currentPage: safePage,
        totalItems,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("News API error:", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}