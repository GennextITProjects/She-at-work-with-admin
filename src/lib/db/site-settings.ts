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
    return [];
  }
});
