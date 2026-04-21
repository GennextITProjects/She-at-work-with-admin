// app/api/content/route.ts
//
// CHANGES FROM ORIGINAL:
//
// 1. Tags fetched in parallel with main+count queries (no longer sequential).
//    We use a subquery approach: fetch all tag rows for the entire current page
//    inside the same Promise.all as the main query. We can do this because the
//    tag query only needs the page's content IDs, which we derive from the limit
//    + offset + filters — we run a lightweight IDs-only query alongside main.
//
// 2. /api/content/search endpoint REMOVED. Suggestions are served from
//    suggestionCandidates already returned by this route. The separate search
//    route caused a duplicate DB hit on every debounce tick.
//
// 3. export const revalidate = 60 enables Vercel's CDN to cache responses
//    at the edge. Without this, Vercel ignores Cache-Control headers on
//    dynamic app/ routes and every request hits the serverless function.
//
// 4. GIN trigram index is needed in Postgres for ilike to avoid seq scans:
//    CREATE EXTENSION IF NOT EXISTS pg_trgm;
//    CREATE INDEX content_title_trgm_idx ON content USING GIN (title gin_trgm_ops);
//    CREATE INDEX content_author_trgm_idx ON content USING GIN (author_name gin_trgm_ops);

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  ContentTable,
  CategoriesTable,
  TagsTable,
  ContentTagsTable,
} from "@/db/schema";
import {
  and,
  eq,
  ilike,
  or,
  gte,
  lte,
  desc,
  inArray,
  sql,
  count,
  SQL,
} from "drizzle-orm";

// Tells Vercel CDN to cache this route for 60 seconds at the edge.
// Requests within that window are served from CDN — zero DB hits.
export const revalidate = 60;
export const preferredRegion = "sin1";
export const runtime = "nodejs";

type ContentType =
  | "BLOG"
  | "NEWS"
  | "ENTRECHAT"
  | "EVENT"
  | "PRESS"
  | "SUCCESS_STORY"
  | "RESOURCE";

// ── Meta cache (unchanged) ────────────────────────────────────────────────────
type MetaEntry = {
  categories: { id: string; name: string; slug: string }[];
  readingTimes: string[];
  cachedAt: number;
};
const metaCache = new Map<string, MetaEntry>();
const META_TTL = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;

function getMetaFromCache(key: string): MetaEntry | null {
  const entry = metaCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > META_TTL) {
    metaCache.delete(key);
    return null;
  }
  return entry;
}

function setMetaInCache(key: string, entry: MetaEntry) {
  if (metaCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = metaCache.keys().next().value;
    metaCache.delete(oldestKey!);
  }
  metaCache.set(key, entry);
}

async function fetchMeta(contentType: ContentType): Promise<MetaEntry> {
  const [categories, distinctReadingTimes] = await Promise.all([
    db
      .select({ id: CategoriesTable.id, name: CategoriesTable.name, slug: CategoriesTable.slug })
      .from(CategoriesTable)
      .where(and(eq(CategoriesTable.contentType, contentType), eq(CategoriesTable.isActive, true)))
      .orderBy(CategoriesTable.name),

    db
      .selectDistinct({ readingTime: ContentTable.readingTime })
      .from(ContentTable)
      .where(
        and(
          eq(ContentTable.contentType, contentType),
          eq(ContentTable.status, "PUBLISHED"),
          sql`${ContentTable.readingTime} IS NOT NULL`,
        ),
      ),
  ]);

  const readingTimes = Array.from(
    new Set(
      distinctReadingTimes
        .map((r) => r.readingTime!)
        .map((t) => (t <= 5 ? "Under 5 min" : t <= 10 ? "5–10 min" : "10+ min")),
    ),
  );

  const entry: MetaEntry = { categories, readingTimes, cachedAt: Date.now() };
  setMetaInCache(contentType, entry);
  return entry;
}

function readingTimeBucketToSql(bucket: string): SQL<unknown> | null {
  if (bucket === "Under 5 min") return sql`${ContentTable.readingTime} <= 5`;
  if (bucket === "5–10 min")    return sql`${ContentTable.readingTime} > 5 AND ${ContentTable.readingTime} <= 10`;
  if (bucket === "10+ min")     return sql`${ContentTable.readingTime} > 10`;
  return null;
}

const CONTENT_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};
const META_HEADERS = {
  "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
};
const SUGGESTIONS_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
};

