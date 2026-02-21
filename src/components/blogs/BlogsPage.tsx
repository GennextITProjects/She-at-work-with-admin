/*eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, Variants } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Cta from "../common/Cta";
import {
  getCategoryIcon,
  MultiSelectDropdown,
} from "../common/MultiSelectDropdown";
import {
  AnimatedText,
  ScrollFade,
  StaggerChildren,
} from "../common/ScrollFade";
import { ScrollReveal } from "../common/ScrollReveal";
import { Chip } from "./Chip";
import {
  ApiResponse,
  blogCategories,
  buildApiUrl,
  buildPageNumbers,
  ITEMS_PER_PAGE,
  predefinedDateRanges,
  ProcessedBlogItem,
  SearchSuggestion,
} from "./helper";
import { SearchSuggestions } from "./SearchSuggestions";
import { SkeletonCard } from "./SkeletonCard";
// ─── Main Component ───────────────────────────────────────────────────────────

export default function BlogsPage() {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "All Blogs",
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedDateRange, setSelectedDateRange] = useState("");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedReadingTimes, setSelectedReadingTimes] = useState<string[]>([
    "All Reading Times",
  ]);
  const [selectedProficiencyLevels, setSelectedProficiencyLevels] = useState<
    string[]
  >(["All Levels"]);

  // ── Data state ────────────────────────────────────────────────────────────
  const [blogItems, setBlogItems] = useState<ProcessedBlogItem[]>([]);
  const [featuredBlog, setFeaturedBlog] = useState<ProcessedBlogItem | null>(
    null,
  );
  const [latestHeadlines, setLatestHeadlines] = useState<ProcessedBlogItem[]>(
    [],
  );
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Metadata (for filter dropdowns) ──────────────────────────────────────
  const [uniqueCountries, setUniqueCountries] = useState<string[]>([]);
  const [uniqueReadingTimes, setUniqueReadingTimes] = useState<string[]>([]);
  const [uniqueProficiencyLevels, setUniqueProficiencyLevels] = useState<
    string[]
  >([]);

  // ── Loading state ─────────────────────────────────────────────────────────
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // ── Search suggestions ────────────────────────────────────────────────────
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<
    SearchSuggestion[]
  >([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    country?: string;
    state?: string;
    detected: boolean;
  }>({ detected: false });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const searchRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const filterAbortRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const prevFilters = useRef({
    selectedCategories,
    debouncedSearch,
    dateRange,
    selectedStates,
    selectedCountries,
    selectedReadingTimes,
    selectedProficiencyLevels,
  });

  // ── Animation variants ────────────────────────────────────────────────────
  const bannerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };
  const bannerSubtitleVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] },
    },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Debounce search
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(
      () => setDebouncedSearch(searchQuery),
      300,
    );
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // ─────────────────────────────────────────────────────────────────────────
  // On mount: parallel fetch of first page + metadata
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [blogsRes, metaRes] = await Promise.all([
          fetch("/api/blogs?page=1"),
          fetch("/api/blogs?meta=1"),
        ]);

        if (blogsRes.ok) {
          const data: ApiResponse = await blogsRes.json();
          if (data.blogs.length > 0) setFeaturedBlog(data.blogs[0]);
          setLatestHeadlines(data.blogs.slice(0, 4));
          setBlogItems(data.blogs);
          setTotalPages(data.totalPages);
          setTotalItems(data.totalItems);
        }

        if (metaRes.ok) {
          const meta = await metaRes.json();
          if (meta.countries) setUniqueCountries(meta.countries);
          if (meta.readingTimes) setUniqueReadingTimes(meta.readingTimes);
          if (meta.proficiencyLevels)
            setUniqueProficiencyLevels(meta.proficiencyLevels);
        }
      } catch (err) {
        console.error("Init fetch error:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    init();
    detectUserLocation();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch filtered blogs — abort-controlled
  // ─────────────────────────────────────────────────────────────────────────
  const fetchFilteredBlogs = useCallback(async () => {
    if (filterAbortRef.current) filterAbortRef.current.abort();
    filterAbortRef.current = new AbortController();
    setIsFilterLoading(true);

    try {
      const url = buildApiUrl({
        page: currentPage,
        categories: selectedCategories,
        search: debouncedSearch,
        countries: selectedCountries,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        readingTimes: selectedReadingTimes,
        proficiencyLevels: selectedProficiencyLevels,
        states: selectedStates,
      });

      const res = await fetch(url, { signal: filterAbortRef.current.signal });
      if (!res.ok) throw new Error("Failed");
      const data: ApiResponse = await res.json();

      setBlogItems(data.blogs);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("Filter fetch error:", err);
      setBlogItems([]);
    } finally {
      setIsFilterLoading(false);
    }
  }, [
    currentPage,
    selectedCategories,
    debouncedSearch,
    selectedCountries,
    dateRange,
    selectedReadingTimes,
    selectedProficiencyLevels,
    selectedStates,
  ]);

  // Skip first render (init fetch handles it)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchFilteredBlogs();
  }, [fetchFilteredBlogs]);

  // Reset page on filter change
  useEffect(() => {
    const prev = prevFilters.current;
    const changed =
      prev.selectedCategories !== selectedCategories ||
      prev.debouncedSearch !== debouncedSearch ||
      prev.dateRange !== dateRange ||
      prev.selectedStates !== selectedStates ||
      prev.selectedCountries !== selectedCountries ||
      prev.selectedReadingTimes !== selectedReadingTimes ||
      prev.selectedProficiencyLevels !== selectedProficiencyLevels;

    if (changed) {
      setCurrentPage(1);
      prevFilters.current = {
        selectedCategories,
        debouncedSearch,
        dateRange,
        selectedStates,
        selectedCountries,
        selectedReadingTimes,
        selectedProficiencyLevels,
      };
    }
  }, [
    selectedCategories,
    debouncedSearch,
    dateRange,
    selectedStates,
    selectedCountries,
    selectedReadingTimes,
    selectedProficiencyLevels,
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // Search suggestions — abort-controlled
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (searchAbortRef.current) searchAbortRef.current.abort();
    searchAbortRef.current = new AbortController();

    const run = async () => {
      try {
        const res = await fetch(
          `/api/blogs?page=1&search=${encodeURIComponent(debouncedSearch)}`,
          { signal: searchAbortRef.current!.signal },
        );
        if (!res.ok) return;
        const data: ApiResponse = await res.json();

        const query = debouncedSearch.toLowerCase();
        const suggestions: SearchSuggestion[] = data.blogs
          .map((b) => {
            let relevance = 0;
            if (b.title.toLowerCase().includes(query)) relevance += 10;
            if (b.excerpt?.toLowerCase().includes(query)) relevance += 5;
            if (b.category.toLowerCase().includes(query)) relevance += 8;
            if (b.author?.toLowerCase().includes(query)) relevance += 4;
            if (b.state?.toLowerCase().includes(query)) relevance += 6;
            if (b.country?.toLowerCase().includes(query)) relevance += 6;
            if (b.title.toLowerCase().startsWith(query)) relevance += 5;
            return {
              id: b.id,
              title: b.title,
              category: b.category,
              author: b.author ?? "",
              date: b.date,
              slug: b.slug,
              relevance,
            };
          })
          .filter((s) => s.relevance > 0)
          .sort((a, b) => b.relevance - a.relevance)
          .slice(0, 8);

        setSearchSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (err: any) {
        if (err.name !== "AbortError") console.error(err);
      }
    };

    run();
  }, [debouncedSearch]);

  // ─────────────────────────────────────────────────────────────────────────
  // Location detection
  // ─────────────────────────────────────────────────────────────────────────
  const detectUserLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      setUserLocation({
        country: data.country_name,
        state: data.region,
        detected: true,
      });
      if (data.country_name) setSelectedCountries([data.country_name]);
    } catch {
      setUserLocation({ detected: false });
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Click-outside
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowSuggestions(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setIsFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Date range
  // ─────────────────────────────────────────────────────────────────────────
  const applyDateRangeFilter = (range: string) => {
    const now = new Date();
    const from = new Date();
    setSelectedDateRange(range);

    if (range === "custom") {
      setShowCustomDatePicker(true);
      return;
    }
    setShowCustomDatePicker(false);
    if (!range) {
      setDateRange({ from: "", to: "" });
      return;
    }

    const offsets: Record<string, () => void> = {
      "24h": () => from.setDate(now.getDate() - 1),
      week: () => from.setDate(now.getDate() - 7),
      month: () => from.setMonth(now.getMonth() - 1),
      "3months": () => from.setMonth(now.getMonth() - 3),
    };
    offsets[range]?.();
    setDateRange({
      from: from.toISOString().split("T")[0],
      to: now.toISOString().split("T")[0],
    });
  };

  const getDateRangeDisplayLabel = () => {
    if (selectedDateRange === "custom") {
      const parts: string[] = [];
      if (dateRange.from)
        parts.push(
          `From: ${new Date(dateRange.from).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        );
      if (dateRange.to)
        parts.push(
          `To: ${new Date(dateRange.to).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        );
      return parts.join(" • ") || "Custom Range";
    }
    return (
      predefinedDateRanges.find((r) => r.value === selectedDateRange)?.label ??
      ""
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Filter helpers
  // ─────────────────────────────────────────────────────────────────────────
  const clearAllFilters = () => {
    setSelectedCategories(["All Blogs"]);
    setDateRange({ from: "", to: "" });
    setSelectedDateRange("");
    setShowCustomDatePicker(false);
    setSelectedStates([]);
    setSelectedCountries([]);
    setSelectedReadingTimes(["All Reading Times"]);
    setSelectedProficiencyLevels(["All Levels"]);
    setSearchQuery("");
    setDebouncedSearch("");
    setSearchSuggestions([]);
    setShowSuggestions(false);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const isAnyFilterActive = () =>
    (selectedCategories.length > 0 &&
      !selectedCategories.includes("All Blogs")) ||
    dateRange.from !== "" ||
    dateRange.to !== "" ||
    selectedStates.length > 0 ||
    selectedCountries.length > 0 ||
    (selectedReadingTimes.length > 0 &&
      !selectedReadingTimes.includes("All Reading Times")) ||
    (selectedProficiencyLevels.length > 0 &&
      !selectedProficiencyLevels.includes("All Levels")) ||
    searchQuery !== "";

  const activeFilterCount = [
    selectedCategories.length > 0 && !selectedCategories.includes("All Blogs"),
    dateRange.from || dateRange.to,
    selectedStates.length > 0,
    selectedCountries.length > 0,
    selectedReadingTimes.length > 0 &&
      !selectedReadingTimes.includes("All Reading Times"),
    selectedProficiencyLevels.length > 0 &&
      !selectedProficiencyLevels.includes("All Levels"),
    searchQuery,
  ].filter(Boolean).length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

  // ─────────────────────────────────────────────────────────────────────────
  // Initial loading
  // ─────────────────────────────────────────────────────────────────────────
  if (isInitialLoading) {
    return (
      <main className="bg-background min-h-screen">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading blog articles…</p>
          </div>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="bg-background min-h-screen">
  <section className="relative h-[480px] md:h-[600px] lg:h-[470px] overflow-hidden pt-24">
  <div className="absolute inset-0" style={{ top: 96 }}>
    <div className="block lg:hidden relative w-full h-full">
      <Image
        src="/blogs/mobileBlogs.png"
        alt="News Banner"
        fill
        className="object-cover object-center"
        priority
        sizes="(max-width: 1024px) 100vw"
      />
    </div>
    <div className="hidden lg:block relative w-full h-full">
      <Image
        src="/blogs/finalBlogsbanner.png"
        alt="News Banner"
        fill
        className="object-cover object-center"
        priority
        sizes="(min-width: 1024px) 100vw"
      />
    </div>
  </div>

  {/* ✅ Text Centered Inside Gradient */}
  <div className="relative z-10 h-full flex items-center">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl px-4 sm:px-6 lg:px-8 -mt-40 lg:mt-0">

        <motion.div
          initial="hidden"
          animate="visible"
          variants={bannerVariants}
        >
          <h1 className="text-white leading-tight">
            <span className="block text-3xl sm:text-4xl lg:text-6xl font-bold">
              Inspiring Blogs
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={bannerSubtitleVariants}
          className="mt-2 sm:mt-6 text-sm sm:text-base md:text-xl text-white/90 leading-relaxed max-w-xl"
        >
          Explore real insights, bold conversations, and practical
          guidance for women entrepreneurs. From funding and strategy to
          inspiring journeys, discover ideas that help you start, scale,
          and grow.
        </motion.p>

      </div>
    </div>
  </div>
