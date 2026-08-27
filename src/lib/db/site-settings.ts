// lib/db/site-settings.ts
// Add this function to your existing lib/db/content.ts or create a new file

import { cache } from "react";
import { db } from "@/db";
import { SiteSettingsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export type SiteSettingRow = {
  key: string;
  value: string;
  label: string;
  group: string;
};

export const fetchSiteSettingsByGroup = cache(async (
  group: string
): Promise<SiteSettingRow[]> => {
  try {
    const rows = await db
      .select({
        key: SiteSettingsTable.key,
        value: SiteSettingsTable.value,
        label: SiteSettingsTable.label,
        group: SiteSettingsTable.group,
      })
      .from(SiteSettingsTable)
      .where(eq(SiteSettingsTable.group, group))
      .orderBy(SiteSettingsTable.key);

    return rows;
  } catch (err) {
    console.error(`[fetchSiteSettingsByGroup] Error fetching group "${group}":`, err);
    // Rethrow instead of returning an empty result. Public pages are now cached
    // with a long/indefinite `revalidate` (on-demand invalidation in
    // lib/revalidate.ts pushes real updates), so an empty-on-error return would
    // be written into the ISR cache and served as a permanently blank page.
    // A thrown error is not cached — the next request retries the database.
    throw err;
  }
});
