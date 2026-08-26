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
const DETAIL_PREFIXES: Record<string, string[]> = {
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
