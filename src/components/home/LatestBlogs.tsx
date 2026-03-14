// components/home/LatestBlogs.tsx
// Server Component — fetches blog data at render time (ISR 60s).
// Passes pre-fetched data to LatestBlogsCarousel (client island).
// Eliminates the useEffect fetch + isLoading skeleton flash on the home page.

import { LatestBlogsCarousel, ProcessedBlog } from "./Latestblogscarousel";



interface ApiContentItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  featuredImage: string | null;
  readingTime: number | null;
  publishedAt: string | null;
  authorName: string | null;
  categoryName: string | null;
  categorySlug: string | null;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Date unavailable";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch { return "Date unavailable"; }
}

function extractExcerpt(text: string | null, maxLength = 150): string {
  if (!text) return "No excerpt available";
  const clean = text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return clean.length <= maxLength ? clean : clean.substring(0, maxLength) + "...";
}

export async function LatestBlogs() {
  let blogs: ProcessedBlog[] = [];

  try {
    const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "";
    const res = await fetch(
      `${BASE}/api/content?contentType=BLOG&page=1&limit=8`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const data = await res.json();
      blogs = (data.items as ApiContentItem[]).map((item) => ({
        id:       item.id,
        title:    item.title.replace(/&amp;/g, "&"),
        excerpt:  extractExcerpt(item.summary, 110),
        category: item.categoryName ?? "General",
        date:     formatDate(item.publishedAt),
        readTime: item.readingTime ? `${item.readingTime} min read` : "1 min read",
        image:    item.featuredImage?.trim() || "/placeholder-blog.jpg",
        slug:     item.slug,
        author:   { name: item.authorName ?? "She at Work", role: "Contributor" },
      }));
    }
  } catch {
    // silently fails — section won't render
  }

  return <LatestBlogsCarousel blogs={blogs} />;
}