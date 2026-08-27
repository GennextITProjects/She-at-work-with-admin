// lib/revalidate.ts
// ─────────────────────────────────────────────────────────────────────────────
// On-demand ISR invalidation for admin writes.
//
// Public pages are cached (`export const revalidate = 1800`), so without this
// an edit would not appear on the live site for up to 30 minutes. Calling
// revalidateContent() after a successful write pushes the change out instantly
// while keeping the cache — and therefore the Neon compute savings — intact.
// ─────────────────────────────────────────────────────────────────────────────

import { revalidatePath } from "next/cache";

/** contentType → public listing routes that render it. */
const LISTING_ROUTES: Record<string, string[]> = {
  BLOG:          ["/blogs"],
  NEWS:          ["/news"],
  EVENT:         ["/events"],
  ENTRECHAT:     ["/entrechat"],
  PRESS:         ["/about/press-room"],
  SUCCESS_STORY: ["/about/press-room"],
};

/** contentType → route prefixes under which a `[slug]` detail page lives. */
export const DETAIL_PREFIXES: Record<string, string[]> = {
  BLOG:          ["/blogs"],
  NEWS:          ["/news"],
  EVENT:         ["/events"],
  ENTRECHAT:     ["/entrechat"],
  PRESS:         ["/about/press-room", "/press"],
  SUCCESS_STORY: ["/about/press-room", "/press"],
};

/**
 * Invalidate the cached public pages affected by a content write.
 * Safe to call with an unknown contentType — the home page is still refreshed.
 *
 * @param contentType content_type enum value of the written row
 * @param slug        slug of the written row, when the detail page should refresh too
 */
export function revalidateContent(contentType?: string | null, slug?: string | null) {
  // The home page pulls BLOG + ENTRECHAT carousels and site settings.
  revalidatePath("/");

  // Clear the legacy-permalink lookup cache (app/[legacySlug]/page.tsx). Those
  // pages use `revalidate = false`, so a miss is cached as a permanent 404 — if
  // a crawler probed a root-level slug before the article existed, publishing it
  // would otherwise never fix that URL. Publishes are rare, so re-resolving the
  // handful of cached redirects afterwards costs almost nothing.
  revalidatePath("/[legacySlug]", "page");
  revalidatePath("/blog/[legacySlug]", "page");

  if (!contentType) return;

  for (const route of LISTING_ROUTES[contentType] ?? []) {
    revalidatePath(route);
  }

  if (slug) {
    for (const prefix of DETAIL_PREFIXES[contentType] ?? []) {
      revalidatePath(`${prefix}/${slug}`);
    }
  }
}

/** Invalidate pages driven by site settings (home page hero stats / categories). */
export function revalidateSiteSettings() {
  revalidatePath("/");
}

/**
 * Invalidate everything a category write touches.
 *
 * Categories are rendered in two places: the filter panel on every listing
 * page, and the category chip on every detail page. Detail pages are cached
 * with `export const revalidate = false`, so without this a renamed or
 * deactivated category would stay visible until the next deploy.
 *
 * `revalidatePath(route, "page")` on a dynamic segment invalidates every cached
 * page under it in one call — there is no need to enumerate slugs.
 *
 * @param contentType content_type of the written category; when omitted every
 *                    public content route is invalidated (e.g. on delete, where
 *                    the row's type may no longer be readable).
 */
export function revalidateCategories(contentType?: string | null) {
  revalidatePath("/");

  const types = contentType
    ? [contentType]
    : Object.keys(LISTING_ROUTES);

  for (const type of types) {
    for (const route of LISTING_ROUTES[type] ?? []) {
      revalidatePath(route);
    }
    for (const prefix of DETAIL_PREFIXES[type] ?? []) {
      // Dynamic segment — invalidates all cached slugs under this prefix.
      revalidatePath(`${prefix}/[slug]`, "page");
    }
  }
}
