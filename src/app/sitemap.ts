// app/sitemap.ts
// ─────────────────────────────────────────────────────────────────────────────
// A sitemap is a Neon CU optimisation as much as an SEO one.
//
// Without one, a crawler discovers URLs by following links — it re-walks the
// whole site to find out what changed, and every URL it touches whose ISR entry
// has expired triggers a background regeneration (= a DB query). With a sitemap
// carrying `lastModified`, well-behaved crawlers refetch only the pages that
// actually changed.
//
// Cost: exactly one DB query per day (see `revalidate` below), which is well
// inside Neon's 5-minute suspend window.
// ─────────────────────────────────────────────────────────────────────────────

import type { MetadataRoute } from "next";
import { db } from "@/db";
import { ContentTable } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

// One regeneration per day. Content edits also push an on-demand invalidation
// through lib/revalidate.ts, so this is only a staleness backstop.
export const revalidate = 86400;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sheatwork.com";

/** contentType → the public route prefix its detail page lives under. */
const DETAIL_PREFIX: Record<string, string> = {
  BLOG: "/blogs",
  NEWS: "/news",
  EVENT: "/events",
  ENTRECHAT: "/entrechat",
  PRESS: "/about/press-room",
  SUCCESS_STORY: "/about/press-room",
};

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/",                                        priority: 1.0, changeFrequency: "daily" },
  { path: "/blogs",                                   priority: 0.9, changeFrequency: "daily" },
  { path: "/news",                                    priority: 0.9, changeFrequency: "daily" },
  { path: "/entrechat",                               priority: 0.8, changeFrequency: "weekly" },
  { path: "/events",                                  priority: 0.8, changeFrequency: "weekly" },
  { path: "/sheDiaries",                              priority: 0.7, changeFrequency: "weekly" },
  { path: "/about",                                   priority: 0.6, changeFrequency: "monthly" },
  { path: "/about/core-team",                         priority: 0.5, changeFrequency: "monthly" },
  { path: "/about/press-room",                        priority: 0.7, changeFrequency: "weekly" },
  { path: "/gettingstarted",                          priority: 0.6, changeFrequency: "monthly" },
  { path: "/gettingstarted/government-schemes-india", priority: 0.6, changeFrequency: "monthly" },
  { path: "/gettingstarted/global-schemes",           priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact",                                 priority: 0.4, changeFrequency: "yearly" },
  { path: "/share-your-story",                        priority: 0.4, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  let rows: { slug: string; contentType: string; updatedAt: Date }[] = [];

  try {
    // Single query, all published detail pages. Deliberately slim — three
    // columns, one index-backed filter.
    rows = await db
      .select({
        slug: ContentTable.slug,
        contentType: ContentTable.contentType,
        updatedAt: ContentTable.updatedAt,
      })
      .from(ContentTable)
      .where(eq(ContentTable.status, "PUBLISHED"))
      .orderBy(desc(ContentTable.updatedAt));
  } catch (err) {
    // Never fail the build or serve a 500 over the sitemap — the static routes
    // are still worth publishing.
    console.error("[sitemap] content query failed:", err);
  }

  const detailEntries: MetadataRoute.Sitemap = rows.flatMap((row) => {
    const prefix = DETAIL_PREFIX[row.contentType];
    if (!prefix || !row.slug) return [];
    return [
      {
        url: `${SITE_URL}${prefix}/${row.slug}`,
        lastModified: row.updatedAt ?? now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      },
    ];
  });

  return [...staticEntries, ...detailEntries];
}
