// scripts/migrate-categories.ts
import { db } from "@/db";
import { CategoriesTable } from "@/db/schema";
import { sql } from "drizzle-orm";

type ContentType = "BLOG" | "NEWS" | "ENTRECHAT" | "EVENT" | "PRESS" | "SUCCESS_STORY" | "RESOURCE";

interface CategoryData {
  name: string;
  contentType: ContentType;
  description: string;
}

const CATEGORIES_WITH_TYPES: CategoryData[] = [
  // ============ BLOG CATEGORIES ============
  { 
    name: "Digital Marketing", 
    contentType: "BLOG", 
    description: "Articles about digital marketing strategies, SEO, social media, and online advertising" 
  },
  { 
    name: "Leadership & Mindset", 
    contentType: "BLOG", 
    description: "Insights on leadership skills, entrepreneurial mindset, and personal growth" 
  },
  { 
    name: "Legal & Compliance", 
    contentType: "BLOG", 
    description: "Legal guidelines, compliance requirements, and regulatory updates for businesses" 
  },
  { 
    name: "Financial Management", 
    contentType: "BLOG", 
    description: "Financial planning, budgeting, accounting, and investment strategies" 
  },
  { 
    name: "E-commerce", 
    contentType: "BLOG", 
    description: "E-commerce platforms, online selling strategies, and digital storefront tips" 
  },
  { 
    name: "EdTech", 
    contentType: "BLOG", 
    description: "Educational technology trends, online learning platforms, and EdTech innovations" 
  },
  { 
    name: "Health & Wellness", 
    contentType: "BLOG", 
    description: "Health tips, wellness programs, and work-life balance for entrepreneurs" 
  },
  { 
    name: "Growth & Scaling", 
    contentType: "BLOG", 
    description: "Business growth strategies, scaling operations, and expansion techniques" 
  },
  { 
    name: "Success Stories", 
    contentType: "BLOG", 
    description: "Inspiring success stories of women entrepreneurs and business leaders" 
  },
  { 
    name: "Business Strategy", 
    contentType: "BLOG", 
    description: "Strategic planning, business models, and competitive analysis" 
  },
  { 
    name: "Brand Building", 
    contentType: "BLOG", 
    description: "Brand development, storytelling, and marketing communication" 
  },
  { 
    name: "General", 
    contentType: "BLOG", 
    description: "General business articles and miscellaneous topics" 
  },
  
  // ============ NEWS CATEGORIES ============
  { 
    name: "Funding & Investment", 
    contentType: "NEWS", 
    description: "Latest funding news, investment rounds, and venture capital updates" 
  },
  { 
    name: "Policy & Government Schemes", 
    contentType: "NEWS", 
    description: "Government policies, schemes, and regulatory changes affecting businesses" 
  },

  { 
    name: "Awards & Recognition", 
    contentType: "NEWS", 
    description: "Awards, honors, and recognition received by women entrepreneurs" 
  },
  { 
    name: "Launches", 
    contentType: "NEWS", 
    description: "New product launches, service introductions, and business expansions" 
  },
  { 
    name: "Partnerships", 
    contentType: "NEWS", 
    description: "Strategic partnerships, collaborations, and joint ventures" 
  },
  { 
    name: "Success Stories", 
    contentType: "NEWS", 
    description: "News coverage of entrepreneurial success stories" 
  },
  { 
    name: "Industry Trends", 
    contentType: "NEWS", 
    description: "Industry analysis, market trends, and sector insights" 
  },
  { 
    name: "General News", 
    contentType: "NEWS", 
    description: "General business news and updates" 
  },
  
  // ============ ENTRECHAT CATEGORIES ============
  { 
    name: "Design & Architecture", 
    contentType: "ENTRECHAT", 
    description: "Interviews with women in design, architecture, and creative fields" 
  },
  { 
    name: "Wellness & Health", 
    contentType: "ENTRECHAT", 
    description: "Conversations with wellness entrepreneurs and health professionals" 
  },
  { 
    name: "Funding & Finance", 
    contentType: "ENTRECHAT", 
    description: "Interviews about funding journeys and financial management" 
  },
  { 
    name: "Technology", 
    contentType: "ENTRECHAT", 
    description: "Tech founder interviews and technology entrepreneurship stories" 
  },
  { 
    name: "Leadership", 
    contentType: "ENTRECHAT", 
    description: "Leadership insights from successful women executives" 
  },
  { 
    name: "Marketing", 
    contentType: "ENTRECHAT", 
    description: "Marketing strategies and brand building stories" 
  },
  { 
    name: "Product Development", 
    contentType: "ENTRECHAT", 
    description: "Product innovation and development journeys" 
  },
  { 
    name: "Work-Life Balance", 
    contentType: "ENTRECHAT", 
    description: "Stories about balancing business and personal life" 
  },
  { 
    name: "Legal & Compliance", 
    contentType: "ENTRECHAT", 
    description: "Legal insights from women in law and compliance" 
  },
  { 
    name: "Entrepreneurship", 
    contentType: "ENTRECHAT", 
    description: "General entrepreneurship interviews and stories" 
  },
  
  // ============ EVENT CATEGORIES ============
  { 
    name: "Conferences", 
    contentType: "EVENT", 
    description: "Major conferences and summits for women entrepreneurs" 
  },
  { 
    name: "Workshops", 
    contentType: "EVENT", 
    description: "Hands-on workshops and training sessions" 
  },
  { 
    name: "Webinars", 
    contentType: "EVENT", 
    description: "Online webinars and virtual learning sessions" 
  },
  { 
    name: "Networking", 
    contentType: "EVENT", 
    description: "Networking events and community gatherings" 
  },
  { 
    name: "Seminars", 
    contentType: "EVENT", 
    description: "Educational seminars and expert talks" 
  },
  { 
    name: "Forums", 
    contentType: "EVENT", 
    description: "Discussion forums and panel discussions" 
  },
  { 
    name: "Launches", 
    contentType: "EVENT", 
    description: "Event launches and inaugural programs" 
  },
  { 
    name: "Awards", 
    contentType: "EVENT", 
    description: "Award ceremonies and recognition events" 
  },
  { 
    name: "Festivals", 
    contentType: "EVENT", 
    description: "Entrepreneurship festivals and celebrations" 
  },
  { 
    name: "Other Events", 
    contentType: "EVENT", 
    description: "Miscellaneous events and gatherings" 
  },
  
  // ============ PRESS CATEGORIES ============
  { 
    name: "Press Release", 
    contentType: "PRESS", 
    description: "Official press releases and announcements" 
  },
  { 
    name: "Media Coverage", 
    contentType: "PRESS", 
    description: "News coverage and media mentions" 
  },
  { 
    name: "Company Announcements", 
    contentType: "PRESS", 
    description: "Corporate announcements and updates" 
  },
  { 
    name: "Product Launches", 
    contentType: "PRESS", 
    description: "Press coverage of new product launches" 
  },
  { 
    name: "Partnership Announcements", 
    contentType: "PRESS", 
    description: "Announcements of strategic partnerships" 
  },
  { 
    name: "Awards & Recognition", 
    contentType: "PRESS", 
    description: "Press coverage of awards and recognition" 
  },
  { 
    name: "Executive Announcements", 
    contentType: "PRESS", 
    description: "Leadership changes and executive appointments" 
  },
  
  // ============ SUCCESS STORY CATEGORIES ============
  { 
    name: "Business Growth", 
    contentType: "SUCCESS_STORY", 
    description: "Stories of business growth and expansion" 
  },
  { 
    name: "Startup Journey", 
    contentType: "SUCCESS_STORY", 
    description: "Entrepreneurial journeys from startup to success" 
  },
  { 
    name: "Overcoming Challenges", 
    contentType: "SUCCESS_STORY", 
    description: "Stories of overcoming business challenges" 
  },
  { 
    name: "Industry Impact", 
    contentType: "SUCCESS_STORY", 
    description: "Stories of making impact in specific industries" 
  },
  { 
    name: "Innovation Stories", 
    contentType: "SUCCESS_STORY", 
    description: "Innovation-driven success stories" 
  },
  { 
    name: "Social Impact", 
    contentType: "SUCCESS_STORY", 
    description: "Stories of creating social change through business" 
  },
  { 
    name: "Global Expansion", 
    contentType: "SUCCESS_STORY", 
    description: "Success stories of global business expansion" 
  },
  
  // ============ RESOURCE CATEGORIES ============
  { 
    name: "Getting Started Guides", 
    contentType: "RESOURCE", 
    description: "Resources for new entrepreneurs starting their journey" 
  },
  { 
    name: "Business Templates", 
    contentType: "RESOURCE", 
    description: "Templates and tools for business operations" 
  },
  { 
    name: "Funding Resources", 
    contentType: "RESOURCE", 
    description: "Resources for finding funding and investors" 
  },
  { 
    name: "Legal Resources", 
    contentType: "RESOURCE", 
    description: "Legal guides and compliance resources" 
  },
  { 
    name: "Marketing Resources", 
    contentType: "RESOURCE", 
    description: "Marketing templates and strategy guides" 
  },
  { 
    name: "State-Specific Resources", 
    contentType: "RESOURCE", 
    description: "Resources specific to Indian states" 
  },
  { 
    name: "Global Resources", 
    contentType: "RESOURCE", 
    description: "International business resources" 
  },
];

