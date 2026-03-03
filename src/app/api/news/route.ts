/**
 * app/api/news/route.ts
 *
 * Cold start cost: ONE fs.readFileSync + JSON.parse
 * All processing done at build time by build-all-caches.ts
 */

import { ITEMS_PER_PAGE } from "@/components/news/helper";
import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsItem {
  id: string; category: string; title: string; excerpt: string;
  date: string; rawDate: string; readTime: string; source: string;
  sourceType: string; image: string; externalUrl: string | null;
  slug: string; state?: string; country?: string; city?: string;
  region?: string; topicTags: string[]; modifiedDate?: string;
}

interface Cache {
  items: NewsItem[];
  byCategory: Record<string, number[]>;
  byCountry:  Record<string, number[]>;
  bySlug:     Record<string, number>;
  categories: string[]; countries: string[];
  totalItems: number; builtAt: number;
}

// ─── Load once per instance ───────────────────────────────────────────────────

let _cache: Cache | null = null;

function getCache(): Cache {
  if (_cache) return _cache;
  const file = path.join(process.cwd(), "public", "cache", "news-cache.json");
  if (!fs.existsSync(file)) throw new Error("news-cache.json missing — run npm run build:cache");
  _cache = JSON.parse(fs.readFileSync(file, "utf-8")) as Cache;
  console.log(`[news] cache loaded: ${_cache.totalItems} items`);
  return _cache;
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const sp          = new URL(req.url).searchParams;
  const page        = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const category    = sp.get("category") ?? "All News";
  const search      = (sp.get("search") ?? "").toLowerCase().trim();
  const country     = sp.get("country") ?? "";
  const dateFrom    = sp.get("dateFrom") ?? "";
  const dateTo      = sp.get("dateTo") ?? "";
  const srcParam    = sp.get("sourceTypes") ?? "";
  const statesPar   = sp.get("states") ?? "";
  const regionsParam= sp.get("regions") ?? "";
  const slugParam   = sp.get("slug") ?? "";
  const metaOnly    = sp.get("meta") === "1";

  try {
    const c = getCache();

    // ── Single slug lookup ────────────────────────────────────────────────
    if (slugParam) {
      const idx = c.bySlug[slugParam];
      if (idx === undefined)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ news: c.items[idx] }, {
        headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
      });
    }

    // ── Metadata only ─────────────────────────────────────────────────────
    if (metaOnly) {
      return NextResponse.json({
        countries: c.countries, categories: c.categories,
      }, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
    }

    // ── Candidate indices ─────────────────────────────────────────────────
    let indices: number[];
    if (category !== "All News" && c.byCategory[category])
      indices = c.byCategory[category];
    else if (country && c.byCountry[country])
      indices = c.byCountry[country];
    else
      indices = Array.from({ length: c.items.length }, (_, i) => i);

    // ── Parse filters ─────────────────────────────────────────────────────
    const sourceTypes = srcParam    ? srcParam.split(",")     : [];
    const states      = statesPar   ? statesPar.split(",")    : [];
    const regions     = regionsParam? regionsParam.split(",") : [];

    let fromDate: Date | null = null, toDate: Date | null = null;
    if (dateFrom) { fromDate = new Date(dateFrom); fromDate.setHours(0,0,0,0); if (isNaN(fromDate.getTime())) fromDate = null; }
    if (dateTo)   { toDate   = new Date(dateTo);   toDate.setHours(23,59,59,999); if (isNaN(toDate.getTime()))   toDate   = null; }

    // ── Single-pass filter ────────────────────────────────────────────────
    const filtered: NewsItem[] = [];
    for (const idx of indices) {
      const item = c.items[idx];
      if (!item) continue;
      if (category !== "All News" && item.category !== category) continue;
      if (country && item.country !== country) continue;
      if (fromDate || toDate) {
        const d = new Date(item.rawDate);
        if (fromDate && d < fromDate) continue;
        if (toDate   && d > toDate)   continue;
      }
      if (states.length      && (!item.state  || !states.includes(item.state))) continue;
      if (regions.length     && (!item.region || !regions.includes(item.region))) continue;
      if (sourceTypes.length && !sourceTypes.includes(item.sourceType)) continue;
      if (search) {
        const hit = item.title.toLowerCase().includes(search)    ||
                    item.excerpt.toLowerCase().includes(search)   ||
                    item.category.toLowerCase().includes(search)  ||
                    item.source.toLowerCase().includes(search)    ||
                    (item.state?.toLowerCase().includes(search)   ?? false) ||
                    (item.country?.toLowerCase().includes(search) ?? false) ||
                    (item.city?.toLowerCase().includes(search)    ?? false) ||
                    (item.region?.toLowerCase().includes(search)  ?? false) ||
                    item.topicTags.some(t => t.toLowerCase().includes(search));
        if (!hit) continue;
      }
      filtered.push(item);
    }

    // ── Paginate ──────────────────────────────────────────────────────────
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const safePage   = Math.min(page, totalPages);
    const start      = (safePage - 1) * ITEMS_PER_PAGE;

    return NextResponse.json({
      news: filtered.slice(start, start + ITEMS_PER_PAGE),
      totalPages, currentPage: safePage, totalItems,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    }, {
      headers: {
        "Cache-Control": search
          ? "no-store"
          : "public, max-age=60, stale-while-revalidate=300",
      },
    });

  } catch (err) {
    console.error("[news] error:", err);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}