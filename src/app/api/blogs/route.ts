
import {
  BlogItem,
  calculateReadTime,
  extractAuthor,
  extractExcerpt,
  formatDate,
  getCategoryFromContent,
  getLocationData,
  getProficiencyLevel,
  getReadingTimeCategory,
  ITEMS_PER_PAGE
} from "@/components/blogs/helper";
import { blogsData } from "@/data/Blogs";
import { NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProcessedBlogItem {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  rawDate: Date;
  readTime: string;
  readingTimeCategory: string;
  proficiencyLevel: string;
  author: string;
  image: string | null;
  slug: string;
  state?: string;
  country?: string;
  modifiedDate?: string;
}

interface CacheStore {
  items: ProcessedBlogItem[];
  byCategory: Map<string, number[]>;
  byCountry: Map<string, number[]>;
  byReadingTime: Map<string, number[]>;
  byProficiency: Map<string, number[]>;
  countries: string[];
  categories: string[];
  readingTimes: string[];
  proficiencyLevels: string[];
  builtAt: number;
}

// ─── Module-level singleton cache ────────────────────────────────────────────

let _cache: CacheStore | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function buildCache(): CacheStore {
  const items: ProcessedBlogItem[] = blogsData.map((item: BlogItem) => {
    const category = getCategoryFromContent(item.post_content);

    const excerpt =
      item.post_excerpt?.trim()
        ? item.post_excerpt
        : extractExcerpt(item.post_content);

    const title = item.post_title
      ? item.post_title.replace(/&amp;/g, "&")
      : "Untitled";

    const location = getLocationData(item.ID, item.post_content);

    return {
      id: String(item.ID ?? Math.random()),
      category,
      title,
      excerpt,
      date: formatDate(item.post_date),
      rawDate: new Date(item.post_date),
      readTime: calculateReadTime(item.post_content),
      readingTimeCategory: getReadingTimeCategory(item.post_content),
      proficiencyLevel: getProficiencyLevel(item.post_content),
      author: extractAuthor(item.post_content),
      image: item.featured_image_url?.trim() ? item.featured_image_url : null,
      slug: item.post_name ?? `blog-${item.ID}`,
      state: location.state,
      country: location.country,
      modifiedDate: item.post_modified ? formatDate(item.post_modified) : undefined,
    };
  });

  // Sort newest-first once
  items.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

  // Build index maps
  const byCategory = new Map<string, number[]>();
  const byCountry = new Map<string, number[]>();
  const byReadingTime = new Map<string, number[]>();
  const byProficiency = new Map<string, number[]>();

  items.forEach((item, idx) => {
    // Category
    const catList = byCategory.get(item.category) ?? [];
    catList.push(idx);
    byCategory.set(item.category, catList);

    // Country
    if (item.country) {
      const cList = byCountry.get(item.country) ?? [];
      cList.push(idx);
      byCountry.set(item.country, cList);
    }

    // Reading time
    if (item.readingTimeCategory) {
      const rtList = byReadingTime.get(item.readingTimeCategory) ?? [];
      rtList.push(idx);
      byReadingTime.set(item.readingTimeCategory, rtList);
    }

    // Proficiency
    if (item.proficiencyLevel) {
      const pList = byProficiency.get(item.proficiencyLevel) ?? [];
      pList.push(idx);
      byProficiency.set(item.proficiencyLevel, pList);
    }
  });

  return {
    items,
    byCategory,
    byCountry,
    byReadingTime,
    byProficiency,
    countries: Array.from(byCountry.keys()).sort(),
    categories: Array.from(byCategory.keys()).sort(),
    readingTimes: Array.from(byReadingTime.keys()).sort(),
    proficiencyLevels: Array.from(byProficiency.keys()).sort(),
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
  const category = searchParams.get("category") ?? "All Blogs";
  const search = (searchParams.get("search") ?? "").toLowerCase().trim();
  const country = searchParams.get("country") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const readingTimesParam = searchParams.get("readingTimes") ?? "";
  const proficiencyParam = searchParams.get("proficiency") ?? "";
  const statesParam = searchParams.get("states") ?? "";
  const metaOnly = searchParams.get("meta") === "1";

  try {
    const cache = getCache();

    // ── Metadata-only response ────────────────────────────────────────────
    if (metaOnly) {
      return NextResponse.json(
        {
          countries: cache.countries,
          categories: cache.categories,
          readingTimes: cache.readingTimes,
          proficiencyLevels: cache.proficiencyLevels,
        },
        {
          headers: {
            "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
          },
        }
      );
    }

    // ── Determine candidate indices ───────────────────────────────────────
    let indices: number[];

    if (category !== "All Blogs" && cache.byCategory.has(category)) {
      indices = cache.byCategory.get(category)!;
    } else if (country && cache.byCountry.has(country)) {
      indices = cache.byCountry.get(country)!;
    } else {
      indices = Array.from({ length: cache.items.length }, (_, i) => i);
    }

    // ── Parse filter arrays ───────────────────────────────────────────────
    const readingTimes = readingTimesParam ? readingTimesParam.split(",") : [];
    const proficiencyLevels = proficiencyParam ? proficiencyParam.split(",") : [];
    const states = statesParam ? statesParam.split(",") : [];

    let fromDate: Date | null = null;
    let toDate: Date | null = null;
    if (dateFrom) { fromDate = new Date(dateFrom); fromDate.setHours(0, 0, 0, 0); }
    if (dateTo) { toDate = new Date(dateTo); toDate.setHours(23, 59, 59, 999); }

    // ── Single-pass filter ────────────────────────────────────────────────
    const filtered: ProcessedBlogItem[] = [];

    for (const idx of indices) {
      const item = cache.items[idx];

      if (category !== "All Blogs" && item.category !== category) continue;
      if (country && item.country !== country) continue;
      if (fromDate && item.rawDate < fromDate) continue;
      if (toDate && item.rawDate > toDate) continue;
      if (states.length > 0 && (!item.state || !states.includes(item.state))) continue;
      if (readingTimes.length > 0 && !readingTimes.includes(item.readingTimeCategory)) continue;
      if (proficiencyLevels.length > 0 && !proficiencyLevels.includes(item.proficiencyLevel)) continue;

      // Full-text search (most expensive — last)
      if (search) {
        const hit =
          item.title.toLowerCase().includes(search) ||
          item.excerpt.toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search) ||
          item.author.toLowerCase().includes(search) ||
          (item.state?.toLowerCase().includes(search) ?? false) ||
          (item.country?.toLowerCase().includes(search) ?? false);
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

    // ── Serialise ─────────────────────────────────────────────────────────
    const blogs = pageItems.map(({ rawDate, ...rest }) => ({
      ...rest,
      rawDate: rawDate.toISOString(),
    }));

    return NextResponse.json(
      {
        blogs,
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
    console.error("Blogs API error:", error);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}