/**
 * Generate a URL-friendly slug from a category name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
}

/**
 * Main migration function to insert all categories
 */
async function migrateCategories() {
  console.log("🚀 Starting categories migration...");
  console.log("=".repeat(60));
  
  const startTime = Date.now();
  const results: Record<ContentType, { created: number; skipped: number }> = {
    BLOG: { created: 0, skipped: 0 },
    NEWS: { created: 0, skipped: 0 },
    ENTRECHAT: { created: 0, skipped: 0 },
    EVENT: { created: 0, skipped: 0 },
    PRESS: { created: 0, skipped: 0 },
    SUCCESS_STORY: { created: 0, skipped: 0 },
    RESOURCE: { created: 0, skipped: 0 },
  };
  
  let totalCreated = 0;
  let totalSkipped = 0;

  try {
    // First, check if any categories already exist
    const existingCategories = await db.select({
      name: CategoriesTable.name,
      contentType: CategoriesTable.contentType,
    }).from(CategoriesTable);
    
    const existingMap = new Set(
      existingCategories.map(c => `${c.name}:${c.contentType}`)
    );
    
    console.log(`📊 Found ${existingCategories.length} existing categories in database\n`);

    // Process each category
    for (const categoryData of CATEGORIES_WITH_TYPES) {
      const key = `${categoryData.name}:${categoryData.contentType}`;
      
      // Check if category already exists with same name and content type
      if (existingMap.has(key)) {
        console.log(`⏭️  Skipping "${categoryData.name}" (${categoryData.contentType}) - already exists`);
        results[categoryData.contentType].skipped++;
        totalSkipped++;
        continue;
      }

      const slug = generateSlug(categoryData.name);

      // Insert new category
      await db.insert(CategoriesTable).values({
        name: categoryData.name,
        slug: slug,
        description: categoryData.description,
        contentType: categoryData.contentType,
        isActive: true,
        createdAt: new Date(),
      });

      console.log(`✅ Created "${categoryData.name}" (${categoryData.contentType})`);
      results[categoryData.contentType].created++;
      totalCreated++;
    }

    // Print summary by content type
    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY BY CONTENT TYPE");
    console.log("=".repeat(60));
    
    for (const [contentType, stats] of Object.entries(results)) {
      if (stats.created > 0 || stats.skipped > 0) {
        console.log(`\n${contentType}:`);
        console.log(`  ✅ Created: ${stats.created}`);
        console.log(`  ⏭️  Skipped: ${stats.skipped}`);
      }
    }

    // Print total summary
    console.log("\n" + "=".repeat(60));
    console.log("📈 TOTAL SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Total categories created: ${totalCreated}`);
    console.log(`⏭️  Total categories skipped: ${totalSkipped}`);
    console.log(`📊 Total categories processed: ${CATEGORIES_WITH_TYPES.length}`);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`\n⏱️  Migration completed in ${duration.toFixed(2)} seconds`);
    console.log("=".repeat(60));
    console.log("✅ Categories migration completed successfully!");
    
  } catch (error) {
    console.error("\n❌ Error during categories migration:", error);
    throw error;
  }
}

