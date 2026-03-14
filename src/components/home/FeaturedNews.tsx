// components/home/FeaturedNews.tsx
// Data is now fetched SERVER-SIDE (no useEffect fetch, no loading skeleton flash).
// The carousel interactivity (prev/next, index state) stays client-side in FeaturedStoriesCarousel.

import { FeaturedStoriesCarousel } from "./Featuredstoriescarousel";



// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiContentItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  featuredImage: string | null;
  publishedAt: string | null;
  authorName: string | null;
  categoryName: string | null;
}

export interface ProcessedStory {
  id: string;
  title: string;
  description: string;
  date: string;
  image: string;
  slug: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string | null): string {
  if (!dateString) return "Date unavailable";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function extractExcerpt(text: string | null, maxLength = 120): string {
  if (!text) return "No description available";
  const plain = text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return plain.length > maxLength ? plain.substring(0, maxLength) + "..." : plain;
}

// ─── Server Component ─────────────────────────────────────────────────────────

export default async function FeaturedStories() {
  let stories: ProcessedStory[] = [];

  try {
    const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "";
    const res = await fetch(
      `${BASE}/api/content?contentType=ENTRECHAT&page=1&limit=5`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const data = await res.json();
      stories = (data.items as ApiContentItem[]).map((item) => ({
        id:          item.id,
        title:       item.title.replace(/&amp;/g, "&"),
        description: extractExcerpt(item.summary, 100),
        date:        formatDate(item.publishedAt),
        image:       item.featuredImage?.trim() || "/placeholder-interview.jpg",
        slug:        item.slug,
      }));
    }
  } catch {
    // fails silently — section just won't render
  }

  if (!stories.length) return null;

  // Pass pre-fetched data to the carousel (client island for interactivity only)
  return <FeaturedStoriesCarousel stories={stories} />;
}