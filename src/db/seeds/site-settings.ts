// db/seeds/site-settings.ts
import { db } from "@/db";
import { SiteSettingsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

const initialSettings = [
  // Hero Stats
  {
    key: "stat_articles",
    value: "975",
    label: "Articles Count",
    group: "hero-stats",
    isActive: true,
  },
  {
    key: "stat_articles_suffix",
    value: "+",
    label: "Articles Suffix",
    group: "hero-stats",
    isActive: true,
  },
  {
    key: "stat_events_webinars",
    value: "121",
    label: "Events & Webinars Count",
    group: "hero-stats",
    isActive: true,
  },
  {
    key: "stat_events_webinars_suffix",
    value: "+",
    label: "Events & Webinars Suffix",
    group: "hero-stats",
    isActive: true,
  },
  {
    key: "stat_community_reach",
    value: "50",
    label: "Community Reach Count",
    group: "hero-stats",
    isActive: true,
  },
  {
    key: "stat_community_reach_suffix",
    value: "k+",
    label: "Community Reach Suffix",
    group: "hero-stats",
    isActive: true,
  },
  {
    key: "stat_countries",
    value: "85",
    label: "Countries Count",
    group: "hero-stats",
    isActive: true,
  },
  {
    key: "stat_countries_suffix",
    value: "+",
    label: "Countries Suffix",
    group: "hero-stats",
    isActive: true,
  },
  // Categories
  {
    key: "cat_blogs_count",
    value: "875",
    label: "Blogs Category Count",
    group: "categories",
    isActive: true,
  },
  {
    key: "cat_blogs_suffix",
    value: "+",
    label: "Blogs Suffix",
    group: "categories",
    isActive: true,
  },
  {
    key: "cat_news_count",
    value: "500",
    label: "News Category Count",
    group: "categories",
    isActive: true,
  },
  {
    key: "cat_news_suffix",
    value: "+",
    label: "News Suffix",
    group: "categories",
    isActive: true,
  },
  {
    key: "cat_entrechat_count",
    value: "121",
    label: "Entrechat Category Count",
    group: "categories",
    isActive: true,
  },
  {
    key: "cat_entrechat_suffix",
    value: "+",
    label: "Entrechat Suffix",
    group: "categories",
    isActive: true,
  },
  {
    key: "cat_events_count",
    value: "50",
    label: "Events Category Count",
    group: "categories",
    isActive: true,
  },
  {
    key: "cat_events_suffix",
    value: "+",
    label: "Events Suffix",
    group: "categories",
    isActive: true,
  },
];

export async function seedSiteSettings() {
  console.log("🌱 Seeding site settings...");
  
  for (const setting of initialSettings) {
    const existing = await db
      .select()
      .from(SiteSettingsTable)
      .where(eq(SiteSettingsTable.key, setting.key))
      .limit(1);
    
    if (existing.length === 0) {
      await db.insert(SiteSettingsTable).values(setting);
      console.log(`  ✅ Created ${setting.key}`);
    } else {
      console.log(`  ⏭️  Skipped ${setting.key} (already exists)`);
    }
  }
  
  console.log("✅ Site settings seeding complete!");
}