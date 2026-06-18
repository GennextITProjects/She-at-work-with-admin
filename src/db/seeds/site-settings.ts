// db/seeds/site-settings.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { SiteSettingsTable } from "../schema"; 
import { sql } from "drizzle-orm";


const connectionString = "postgresql://neondb_owner:npg_nAjQ0PiRF9Cw@ep-snowy-rain-a1xy2ngj-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const client = neon(connectionString);
const db = drizzle(client);

// ----------------------------------------------------------------
// Seed data
// ----------------------------------------------------------------
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

// ----------------------------------------------------------------
// Seed function
// ----------------------------------------------------------------
async function seedSiteSettings() {
  console.log("🌱 Seeding site settings...");

  try {
    const result = await db
      .insert(SiteSettingsTable)
      .values(initialSettings)
      .onConflictDoNothing({ target: SiteSettingsTable.key });

    console.log(`✅ Done! ${initialSettings.length} settings processed (existing ones were skipped).`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedSiteSettings();