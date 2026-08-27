// lib/legacy-redirect.ts
// ─────────────────────────────────────────────────────────────────────────────
// WordPress → Next.js permalink recovery.
//
// The old site served every article from the root: /women-entrepreneurs-yoga-can-empower-you
// The migration moved them under a type prefix AND appended the WordPress post
// id to the slug, so the live URL is now:
//     /blogs/women-entrepreneurs-yoga-can-empower-you-14733
//
// Nothing ever redirected the old form, so those URLs 404. Access logs show they
// are ~36% of all traffic — Google still has them indexed and crawlers keep
// re-checking them because they never receive a definitive answer.
//
// Two slug regimes exist in the table and this module handles both without
// needing to know which row is which:
//   * migrated WordPress rows  → `<original-slug>-<wp_id>`   (5-digit suffix)
//   * rows created in the admin → `<title-slug>-<Date.now()>` (13-digit suffix,
//     see toSlug() in api/admin/content/route.ts)
// Stripping a trailing `-<digits>` normalises both to the original slug.
// ─────────────────────────────────────────────────────────────────────────────

import { cache } from "react";
import { db } from "@/db";
import { ContentTable } from "@/db/schema";
import { and, eq, or, sql } from "drizzle-orm";
import { DETAIL_PREFIXES } from "@/lib/revalidate";

/**
 * Shape of a plausible WordPress permalink.
 *
 * This runs BEFORE any database access and is the reason vulnerability scanners
 * are free: `/wp-login.php`, `/administrator`, `/.env`, `/Trash` and friends all
 * fail the test and never reach Neon. Only lowercase alphanumerics and hyphens
 * get a lookup.
 */
const LEGACY_SLUG_RE = /^[a-z0-9][a-z0-9-]{2,200}$/;

/**
 * Slugs that pass the shape guard but can never be an article.
 *
 * Without this they each cost one Neon query and then cache a permanent 404,
 * which is the same failure the shape guard exists to prevent — it just misses
 * these because they look like valid permalinks.
 *
 * Keep this small. It is a backstop, not a routing table: the real fix for each
 * entry is upstream (a redirect in next.config.ts, or not linking to a page that
 * does not exist). Every entry needs a reason.
 */
const NEVER_CONTENT = new Set([
  "shediaries", // casing miss for /sheDiaries; also redirected in next.config.ts
  "privacy",    // no such route; footer links to it exist but are commented out
  "terms",      // ditto — cheap cover if either is ever uncommented or linked
  "sitemap",    // crawlers probe this alongside /sitemap.xml
  "rss",        // ditto, WordPress feed conventions
  "feed",
]);

/**
 * Resolve an old root-level permalink to its current path.
 *
 * @returns the new pathname (e.g. `/blogs/foo-14733`), or `null` when the slug
 *          is malformed or matches no published row.
 *
 * Wrapped in `cache()` so a page and its `generateMetadata` share one query.
 * The pages that call this set `revalidate = false`, so in practice each
 * distinct legacy slug costs exactly one database query, ever — after that the
 * redirect is served from the ISR cache with no function invocation at all.
 */
export const findLegacyTarget = cache(
  async (slug: string): Promise<string | null> => {
    if (!LEGACY_SLUG_RE.test(slug)) return null;
    if (NEVER_CONTENT.has(slug)) return null;

    const [row] = await db
      .select({
        slug: ContentTable.slug,
        contentType: ContentTable.contentType,
      })
      .from(ContentTable)
      .where(
        and(
          eq(ContentTable.status, "PUBLISHED"),
          or(
            // Row kept its original slug (never suffixed).
            eq(ContentTable.slug, slug),
            // Row was suffixed with a WP post id or a creation timestamp.
            sql`regexp_replace(${ContentTable.slug}, '-\\d+$', '') = ${slug}`
          )
        )
      )
      .limit(1);

    if (!row) return null;

    // Reuse the one contentType → route map the revalidation layer already
    // owns, so a new content type can never be handled in two different places.
    const prefix = DETAIL_PREFIXES[row.contentType]?.[0];
    if (!prefix) return null;

    return `${prefix}/${row.slug}`;
  }
);
