// app/api/content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  ContentTable,
  CategoriesTable,
  TagsTable,
  ContentTagsTable,
} from "@/db/schema";
import { and, eq, ilike, or, gte, lte, desc, count, inArray, sql } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentType =
  | "BLOG" | "NEWS" | "ENTRECHAT" | "EVENT"
  | "PRESS" | "SUCCESS_STORY" | "RESOURCE";

// ─── In-memory meta cache ─────────────────────────────────────────────────────

type MetaEntry = {
  categories: { id: string; name: string; slug: string }[];
  readingTimes: string[];
  cachedAt: number;
};

const metaCache = new Map<string, MetaEntry>();
const META_TTL  = 10 * 60 * 1000; // 10 minutes

function getMetaFromCache(key: string): MetaEntry | null {
  const entry = metaCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > META_TTL) {
    metaCache.delete(key);
    return null;
  }
  return entry;
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
          sql`${ContentTable.readingTime} IS NOT NULL`
        )
      ),
  ]);

  const readingTimes = Array.from(
    new Set(
      distinctReadingTimes
        .map((r) => r.readingTime!)
        .map((t) => (t <= 5 ? "Under 5 min" : t <= 10 ? "5–10 min" : "10+ min"))
    )
  );

  const entry: MetaEntry = { categories, readingTimes, cachedAt: Date.now() };
  metaCache.set(contentType, entry);
  return entry;
}

// ─── Cache headers ────────────────────────────────────────────────────────────

const CONTENT_HEADERS     = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };
const META_HEADERS        = { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" };
const SUGGESTIONS_HEADERS = { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" };

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contentType = (searchParams.get("contentType") ?? "BLOG") as ContentType;

    // ── ?meta=1 ───────────────────────────────────────────────────────────────
    if (searchParams.get("meta") === "1") {
      const meta = getMetaFromCache(contentType) ?? await fetchMeta(contentType);
      return NextResponse.json(
        { categories: meta.categories, readingTimes: meta.readingTimes },
        { headers: META_HEADERS }
      );
    }

    // ── ?suggestions=1 ───────────────────────────────────────────────────────
    //
    // Kept for backward compatibility and for cases where you need deep search
    // across ALL ~1900 rows (not just the current page).
    //
    // The main paginated endpoint now also returns `suggestionCandidates` when
    // a `search` param is present, so the client can skip this extra request
    // for most use cases.
    //
    // Usage: GET /api/content?contentType=BLOG&suggestions=1&q=entrepreneur
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
              ilike(ContentTable.authorName, `%${q}%`)
            )
          )
        )
        .orderBy(desc(ContentTable.publishedAt))
        .limit(50); // fetch 50 candidates, ranked to top 8 client-side

      return NextResponse.json({ results: rows }, { headers: SUGGESTIONS_HEADERS });
    }

    // ── Paginated content list (default) ─────────────────────────────────────
    const page         = Math.max(1, parseInt(searchParams.get("page")     ?? "1"));
    const limit        = Math.min(100, parseInt(searchParams.get("limit")  ?? "12"));
    const offset       = (page - 1) * limit;
    const search       = searchParams.get("search")?.trim()   ?? "";
    const categorySlug = searchParams.get("category")?.trim() ?? "";
    const tagSlug      = searchParams.get("tag")?.trim()      ?? "";
    const dateFrom     = searchParams.get("dateFrom")         ?? "";
    const dateTo       = searchParams.get("dateTo")           ?? "";

    const conditions = [
      eq(ContentTable.contentType, contentType),
      eq(ContentTable.status, "PUBLISHED"),
    ];

    if (search)   conditions.push(ilike(ContentTable.title, `%${search}%`));
    if (dateFrom) conditions.push(gte(ContentTable.publishedAt, new Date(dateFrom)));
    if (dateTo) {
      const to = new Date(dateTo);
      to.setDate(to.getDate() + 1);
      conditions.push(lte(ContentTable.publishedAt, to));
    }

    if (categorySlug) {
      conditions.push(
        sql`${ContentTable.categoryId} = (
          SELECT id FROM categories
          WHERE slug        = ${categorySlug}
            AND content_type = ${contentType}
          LIMIT 1
        )`
      );
    }

    if (tagSlug) {
      conditions.push(
        sql`${ContentTable.id} IN (
          SELECT ct.content_id FROM content_tags ct
          JOIN tags t ON t.id = ct.tag_id
          WHERE t.slug = ${tagSlug}
        )`
      );
    }

    const where = and(...conditions);

    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          id:           ContentTable.id,
          title:        ContentTable.title,
          slug:         ContentTable.slug,
          summary:      ContentTable.summary,
          featuredImage:ContentTable.featuredImage,
          externalUrl:  ContentTable.externalUrl,
          readingTime:  ContentTable.readingTime,
          publishedAt:  ContentTable.publishedAt,
          authorName:   ContentTable.authorName,
          categoryId:   ContentTable.categoryId,
          categoryName: CategoriesTable.name,
          categorySlug: CategoriesTable.slug,
        })
        .from(ContentTable)
        .leftJoin(CategoriesTable, eq(ContentTable.categoryId, CategoriesTable.id))
        .where(where)
        .orderBy(desc(ContentTable.publishedAt))
        .limit(limit)
        .offset(offset),

      db.select({ total: count() }).from(ContentTable).where(where),
    ]);

    const tagMap: Record<string, { id: string; name: string; slug: string }[]> = {};

    const tagFetch = rows.length > 0
      ? db
          .select({
            contentId: ContentTagsTable.contentId,
            tagId:     TagsTable.id,
            tagName:   TagsTable.name,
            tagSlug:   TagsTable.slug,
          })
          .from(ContentTagsTable)
          .innerJoin(TagsTable, eq(ContentTagsTable.tagId, TagsTable.id))
          .where(inArray(ContentTagsTable.contentId, rows.map((r) => r.id)))
      : Promise.resolve([]);

    const metaFetch = getMetaFromCache(contentType)
      ? Promise.resolve(getMetaFromCache(contentType)!)
      : fetchMeta(contentType);

    const [tagRows, meta] = await Promise.all([tagFetch, metaFetch]);

    for (const t of tagRows) {
      if (!tagMap[t.contentId]) tagMap[t.contentId] = [];
      tagMap[t.contentId].push({ id: t.tagId, name: t.tagName, slug: t.tagSlug });
    }

    const totalItems = Number(total);

    // ── Build suggestion candidates from current page rows ────────────────────
    //
    // When a search query is present, include the matched rows as slim suggestion
    // candidates so the client can populate the dropdown without a second request.
    //
    // NOTE: These are limited to the current page (up to `limit` rows). If you
    // need suggestions from ALL rows across all pages, use ?suggestions=1 instead.
    const suggestionCandidates = search
      ? rows.map((r) => ({
          id:          r.id,
          title:       r.title,
          slug:        r.slug,
          publishedAt: r.publishedAt,
          authorName:  r.authorName,
          categoryName: r.categoryName,
        }))
      : [];

    return NextResponse.json(
      {
        items:                rows.map((r) => ({ ...r, tags: tagMap[r.id] ?? [] })),
        totalItems,
        totalPages:           Math.ceil(totalItems / limit),
        page,
        limit,
        categories:           meta.categories,
        readingTimes:         meta.readingTimes,
        suggestionCandidates,              // ← new: slim candidates for dropdown
      },
      { headers: CONTENT_HEADERS }
    );

  } catch (err) {
    console.error("[GET /api/content]", err);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}