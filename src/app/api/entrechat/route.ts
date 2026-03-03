/**
 * app/api/entrechat/route.ts
 *
 * Cold start cost: ONE fs.readFileSync + JSON.parse
 * All processing done at build time by build-all-caches.ts
 */

import { ITEMS_PER_PAGE } from "@/components/enterchat/helper";
import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatItem {
  id: string; category: string; title: string; excerpt: string;
  date: string; rawDate: string; readTime: string; interviewee: string;
  image: string | null; slug: string; state?: string; country?: string;
  industrySector: string; businessStage: string; interviewFormat: string;
  founderRegion: string; successFactor: string; modifiedDate?: string;
}

interface Cache {
  items: ChatItem[];
  byCategory:      Record<string, number[]>;
  byCountry:       Record<string, number[]>;
  byIndustry:      Record<string, number[]>;
  byStage:         Record<string, number[]>;
  byFormat:        Record<string, number[]>;
  byRegion:        Record<string, number[]>;
  bySuccessFactor: Record<string, number[]>;
  bySlug:          Record<string, number>;
  categories: string[]; countries: string[]; industrySectors: string[];
  businessStages: string[]; interviewFormats: string[];
  founderRegions: string[]; successFactors: string[]; states: string[];
  totalItems: number; builtAt: number;
}

// ─── Load once per instance ───────────────────────────────────────────────────

let _cache: Cache | null = null;

function getCache(): Cache {
  if (_cache) return _cache;
  const file = path.join(process.cwd(), "public", "cache", "entrechat-cache.json");
  if (!fs.existsSync(file)) throw new Error("entrechat-cache.json missing — run npm run build:cache");
  _cache = JSON.parse(fs.readFileSync(file, "utf-8")) as Cache;
  console.log(`[entrechat] cache loaded: ${_cache.totalItems} items`);
  return _cache;
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const sp       = new URL(req.url).searchParams;
  const page     = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const category = sp.get("category") ?? "All Interviews";
  const search   = (sp.get("search") ?? "").toLowerCase().trim();
  const country  = sp.get("country") ?? "";
  const dateFrom = sp.get("dateFrom") ?? "";
  const dateTo   = sp.get("dateTo") ?? "";
  const indParam = sp.get("industries") ?? "";
  const stgParam = sp.get("stages") ?? "";
  const fmtParam = sp.get("formats") ?? "";
  const rgnParam = sp.get("regions") ?? "";
  const sfParam  = sp.get("successFactors") ?? "";
  const statesPar= sp.get("states") ?? "";
  const slugParam= sp.get("slug") ?? "";
  const metaOnly = sp.get("meta") === "1";

  try {
    const c = getCache();

    // ── Single slug lookup ────────────────────────────────────────────────
    if (slugParam) {
      const idx = c.bySlug[slugParam];
      if (idx === undefined)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ interview: c.items[idx] }, {
        headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
      });
    }

    // ── Metadata only ─────────────────────────────────────────────────────
    if (metaOnly) {
      return NextResponse.json({
        categories: c.categories, countries: c.countries, states: c.states,
        industrySectors: c.industrySectors, businessStages: c.businessStages,
        interviewFormats: c.interviewFormats, founderRegions: c.founderRegions,
        successFactors: c.successFactors,
      }, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
    }

    // ── Candidate indices ─────────────────────────────────────────────────
    let indices: number[];
    if (category !== "All Interviews" && c.byCategory[category])
      indices = c.byCategory[category];
    else if (country && c.byCountry[country])
      indices = c.byCountry[country];
    else
      indices = Array.from({ length: c.items.length }, (_, i) => i);

    // ── Parse filters ─────────────────────────────────────────────────────
    const industries    = indParam   ? indParam.split(",")    : [];
    const stages        = stgParam   ? stgParam.split(",")    : [];
    const formats       = fmtParam   ? fmtParam.split(",")    : [];
    const regions       = rgnParam   ? rgnParam.split(",")    : [];
    const successFactors= sfParam    ? sfParam.split(",")     : [];
    const states        = statesPar  ? statesPar.split(",")   : [];

    let fromDate: Date | null = null, toDate: Date | null = null;
    if (dateFrom) { fromDate = new Date(dateFrom); fromDate.setHours(0,0,0,0); if (isNaN(fromDate.getTime())) fromDate = null; }
    if (dateTo)   { toDate   = new Date(dateTo);   toDate.setHours(23,59,59,999); if (isNaN(toDate.getTime()))   toDate   = null; }

    // ── Single-pass filter ────────────────────────────────────────────────
    const filtered: ChatItem[] = [];
    for (const idx of indices) {
      const item = c.items[idx];
      if (!item) continue;
      if (category !== "All Interviews" && item.category !== category) continue;
      if (country && item.country !== country) continue;
      if (fromDate || toDate) {
        const d = new Date(item.rawDate);
        if (fromDate && d < fromDate) continue;
        if (toDate   && d > toDate)   continue;
      }
      if (states.length         && (!item.state || !states.includes(item.state))) continue;
      if (industries.length     && !industries.includes(item.industrySector)) continue;
      if (stages.length         && !stages.includes(item.businessStage)) continue;
      if (formats.length        && !formats.includes(item.interviewFormat)) continue;
      if (regions.length        && !regions.includes(item.founderRegion)) continue;
      if (successFactors.length && !successFactors.includes(item.successFactor)) continue;
      if (search) {
        const hit = item.title.toLowerCase().includes(search)           ||
                    item.excerpt.toLowerCase().includes(search)          ||
                    item.category.toLowerCase().includes(search)         ||
                    item.interviewee.toLowerCase().includes(search)      ||
                    item.industrySector.toLowerCase().includes(search)   ||
                    item.businessStage.toLowerCase().includes(search)    ||
                    item.interviewFormat.toLowerCase().includes(search)  ||
                    item.founderRegion.toLowerCase().includes(search)    ||
                    item.successFactor.toLowerCase().includes(search)    ||
                    (item.state?.toLowerCase().includes(search)   ?? false) ||
                    (item.country?.toLowerCase().includes(search) ?? false);
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
      interviews: filtered.slice(start, start + ITEMS_PER_PAGE),
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
    console.error("[entrechat] error:", err);
    return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 });
  }
}