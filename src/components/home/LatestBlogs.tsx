"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowRight, Clock, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

// Import your blogs data
import { blogsData } from "@/data/Blogs";

// Types matching your blog data structure
interface BlogItem {
  post_name: string;
  ID: string;
  post_title: string;
  post_content: string;
  post_date: string;
  post_excerpt: string;
  featured_image_url: string | null;
  external_url: string | null;
  section_name: string;
  post_modified?: string;
  post_author?: string;
}

interface ProcessedBlog {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  slug: string;
  author: {
    name: string;
    role?: string;
  };
}

// ─── Helper Functions ──────────────────────────────────────────────────────────

const getCategoryFromContent = (content: string): string => {
  const c = content.toLowerCase();
  if (c.includes("leadership") || c.includes("leader") || c.includes("ceo") || c.includes("management")) return "Leadership";
  if (c.includes("finance") || c.includes("funding") || c.includes("$") || c.includes("investment") || c.includes("budget") || c.includes("financial")) return "Finance";
  if (c.includes("marketing") || c.includes("brand") || c.includes("social media") || c.includes("promotion") || c.includes("sales")) return "Marketing";
  if (c.includes("technology") || c.includes("tech") || c.includes("digital") || c.includes("ai") || c.includes("software") || c.includes("app")) return "Technology";
  if (c.includes("wellness") || c.includes("health") || c.includes("self-care") || c.includes("mental health") || c.includes("balance")) return "Wellness";
  if (c.includes("growth") || c.includes("scale") || c.includes("expand") || c.includes("development") || c.includes("progress")) return "Growth";
  if (c.includes("strategy") || c.includes("planning") || c.includes("tactics") || c.includes("business plan") || c.includes("roadmap")) return "Strategy";
  if (c.includes("innovation") || c.includes("innovate") || c.includes("creative") || c.includes("disrupt") || c.includes("new ideas")) return "Innovation";
  if (c.includes("success") || c.includes("story") || c.includes("journey") || c.includes("experience") || c.includes("testimonial")) return "Success Stories";
  return "General";
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "Date unavailable";
  }
};

const extractExcerpt = (content: string, maxLength = 150): string => {
  if (!content) return "No excerpt available";
  try {
    const clean = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    return clean.length <= maxLength ? clean : clean.substring(0, maxLength) + "...";
  } catch {
    return "No excerpt available";
  }
};

const calculateReadTime = (text: string): string => {
  if (!text) return "1 min read";
  const minutes = Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
  return `${minutes} min read`;
};

// ─── Fallback Data ─────────────────────────────────────────────────────────────

const FALLBACK_BLOGS: ProcessedBlog[] = [
  {
    id: "1",
    title: "Ready, Set, Lead: The Next Wave of Women Entrepreneurs is Already Here!",
    excerpt: "Discover how the next generation of women leaders are redefining entrepreneurship with innovation and purpose.",
    category: "Leadership",
    date: "November 19, 2025",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80",
    slug: "ready-set-lead-next-wave-women-entrepreneurs",
    author: { name: "She at Work", role: "Editor" },
  },
  {
    id: "2",
    title: "Breaking Barriers: How Women in Finance Are Changing the Game",
    excerpt: "An inside look at the trailblazing women reshaping the finance world one deal at a time.",
    category: "Finance",
    date: "October 12, 2025",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
    slug: "women-in-finance-changing-the-game",
    author: { name: "She at Work", role: "Editor" },
  },
  {
    id: "3",
    title: "Tech & Tenacity: Women Who Are Building the Future",
    excerpt: "Meet the women coding, designing, and leading the technology companies of tomorrow.",
    category: "Technology",
    date: "September 5, 2025",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80",
    slug: "women-building-the-future-in-tech",
    author: { name: "She at Work", role: "Editor" },
  },
  {
    id: "4",
    title: "Wellness at Work: Why Self-Care is a Business Strategy",
    excerpt: "How prioritising wellness can be the most powerful business decision you make this year.",
    category: "Wellness",
    date: "August 22, 2025",
    readTime: "3 min read",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80",
    slug: "wellness-at-work-business-strategy",
    author: { name: "She at Work", role: "Editor" },
  },
  {
    id: "5",
    title: "Marketing Mastery: Build a Brand That Truly Stands Out",
    excerpt: "Expert tips on crafting an authentic brand identity that resonates with your target audience.",
    category: "Marketing",
    date: "July 18, 2025",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&q=80",
    slug: "marketing-mastery-brand-that-stands-out",
    author: { name: "She at Work", role: "Editor" },
  },
  {
    id: "6",
    title: "Scale Smart: Growth Strategies for Purpose-Driven Businesses",
    excerpt: "Practical frameworks for growing your business sustainably without burning out.",
    category: "Growth",
    date: "June 10, 2025",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    slug: "scale-smart-growth-strategies",
    author: { name: "She at Work", role: "Editor" },
  },
  {
    id: "7",
    title: "Innovation in Action: From Idea to Impact",
    excerpt: "How women innovators are turning unconventional ideas into world-changing ventures.",
    category: "Innovation",
    date: "May 3, 2025",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80",
    slug: "innovation-in-action-idea-to-impact",
    author: { name: "She at Work", role: "Editor" },
  },
  {
    id: "8",
    title: "Strategy Spotlight: Planning for Success in Uncertain Times",
    excerpt: "Adaptive planning tools and mindsets that keep resilient leaders ahead of the curve.",
    category: "Strategy",
    date: "April 15, 2025",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80",
    slug: "strategy-spotlight-planning-for-success",
    author: { name: "She at Work", role: "Editor" },
  },
];

