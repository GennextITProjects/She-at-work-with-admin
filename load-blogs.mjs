//load-blogs.mjs


import "dotenv/config";
import { db } from "@/db";
import { eq, sql } from "drizzle-orm";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  ContentTable,
  CategoriesTable,
  TagsTable,
  ContentTagsTable,
} from "@/db/schema";

// ─── Category detection (mirrors your frontend getCategoryFromContent) ─────────

function getCategoryFromContent(content) {
  const c = content.toLowerCase();
  if (c.includes("digital") || c.includes("marketing")) return "Digital Marketing";
  if (c.includes("leadership") || c.includes("mindset")) return "Leadership & Mindset";
  if (c.includes("legal") || c.includes("compliance")) return "Legal & Compliance";
  if (c.includes("finance") || c.includes("financial") || c.includes("management")) return "Financial Management";
  if (c.includes("e-commerce") || c.includes("ecommerce")) return "E-commerce";
  if (c.includes("edtech") || c.includes("education")) return "EdTech";
  if (c.includes("health") || c.includes("wellness")) return "Health & Wellness";
  if (c.includes("growth") || c.includes("scale")) return "Growth & Scaling";
  if (c.includes("innovation") || c.includes("tech")) return "Technology & Innovation";
  if (c.includes("success") || c.includes("story")) return "Success Stories";
  if (c.includes("strategy") || c.includes("planning")) return "Business Strategy";
  if (c.includes("brand") || c.includes("social")) return "Brand Building";
  return "General";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateReadingTime(text) {
  if (!text) return 1;
  const wordCount = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

function extractAuthor(content, fallback = "She at Work Team") {
  const match =
    content.match(/by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i) ||
    content.match(/Written by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i) ||
    content.match(/Author:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
  return match ? match[1] : fallback;
}

function extractTags(content, title) {
  const tags = new Set();
  const c = content.toLowerCase();
  const t = title.toLowerCase();

  const keywords = [
    "women-entrepreneurs", "startup", "business-growth", "funding",
    "leadership", "marketing", "technology", "innovation", "success-story",
    "digital-transformation", "ecommerce", "fintech", "edtech", "healthtech",
    "sustainability", "diversity", "inclusion", "work-life-balance",
  ];

  for (const kw of keywords) {
    if (c.includes(kw.replace(/-/g, " ")) || t.includes(kw.replace(/-/g, " "))) {
      tags.add(kw);
    }
  }

  // Extract #hashtags from content
  const hashtags = content.match(/#(\w+)/g) ?? [];
  for (const h of hashtags) {
    tags.add(h.replace("#", "").toLowerCase());
  }

  return [...tags];
}

function extractExcerpt(content, maxLength = 200) {
  if (!content) return "";
  const plain = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return plain.length <= maxLength ? plain : plain.substring(0, maxLength) + "...";
}

/**
 * Slug: use post_name if available, else derive from title.
 * Always append last 6 chars of wpId to guarantee uniqueness
 * even when two posts have identical titles.
 */
function generateSlug(post) {
  const base = post.post_name
    ? post.post_name.toLowerCase().replace(/[^\w-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
    : post.post_title.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return `${base}-${String(post.ID).slice(-6)}`;
}

// ─── Load file ────────────────────────────────────────────────────────────────

async function loadBlogsFromFile(filePath) {
  const absolute = path.resolve(process.cwd(), filePath);
  const raw = readFileSync(absolute, "utf-8");

  let blogs;
  if (filePath.endsWith(".ts")) {
    const match = raw.match(/export\s+const\s+\w+\s*=\s*(\[[\s\S]*?\])\s*;?\s*$/m);
    if (!match) throw new Error("Could not parse array from .ts file");
    blogs = new Function(`return ${match[1]}`)();
  } else {
    blogs = JSON.parse(raw);
  }

  console.log(`📖 Loaded ${blogs.length} blogs from ${filePath}`);
  return blogs;
}

// ─── Build category lookup map ────────────────────────────────────────────────

async function buildCategoryMap() {
  const rows = await db
    .select({ id: CategoriesTable.id, name: CategoriesTable.name })
    .from(CategoriesTable)
    .where(eq(CategoriesTable.contentType, "BLOG"));

  // Map: lowercase name → uuid
  const map = new Map(rows.map((r) => [r.name.toLowerCase(), r.id]));
  console.log(`📊 Found ${rows.length} BLOG categories in database`);

  if (rows.length === 0) {
    console.error("❌ No BLOG categories found — run migrate-categories.mjs first!");
    process.exit(1);
  }

  return map;
}

// ─── Get or create a tag (within a transaction) ───────────────────────────────
//
// FIX: instead of tx.query (requires schema config) we use a plain select
// with eq() — works with both drizzle(sql) and drizzle(sql, { schema })

async function getOrCreateTag(tx, tagName) {
  const slug = tagName.toLowerCase().replace(/\s+/g, "-");

  // Try to find existing tag
  const existing = await tx
    .select({ id: TagsTable.id })
    .from(TagsTable)
    .where(eq(TagsTable.name, tagName))
    .limit(1);

  if (existing.length > 0) {
    // Increment usage count
    await tx
      .update(TagsTable)
      .set({ usageCount: sql`${TagsTable.usageCount} + 1` })
      .where(eq(TagsTable.id, existing[0].id));
    return existing[0].id;
  }

  // Create new tag
  const [created] = await tx
    .insert(TagsTable)
    .values({ name: tagName, slug, usageCount: 1, createdAt: new Date() })
    .returning({ id: TagsTable.id });

  return created.id;
}

// ─── Insert blogs ─────────────────────────────────────────────────────────────

async function insertBlogs(blogs, categoryMap) {
  console.log(`\n📥 Inserting ${blogs.length} blogs…`);

  // Pre-fetch existing wpIds to skip without hitting DB every time
  const existing = await db
    .select({ wpId: ContentTable.wpId })
    .from(ContentTable)
    .where(eq(ContentTable.contentType, "BLOG"));

  const existingWpIds = new Set(existing.map((r) => r.wpId).filter(Boolean));
  console.log(`📊 ${existingWpIds.size} blogs already in database — will skip duplicates\n`);

  const stats = { inserted: 0, skipped: 0, failed: 0, tagsCreated: 0 };

  for (const blog of blogs) {
    // Skip already-migrated posts
    if (blog.ID && existingWpIds.has(blog.ID)) {
      stats.skipped++;
      continue;
    }

    try {
      // Resolve category
      const categoryName = getCategoryFromContent(blog.post_content);
      const categoryId = categoryMap.get(categoryName.toLowerCase()) ?? null;

      if (!categoryId) {
        console.warn(`  ⚠️  Category "${categoryName}" not found for: ${blog.post_title.substring(0, 50)}`);
      }

      const slug = generateSlug(blog);
      const summary = blog.post_excerpt?.trim()
        ? blog.post_excerpt.replace(/<[^>]*>/g, "").trim()
        : extractExcerpt(blog.post_content);
      const authorName = extractAuthor(blog.post_content, blog.post_author || "She at Work Team");
      const readingTime = calculateReadingTime(blog.post_content);
      const publishedAt = blog.post_date ? new Date(blog.post_date) : new Date();
      const updatedAt = blog.post_modified ? new Date(blog.post_modified) : publishedAt;
      const tags = extractTags(blog.post_content, blog.post_title);

      // Use a transaction PER blog so one failure doesn't affect others
      await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(ContentTable)
          .values({
            wpId: blog.ID ?? null,
            title: blog.post_title.replace(/&amp;/g, "&"),
            slug,
            summary,
            content: blog.post_content,
            contentType: "BLOG",
            categoryId,
            authorName,
            featuredImage: blog.featured_image_url ?? null,
            externalUrl: blog.external_url ?? null,
            readingTime,
            status: "PUBLISHED",
            publishedAt,
            createdAt: publishedAt,
            updatedAt,
          })
          .returning({ id: ContentTable.id });

        // Insert tags
        for (const tagName of tags) {
          try {
            const tagId = await getOrCreateTag(tx, tagName);
            await tx
              .insert(ContentTagsTable)
              .values({ contentId: inserted.id, tagId, createdAt: new Date() })
              .onConflictDoNothing();
          } catch (tagErr) {
            console.warn(`    ⚠️  Tag "${tagName}" skipped: ${tagErr.message}`);
          }
        }
      });

      stats.inserted++;

      // Progress log every 50
      if (stats.inserted % 50 === 0) {
        console.log(`  … ${stats.inserted} inserted, ${stats.skipped} skipped, ${stats.failed} failed`);
      }

    } catch (err) {
      console.error(`  ❌ Failed blog ${blog.ID} "${blog.post_title?.substring(0, 40)}": ${err.message}`);
      stats.failed++;
    }
  }

  return stats;
}

// ─── Verify ───────────────────────────────────────────────────────────────────

async function verify() {
  console.log("\n🔍 Verifying…");

  const [counts] = await db
    .select({
      total: sql`count(*)`.mapWith(Number),
      withCategory: sql`count(case when category_id is not null then 1 end)`.mapWith(Number),
    })
    .from(ContentTable)
    .where(eq(ContentTable.contentType, "BLOG"));

  const [tagCount] = await db
    .select({ total: sql`count(*)`.mapWith(Number) })
    .from(TagsTable);

  const topTags = await db
    .select({ name: TagsTable.name, usageCount: TagsTable.usageCount })
    .from(TagsTable)
    .orderBy(sql`${TagsTable.usageCount} desc`)
    .limit(5);

  console.log("\n📊 RESULTS");
  console.log("=".repeat(50));
  console.log(`📝 Blogs in DB        : ${counts.total}`);
  console.log(`✅ With category      : ${counts.withCategory}`);
  console.log(`⚠️  Without category  : ${counts.total - counts.withCategory}`);
  console.log(`🏷️  Unique tags        : ${tagCount.total}`);
  console.log("\n📈 Top 5 tags:");
  topTags.forEach((t, i) => console.log(`   ${i + 1}. ${t.name} (${t.usageCount})`));
  console.log("=".repeat(50));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const start = Date.now();
  console.log("🚀 Starting blog migration…");
  console.log("=".repeat(50));

  const filePath = process.argv[2] || "./src/data/Blogs.ts";
  console.log(`📂 File: ${filePath}\n`);

  const rawBlogs = await loadBlogsFromFile(filePath);
  const categoryMap = await buildCategoryMap();
  const stats = await insertBlogs(rawBlogs, categoryMap);

  const duration = ((Date.now() - start) / 1000).toFixed(2);

  console.log("\n📊 SUMMARY");
  console.log("=".repeat(50));
  console.log(`✅ Inserted : ${stats.inserted}`);
  console.log(`⏭️  Skipped  : ${stats.skipped}`);
  console.log(`❌ Failed   : ${stats.failed}`);
  console.log(`⏱️  Duration : ${duration}s`);
  console.log("=".repeat(50));

  await verify();

  console.log("\n✅ Done!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