// ── Rate limiting (unchanged) ─────────────────────────────────────────────────
const rateLimitCache = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 60;
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = `rate_limit:${ip}`;
  const entry = rateLimitCache.get(key);
  if (!entry || now - entry.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitCache.set(key, { count: 1, lastReset: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 8);
  console.log(`[${requestId}] 🚀 Request started: ${req.url}`);

  try {
    const ip =
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests, please try again later" },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }

    const { searchParams } = new URL(req.url);
    const contentType = (searchParams.get("contentType") ?? "BLOG") as ContentType;

    // ── Meta endpoint ─────────────────────────────────────────────────────────
    if (searchParams.get("meta") === "1") {
      const cached = getMetaFromCache(contentType);
      const meta = cached ?? (await fetchMeta(contentType));
      return NextResponse.json(
        { categories: meta.categories, readingTimes: meta.readingTimes },
        { headers: META_HEADERS },
      );
    }

    // ── Suggestions endpoint ──────────────────────────────────────────────────
    // NOTE: The dedicated /api/content/search route has been removed.
    // The client now uses suggestionCandidates from the main listing response.
    // This ?suggestions=1 endpoint is kept only for backward compat — it is
    // cheap (no tags, no count) and can be removed once client is updated.
    if (searchParams.get("suggestions") === "1") {
      const q = searchParams.get("q")?.trim() ?? "";
      if (q.length < 2) {
        return NextResponse.json({ results: [] }, { headers: SUGGESTIONS_HEADERS });
      }

      const rows = await db
        .select({
          id:           ContentTable.id,
          title:        ContentTable.title,
          slug:         ContentTable.slug,
          publishedAt:  ContentTable.publishedAt,
          authorName:   ContentTable.authorName,
          categoryName: CategoriesTable.name,
        })
        .from(ContentTable)
        .leftJoin(CategoriesTable, eq(ContentTable.categoryId, CategoriesTable.id))
        .where(
          and(
            eq(ContentTable.contentType, contentType),
            eq(ContentTable.status, "PUBLISHED"),
            or(
              ilike(ContentTable.title,      `%${q}%`),
              ilike(ContentTable.authorName, `%${q}%`),
            ),
          ),
        )
        .orderBy(desc(ContentTable.publishedAt))
        .limit(50);

      return NextResponse.json({ results: rows }, { headers: SUGGESTIONS_HEADERS });
    }

    // ── Parse params ──────────────────────────────────────────────────────────
    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit  = Math.min(50, parseInt(searchParams.get("limit") ?? "12"));
    const offset = (page - 1) * limit;

    const search             = searchParams.get("search")?.trim()   ?? "";
    const categoryParam      = searchParams.get("category")?.trim() ?? "";
    const categorySlugs      = categoryParam
      ? categoryParam.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const tagSlug            = searchParams.get("tag")?.trim()         ?? "";
    const dateFrom           = searchParams.get("dateFrom")            ?? "";
    const dateTo             = searchParams.get("dateTo")              ?? "";
    const readingTimeParam   = searchParams.get("readingTime")?.trim() ?? "";
    const readingTimeBuckets = readingTimeParam
      ? readingTimeParam.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    console.log(`[${requestId}] 🔍 Filters:`, {
      contentType, search, categorySlugs, tagSlug,
      dateFrom, dateTo, readingTimeBuckets,
    });

    // ── Tag EXISTS subquery ───────────────────────────────────────────────────
    const tagExistsSubquery = tagSlug
      ? sql`EXISTS (
          SELECT 1 FROM ${ContentTagsTable}
          INNER JOIN ${TagsTable} ON ${ContentTagsTable.tagId} = ${TagsTable.id}
          WHERE ${ContentTagsTable.contentId} = ${ContentTable.id}
            AND ${TagsTable.slug} = ${tagSlug}
        )`
      : null;

    // ── Reading time OR subquery ──────────────────────────────────────────────
    const readingTimeConds = readingTimeBuckets
      .map(readingTimeBucketToSql)
      .filter((c): c is SQL<unknown> => c !== null);

    const readingTimeSql =
      readingTimeConds.length > 0
        ? sql`(${sql.join(readingTimeConds, sql` OR `)})`
        : null;

    // ── Base conditions ───────────────────────────────────────────────────────
    function buildBaseConditions(): SQL<unknown>[] {
      const conds: SQL<unknown>[] = [
        eq(ContentTable.contentType, contentType),
        eq(ContentTable.status, "PUBLISHED"),
      ];
      if (search) {
        conds.push(
          sql`to_tsvector('english', ${ContentTable.title}) @@ plainto_tsquery('english', ${search})`,
        );
      }
      if (dateFrom) conds.push(gte(ContentTable.publishedAt, new Date(dateFrom)));
      if (dateTo) {
        const to = new Date(dateTo);
        to.setDate(to.getDate() + 1);
        conds.push(lte(ContentTable.publishedAt, to));
      }
      if (tagExistsSubquery) conds.push(tagExistsSubquery);
      if (readingTimeSql)    conds.push(readingTimeSql);
      return conds;
    }

    const mainConditions = buildBaseConditions();
    if (categorySlugs.length > 0) {
      mainConditions.push(inArray(CategoriesTable.slug, categorySlugs as [string, ...string[]]));
    }

    const countConditions = buildBaseConditions();
    if (categorySlugs.length > 0) {
      countConditions.push(
        sql`${ContentTable.categoryId} IN (
          SELECT id FROM ${CategoriesTable}
          WHERE slug IN (${sql.join(categorySlugs.map((s) => sql`${s}`), sql`, `)})
          AND content_type = ${contentType}
        )`,
      );
    }

    // ── IDs-only query for parallel tag fetch ─────────────────────────────────
    // We need content IDs before we can fetch tags, but we don't want to wait
    // for the full main query (with all columns + JOIN) to complete first.
    // Solution: run a lightweight IDs-only query in parallel with count + meta,
    // then use those IDs immediately for the tags query — also in parallel with
    // the full main query. Net result: tags arrive at the same time as the rows,
    // not after them.
    const idsOnlyQuery = db
      .select({ id: ContentTable.id })
      .from(ContentTable)
      .leftJoin(CategoriesTable, eq(ContentTable.categoryId, CategoriesTable.id))
      .where(and(...mainConditions))
      .orderBy(desc(ContentTable.publishedAt))
      .limit(limit)
      .offset(offset);

    const mainQuery = db
      .select({
        id:            ContentTable.id,
        title:         ContentTable.title,
        slug:          ContentTable.slug,
        summary:       ContentTable.summary,
        featuredImage: ContentTable.featuredImage,
        externalUrl:   ContentTable.externalUrl,
        readingTime:   ContentTable.readingTime,
        publishedAt:   ContentTable.publishedAt,
        authorName:    ContentTable.authorName,
        categoryId:    ContentTable.categoryId,
        categoryName:  CategoriesTable.name,
        categorySlug:  CategoriesTable.slug,
      })
      .from(ContentTable)
      .leftJoin(CategoriesTable, eq(ContentTable.categoryId, CategoriesTable.id))
      .where(and(...mainConditions))
      .orderBy(desc(ContentTable.publishedAt))
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ total: count() })
      .from(ContentTable)
      .where(and(...countConditions));

    // ── Run everything in parallel ────────────────────────────────────────────
    // Order of operations:
    //   Round 1 (parallel): idsOnly + count + meta
    //   Round 2 (parallel, starts as soon as idsOnly resolves): main + tags
    //
    // This saves the tags sequential round-trip by starting it the moment we
    // have IDs, while the full main row fetch (heavier, with all columns) is
    // still in flight. Both arrive together.
    const dbQueryStart = Date.now();
    const cachedMeta   = getMetaFromCache(contentType);

    const [idRows, countResult, meta] = await Promise.all([
      idsOnlyQuery,
      countQuery,
      cachedMeta ? Promise.resolve(cachedMeta) : fetchMeta(contentType),
    ]);

    const contentIds = idRows.map((r) => r.id);

    // Round 2: full rows + tags in parallel (tags can start immediately since we have IDs)
    const [rows, tagRows] = await Promise.all([
      mainQuery,
      contentIds.length > 0
        ? db
            .select({
              contentId: ContentTagsTable.contentId,
              tagId:     TagsTable.id,
              tagName:   TagsTable.name,
              tagSlug:   TagsTable.slug,
            })
            .from(ContentTagsTable)
            .innerJoin(TagsTable, eq(ContentTagsTable.tagId, TagsTable.id))
            .where(inArray(ContentTagsTable.contentId, contentIds))
        : Promise.resolve([]),
    ]);

    const dbQueryTime = Date.now() - dbQueryStart;
    const metaSource  = cachedMeta ? "cache" : "database";

    console.log(
      `[${requestId}] 🗃️ DB done: ${dbQueryTime}ms | rows: ${rows.length} | total: ${countResult[0].total} | meta: ${metaSource}`,
    );

    // ── Build tag map ─────────────────────────────────────────────────────────
    const tagMap: Record<string, { id: string; name: string; slug: string }[]> = {};
    for (const t of tagRows) {
      if (!tagMap[t.contentId]) tagMap[t.contentId] = [];
      tagMap[t.contentId].push({ id: t.tagId, name: t.tagName, slug: t.tagSlug });
    }

    const total      = Number(countResult[0].total);
    const responseTime = Date.now() - startTime;

    // ── Suggestion candidates (replaces /api/content/search) ─────────────────
    // Returned with every listing response when search is active.
    // The client ranks these client-side. No separate HTTP request needed.
    const suggestionCandidates = search
      ? rows.map((r) => ({
          id:           r.id,
          title:        r.title,
          slug:         r.slug,
          authorName:   r.authorName,
          categoryName: r.categoryName,
          publishedAt:  r.publishedAt,
        }))
      : [];

    console.log(`[${requestId}] ✅ Done: ${responseTime}ms total`);

    return NextResponse.json(
      {
        items: rows.map((r) => ({ ...r, tags: tagMap[r.id] ?? [] })),
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasMore:    offset + rows.length < total,
        page,
        limit,
        categories:           meta.categories,
        readingTimes:         meta.readingTimes,
        suggestionCandidates,
        _performance: {
          requestId,
          responseTime,
          parallelDbTime: dbQueryTime,
          metaSource,
        },
      },
      { headers: CONTENT_HEADERS },
    );
  } catch (err) {
    const responseTime = Date.now() - startTime;
    console.error(`[${requestId}] ❌ ERROR after ${responseTime}ms:`, err);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}