/**
 * Optional: Function to verify the migration
 */
async function verifyMigration() {
  console.log("\n🔍 Verifying migration...");
  
  try {
    const categories = await db.select({
      id: CategoriesTable.id,
      name: CategoriesTable.name,
      slug: CategoriesTable.slug,
      contentType: CategoriesTable.contentType,
      isActive: CategoriesTable.isActive,
    }).from(CategoriesTable);
    
    console.log(`\n📊 Total categories in database: ${categories.length}`);
    
    // Group by content type
    const grouped = categories.reduce((acc, cat) => {
      if (!acc[cat.contentType]) acc[cat.contentType] = [];
      acc[cat.contentType].push(cat);
      return acc;
    }, {} as Record<string, typeof categories>);
    
    console.log("\n📈 Categories by content type:");
    for (const [type, cats] of Object.entries(grouped)) {
      console.log(`  ${type}: ${cats.length} categories`);
    }
    
    // Sample a few categories
    console.log("\n📝 Sample categories (first 3 from each type):");
    for (const [type, cats] of Object.entries(grouped)) {
      console.log(`\n${type}:`);
      cats.slice(0, 3).forEach(cat => {
        console.log(`  - ${cat.name} (slug: ${cat.slug})`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error during verification:", error);
  }
}

/**
 * Run the migration
 */
async function main() {
  try {
    await migrateCategories();
    await verifyMigration();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Execute the migration
main();