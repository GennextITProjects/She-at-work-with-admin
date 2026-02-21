import {
  calculateReadTime,
  EntreChatItem,
  extractExcerpt,
  extractInterviewee,
  formatDate,
  getBusinessStage,
  getCategoryFromContent,
  getFounderRegion,
  getIndustrySector,
  getInterviewFormat,
  getLocationData,
  getSuccessFactor,
  ITEMS_PER_PAGE
} from "@/components/enterchat/helper";
import { entrechatData } from "@/data/Entrechat";
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
  interviewee: string;
  image: string | null;
  slug: string;
  state?: string;
  country?: string;
  industrySector: string;
  businessStage: string;
  interviewFormat: string;
  founderRegion: string;
  successFactor: string;
  modifiedDate?: string;
}

interface CacheStore {
  items: ProcessedItem[];
  byCategory: Map<string, number[]>;
  byCountry: Map<string, number[]>;
  byIndustry: Map<string, number[]>;
  byStage: Map<string, number[]>;
  byFormat: Map<string, number[]>;
  byRegion: Map<string, number[]>;
  bySuccessFactor: Map<string, number[]>;
  // Sorted unique lists for ?meta=1
  categories: string[];
  countries: string[];
  industrySectors: string[];
  businessStages: string[];
  interviewFormats: string[];
  founderRegions: string[];
  successFactors: string[];
  states: string[];
  builtAt: number;
}

// ─── Singleton cache ──────────────────────────────────────────────────────────

let _cache: CacheStore | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

