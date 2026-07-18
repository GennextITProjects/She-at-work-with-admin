// lib/db/content.ts
// ─────────────────────────────────────────────────────────────────────────
// Direct database access for initial page loads.
// Used by Server Components to avoid HTTP roundtrip + Vercel function overhead.
// ─────────────────────────────────────────────────────────────────────────

import { db } from "@/db";
import {
  ContentTable,
  CategoriesTable,
  ContentTagsTable,
  TagsTable,
} from "@/db/schema";
import { and, count, desc, eq, inArray } from "drizzle-orm";

export type ContentType =
  | "BLOG"
  | "NEWS"
  | "ENTRECHAT"
  | "EVENT"
  | "PRESS"
  | "SUCCESS_STORY"
  | "RESOURCE";

export type ContentRow = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  featuredImage: string | null;
  externalUrl: string | null;
  readingTime: number | null;
  publishedAt: Date | null;
  authorName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  tags?: Array<{ id: string; name: string; slug: string }>;
  createdAt:string;
};

export type PageContentResponse = {
  items: ContentRow[];
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
  categories: Array<{ id: string; name: string; slug: string }>;
  readingTimes: string[];
};

/**
 * Fetch initial page content + metadata (categories, reading times, tags)
 *
 * Used by Server Components for initial page loads.
 * ✅ Zero HTTP overhead
 * ✅ No Vercel function invocation
 * ✅ Direct Neon connection
 *
 * @param contentType - Type of content to fetch
 * @param limit - Number of items to return
 * @returns Page content with items, metadata, and tags
 */
export async function fetchPageContent(
  contentType: ContentType,
  limit: number = 12,
): Promise<PageContentResponse> {
  try {
    // Parallel fetch: rows + count + categories all at once
    const [rows, countResult, categories] = await Promise.all([
      // Main content query with category join
      db
        .select({
          id: ContentTable.id,
          title: ContentTable.title,
          slug: ContentTable.slug,
          summary: ContentTable.summary,
          featuredImage: ContentTable.featuredImage,
          externalUrl: ContentTable.externalUrl,
          readingTime: ContentTable.readingTime,
          publishedAt: ContentTable.publishedAt,
          authorName: ContentTable.authorName,
          categoryId: ContentTable.categoryId,
          categoryName: CategoriesTable.name,
          categorySlug: CategoriesTable.slug,
          createdAt: ContentTable.createdAt,
        })
        .from(ContentTable)
        .leftJoin(
          CategoriesTable,
          eq(ContentTable.categoryId, CategoriesTable.id)
        )
        .where(
          and(
            eq(ContentTable.contentType, contentType),
            eq(ContentTable.status, "PUBLISHED")
          )
        )
        .orderBy(desc(ContentTable.publishedAt))
        .limit(limit),

      // Total count for pagination
      db
        .select({ total: count() })
        .from(ContentTable)
        .where(
          and(
            eq(ContentTable.contentType, contentType),
            eq(ContentTable.status, "PUBLISHED")
          )
        ),

      // Categories for filter UI
      db
        .select({
          id: CategoriesTable.id,
          name: CategoriesTable.name,
          slug: CategoriesTable.slug,
        })
        .from(CategoriesTable)
        .where(
          and(
            eq(CategoriesTable.contentType, contentType),
            eq(CategoriesTable.isActive, true)
          )
        )
        .orderBy(CategoriesTable.name),
    ]);

    // Fetch tags for all content items
    const tagMap: Record<string, ContentRow["tags"]> = {};
    if (rows.length > 0) {
      const contentIds = rows.map((r) => r.id);
      const tagRows = await db
        .select({
          contentId: ContentTagsTable.contentId,
          tagId: TagsTable.id,
          tagName: TagsTable.name,
          tagSlug: TagsTable.slug,
        })
        .from(ContentTagsTable)
        .innerJoin(TagsTable, eq(ContentTagsTable.tagId, TagsTable.id))
        .where(inArray(ContentTagsTable.contentId, contentIds));

      for (const t of tagRows) {
        if (!tagMap[t.contentId]) tagMap[t.contentId] = [];
        tagMap[t.contentId]!.push({
          id: t.tagId,
          name: t.tagName,
          slug: t.tagSlug,
        });
      }
    }

    const totalItems = Number(countResult[0]?.total ?? 0);

    return {
      items: rows.map((r) => ({
        ...r,
        tags: tagMap[r.id] ?? [],
        createdAt: r.createdAt.toISOString(),
      })),
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      hasMore: rows.length < totalItems,
      categories,
      readingTimes: [], // Could compute from rows if needed
    };
  } catch (err) {
    console.error(`[fetchPageContent] Error fetching ${contentType}:`, err);
    return {
      items: [],
      totalItems: 0,
      totalPages: 0,
      hasMore: false,
      categories: [],
      readingTimes: [],
    };
  }
}

/**
 * Lightweight fetch for homepage carousels.
 * Returns minimal set of fields (no tags).
 *
 * ✅ Faster than fetchPageContent
 * ✅ Perfect for carousels and featured sections
 *
 * @param contentType - Type of content to fetch
 * @param limit - Number of items to return (default 5)
 * @returns Array of content items with minimal fields
 */
export async function fetchPageContentMinimal(
  contentType: ContentType,
  limit: number = 5,
): Promise<{ items: Partial<ContentRow>[] }> {
  try {
    const rows = await db
      .select({
        id: ContentTable.id,
        title: ContentTable.title,
        slug: ContentTable.slug,
        summary: ContentTable.summary,
        featuredImage: ContentTable.featuredImage,
        publishedAt: ContentTable.publishedAt,
        authorName: ContentTable.authorName,
        categoryName: CategoriesTable.name,
        readingTime: ContentTable.readingTime,
        createdAt :ContentTable.createdAt
      })
      .from(ContentTable)
      .leftJoin(
        CategoriesTable,
        eq(ContentTable.categoryId, CategoriesTable.id)
      )
      .where(
        and(
          eq(ContentTable.contentType, contentType),
          eq(ContentTable.status, "PUBLISHED")
        )
      )
      .orderBy(desc(ContentTable.createdAt))
      .limit(limit);

    return { items: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })) };
  } catch (err) {
    console.error(`[fetchPageContentMinimal] Error fetching ${contentType}:`, err);
    return { items: [] };
  }
}