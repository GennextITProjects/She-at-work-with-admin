/*eslint-disable @typescript-eslint/no-explicit-any  */
"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, Variants } from "framer-motion";
import {
  ArrowRight,
  Building,
  Calendar,
  CalendarDays,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  TrendingUp,
  User,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
import {
  entrechatCategories,
  ITEMS_PER_PAGE,
  predefinedDateRanges,
  ProcessedEntreChatItem,
} from "./helper";
import { SearchSuggestions } from "./SearchSuggestions";
import { SkeletonCard } from "../blogs/SkeletonCard";
import { Chip } from "../blogs/Chip";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiResponse {
  interviews: ProcessedEntreChatItem[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface SearchSuggestion {
  id: string;
  title: string;
  category: string;
  interviewee: string;
  date: string;
  slug: string;
  relevance: number;
}

// ─── URL builder ──────────────────────────────────────────────────────────────

function buildApiUrl(p: {
  page: number;
  categories: string[];
  search: string;
  countries: string[];
  dateFrom: string;
  dateTo: string;
  industries: string[];
  stages: string[];
  formats: string[];
  regions: string[];
  successFactors: string[];
  states: string[];
}) {
  const sp = new URLSearchParams();
  sp.set("page", String(p.page));

  const cat = p.categories.filter((c) => c !== "All Interviews");
  if (cat.length === 1) sp.set("category", cat[0]);
  if (cat.length > 1) sp.set("categories", cat.join(","));

  if (p.search) sp.set("search", p.search);

  if (p.countries.length === 1) sp.set("country", p.countries[0]);
  if (p.countries.length > 1) sp.set("countries", p.countries.join(","));

  if (p.dateFrom) sp.set("dateFrom", p.dateFrom);
  if (p.dateTo) sp.set("dateTo", p.dateTo);

  const ind = p.industries.filter((i) => i !== "All Industries");
  if (ind.length) sp.set("industries", ind.join(","));

  const stg = p.stages.filter((s) => s !== "All Stages");
  if (stg.length) sp.set("stages", stg.join(","));

  const fmt = p.formats.filter((f) => f !== "All Formats");
  if (fmt.length) sp.set("formats", fmt.join(","));

  const rgn = p.regions.filter((r) => r !== "All Regions");
  if (rgn.length) sp.set("regions", rgn.join(","));

  const sf = p.successFactors.filter((s) => s !== "All Funding Types");
  if (sf.length) sp.set("successFactors", sf.join(","));

  if (p.states.length) sp.set("states", p.states.join(","));

  return `/api/entrechat?${sp.toString()}`;
}




// ─── Pagination page-number builder ──────────────────────────────────────────

function buildPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EntreChatPage() {
  const router = useRouter();

  // ── Filter state ──────────────────────────────────────────────────────────
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["All Interviews"]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedDateRange, setSelectedDateRange] = useState("");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedIndustrySectors, setSelectedIndustrySectors] = useState<string[]>(["All Industries"]);
  const [selectedBusinessStages, setSelectedBusinessStages] = useState<string[]>(["All Stages"]);
  const [selectedInterviewFormats, setSelectedInterviewFormats] = useState<string[]>(["All Formats"]);
  const [selectedFounderRegions, setSelectedFounderRegions] = useState<string[]>(["All Regions"]);
  const [selectedSuccessFactors, setSelectedSuccessFactors] = useState<string[]>(["All Funding Types"]);

  // ── Data state ────────────────────────────────────────────────────────────
  const [interviewItems, setInterviewItems] = useState<ProcessedEntreChatItem[]>([]);
  const [featuredInterview, setFeaturedInterview] = useState<ProcessedEntreChatItem | null>(null);
  const [latestHeadlines, setLatestHeadlines] = useState<ProcessedEntreChatItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Metadata (filter dropdowns) ───────────────────────────────────────────
  const [uniqueCountries, setUniqueCountries] = useState<string[]>([]);
  const [uniqueStates, setUniqueStates] = useState<string[]>([]);
  const [uniqueIndustrySectors, setUniqueIndustrySectors] = useState<string[]>([]);
  const [uniqueBusinessStages, setUniqueBusinessStages] = useState<string[]>([]);
  const [uniqueInterviewFormats, setUniqueInterviewFormats] = useState<string[]>([]);
  const [uniqueFounderRegions, setUniqueFounderRegions] = useState<string[]>([]);
  const [uniqueSuccessFactors, setUniqueSuccessFactors] = useState<string[]>([]);

  // ── Loading state ─────────────────────────────────────────────────────────
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // ── Search suggestions ────────────────────────────────────────────────────
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);

  // ── UI ────────────────────────────────────────────────────────────────────
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
    selectedIndustrySectors,
    selectedBusinessStages,
    selectedInterviewFormats,
    selectedFounderRegions,
    selectedSuccessFactors,
  });

  // ── Animation variants ────────────────────────────────────────────────────
  const bannerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
  };
  const bannerSubtitleVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] } },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Debounce search
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchQuery]);

  // ─────────────────────────────────────────────────────────────────────────
  // On mount: parallel fetch of first page + metadata
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [interviewsRes, metaRes] = await Promise.all([
          fetch("/api/entrechat?page=1"),
          fetch("/api/entrechat?meta=1"),
        ]);

        if (interviewsRes.ok) {
          const data: ApiResponse = await interviewsRes.json();
          if (data.interviews.length > 0) setFeaturedInterview(data.interviews[0]);
          setLatestHeadlines(data.interviews.slice(0, 4));
          setInterviewItems(data.interviews);
          setTotalPages(data.totalPages);
          setTotalItems(data.totalItems);
        }

        if (metaRes.ok) {
          const meta = await metaRes.json();
          if (meta.countries) setUniqueCountries(meta.countries);
          if (meta.states) setUniqueStates(meta.states);
          if (meta.industrySectors) setUniqueIndustrySectors(meta.industrySectors);
          if (meta.businessStages) setUniqueBusinessStages(meta.businessStages);
          if (meta.interviewFormats) setUniqueInterviewFormats(meta.interviewFormats);
          if (meta.founderRegions) setUniqueFounderRegions(meta.founderRegions);
          if (meta.successFactors) setUniqueSuccessFactors(meta.successFactors);
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
  // Fetch filtered interviews — abort-controlled
  // ─────────────────────────────────────────────────────────────────────────
  const fetchFilteredInterviews = useCallback(async () => {
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
        industries: selectedIndustrySectors,
        stages: selectedBusinessStages,
        formats: selectedInterviewFormats,
        regions: selectedFounderRegions,
        successFactors: selectedSuccessFactors,
        states: selectedStates,
      });

      const res = await fetch(url, { signal: filterAbortRef.current.signal });
      if (!res.ok) throw new Error("Failed");
      const data: ApiResponse = await res.json();

      setInterviewItems(data.interviews);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("Filter fetch error:", err);
      setInterviewItems([]);
    } finally {
      setIsFilterLoading(false);
    }
  }, [
    currentPage,
    selectedCategories,
    debouncedSearch,
    selectedCountries,
    dateRange,
    selectedIndustrySectors,
    selectedBusinessStages,
    selectedInterviewFormats,
    selectedFounderRegions,
    selectedSuccessFactors,
    selectedStates,
  ]);

  // Skip first render (init handles it)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    fetchFilteredInterviews();
  }, [fetchFilteredInterviews]);

  // Reset page on filter change
  useEffect(() => {
    const prev = prevFilters.current;
    const changed =
      prev.selectedCategories !== selectedCategories ||
      prev.debouncedSearch !== debouncedSearch ||
      prev.dateRange !== dateRange ||
      prev.selectedStates !== selectedStates ||
      prev.selectedCountries !== selectedCountries ||
      prev.selectedIndustrySectors !== selectedIndustrySectors ||
      prev.selectedBusinessStages !== selectedBusinessStages ||
      prev.selectedInterviewFormats !== selectedInterviewFormats ||
      prev.selectedFounderRegions !== selectedFounderRegions ||
      prev.selectedSuccessFactors !== selectedSuccessFactors;

    if (changed) {
      setCurrentPage(1);
      prevFilters.current = {
        selectedCategories,
        debouncedSearch,
        dateRange,
        selectedStates,
        selectedCountries,
        selectedIndustrySectors,
        selectedBusinessStages,
        selectedInterviewFormats,
        selectedFounderRegions,
        selectedSuccessFactors,
      };
    }
  }, [
    selectedCategories, debouncedSearch, dateRange, selectedStates,
    selectedCountries, selectedIndustrySectors, selectedBusinessStages,
    selectedInterviewFormats, selectedFounderRegions, selectedSuccessFactors,
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
          `/api/entrechat?page=1&search=${encodeURIComponent(debouncedSearch)}`,
          { signal: searchAbortRef.current!.signal }
        );
        if (!res.ok) return;
        const data: ApiResponse = await res.json();

        const query = debouncedSearch.toLowerCase();
        const suggestions: SearchSuggestion[] = data.interviews
          .map((a) => {
            let relevance = 0;
            if (a.title.toLowerCase().includes(query)) relevance += 10;
            if (a.excerpt?.toLowerCase().includes(query)) relevance += 5;
            if (a.category.toLowerCase().includes(query)) relevance += 8;
            if (a.interviewee?.toLowerCase().includes(query)) relevance += 6;
            if (a.industrySector?.toLowerCase().includes(query)) relevance += 4;
            if (a.state?.toLowerCase().includes(query)) relevance += 3;
            if (a.country?.toLowerCase().includes(query)) relevance += 3;
            if (a.title.toLowerCase().startsWith(query)) relevance += 5;
            return {
              id: a.id,
              title: a.title,
              category: a.category,
              interviewee: a.interviewee ?? "",
              date: a.date,
              slug: a.slug,
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
      setUserLocation({ country: data.country_name, state: data.region, detected: true });
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
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setIsFilterOpen(false);
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

    if (range === "custom") { setShowCustomDatePicker(true); return; }
    setShowCustomDatePicker(false);
    if (!range) { setDateRange({ from: "", to: "" }); return; }

    const offsets: Record<string, () => void> = {
      "24h": () => from.setDate(now.getDate() - 1),
      week: () => from.setDate(now.getDate() - 7),
      month: () => from.setMonth(now.getMonth() - 1),
      "3months": () => from.setMonth(now.getMonth() - 3),
    };
    offsets[range]?.();
    setDateRange({ from: from.toISOString().split("T")[0], to: now.toISOString().split("T")[0] });
  };

  const getDateRangeDisplayLabel = () => {
    if (selectedDateRange === "custom") {
      const parts: string[] = [];
      if (dateRange.from) parts.push(`From: ${new Date(dateRange.from).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
      if (dateRange.to) parts.push(`To: ${new Date(dateRange.to).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
      return parts.join(" • ") || "Custom Range";
    }
    return predefinedDateRanges.find((r) => r.value === selectedDateRange)?.label ?? "";
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Filter helpers
  // ─────────────────────────────────────────────────────────────────────────
  const clearAllFilters = () => {
    setSelectedCategories(["All Interviews"]);
    setDateRange({ from: "", to: "" });
    setSelectedDateRange("");
    setShowCustomDatePicker(false);
    setSelectedStates([]);
    setSelectedCountries([]);
    setSelectedIndustrySectors(["All Industries"]);
    setSelectedBusinessStages(["All Stages"]);
    setSelectedInterviewFormats(["All Formats"]);
    setSelectedFounderRegions(["All Regions"]);
    setSelectedSuccessFactors(["All Funding Types"]);
    setSearchQuery("");
    setDebouncedSearch("");
    setSearchSuggestions([]);
    setShowSuggestions(false);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const isAnyFilterActive = () =>
    (selectedCategories.length > 0 && !selectedCategories.includes("All Interviews")) ||
    dateRange.from !== "" || dateRange.to !== "" ||
    selectedStates.length > 0 || selectedCountries.length > 0 ||
    (selectedIndustrySectors.length > 0 && !selectedIndustrySectors.includes("All Industries")) ||
    (selectedBusinessStages.length > 0 && !selectedBusinessStages.includes("All Stages")) ||
    (selectedInterviewFormats.length > 0 && !selectedInterviewFormats.includes("All Formats")) ||
    (selectedFounderRegions.length > 0 && !selectedFounderRegions.includes("All Regions")) ||
    (selectedSuccessFactors.length > 0 && !selectedSuccessFactors.includes("All Funding Types")) ||
    searchQuery !== "";

  const activeFilterCount = [
    selectedCategories.length > 0 && !selectedCategories.includes("All Interviews"),
    dateRange.from || dateRange.to,
    selectedStates.length > 0,
    selectedCountries.length > 0,
    selectedIndustrySectors.length > 0 && !selectedIndustrySectors.includes("All Industries"),
    selectedBusinessStages.length > 0 && !selectedBusinessStages.includes("All Stages"),
    selectedInterviewFormats.length > 0 && !selectedInterviewFormats.includes("All Formats"),
    selectedFounderRegions.length > 0 && !selectedFounderRegions.includes("All Regions"),
    selectedSuccessFactors.length > 0 && !selectedSuccessFactors.includes("All Funding Types"),
    searchQuery,
  ].filter(Boolean).length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleInterviewClick = (slug: string) => router.push(`/entrechat/${slug}`);

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
            <p className="text-muted-foreground">Loading interviews…</p>
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

      {/* ══════════════════ HERO BANNER ══════════════════════════════════ */}
      <section className="relative h-[600px] md:h-[600px] lg:h-[470px] overflow-hidden pt-24">
        <div className="absolute inset-0" style={{ top: 96 }}>
          <div className="block lg:hidden relative w-full h-full">
            <Image
              src="/entrechat/Mobile-Entrechat.png"
              alt="EntreChat Banner"
              fill
              className="object-cover object-center"
              priority
              sizes="(max-width: 1024px) 100vw"
            />
          </div>
          <div className="hidden lg:block relative w-full h-full">
            <Image
              src="/entrechat/FinalEntrechatbanner.png"
              alt="EntreChat Banner"
              fill
              className="object-cover object-center"
              priority
              sizes="(min-width: 1024px) 100vw"
            />
          </div>
        </div>

        <div className="relative z-10 h-full flex pt-2 md:pt-10 lg:items-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl px-4 sm:px-6 lg:px-8">
              <motion.div initial="hidden" animate="visible" variants={bannerVariants}>
                <h1 className="text-white leading-tight">
                  <span className="block text-3xl sm:text-4xl lg:text-6xl font-bold">
                    EntreChat Community
                  </span>
                </h1>
              </motion.div>
              <motion.p
                initial="hidden"
                animate="visible"
                variants={bannerSubtitleVariants}
                className="mt-2 sm:mt-6 text-md sm:text-base md:text-xl text-white/90 leading-relaxed max-w-xl"
              >
                Candid conversations with inspiring women entrepreneurs sharing real journeys and experiences.
                Discover challenges, strategies, and lessons that inform, inspire, and empower your own path.
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURED + SIDEBAR ═══════════════════════════ */}
      <ScrollReveal direction="up" delay={0.2} threshold={0}>
        <section className="px-4 sm:px-6 lg:px-8 py-12 bg-secondary/30">
          <div className="max-w-screen-xl mx-auto grid lg:grid-cols-3 gap-6 sm:gap-8">

            {/* ── FEATURED ── */}
            {featuredInterview && (
              <ScrollReveal direction="left" delay={0.3} className="lg:col-span-2">
                <div
                  onClick={() => handleInterviewClick(featuredInterview.slug)}
                  className="relative group bg-card rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-primary/10 cursor-pointer"
                >
                  <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
                    <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-white text-xs font-bold uppercase shadow-lg">
                      Featured Interview
                    </span>
                  </div>

                  <div className="relative h-48 sm:h-64 lg:h-[340px] overflow-hidden bg-gradient-to-br from-muted to-secondary">
                    {featuredInterview.image ? (
                      <Image
                        src={featuredInterview.image}
                        alt={featuredInterview.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        priority
                        sizes="(max-width: 1024px) 100vw, 66vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <span className="text-white/40 text-6xl font-display">
                          {featuredInterview.interviewee?.charAt(0) ?? "E"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-display font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                      {featuredInterview.title}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground mb-2 leading-relaxed line-clamp-3">
                      {featuredInterview.excerpt}
                    </p>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-border">
                      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          {featuredInterview.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          {featuredInterview.readTime}
                        </div>
                        {featuredInterview.state && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                            {featuredInterview.state}
                          </div>
                        )}
                      </div>
                      <Button className="bg-primary hover:bg-primary/90 group text-sm w-full sm:w-auto">
                        Read Interview
                        <ExternalLink className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            )}

            {/* ── SIDEBAR – TRENDING NOW ── */}
            <ScrollReveal direction="right" delay={0.4} className={!featuredInterview ? "lg:col-span-3" : ""}>
              <div className="bg-card rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 shadow-lg border border-border lg:sticky lg:top-24">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                  <h3 className="text-lg sm:text-xl font-display font-bold text-foreground">Trending Now</h3>
                </div>

                <div className="max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  <StaggerChildren>
                    <div className="space-y-3 sm:space-y-4">
                      {latestHeadlines.map((interview, i) => (
                        <motion.div
                          key={interview.id}
                          variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                          onClick={() => handleInterviewClick(interview.slug)}
                          className="block cursor-pointer pb-3 sm:pb-4 border-b border-border last:border-0 last:pb-0 hover:bg-secondary/30 rounded-lg px-2 -mx-2 transition-all duration-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 relative h-12 w-12 sm:h-14 sm:w-14 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-secondary">
                              {interview.image ? (
                                <Image
                                  src={interview.image}
                                  alt={interview.title}
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                  loading="eager"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center">
                                  <span className="text-primary/40 text-lg font-display">
                                    {interview.interviewee?.charAt(0) ?? "E"}
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
                                  {getCategoryIcon(interview.category)}
                                  <span className="truncate max-w-[60px]">{interview.category.split(" & ")[0]}</span>
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <User className="h-2.5 w-2.5" />
                                  {interview.interviewee?.split(" ")[0]}
                                </span>
                              </div>
                              <h4 className="font-semibold text-xs sm:text-sm text-foreground mb-1.5 leading-snug line-clamp-2">
                                {interview.title}
                              </h4>
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {interview.date}
                                </div>
                                {interview.state && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate max-w-[60px]">{interview.state}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0 mt-1" />
                          </div>
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
                      window.scrollTo({ top: document.getElementById("all-interviews-section")?.offsetTop ?? 0, behavior: "smooth" });
                    }}
                  >
                    View All Interviews
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ScrollReveal>

      {/* ══════════════════ ALL INTERVIEWS GRID ══════════════════════════ */}
      <ScrollFade delay={0.3}>
        <section id="all-interviews-section" className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-screen-xl mx-auto">

            {/* ── Header + Search + Filter ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12">
              <ScrollReveal direction="right" delay={0.2}>
                <div>
                  <AnimatedText as="h2" delay={0.1}>
                    {selectedCategories.includes("All Interviews") || selectedCategories.length === 0
                      ? "All Interviews"
                      : `${selectedCategories.length} ${selectedCategories.length === 1 ? "Category" : "Categories"} Selected`}
                    {debouncedSearch && (
                      <span className="text-lg sm:text-xl text-primary"> — Search: {debouncedSearch}</span>
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
                        {totalItems} {totalItems === 1 ? "interview" : "interviews"} found
                        {debouncedSearch && ` matching "${debouncedSearch}"`}
                        {getDateRangeDisplayLabel() && ` • ${getDateRangeDisplayLabel()}`}
                      </>
                    )}
                  </AnimatedText>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="left" delay={0.3}>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">

                  {/* SEARCH */}
                  <div className="relative w-full sm:w-64" ref={searchRef}>
                    <form onSubmit={(e) => { e.preventDefault(); setShowSuggestions(false); }}>
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black z-10" />
                      <Input
                        type="search"
                        placeholder="Search interviews…"
                        className="pl-10 pr-10 w-full bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => {
                          if (debouncedSearch.length >= 2 && searchSuggestions.length > 0)
                            setShowSuggestions(true);
                        }}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => { setSearchQuery(""); setDebouncedSearch(""); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-10"
                        >
                          <X className="h-4 w-4 text-black" />
                        </button>
                      )}
                    </form>

                    <SearchSuggestions
                      suggestions={searchSuggestions}
                      onSelect={(title) => { setSearchQuery(title); setShowSuggestions(false); }}
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
                          <h4 className="text-lg font-semibold text-foreground">Filter Interviews</h4>
                        </div>

                        {/* CATEGORY */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-foreground mb-2">Category</h5>
                          <MultiSelectDropdown
                            label="Categories"
                            icon={<CalendarDays className="h-4 w-4" />}
                            options={entrechatCategories.filter((c) => c !== "All Interviews")}
                            selectedValues={selectedCategories.filter((c) => c !== "All Interviews")}
                            onChange={setSelectedCategories}
                            placeholder="Select categories"
                            allOptionLabel="All Categories"
                          />
                        </div>

                        {/* INDUSTRY SECTOR */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-foreground mb-2">Industry / Sector</h5>
                          <MultiSelectDropdown
                            label="Industries"
                            icon={<Building className="h-4 w-4" />}
                            options={uniqueIndustrySectors}
                            selectedValues={selectedIndustrySectors.filter((s) => s !== "All Industries")}
                            onChange={setSelectedIndustrySectors}
                            placeholder="Select industries"
                            allOptionLabel="All Industries"
                          />
                        </div>

                        {/* BUSINESS STAGE */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-foreground mb-2">Business Stage</h5>
                          <MultiSelectDropdown
                            label="Business Stages"
                            icon={<TrendingUp className="h-4 w-4" />}
                            options={uniqueBusinessStages}
                            selectedValues={selectedBusinessStages.filter((s) => s !== "All Stages")}
                            onChange={setSelectedBusinessStages}
                            placeholder="Select business stages"
                            allOptionLabel="All Stages"
                          />
                        </div>

                        {/* INTERVIEW FORMAT */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-foreground mb-2">Interview Format</h5>
                          <MultiSelectDropdown
                            label="Formats"
                            icon={<Video className="h-4 w-4" />}
                            options={uniqueInterviewFormats}
                            selectedValues={selectedInterviewFormats.filter((f) => f !== "All Formats")}
                            onChange={setSelectedInterviewFormats}
                            placeholder="Select formats"
                            allOptionLabel="All Formats"
                          />
                        </div>

                        {/* FOUNDER REGION */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-foreground mb-2">Founder Region</h5>
                          <MultiSelectDropdown
                            label="Regions"
                            icon={<Globe className="h-4 w-4" />}
                            options={uniqueFounderRegions}
                            selectedValues={selectedFounderRegions.filter((r) => r !== "All Regions")}
                            onChange={setSelectedFounderRegions}
                            placeholder="Select regions"
                            allOptionLabel="All Regions"
                          />
                        </div>

                        {/* SUCCESS FACTOR */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-foreground mb-2">Success Factor (Funding)</h5>
                          <MultiSelectDropdown
                            label="Funding Types"
                            icon={<FileText className="h-4 w-4" />}
                            options={uniqueSuccessFactors}
                            selectedValues={selectedSuccessFactors.filter((s) => s !== "All Funding Types")}
                            onChange={setSelectedSuccessFactors}
                            placeholder="Select funding types"
                            allOptionLabel="All Funding Types"
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
                                <label className="text-xs text-muted-foreground block mb-1">From</label>
                                <Input type="date" value={dateRange.from} onChange={(e) => setDateRange((d) => ({ ...d, from: e.target.value }))} className="w-full" />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground block mb-1">To</label>
                                <Input type="date" value={dateRange.to} onChange={(e) => setDateRange((d) => ({ ...d, to: e.target.value }))} className="w-full" />
                              </div>
                            </motion.div>
                          )}

                          {(dateRange.from || dateRange.to) && (
                            <button
                              onClick={() => { setDateRange({ from: "", to: "" }); setSelectedDateRange(""); setShowCustomDatePicker(false); }}
                              className="text-xs text-primary hover:text-primary/80 mt-2 transition-colors"
                            >
                              Clear date range
                            </button>
                          )}
                        </div>

                        {/* COUNTRY */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-foreground mb-2">Country</h5>
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

                        {/* STATE */}
                        {uniqueStates.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-foreground mb-2">State / Region</h5>
                            <MultiSelectDropdown
                              label="States"
                              icon={<MapPin className="h-4 w-4" />}
                              options={uniqueStates}
                              selectedValues={selectedStates}
                              onChange={setSelectedStates}
                              placeholder="Select states"
                              allOptionLabel="All States"
                            />
                          </div>
                        )}

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
                              {isDetectingLocation ? <Loader2 className="h-3 w-3 animate-spin" /> : "Refresh"}
                            </button>
                          </div>
                          {userLocation.detected ? (
                            <p className="text-xs text-muted-foreground">
                              Showing interviews from{" "}
                              <span className="font-medium text-foreground">
                                {userLocation.country}
                                {userLocation.state && ` • ${userLocation.state}`}
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
                              <h5 className="text-sm font-medium text-foreground">Active Filters</h5>
                              <button onClick={clearAllFilters} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                                <X className="h-3 w-3" /> Clear All
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {selectedCategories.length > 0 && !selectedCategories.includes("All Interviews") && (
                                <Chip color="primary" icon={<CalendarDays className="h-3 w-3" />} onRemove={() => setSelectedCategories(["All Interviews"])}>
                                  {selectedCategories.length} categor{selectedCategories.length !== 1 ? "ies" : "y"}
                                </Chip>
                              )}
                              {selectedIndustrySectors.length > 0 && !selectedIndustrySectors.includes("All Industries") && (
                                <Chip color="blue" icon={<Building className="h-3 w-3" />} onRemove={() => setSelectedIndustrySectors(["All Industries"])}>
                                  {selectedIndustrySectors.length} industr{selectedIndustrySectors.length !== 1 ? "ies" : "y"}
                                </Chip>
                              )}
                              {selectedBusinessStages.length > 0 && !selectedBusinessStages.includes("All Stages") && (
                                <Chip color="green" icon={<TrendingUp className="h-3 w-3" />} onRemove={() => setSelectedBusinessStages(["All Stages"])}>
                                  {selectedBusinessStages.length} stage{selectedBusinessStages.length !== 1 ? "s" : ""}
                                </Chip>
                              )}
                              {selectedInterviewFormats.length > 0 && !selectedInterviewFormats.includes("All Formats") && (
                                <Chip color="purple" icon={<Video className="h-3 w-3" />} onRemove={() => setSelectedInterviewFormats(["All Formats"])}>
                                  {selectedInterviewFormats.length} format{selectedInterviewFormats.length !== 1 ? "s" : ""}
                                </Chip>
                              )}
                              {selectedFounderRegions.length > 0 && !selectedFounderRegions.includes("All Regions") && (
                                <Chip color="purple" icon={<Globe className="h-3 w-3" />} onRemove={() => setSelectedFounderRegions(["All Regions"])}>
                                  {selectedFounderRegions.length} region{selectedFounderRegions.length !== 1 ? "s" : ""}
                                </Chip>
                              )}
                              {selectedSuccessFactors.length > 0 && !selectedSuccessFactors.includes("All Funding Types") && (
                                <Chip color="amber" icon={<FileText className="h-3 w-3" />} onRemove={() => setSelectedSuccessFactors(["All Funding Types"])}>
                                  {selectedSuccessFactors.length} funding type{selectedSuccessFactors.length !== 1 ? "s" : ""}
                                </Chip>
                              )}
                              {selectedDateRange && selectedDateRange !== "custom" && (
                                <Chip color="green" icon={<Calendar className="h-3 w-3" />} onRemove={() => { setDateRange({ from: "", to: "" }); setSelectedDateRange(""); }}>
                                  {predefinedDateRanges.find((r) => r.value === selectedDateRange)?.label}
                                </Chip>
                              )}
                              {selectedDateRange === "custom" && dateRange.from && (
                                <Chip color="green" icon={<Calendar className="h-3 w-3" />} onRemove={() => setDateRange((d) => ({ ...d, from: "" }))}>
                                  From: {new Date(dateRange.from).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </Chip>
                              )}
                              {selectedDateRange === "custom" && dateRange.to && (
                                <Chip color="green" icon={<Calendar className="h-3 w-3" />} onRemove={() => setDateRange((d) => ({ ...d, to: "" }))}>
                                  To: {new Date(dateRange.to).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </Chip>
                              )}
                              {selectedCountries.length > 0 && (
                                <Chip color="purple" icon={<Globe className="h-3 w-3" />} onRemove={() => setSelectedCountries([])}>
                                  {selectedCountries.length} countr{selectedCountries.length !== 1 ? "ies" : "y"}
                                </Chip>
                              )}
                              {selectedStates.length > 0 && (
                                <Chip color="amber" icon={<MapPin className="h-3 w-3" />} onRemove={() => setSelectedStates([])}>
                                  {selectedStates.length} state{selectedStates.length !== 1 ? "s" : ""}
                                </Chip>
                              )}
                              {searchQuery && (
                                <Chip color="amber" icon={<Search className="h-3 w-3" />} onRemove={() => { setSearchQuery(""); setDebouncedSearch(""); }}>
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
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : interviewItems.length === 0 ? (
              <ScrollFade delay={0.4}>
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-display font-bold text-foreground mb-2">No interviews found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {debouncedSearch
                      ? `No interviews found matching "${debouncedSearch}".`
                      : "No interviews match the current filters."}
                  </p>
                  <Button onClick={clearAllFilters} className="bg-gradient-to-r from-primary to-accent text-white font-semibold">
                    View All Interviews
                  </Button>
                </div>
              </ScrollFade>
            ) : (
              <>
                <StaggerChildren>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {interviewItems.map((interview, index) => (
                      <motion.div
                        key={interview.id}
                        variants={{
                          hidden: { opacity: 0, y: 30 },
                          visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                        }}
                        onClick={() => handleInterviewClick(interview.slug)}
                        className="group bg-card rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 border border-border cursor-pointer flex flex-col"
                      >
                        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-muted to-secondary flex-shrink-0">
                          {interview.image ? (
                            <Image
                              src={interview.image}
                              alt={interview.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              loading={index < 4 ? "eager" : "lazy"}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                              <span className="text-white/40 text-5xl font-display">
                                {interview.interviewee?.charAt(0) ?? "E"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-4 sm:p-6 flex flex-col flex-grow">
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase">
                              {getCategoryIcon(interview.category)}
                              {interview.category.split(" & ")[0]}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {interview.interviewee?.split(" ")[0]}
                            </span>
                          </div>

                          <h3 className="text-sm sm:text-base lg:text-lg font-display font-bold text-foreground mb-2 sm:mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                            {interview.title}
                          </h3>

                          <div className="flex flex-wrap gap-1 mb-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                              {interview.industrySector?.split(" & ")[0]}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                              {interview.businessStage?.split("/")[0]}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-5 line-clamp-2 leading-relaxed flex-grow">
                            {interview.excerpt}
                          </p>

                          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-border mt-auto">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                {interview.date}
                              </div>
                              {(interview.state || interview.country) && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  {interview.state || interview.country}
                                </div>
                              )}
                            </div>
                            <motion.div
                              whileHover={{ x: 5 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                              className="inline-flex items-center gap-1 px-2 py-1 -mx-2 -my-1 rounded-md text-primary group-hover:text-accent group-hover:bg-primary/5 transition-colors"
                            >
                              Read
                              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </StaggerChildren>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <ScrollFade delay={0.5}>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 sm:mt-12 pt-8 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}–{endIndex} of {totalItems} interviews
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
                          {buildPageNumbers(currentPage, totalPages).map((p, i) =>
                            p === "…" ? (
                              <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">…</span>
                            ) : (
                              <motion.div key={p} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  variant={currentPage === p ? "default" : "outline"}
                                  size="sm"
                                  className="w-10 h-10 p-0"
                                  onClick={() => handlePageChange(p as number)}
                                >
                                  {p}
                                </Button>
                              </motion.div>
                            )
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