function buildCache(): CacheStore {
  const items: ProcessedItem[] = (entrechatData as EntreChatItem[]).map((item) => {
    const category = getCategoryFromContent(item.post_content);
    const excerpt =
      item.post_excerpt?.trim()
        ? item.post_excerpt
        : extractExcerpt(item.post_content);
    const title = item.post_title
      ? item.post_title.replace(/&amp;/g, "&")
      : "EntreChat Interview";
    const location = getLocationData(item.ID, item.post_content);

    return {
      id: String(item.ID ?? Math.random()),
      category,
      title,
      excerpt,
      date: formatDate(item.post_date),
      rawDate: new Date(item.post_date),
      readTime: calculateReadTime(item.post_content),
      interviewee: extractInterviewee(title),
      image: item.featured_image_url?.trim() ? item.featured_image_url : null,
      slug: item.post_name ?? `entrechat-${item.ID}`,
      state: location.state,
      country: location.country,
      industrySector: getIndustrySector(item.post_content),
      businessStage: getBusinessStage(item.post_content),
      interviewFormat: getInterviewFormat(item.post_content),
      founderRegion: getFounderRegion(item.post_content),
      successFactor: getSuccessFactor(item.post_content),
      modifiedDate: item.post_modified ? formatDate(item.post_modified) : undefined,
    };
  });

  // Sort newest-first once
  items.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

  // Build all index maps in a single pass
  const byCategory = new Map<string, number[]>();
  const byCountry = new Map<string, number[]>();
  const byIndustry = new Map<string, number[]>();
  const byStage = new Map<string, number[]>();
  const byFormat = new Map<string, number[]>();
  const byRegion = new Map<string, number[]>();
  const bySuccessFactor = new Map<string, number[]>();

  const push = (map: Map<string, number[]>, key: string | undefined, idx: number) => {
    if (!key) return;
    const list = map.get(key) ?? [];
    list.push(idx);
    map.set(key, list);
  };

  items.forEach((item, idx) => {
    push(byCategory, item.category, idx);
    push(byCountry, item.country, idx);
    push(byIndustry, item.industrySector, idx);
    push(byStage, item.businessStage, idx);
    push(byFormat, item.interviewFormat, idx);
    push(byRegion, item.founderRegion, idx);
    push(bySuccessFactor, item.successFactor, idx);
  });

  const sorted = (map: Map<string, number[]>) =>
    Array.from(map.keys()).sort();

  const statesSet = new Set<string>();
  items.forEach((i) => { if (i.state) statesSet.add(i.state); });

  return {
    items,
    byCategory,
    byCountry,
    byIndustry,
    byStage,
    byFormat,
    byRegion,
    bySuccessFactor,
    categories: sorted(byCategory),
    countries: sorted(byCountry),
    industrySectors: sorted(byIndustry),
    businessStages: sorted(byStage),
    interviewFormats: sorted(byFormat),
    founderRegions: sorted(byRegion),
    successFactors: sorted(bySuccessFactor),
    states: Array.from(statesSet).sort(),
    builtAt: Date.now(),
  };
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
  const category = searchParams.get("category") ?? "All Interviews";
  const search = (searchParams.get("search") ?? "").toLowerCase().trim();
  const country = searchParams.get("country") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const industriesParam = searchParams.get("industries") ?? "";
  const stagesParam = searchParams.get("stages") ?? "";
  const formatsParam = searchParams.get("formats") ?? "";
  const regionsParam = searchParams.get("regions") ?? "";
  const successParam = searchParams.get("successFactors") ?? "";
  const statesParam = searchParams.get("states") ?? "";
  const metaOnly = searchParams.get("meta") === "1";

  try {
    const cache = getCache();

    // ── Metadata-only response ─────────────────────────────────────────────
    if (metaOnly) {
      return NextResponse.json(
        {
          categories: cache.categories,
          countries: cache.countries,
          states: cache.states,
          industrySectors: cache.industrySectors,
          businessStages: cache.businessStages,
          interviewFormats: cache.interviewFormats,
          founderRegions: cache.founderRegions,
          successFactors: cache.successFactors,
        },
        { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } }
      );
    }

    // ── Narrow candidate set using best available index ────────────────────
    let indices: number[];
    if (category !== "All Interviews" && cache.byCategory.has(category)) {
      indices = cache.byCategory.get(category)!;
    } else if (country && cache.byCountry.has(country)) {
      indices = cache.byCountry.get(country)!;
    } else {
      indices = Array.from({ length: cache.items.length }, (_, i) => i);
    }

    // ── Parse array filters ────────────────────────────────────────────────
    const industries = industriesParam ? industriesParam.split(",") : [];
    const stages = stagesParam ? stagesParam.split(",") : [];
    const formats = formatsParam ? formatsParam.split(",") : [];
    const regions = regionsParam ? regionsParam.split(",") : [];
    const successFactors = successParam ? successParam.split(",") : [];
    const states = statesParam ? statesParam.split(",") : [];

    let fromDate: Date | null = null;
    let toDate: Date | null = null;
    if (dateFrom) { fromDate = new Date(dateFrom); fromDate.setHours(0, 0, 0, 0); }
    if (dateTo) { toDate = new Date(dateTo); toDate.setHours(23, 59, 59, 999); }

    // ── Single-pass filter ─────────────────────────────────────────────────
    const filtered: ProcessedItem[] = [];

    for (const idx of indices) {
      const item = cache.items[idx];

      if (category !== "All Interviews" && item.category !== category) continue;
      if (country && item.country !== country) continue;
      if (fromDate && item.rawDate < fromDate) continue;
      if (toDate && item.rawDate > toDate) continue;
      if (states.length > 0 && (!item.state || !states.includes(item.state))) continue;
      if (industries.length > 0 && !industries.includes(item.industrySector)) continue;
      if (stages.length > 0 && !stages.includes(item.businessStage)) continue;
      if (formats.length > 0 && !formats.includes(item.interviewFormat)) continue;
      if (regions.length > 0 && !regions.includes(item.founderRegion)) continue;
      if (successFactors.length > 0 && !successFactors.includes(item.successFactor)) continue;

      // Full-text search last (most expensive)
      if (search) {
        const hit =
          item.title.toLowerCase().includes(search) ||
          item.excerpt.toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search) ||
          item.interviewee.toLowerCase().includes(search) ||
          item.industrySector.toLowerCase().includes(search) ||
          item.businessStage.toLowerCase().includes(search) ||
          item.interviewFormat.toLowerCase().includes(search) ||
          item.founderRegion.toLowerCase().includes(search) ||
          item.successFactor.toLowerCase().includes(search) ||
          (item.state?.toLowerCase().includes(search) ?? false) ||
          (item.country?.toLowerCase().includes(search) ?? false);
        if (!hit) continue;
      }

      filtered.push(item);
    }

    // ── Pagination ─────────────────────────────────────────────────────────
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

    // ── Serialise (strip rawDate Date objects) ─────────────────────────────
    const interviews = pageItems.map(({ rawDate, ...rest }) => ({
      ...rest,
      rawDate: rawDate.toISOString(),
    }));

    return NextResponse.json(
      {
        interviews,
        totalPages,
        currentPage: safePage,
        totalItems,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" } }
    );
  } catch (error) {
    console.error("EntreChat API error:", error);
    return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 });
  }
}