</section>

      {/* ══════════════════ FEATURED BLOG + SIDEBAR ══════════════════════ */}
      <ScrollReveal direction="up" delay={0.2} threshold={0}>
        <section className="px-4 sm:px-6 lg:px-8 py-12 bg-secondary/30">
          <div className="max-w-screen-xl mx-auto grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* ── FEATURED ── */}
            {featuredBlog && (
              <ScrollReveal
                direction="left"
                delay={0.3}
                className="lg:col-span-2"
              >
                <Link
                  href={`/blogs/${featuredBlog.slug}`}
                  className="block relative group bg-card rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-primary/10"
                >
                  <div className="absolute top-4 right-4 sm:top-4 sm:right-4 z-10">
                    <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-white text-xs font-bold uppercase shadow-lg">
                      Featured Story
                    </span>
                  </div>

                  <div className="relative h-40 sm:h-64 lg:h-[340px] bg-gradient-to-br from-muted to-secondary">
                    {featuredBlog.image ? (
                      <Image
                        src={featuredBlog.image}
                        alt={featuredBlog.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                        sizes="(max-width: 1024px) 100vw, 66vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                        <div className="text-white/40 text-6xl font-display">
                          {featuredBlog.title.charAt(0)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1 px-2 sm:px-3 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase">
                        {getCategoryIcon(featuredBlog.category)}
                        {featuredBlog.category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {featuredBlog.author?.split(" ")[0]}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-display font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                      {featuredBlog.title}
                    </h2>

                    <p className="text-sm sm:text-base text-muted-foreground mb-2 leading-relaxed line-clamp-3">
                      {featuredBlog.excerpt}
                    </p>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-border">
                      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          {featuredBlog.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          {featuredBlog.readTime}
                        </div>
                        {featuredBlog.state && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                            {featuredBlog.state}
                          </div>
                        )}
                      </div>
                      <Button className="bg-primary hover:bg-primary/90 group text-sm sm:text-base w-full sm:w-auto">
                        Read Full Article
                        <ExternalLink className="ml-2 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            )}

            {/* ── SIDEBAR – TRENDING NOW ── */}
            <ScrollReveal
              direction="right"
              delay={0.4}
              className={!featuredBlog ? "lg:col-span-3" : ""}
            >
              <div className="bg-card rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 shadow-lg border border-border lg:sticky lg:top-24">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                  <h3 className="text-lg sm:text-xl font-display font-bold text-foreground">
                    Trending Now
                  </h3>
                </div>

                <div className="max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  <StaggerChildren>
                    <div className="space-y-3 sm:space-y-4">
                      {latestHeadlines.map((blog, i) => (
                        <motion.div
                          key={blog.id}
                          variants={{
                            hidden: { opacity: 0, x: -20 },
                            visible: { opacity: 1, x: 0 },
                          }}
                        >
                          <Link
                            href={`/blogs/${blog.slug}`}
                            className="block cursor-pointer pb-3 sm:pb-4 border-b border-border last:border-0 last:pb-0 hover:bg-secondary/30 rounded-lg px-2 -mx-2 transition-all duration-200"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 relative h-12 w-12 sm:h-14 sm:w-14 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-secondary">
                                {blog.image ? (
                                  <Image
                                    src={blog.image}
                                    alt={blog.title}
                                    fill
                                    className="object-cover"
                                    sizes="56px"
                                    loading="eager"
                                  />
                                ) : (
                                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center">
                                    <span className="text-primary/40 text-lg font-display">
                                      {blog.title.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <div className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-br from-primary to-accent text-white text-xs font-bold">
                                  {i + 1}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-semibold uppercase tracking-wide">
                                    {getCategoryIcon(blog.category)}
                                    <span className="truncate max-w-[60px]">
                                      {blog.category.split(" ")[0]}
                                    </span>
                                  </span>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <User className="h-2.5 w-2.5" />
                                    {blog.author?.split(" ")[0]}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-xs sm:text-sm text-foreground mb-1.5 leading-snug line-clamp-2">
                                  {blog.title}
                                </h4>
                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {blog.date}
                                  </div>
                                  {blog.state && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      <span className="truncate max-w-[60px]">
                                        {blog.state}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0 mt-1" />
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </StaggerChildren>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    className="w-full text-accent hover:bg-accent/10 hover:text-accent text-sm flex items-center justify-center gap-2"
                    onClick={() => {
                      clearAllFilters();
                      window.scrollTo({
                        top:
                          document.getElementById("all-blogs-section")
                            ?.offsetTop ?? 0,
                        behavior: "smooth",
                      });
                    }}
                  >
                    View All Blogs
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ScrollReveal>

      {/* ══════════════════ ALL BLOGS GRID ═══════════════════════════════ */}
      <ScrollFade delay={0.3}>
        <section id="all-blogs-section" className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-screen-xl mx-auto">
            {/* ── Header + Search + Filter ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12">
              <ScrollReveal direction="right" delay={0.2}>
                <div>
                  <AnimatedText as="h2" delay={0.1}>
                    {selectedCategories.includes("All Blogs") ||
                    selectedCategories.length === 0
                      ? "All Blog Articles"
                      : `${selectedCategories.length} ${selectedCategories.length === 1 ? "Category" : "Categories"} Selected`}
                    {debouncedSearch && (
                      <span className="text-lg sm:text-xl text-primary">
                        {" "}
                        — Search: {debouncedSearch}
                      </span>
                    )}
                  </AnimatedText>

                  <AnimatedText as="p" delay={0.2}>
                    {isFilterLoading ? (
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <span className="inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        Filtering…
                      </span>
                    ) : (
                      <>
                        {totalItems} {totalItems === 1 ? "article" : "articles"}{" "}
                        found
                        {debouncedSearch && ` matching "${debouncedSearch}"`}
                        {getDateRangeDisplayLabel() &&
                          ` • ${getDateRangeDisplayLabel()}`}
                      </>
                    )}
                  </AnimatedText>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="left" delay={0.3}>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
                  {/* SEARCH */}
                  <div className="relative w-full sm:w-64" ref={searchRef}>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setShowSuggestions(false);
                      }}
                    >
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black z-10" />
                      <Input
                        type="search"
                        placeholder="Search blogs…"
                        className="pl-10 pr-10 w-full bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => {
                          if (
                            debouncedSearch.length >= 2 &&
                            searchSuggestions.length > 0
                          )
                            setShowSuggestions(true);
                        }}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setDebouncedSearch("");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-10"
                        >
                          <X className="h-4 w-4 text-black" />
                        </button>
                      )}
                    </form>

                    <SearchSuggestions
                      suggestions={searchSuggestions}
                      onSelect={(title) => {
                        setSearchQuery(title);
                        setShowSuggestions(false);
                      }}
                      searchQuery={debouncedSearch}
                      isVisible={showSuggestions}
                      onClose={() => setShowSuggestions(false)}
                    />
                  </div>

                  {/* FILTER */}
                  <div className="relative w-full sm:w-auto" ref={filterRef}>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto flex items-center gap-2"
                      onClick={() => setIsFilterOpen((v) => !v)}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                      {isAnyFilterActive() && (
                        <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-xs">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>

                    {isFilterOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 mt-1 w-80 sm:w-96 bg-white border border-border rounded-lg shadow-xl z-50 max-h-[80vh] overflow-y-auto p-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-foreground">
                            Filter Articles
                          </h4>
                        </div>

                        {/* CATEGORY */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-foreground mb-2">
                            Category / Topic
                          </h5>
                          <MultiSelectDropdown
                            label="Categories"
                            icon={<CalendarDays className="h-4 w-4" />}
                            options={blogCategories.filter(
                              (c) => c !== "All Blogs",
                            )}
                            selectedValues={selectedCategories.filter(
                              (c) => c !== "All Blogs",
                            )}
                            onChange={setSelectedCategories}
                            placeholder="Select categories"
                            allOptionLabel="All Categories"
                          />
                        </div>

                        {/* READING TIME */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-foreground mb-2">
                            Reading Time
                          </h5>
                          <MultiSelectDropdown
                            label="Reading Times"
                            icon={<Clock className="h-4 w-4" />}
                            options={uniqueReadingTimes}
                            selectedValues={selectedReadingTimes.filter(
                              (t) => t !== "All Reading Times",
                            )}
                            onChange={setSelectedReadingTimes}
                            placeholder="Select reading times"
                            allOptionLabel="All Reading Times"
                          />
                        </div>

                        {/* PROFICIENCY LEVEL */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-foreground mb-2">
                            Proficiency Level
                          </h5>
                          <MultiSelectDropdown
                            label="Proficiency Levels"
                            icon={<User className="h-4 w-4" />}
                            options={uniqueProficiencyLevels}
                            selectedValues={selectedProficiencyLevels.filter(
                              (l) => l !== "All Levels",
                            )}
                            onChange={setSelectedProficiencyLevels}
                            placeholder="Select proficiency levels"
                            allOptionLabel="All Levels"
                          />
                        </div>

                        {/* DATE RANGE */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Date Range
                          </h5>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                            {predefinedDateRanges.map((r) => (
                              <button
                                key={r.value}
                                onClick={() => applyDateRangeFilter(r.value)}
                                className={`px-3 py-2 text-xs rounded-lg border transition-all duration-200 ${
                                  selectedDateRange === r.value
                                    ? "bg-primary text-white border-primary scale-105"
                                    : "bg-secondary/50 border-border hover:bg-secondary"
                                }`}
                              >
                                {r.label}
                              </button>
                            ))}
                          </div>

                          {showCustomDatePicker && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="grid grid-cols-2 gap-3 mt-3 p-3 bg-secondary/30 rounded-lg overflow-hidden"
                            >
                              <div>
                                <label className="text-xs text-muted-foreground block mb-1">
                                  From
                                </label>
                                <Input
                                  type="date"
                                  value={dateRange.from}
                                  onChange={(e) =>
                                    setDateRange((d) => ({
                                      ...d,
                                      from: e.target.value,
                                    }))
                                  }
                                  className="w-full"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground block mb-1">
                                  To
                                </label>
                                <Input
                                  type="date"
                                  value={dateRange.to}
                                  onChange={(e) =>
                                    setDateRange((d) => ({
                                      ...d,
                                      to: e.target.value,
                                    }))
                                  }
                                  className="w-full"
                                />
                              </div>
                            </motion.div>
                          )}

                          {(dateRange.from || dateRange.to) && (
                            <button
                              onClick={() => {
                                setDateRange({ from: "", to: "" });
                                setSelectedDateRange("");
                                setShowCustomDatePicker(false);
                              }}
                              className="text-xs text-primary hover:text-primary/80 mt-2 transition-colors"
                            >
                              Clear date range
                            </button>
                          )}
                        </div>

                        {/* COUNTRY */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-foreground mb-2">
                            Country
                          </h5>
                          <MultiSelectDropdown
                            label="Countries"
                            icon={<Globe className="h-4 w-4" />}
                            options={uniqueCountries}
                            selectedValues={selectedCountries}
                            onChange={setSelectedCountries}
                            placeholder="Select countries"
                            allOptionLabel="All Countries"
                          />
                        </div>

                        {/* LOCATION DETECTION */}
                        <div className="p-3 bg-secondary/30 rounded-lg mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium text-foreground flex items-center gap-2">
                              <MapPin className="h-4 w-4" /> Your Location
                            </h5>
                            <button
                              onClick={detectUserLocation}
                              disabled={isDetectingLocation}
                              className="text-xs text-primary hover:text-primary/80 transition-colors"
                            >
                              {isDetectingLocation ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Refresh"
                              )}
                            </button>
                          </div>
                          {userLocation.detected ? (
                            <p className="text-xs text-muted-foreground">
                              Showing content from{" "}
                              <span className="font-medium text-foreground">
                                {userLocation.country}
                                {userLocation.state &&
                                  ` • ${userLocation.state}`}
                              </span>
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Location not detected. Click refresh to try again.
                            </p>
                          )}
                        </div>

                        {/* ACTIVE FILTER CHIPS */}
                        {isAnyFilterActive() && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="pt-4 mt-2 border-t border-border"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-medium text-foreground">
                                Active Filters
                              </h5>
                              <button
                                onClick={clearAllFilters}
                                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                              >
                                <X className="h-3 w-3" /> Clear All
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {selectedCategories.length > 0 &&
                                !selectedCategories.includes("All Blogs") && (
                                  <Chip
                                    color="primary"
                                    icon={<CalendarDays className="h-3 w-3" />}
                                    onRemove={() =>
                                      setSelectedCategories(["All Blogs"])
                                    }
                                  >
                                    {selectedCategories.length} categor
                                    {selectedCategories.length !== 1
                                      ? "ies"
                                      : "y"}
                                  </Chip>
                                )}
                              {selectedReadingTimes.length > 0 &&
                                !selectedReadingTimes.includes(
                                  "All Reading Times",
                                ) && (
                                  <Chip
                                    color="blue"
                                    icon={<Clock className="h-3 w-3" />}
                                    onRemove={() =>
                                      setSelectedReadingTimes([
                                        "All Reading Times",
                                      ])
                                    }
                                  >
                                    {selectedReadingTimes.length} reading time
                                    {selectedReadingTimes.length !== 1
                                      ? "s"
                                      : ""}
                                  </Chip>
                                )}
                              {selectedProficiencyLevels.length > 0 &&
                                !selectedProficiencyLevels.includes(
                                  "All Levels",
                                ) && (
                                  <Chip
                                    color="green"
                                    icon={<User className="h-3 w-3" />}
                                    onRemove={() =>
                                      setSelectedProficiencyLevels([
                                        "All Levels",
                                      ])
                                    }
                                  >
                                    {selectedProficiencyLevels.length} level
                                    {selectedProficiencyLevels.length !== 1
                                      ? "s"
                                      : ""}
                                  </Chip>
                                )}
                              {selectedDateRange &&
                                selectedDateRange !== "custom" && (
                                  <Chip
                                    color="green"
                                    icon={<Calendar className="h-3 w-3" />}
                                    onRemove={() => {
                                      setDateRange({ from: "", to: "" });
                                      setSelectedDateRange("");
                                    }}
                                  >
                                    {
                                      predefinedDateRanges.find(
                                        (r) => r.value === selectedDateRange,
                                      )?.label
                                    }
                                  </Chip>
                                )}
                              {selectedDateRange === "custom" &&
                                dateRange.from && (
                                  <Chip
                                    color="green"
                                    icon={<Calendar className="h-3 w-3" />}
                                    onRemove={() =>
                                      setDateRange((d) => ({ ...d, from: "" }))
                                    }
                                  >
                                    From:{" "}
                                    {new Date(
                                      dateRange.from,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </Chip>
                                )}
                              {selectedDateRange === "custom" &&
                                dateRange.to && (
                                  <Chip
                                    color="green"
                                    icon={<Calendar className="h-3 w-3" />}
                                    onRemove={() =>
                                      setDateRange((d) => ({ ...d, to: "" }))
                                    }
                                  >
                                    To:{" "}
                                    {new Date(dateRange.to).toLocaleDateString(
                                      "en-US",
                                      { month: "short", day: "numeric" },
                                    )}
                                  </Chip>
                                )}
                              {selectedCountries.length > 0 && (
                                <Chip
                                  color="purple"
                                  icon={<Globe className="h-3 w-3" />}
                                  onRemove={() => setSelectedCountries([])}
                                >
                                  {selectedCountries.length} countr
                                  {selectedCountries.length !== 1 ? "ies" : "y"}
                                </Chip>
                              )}
                              {selectedStates.length > 0 && (
                                <Chip
                                  color="amber"
                                  icon={<MapPin className="h-3 w-3" />}
                                  onRemove={() => setSelectedStates([])}
                                >
                                  {selectedStates.length} state
                                  {selectedStates.length !== 1 ? "s" : ""}
                                </Chip>
                              )}
                              {searchQuery && (
                                <Chip
                                  color="amber"
                                  icon={<Search className="h-3 w-3" />}
                                  onRemove={() => {
                                    setSearchQuery("");
                                    setDebouncedSearch("");
                                  }}
                                >
                                  Search: {searchQuery}
                                </Chip>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* ── Grid / Skeleton / Empty ── */}
            {isFilterLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : blogItems.length === 0 ? (
              <ScrollFade delay={0.4}>
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-display font-bold text-foreground mb-2">
                    No articles found
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {debouncedSearch
                      ? `No articles found matching "${debouncedSearch}".`
                      : "No articles match the current filters."}
                  </p>
                  <Button
                    onClick={clearAllFilters}
                    className="bg-gradient-to-r from-primary to-accent text-white font-semibold"
                  >
                    View All Blogs
                  </Button>
                </div>
              </ScrollFade>
            ) : (
              <>
                <StaggerChildren>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {blogItems.map((blog, index) => (
                      <motion.div
                        key={blog.id}
                        variants={{
                          hidden: { opacity: 0, y: 30 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.6,
                              ease: [0.22, 1, 0.36, 1],
                            },
                          },
                        }}
                      >
                        <Link
                          href={`/blogs/${blog.slug}`}
                          className="group bg-card rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 border border-border flex flex-col h-full"
                        >
                          <div className="relative h-40 sm:h-44 bg-gradient-to-br from-muted to-secondary flex-shrink-0 overflow-hidden">
                            {blog.image ? (
                              <Image
                                src={blog.image}
                                alt={blog.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                loading={index < 4 ? "eager" : "lazy"}
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                                <div className="text-white/40 text-5xl font-display">
                                  {blog.title.charAt(0)}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="p-4 sm:p-6 flex flex-col flex-grow">
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase">
                                {getCategoryIcon(blog.category)}
                                {blog.category.split(" & ")[0]}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {blog.author?.split(" ")[0]}
                              </span>
                            </div>

                            <h3 className="text-sm sm:text-base lg:text-lg font-display font-bold text-foreground mb-2 sm:mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                              {blog.title}
                            </h3>

                            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-5 line-clamp-2 leading-relaxed flex-grow">
                              {blog.excerpt}
                            </p>

                            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-border mt-auto">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  {blog.date}
                                </div>
                                {(blog.state || blog.country) && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    {blog.state || blog.country}
                                  </div>
                                )}
                              </div>
                              <motion.div
                                whileHover={{ x: 5 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 10,
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 -mx-2 -my-1 rounded-md text-primary group-hover:text-accent group-hover:bg-primary/5 transition-colors"
                              >
                                Read
                                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                              </motion.div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </StaggerChildren>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <ScrollFade delay={0.5}>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 sm:mt-12 pt-8 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}–{endIndex} of {totalItems}{" "}
                        articles
                      </p>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="gap-1"
                        >
                          <ArrowRight className="h-3 w-3 rotate-180" />
                          Previous
                        </Button>

                        <div className="flex items-center gap-1">
                          {buildPageNumbers(currentPage, totalPages).map(
                            (p, i) =>
                              p === "…" ? (
                                <span
                                  key={`ellipsis-${i}`}
                                  className="px-2 text-muted-foreground"
                                >
                                  …
                                </span>
                              ) : (
                                <motion.div
                                  key={p}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    variant={
                                      currentPage === p ? "default" : "outline"
                                    }
                                    size="sm"
                                    className="w-10 h-10 p-0"
                                    onClick={() =>
                                      handlePageChange(p as number)
                                    }
                                  >
                                    {p}
                                  </Button>
                                </motion.div>
                              ),
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="gap-1"
                        >
                          Next
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </ScrollFade>
                )}
              </>
            )}
          </div>
        </section>
      </ScrollFade>

      <Cta />
    </main>
  );
}