// ─── Category Badge Colors ─────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Leadership: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  Finance: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Marketing: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Technology: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Wellness: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  Growth: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  Strategy: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  Innovation: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "Success Stories": "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  General: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

// ─── Blog Card ─────────────────────────────────────────────────────────────────

const BlogCard = ({ blog, index }: { blog: ProcessedBlog; index: number }) => {
  const categoryColor = CATEGORY_COLORS[blog.category] ?? CATEGORY_COLORS.General;

  return (
    <motion.article
      key={blog.id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className="group flex flex-col rounded-2xl bg-card border border-border overflow-hidden
        transition-all duration-300 ease-out hover:-translate-y-1.5
        hover:shadow-[0_16px_40px_rgba(0,0,0,0.10)] h-full"
    >
      {/* ── Image ── */}
      <div className="relative w-full overflow-hidden" style={{ paddingBottom: "56.25%" /* 16:9 */ }}>
        <Image
          src={blog.image}
          alt={blog.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColor}`}>
            {blog.category}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
            <Clock className="h-3 w-3 shrink-0" />
            {blog.readTime}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-bold mb-2 line-clamp-2 text-foreground
          group-hover:text-primary transition-colors duration-300 leading-snug">
          {blog.title}
        </h3>

        {/* Excerpt */}
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-4 flex-1 leading-relaxed">
          {blog.excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="hidden xs:inline">{blog.date}</span>
            {/* Compact date on very small screens */}
            <span className="xs:hidden">{blog.date.split(",")[0]}</span>
          </span>

          <Link href={`/blogs/${blog.slug}`}>
            <span className="text-xs sm:text-sm font-medium text-primary
              flex items-center gap-1 group-hover:gap-2 transition-all duration-300 whitespace-nowrap">
              Read More
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </div>
    </motion.article>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const LatestBlogs = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [blogs, setBlogs] = useState<ProcessedBlog[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Process blogs from data source
  useEffect(() => {
    const processed: ProcessedBlog[] = blogsData.slice(0, 8).map((item: BlogItem) => {
      const excerpt =
        item.post_excerpt?.trim()
          ? item.post_excerpt
          : extractExcerpt(item.post_content, 110);

      let authorName = "She at Work";
      const match =
        item.post_content.match(/by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i) ||
        item.post_content.match(/Written by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
      if (match) authorName = match[1];

      return {
        id: item.ID || Math.random().toString(),
        title: item.post_title ? item.post_title.replace(/&amp;/g, "&") : "Untitled",
        excerpt,
        category: getCategoryFromContent(item.post_content),
        date: formatDate(item.post_date),
        readTime: calculateReadTime(excerpt),
        image:
          item.featured_image_url?.trim() ? item.featured_image_url : "/placeholder-blog.jpg",
        slug: item.post_name || `blog-${item.ID}`,
        author: { name: authorName, role: "Contributor" },
      };
    });

    processed.sort((a, b) => {
      const da = new Date(a.date === "Date unavailable" ? "1970-01-01" : a.date).getTime();
      const db = new Date(b.date === "Date unavailable" ? "1970-01-01" : b.date).getTime();
      return db - da;
    });

    setBlogs(processed);
  }, []);

  // Responsive columns
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 480) setItemsPerView(1);        // xs mobile
      else if (w < 640) setItemsPerView(2);   // mobile landscape / small
      else if (w < 1024) setItemsPerView(2);  // tablet (sm, md) → 2-col grid
      else if (w < 1280) setItemsPerView(3);  // small desktop (lg)
      else setItemsPerView(4);                // large desktop (xl+)
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const displayBlogs = blogs.length > 0 ? blogs : FALLBACK_BLOGS;
  const totalItems = displayBlogs.length;
  const maxIndex = Math.max(0, totalItems - itemsPerView);
  const totalPages = Math.ceil(totalItems / itemsPerView);

  const next = () => setCurrentIndex((p) => Math.min(p + itemsPerView, maxIndex));
  const prev = () => setCurrentIndex((p) => Math.max(p - itemsPerView, 0));

  const visibleBlogs = displayBlogs.slice(currentIndex, currentIndex + itemsPerView);

  // Grid column class based on itemsPerView
  const gridCols =
    itemsPerView === 1
      ? "grid-cols-1"
      : itemsPerView === 2
      ? "grid-cols-2"
      : itemsPerView === 3
      ? "grid-cols-3"
      : "grid-cols-4";

  return (
    <section className="py-10 px-4 sm:py-14 sm:px-6 md:py-16 md:px-10 lg:py-20 lg:px-16 xl:px-20 bg-background">
      <div className="mx-auto max-w-screen-xl">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55 }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-10"
        >
          <div>
            <Badge className="mb-2.5 text-xs sm:text-sm bg-secondary text-primary rounded-full px-3 py-1">
              Fresh Insights
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground leading-tight">
              Latest from Our Blog
            </h2>
          </div>

          <Link href="/blogs" className="hidden sm:block shrink-0">
            <Button variant="ghost" className="text-primary">
              View All Blogs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        {/* ── Carousel Wrapper ── */}
        <div className="relative">

          {/* Desktop prev/next arrows (outside cards, hidden on mobile) */}
          <button
            onClick={prev}
            disabled={currentIndex === 0}
            aria-label="Previous posts"
            className={`
              hidden sm:flex absolute -left-12 lg:-left-14 top-1/2 -translate-y-1/2 z-10
              items-center justify-center w-10 h-10 rounded-full
              bg-background border border-border shadow-md
              hover:bg-accent transition-all duration-200
              ${currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:shadow-lg"}
            `}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={next}
            disabled={currentIndex >= maxIndex}
            aria-label="Next posts"
            className={`
              hidden sm:flex absolute -right-12 lg:-right-14 top-1/2 -translate-y-1/2 z-10
              items-center justify-center w-10 h-10 rounded-full
              bg-background border border-border shadow-md
              hover:bg-accent transition-all duration-200
              ${currentIndex >= maxIndex ? "opacity-30 cursor-not-allowed" : "hover:shadow-lg"}
            `}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* ── Blog Cards Grid ── */}
          <div ref={containerRef} className="overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className={`grid ${gridCols} gap-4 sm:gap-5 lg:gap-6`}
            >
              {visibleBlogs.map((blog, i) => (
                <BlogCard key={blog.id} blog={blog} index={i} />
              ))}
            </motion.div>
          </div>

          {/* ── Mobile swipe-style arrows (floating, inside container) ── */}
          {totalPages > 1 && (
            <div className="sm:hidden flex justify-between absolute top-1/3 left-0 right-0 z-10 px-1 pointer-events-none">
              <button
                onClick={prev}
                disabled={currentIndex === 0}
                className={`pointer-events-auto rounded-full p-2 bg-background/90 backdrop-blur-sm
                  border border-border shadow-md transition-opacity
                  ${currentIndex === 0 ? "opacity-25 cursor-not-allowed" : "opacity-100"}`}
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={next}
                disabled={currentIndex >= maxIndex}
                className={`pointer-events-auto rounded-full p-2 bg-background/90 backdrop-blur-sm
                  border border-border shadow-md transition-opacity
                  ${currentIndex >= maxIndex ? "opacity-25 cursor-not-allowed" : "opacity-100"}`}
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Pagination Dots ── */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex justify-center gap-2 mt-6 sm:mt-8"
            >
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageStart = i * itemsPerView;
                const isActive = currentIndex >= pageStart && currentIndex < pageStart + itemsPerView;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(pageStart)}
                    aria-label={`Go to page ${i + 1}`}
                    className={`rounded-full transition-all duration-300 
                      ${isActive
                        ? "w-6 h-2 bg-primary"
                        : "w-2 h-2 bg-muted hover:bg-muted-foreground"
                      }`}
                  />
                );
              })}
            </motion.div>
          )}
        </div>

        {/* ── Mobile "View All" CTA ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-8 text-center sm:hidden"
        >
          <Link href="/blogs">
            <Button variant="outline" className="font-semibold w-full max-w-xs">
              View All Blogs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

      </div>
    </section>
  );
};