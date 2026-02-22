// /components/events/EventsPage.tsx
"use client";

import { AnimatedText, ScrollFade } from "@/components/common/ScrollFade";
import { Button } from "@/components/ui/button";
import { eventsData } from "@/data/events";
import { openEventRegistrationEmail } from "@/hooks/Emailutils";
import { AnimatePresence, motion, Variants } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Clock,
  Filter,
  IndianRupee,
  Mail,
  MapPin,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cta from "../common/Cta";

// Define types for your events data
interface EventItem {
  ID: string;
  post_title: string;
  post_content: string;
  post_date: string;
  post_excerpt: string;
  featured_image_url: string | null;
  section_name: string;
  post_modified?: string;
  post_author?: string;
  post_date_gmt?: string;
  post_content_filtered?: string;
  post_parent?: string;
  guid?: string;
  menu_order?: string;
  post_type?: string;
  post_mime_type?: string;
  comment_count?: string;
  section_id?: string;
  post_name: string;
  external_url?: string | null;
}

// Event categories
const eventCategories = [
  "All Events",
  "Conferences",
  "Workshops",
  "Webinars",
  "Networking",
  "Seminars",
  "Forums",
  "Launches",
  "Awards",
  "Festivals",
  "Other Events",
];

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

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

// Extract categories from content
const getCategoryFromContent = (content: string): string => {
  const contentLower = content.toLowerCase();
  if (
    contentLower.includes("summit") ||
    contentLower.includes("conference") ||
    contentLower.includes("annual") ||
    contentLower.includes("global")
  )
    return "Conferences";
  if (
    contentLower.includes("workshop") ||
    contentLower.includes("masterclass") ||
    contentLower.includes("training") ||
    contentLower.includes("session")
  )
    return "Workshops";
  if (
    contentLower.includes("webinar") ||
    contentLower.includes("online") ||
    contentLower.includes("virtual") ||
    contentLower.includes("zoom")
  )
    return "Webinars";
  if (
    contentLower.includes("networking") ||
    contentLower.includes("meetup") ||
    contentLower.includes("gathering") ||
    contentLower.includes("meeting")
  )
    return "Networking";
  if (
    contentLower.includes("seminar") ||
    contentLower.includes("talk") ||
    contentLower.includes("lecture") ||
    contentLower.includes("presentation")
  )
    return "Seminars";
  if (
    contentLower.includes("dialogue") ||
    contentLower.includes("forum") ||
    contentLower.includes("discussion") ||
    contentLower.includes("panel")
  )
    return "Forums";
  if (
    contentLower.includes("launch") ||
    contentLower.includes("inauguration") ||
    contentLower.includes("unveil") ||
    contentLower.includes("initiative")
  )
    return "Launches";
  if (
    contentLower.includes("award") ||
    contentLower.includes("ceremony") ||
    contentLower.includes("felicitation") ||
    contentLower.includes("recognition")
  )
    return "Awards";
  if (
    contentLower.includes("festival") ||
    contentLower.includes("celebration") ||
    contentLower.includes("day") ||
    contentLower.includes("international")
  )
    return "Festivals";
  return "Other Events";
};

// Format date function
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Date unavailable";
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.warn("Invalid date:", dateString, error);
    return "Date unavailable";
  }
};

// Extract excerpt from content
const extractExcerpt = (content: string, maxLength: number = 150): string => {
  if (!content) return "No description available";

  try {
    // Remove HTML tags
    const plainText = content.replace(/<[^>]*>/g, "");
    // Remove newlines and extra spaces
    const cleanText = plainText.replace(/\s+/g, " ").trim();

    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + "...";
  } catch (error) {
    console.warn("Error extracting excerpt:", error);
    return "No description available";
  }
};

// Improved location extraction
const extractLocation = (content: string): string => {
  const contentLower = content.toLowerCase();

  const knownLocations = [
    { keyword: "rio de janeiro", location: "Rio de Janeiro, Brazil" },
    { keyword: "iit delhi", location: "IIT Delhi, India" },
    { keyword: "india", location: "India" },
    { keyword: "brazil", location: "Brazil" },
    { keyword: "haryana", location: "Haryana, India" },
    { keyword: "punjab", location: "Punjab, India" },
    { keyword: "rajasthan", location: "Rajasthan, India" },
    { keyword: "delhi", location: "Delhi, India" },
  ];

  for (const knownLoc of knownLocations) {
    if (contentLower.includes(knownLoc.keyword)) {
      return knownLoc.location;
    }
  }

  const locationPatterns = [
    /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /at\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /([A-Z][a-z]+\s+[A-Z][a-z]+),\s+[A-Z][a-z]+/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Conference|Summit|Dialogue|Event)/gi,
  ];

  for (const pattern of locationPatterns) {
    const matches = [...content.matchAll(pattern)];
    for (const match of matches) {
      if (match[1]) {
        const location = match[1].trim();
        const falsePositives = [
          "The",
          "This",
          "Our",
          "Global",
          "Annual",
          "International",
          "Flagship",
          "Third",
          "3rd",
          "Second",
          "2nd",
          "First",
          "Finale",
          "Grand",
          "Youth",
          "College",
          "Programme",
        ];
        if (
          !falsePositives.some((fp) =>
            location.toLowerCase().startsWith(fp.toLowerCase()),
          )
        ) {
          if (location.toLowerCase().includes("rio"))
            return "Rio de Janeiro, Brazil";
          if (location.toLowerCase().includes("delhi")) return "Delhi, India";
          return location;
        }
      }
    }
  }

  if (
    contentLower.includes("online") ||
    contentLower.includes("virtual") ||
    contentLower.includes("zoom") ||
    contentLower.includes("webinar") ||
    contentLower.includes("digital")
  ) {
    return "Online";
  }

  if (contentLower.includes("apply") && contentLower.includes("link")) {
    return "Online / Application-based";
  }

  return "Location TBD";
};

// Improved date extraction
const extractDateDetails = (
  content: string,
  postDate: string,
): { date: string; time?: string } => {
  const datePatterns = [
    /([A-Z][a-z]+(?:\s+\d+)?(?:\s+to\s+\d+)?(?:\s*,\s*\d{4})?)/gi,
    /(\d+(?:\s+to\s+\d+)?\s+[A-Z][a-z]+\s+\d{4})/gi,
    /(\d+(?:st|nd|rd|th)?\s+[A-Z][a-z]+\s+\d{4})/gi,
    /([A-Z][a-z]+\s+\d{4})/gi,
    /apply\s+by\s+(\d+(?:st|nd|rd|th)?\s+[A-Z][a-z]+\s+\d{4})/gi,
  ];

  const cleanOrdinals = (dateStr: string): string => {
    return dateStr.replace(/(\d+)(?:st|nd|rd|th)\b/gi, "$1");
  };

  for (const pattern of datePatterns) {
    const matches = [...content.matchAll(pattern)];
    for (const match of matches) {
      if (match[1]) {
        let dateStr = match[1].trim();
        if (/^[A-Z][a-z]+$/.test(dateStr)) continue;

        if (dateStr.includes("to")) {
          const startDateMatch = dateStr.match(/([A-Z][a-z]+(?:\s+\d+)?)/);
          if (startDateMatch && startDateMatch[1]) {
            dateStr = startDateMatch[1] + (dateStr.match(/(\d{4})/)?.[0] || "");
          }
        }

        dateStr = cleanOrdinals(dateStr);

        if (!dateStr.match(/\d{4}/)) {
          const year = postDate.substring(0, 4);
          dateStr += `, ${year}`;
        }

        return { date: dateStr };
      }
    }
  }

  try {
    const date = new Date(postDate);
    if (!isNaN(date.getTime())) {
      return {
        date: date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };
    }
  } catch (error) {
    console.log("Error parsing fallback date:", error);
  }

  return { date: "Date TBD" };
};

// Improved price extraction
const extractPrice = (content: string): string => {
  const contentLower = content.toLowerCase();

  if (
    contentLower.includes("free") ||
    contentLower.includes("complimentary") ||
    contentLower.includes("no cost") ||
    contentLower.includes("no charge") ||
    contentLower.includes("fully funded") ||
    contentLower.includes("fully sponsored") ||
    contentLower.includes("merit certificates") ||
    contentLower.includes("participation certificate")
  ) {
    return "Free";
  }

  const pricePatterns = [
    /₹\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:INR|rupees?)/gi,
    /Rs\.?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    /₹\s*(\d+)/gi,
    /Rs\.?\s*(\d+)/gi,
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|dollars?)/gi,
    /entry\s+fee[:\s]*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    /price[:\s]*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    /cost[:\s]*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    /fee[:\s]*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  ];

  for (const pattern of pricePatterns) {
    const matches = [...content.matchAll(pattern)];
    for (const match of matches) {
      if (match[1]) {
        const amount = match[1];
        if (
          pattern.toString().includes("₹") ||
          pattern.toString().includes("INR") ||
          pattern.toString().includes("Rs")
        ) {
          return `₹${amount}`;
        } else if (
          pattern.toString().includes("$") ||
          pattern.toString().includes("USD")
        ) {
          return `$${amount}`;
        }
        return amount;
      }
    }
  }

  const prizePattern =
    /prize\s+of\s+(?:Rs\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi;
  const prizeMatch = prizePattern.exec(content);
  if (prizeMatch && prizeMatch[1]) {
    return `₹${prizeMatch[1]} (Prize)`;
  }

  const lakhPattern = /(\d+)\s+lakh/gi;
  const lakhMatch = lakhPattern.exec(content);
  if (lakhMatch && lakhMatch[1]) {
    const lakhs = parseInt(lakhMatch[1]);
    const amount = lakhs * 100000;
    return `₹${amount.toLocaleString()}`;
  }

  return "Contact for details";
};

// Improved format detection
const extractFormat = (content: string): string => {
  const contentLower = content.toLowerCase();

  if (
    (contentLower.includes("online") ||
      contentLower.includes("virtual") ||
      contentLower.includes("zoom") ||
      contentLower.includes("webinar") ||
      contentLower.includes("digital conference")) &&
    !contentLower.includes("in-person") &&
    !contentLower.includes("physical venue")
  ) {
    return "Virtual";
  }

  if (
    (contentLower.includes("in-person") ||
      contentLower.includes("physical") ||
      contentLower.includes("venue") ||
      contentLower.includes("attended") ||
      contentLower.includes("hosted at") ||
      contentLower.includes("held at") ||
      contentLower.includes("gathering") ||
      contentLower.includes("summit") ||
      contentLower.includes("conference") ||
      contentLower.includes("dialogue")) &&
    !contentLower.includes("online") &&
    !contentLower.includes("virtual")
  ) {
    return "In-person";
  }

  if (
    contentLower.includes("hybrid") ||
    (contentLower.includes("online") && contentLower.includes("in-person")) ||
    (contentLower.includes("virtual") && contentLower.includes("physical"))
  ) {
    return "Hybrid";
  }

  if (
    contentLower.includes("summit") ||
    contentLower.includes("conference") ||
    contentLower.includes("annual plenary") ||
    contentLower.includes("dialogue")
  ) {
    return "In-person";
  }

  if (
    contentLower.includes("webinar") ||
    contentLower.includes("online session") ||
    contentLower.includes("virtual workshop") ||
    contentLower.includes("digital")
  ) {
    return "Virtual";
  }

  if (
    contentLower.includes("application") ||
    contentLower.includes("apply") ||
    contentLower.includes("programme") ||
    contentLower.includes("program")
  ) {
    return "Application-based";
  }

  return "Format TBD";
};

// Helper function to parse dates for month/day display
const parseDateForDisplay = (
  dateString: string,
  fallbackDate?: string,
): { month: string; day: string } => {
  try {
    let dateToParse = dateString;

    if (dateString.includes("TBD") || dateString.includes("unavailable")) {
      dateToParse = fallbackDate || new Date().toISOString();
    }

    dateToParse = dateToParse
      .replace(/(\d+)(?:st|nd|rd|th)\b/gi, "$1")
      .replace(/\s+to\s+\d+/gi, "")
      .replace(/apply by\s+/gi, "")
      .replace(/,\s*(\d{4})/gi, "")
      .trim();

    let parsedDate: Date;

    const monthNames = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];

    const monthMatch = monthNames.find((month) =>
      dateToParse.toLowerCase().includes(month),
    );

    if (monthMatch) {
      const monthIndex = monthNames.indexOf(monthMatch);
      parsedDate = new Date();
      parsedDate.setMonth(monthIndex);
      parsedDate.setDate(15);
    } else {
      parsedDate = new Date(dateToParse);
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
      }
    }

    return {
      month: parsedDate.toLocaleDateString("en-US", { month: "short" }),
      day: parsedDate.getDate().toString(),
    };
  } catch (error) {
    console.log("Error parsing date for display:", error);
    return { month: "TBD", day: "?" };
  }
};

const ITEMS_PER_PAGE = 12;

interface ProcessedEvent {
  id: string;
  category: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  format: string;
  price: string;
  image: string;
  fullContent: string;
  modifiedDate?: string;
  slug: string;
  featured: boolean;
  month: string;
  day: string;
  postDate: string;
}

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All Events");
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [processedEvents, setProcessedEvents] = useState<ProcessedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>(
    {},
  );
  const router = useRouter();

  useEffect(() => {
    const processEvents = () => {
      try {
        setIsLoading(true);

        const processed = eventsData.map((item: EventItem, index: number) => {
          const category = getCategoryFromContent(item.post_content);
          const description =
            item.post_excerpt && item.post_excerpt.trim() !== ""
              ? item.post_excerpt
              : extractExcerpt(item.post_content);

          const title = item.post_title
            ? item.post_title.replace(/&amp;/g, "&")
            : "Upcoming Event";
          const location = extractLocation(item.post_content);
          const format = extractFormat(item.post_content);
          const price = extractPrice(item.post_content);

          const { date, time } = extractDateDetails(
            item.post_content,
            item.post_date,
          );

          const { month, day } = parseDateForDisplay(date, item.post_date);

          const image =
            item.featured_image_url && item.featured_image_url.trim() !== ""
              ? item.featured_image_url
              : "/placeholder-event.jpg";

          const featured = index === 0;

          return {
            id: item.ID || Math.random().toString(),
            category,
            title,
            description,
            date,
            time,
            location,
            format,
            price,
            image,
            fullContent: item.post_content || "",
            modifiedDate: item.post_modified
              ? formatDate(item.post_modified)
              : undefined,
            slug: item.post_name || `event-${item.ID}`,
            featured,
            month,
            day,
            postDate: item.post_date,
          };
        });

        processed.sort((a, b) => {
          try {
            const parseForComparison = (dateStr: string): Date => {
              if (dateStr.includes("TBD") || dateStr.includes("unavailable")) {
                return new Date("2100-01-01");
              }

              const yearMatch = dateStr.match(/(\d{4})/);
              if (yearMatch) {
                const year = parseInt(yearMatch[1]);
                const monthMatch = dateStr.match(/[A-Z][a-z]+/);
                if (monthMatch) {
                  const monthStr = monthMatch[0].toLowerCase();
                  const months = [
                    "january",
                    "february",
                    "march",
                    "april",
                    "may",
                    "june",
                    "july",
                    "august",
                    "september",
                    "october",
                    "november",
                    "december",
                  ];
                  const monthIndex = months.findIndex((m) =>
                    monthStr.includes(m),
                  );
                  if (monthIndex !== -1) {
                    return new Date(year, monthIndex, 15);
                  }
                }
              }

              return new Date(a.postDate) || new Date("2100-01-01");
            };

            const dateA = parseForComparison(a.date);
            const dateB = parseForComparison(b.date);

            return dateB.getTime() - dateA.getTime();
          } catch (error) {
            console.log(error);
            return 0;
          }
        });

        if (processed.length > 0) {
          processed.forEach((event, index) => {
            event.featured = index === 0;
          });
        }

        setProcessedEvents(processed);
      } catch (error) {
        console.error("Error processing events data:", error);
        setProcessedEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    processEvents();
  }, []);

  const featuredEvent =
    processedEvents.length > 0 ? processedEvents.find((e) => e.featured) : null;
  const trendingEvents = processedEvents.slice(0, 4);

  const getFilteredEvents = () => {
    if (selectedCategory === "All Events") return processedEvents;
    return processedEvents.filter(
      (event) =>
        event.category.toLowerCase() === selectedCategory.toLowerCase(),
    );
  };

  const shouldShowFeaturedEvent = () => {
    if (!featuredEvent || selectedCategory === "All Events") return true;
    return (
      featuredEvent.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  };

  const filteredEvents = getFilteredEvents();
  const showFeaturedEvent = shouldShowFeaturedEvent();

  const getFilteredTrendingEvents = () => {
    if (selectedCategory === "All Events") return trendingEvents;
    return trendingEvents
      .filter(
        (event) =>
          event.category.toLowerCase() === selectedCategory.toLowerCase(),
      )
      .slice(0, 4);
  };

  const filteredTrendingEvents = getFilteredTrendingEvents();

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCardClick = (slug: string) => {
    router.push(`/events/${slug}`);
  };

  const handleContactClick = (event: ProcessedEvent, e: React.MouseEvent) => {
    e.stopPropagation();

    openEventRegistrationEmail({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      format: event.format,
      price: event.price,
      category: event.category,
    });
  };

  const handleImageLoad = (id: string) => {
    setImagesLoaded((prev) => ({ ...prev, [id]: true }));
  };

  if (isLoading) {
    return (
      <main className="bg-background min-h-screen">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading new events…</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background min-h-screen flex flex-col">
      <section className="relative h-[480px] md:h-[600px] lg:h-[470px] overflow-hidden pt-24">
        <div className="absolute inset-0" style={{ top: 96 }}>
          <div className="block lg:hidden relative w-full h-full">
            <Image
              src="/events/Mobile-Events.png"
              alt="News Banner"
              fill
              className="object-cover object-center"
              priority
              sizes="(max-width: 1024px) 100vw"
            />
          </div>
          <div className="hidden lg:block relative w-full h-full">
            <Image
              src="/events/FinalEventsbanner.png"
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
            <div className="max-w-3xl px-2 sm:px-6 lg:px-8 -mt-40 lg:mt-0">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={bannerVariants}
              >
                <h1 className="text-white leading-tight">
                  <span className="block text-3xl sm:text-4xl lg:text-6xl font-bold">
                    Events
                  </span>
                </h1>
              </motion.div>

              <motion.p
                initial="hidden"
                animate="visible"
                variants={bannerSubtitleVariants}
                className="mt-4 sm:mt-6 text-sm sm:text-base md:text-xl text-white/90 leading-relaxed max-w-xl"
              >
                Discover workshops, webinars, and networking events designed to
                support women entrepreneurs. Explore opportunities for learning,
                mentoring, and meaningful connections that help your business
                grow.
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURED EVENT ================= */}
      {showFeaturedEvent && featuredEvent && (
        <ScrollFade>
          <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex-1">
            <div className="max-w-screen-xl mx-auto">
              <motion.div
                variants={scaleIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false }}
                className="grid lg:grid-cols-[65%_35%] bg-card rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-lg sm:shadow-xl lg:shadow-2xl border border-primary/10 hover:shadow-2xl transition-shadow duration-300"
              >
                <motion.div
                  variants={fadeInLeft}
                  className="relative min-h-48 sm:min-h-64 overflow-hidden bg-gradient-to-br from-muted to-secondary"
                >
                  {!imagesLoaded[featuredEvent.id] && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                  )}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full"
                  >
                    <Image
                      src="/Evventssmallbanner.png"
                      alt={featuredEvent.title}
                      fill
                      className={`object-cover transition-opacity duration-500 ${
                        imagesLoaded[featuredEvent.id]
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                      priority
                      onLoad={() => handleImageLoad(featuredEvent.id)}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 65vw, 800px"
                    />
                  </motion.div>
                </motion.div>

                <motion.div
                  variants={fadeInRight}
                  className="p-4 sm:p-6 lg:p-8 flex flex-col justify-center"
                >
                  <motion.span
                    variants={scaleIn}
                    className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-semibold mb-3 sm:mb-4 w-fit"
                  >
                    {featuredEvent.category}
                  </motion.span>

                  <AnimatedText
                    as="h2"
                    className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-display font-bold text-foreground mb-3 sm:mb-4"
                  >
                    {featuredEvent.title}
                  </AnimatedText>

                  <AnimatedText
                    delay={0.1}
                    className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 leading-relaxed line-clamp-3"
                  >
                    {featuredEvent.description}
                  </AnimatedText>

                  <motion.div
                    variants={staggerContainer}
                    className="space-y-3 sm:space-y-4 mb-6 sm:mb-8"
                  >
                    <motion.div
                      variants={fadeInUp}
                      className="flex items-center gap-2 sm:gap-3 text-foreground"
                    >
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <span className="font-medium text-sm sm:text-base">
                        {featuredEvent.date}{" "}
                        {featuredEvent.time && `• ${featuredEvent.time}`}
                      </span>
                    </motion.div>
                    <motion.div
                      variants={fadeInUp}
                      className="flex items-center gap-2 sm:gap-3 text-foreground"
                    >
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <span className="font-medium text-sm sm:text-base">
                        {featuredEvent.location}
                      </span>
                    </motion.div>
                    <motion.div
                      variants={fadeInUp}
                      className="flex items-center gap-2 sm:gap-3 text-foreground"
                    >
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <span className="font-medium text-sm sm:text-base">
                        {featuredEvent.format}
                      </span>
                    </motion.div>
                    <motion.div
                      variants={fadeInUp}
                      className="flex items-center gap-2 sm:gap-3 text-foreground"
                    >
                      <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                      <span className="font-semibold text-base sm:text-lg">
                        {featuredEvent.price}
                      </span>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    variants={staggerContainer}
                    className="grid grid-cols-2 gap-3 w-full"
                  >
                    <motion.div
                      variants={scaleIn}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => handleCardClick(featuredEvent.slug)}
                        variant="outline"
                        className="h-10 sm:h-12 border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-white transition-all text-sm sm:text-base w-full"
                      >
                        View Details
                      </Button>
                    </motion.div>
                    <motion.div
                      variants={scaleIn}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={(e) => handleContactClick(featuredEvent, e)}
                        className="h-10 sm:h-12 bg-accent text-white font-semibold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base w-full"
                      >
                        <Mail className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        Contact
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </section>
        </ScrollFade>
      )}

      {/* ================= ALL EVENTS GRID ================= */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-secondary/30 flex-1">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="lg:col-span-3">
              <ScrollFade>
                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: false }}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12"
                >
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-display font-bold text-foreground mb-1 sm:mb-2">
                      {selectedCategory === "All Events"
                        ? "All Events"
                        : selectedCategory}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {filteredEvents.length}{" "}
                      {filteredEvents.length === 1 ? "event" : "events"} found
                      {selectedCategory !== "All Events" &&
                        ` in ${selectedCategory}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {selectedCategory !== "All Events" && (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="outline"
                          className="flex items-center gap-2 border-2 w-full sm:w-auto"
                          onClick={() => {
                            setSelectedCategory("All Events");
                            setCurrentPage(1);
                          }}
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                          Clear Filter
                        </Button>
                      </motion.div>
                    )}

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 border-2 w-full sm:w-auto"
                        onClick={() => setShowFilter(!showFilter)}
                      >
                        <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                        Filter
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </ScrollFade>

              <AnimatePresence>
                {showFilter && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6 overflow-hidden"
                  >
                    <div className="p-4 bg-card rounded-xl shadow-lg border border-border">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {eventCategories.slice(1).map((cat) => (
                          <motion.button
                            key={cat}
                            whileHover={{
                              scale: 1.02,
                              backgroundColor: "rgba(var(--primary), 0.1)",
                            }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedCategory(cat);
                              setShowFilter(false);
                              setCurrentPage(1);
                            }}
                            className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                              selectedCategory === cat
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-secondary text-muted-foreground"
                            }`}
                          >
                            {cat}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {filteredEvents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-display font-bold text-foreground mb-2">
                    No events found
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    There are no upcoming events in the &quot;{selectedCategory}
                    &quot; category yet.
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => {
                        setSelectedCategory("All Events");
                        setCurrentPage(1);
                      }}
                      className="bg-gradient-to-r from-primary to-accent text-white font-semibold"
                    >
                      View All Events
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, margin: "-50px" }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                  >
                    {currentEvents
                      .filter((event) => !event.featured)
                      .map((event) => (
                        <motion.div
                          key={event.id}
                          variants={fadeInUp}
                          whileHover={{ y: -5, scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="group bg-card rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-border"
                        >
                          <div
                            onClick={() => handleCardClick(event.slug)}
                            className="relative h-40 sm:h-44 overflow-hidden bg-gradient-to-br from-muted to-secondary cursor-pointer"
                          >
                            {!imagesLoaded[event.id] && (
                              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                            )}
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.3 }}
                              className="w-full h-full"
                            >
                              <Image
                                src={event.image}
                                alt={event.title}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className={`object-cover transition-opacity duration-300 ${
                                  imagesLoaded[event.id]
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                                onLoad={() => handleImageLoad(event.id)}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                                loading="lazy"
                              />
                            </motion.div>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", delay: 0.2 }}
                              className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 text-center shadow-lg"
                            >
                              <div className="text-xs text-muted-foreground font-medium uppercase">
                                {event.month}
                              </div>
                              <div className="text-xl sm:text-2xl font-bold text-foreground">
                                {event.day}
                              </div>
                            </motion.div>
                            <motion.div
                              initial={{ x: 50, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.3 }}
                              className="absolute top-3 right-3 sm:top-4 sm:right-4"
                            >
                              <span className="px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-foreground">
                                {event.format.split(" ")[0]}
                              </span>
                            </motion.div>
                          </div>

                          <div className="p-4 sm:p-6">
                            <div
                              onClick={() => handleCardClick(event.slug)}
                              className="cursor-pointer"
                            >
                              <motion.span
                                variants={scaleIn}
                                className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2 sm:mb-3 uppercase"
                              >
                                {event.category}
                              </motion.span>

                              <AnimatedText
                                as="h3"
                                delay={0.1}
                                className="text-sm sm:text-base lg:text-lg font-display font-bold text-foreground mb-2 sm:mb-3 line-clamp-2 group-hover:text-primary transition-colors"
                              >
                                {event.title}
                              </AnimatedText>
                            </div>

                            <motion.div
                              variants={staggerContainer}
                              className="flex items-center justify-between pt-3 sm:pt-4 border-t border-border"
                            >
                              <div className="flex gap-2">
                                <motion.div
                                  variants={scaleIn}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    onClick={(e) =>
                                      handleContactClick(event, e)
                                    }
                                    size="sm"
                                    variant="outline"
                                    className="border-primary text-primary hover:bg-primary hover:text-white"
                                  >
                                    <Mail className="mr-1 h-3 w-3" />
                                    Contact
                                  </Button>
                                </motion.div>
                                <motion.div
                                  variants={scaleIn}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    onClick={() => handleCardClick(event.slug)}
                                    size="sm"
                                    className="bg-primary hover:bg-primary/90 text-white"
                                  >
                                    View Details
                                  </Button>
                                </motion.div>
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                  </motion.div>

                  {totalPages > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 sm:mt-12 pt-8 border-t border-border"
                    >
                      <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}-
                        {Math.min(endIndex, filteredEvents.length)} of{" "}
                        {filteredEvents.length} events
                      </div>

                      <div className="flex items-center gap-2">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
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
                        </motion.div>

                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }

                              return (
                                <motion.div
                                  key={pageNum}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    variant={
                                      currentPage === pageNum
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    className="w-10 h-10 p-0"
                                    onClick={() => handlePageChange(pageNum)}
                                  >
                                    {pageNum}
                                  </Button>
                                </motion.div>
                              );
                            },
                          )}

                          {totalPages > 5 && currentPage < totalPages - 2 && (
                            <>
                              <span className="px-2">...</span>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-10 h-10 p-0"
                                  onClick={() => handlePageChange(totalPages)}
                                >
                                  {totalPages}
                                </Button>
                              </motion.div>
                            </>
                          )}
                        </div>

                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
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
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            {/* SIDEBAR */}
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <ScrollFade>
                <motion.div
                  variants={scaleIn}
                  className="bg-card rounded-xl p-5 shadow-lg border border-border"
                >
                  <motion.div
                    variants={fadeInUp}
                    className="flex items-center justify-between mb-4"
                  >
                    <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                      Upcoming Soon
                    </h3>
                  </motion.div>

                  <motion.div variants={staggerContainer} className="space-y-4">
                    {filteredTrendingEvents.length > 0 ? (
                      filteredTrendingEvents.map((event, index) => (
                        <motion.div
                          key={event.id}
                          variants={fadeInLeft}
                          whileHover={{ x: 5 }}
                          onClick={() => handleCardClick(event.slug)}
                          className="block group cursor-pointer pb-4 border-b border-border last:border-0 last:pb-0 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold"
                            >
                              {index + 1}
                            </motion.span>
                            <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase">
                              {event.category.split(" ")[0]}
                            </span>
                          </div>
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1.5 leading-snug text-sm line-clamp-2">
                            {event.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {event.month} {event.day}
                            </span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-muted-foreground text-sm">
                          No upcoming events
                        </p>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              </ScrollFade>

              <ScrollFade>
                <motion.div
                  variants={scaleIn}
                  className="bg-gradient-to-br from-secondary/50 to-secondary rounded-xl p-5 border border-border"
                >
                  <h3 className="text-base font-display font-bold text-foreground mb-3">
                    Event Categories
                  </h3>
                  <motion.div variants={staggerContainer} className="space-y-2">
                    {eventCategories.slice(1).map((cat) => (
                      <motion.button
                        key={cat}
                        variants={fadeInRight}
                        whileHover={{ x: 5 }}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                          selectedCategory === cat
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-white/20 text-muted-foreground"
                        }`}
                      >
                        {cat}
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              </ScrollFade>

              {selectedCategory !== "All Events" && (
                <ScrollFade>
                  <motion.div
                    variants={scaleIn}
                    className="bg-primary/5 rounded-xl p-5 border border-primary/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-display font-bold text-foreground">
                        Active Filter
                      </h3>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedCategory("All Events");
                          setCurrentPage(1);
                        }}
                        className="text-xs text-primary hover:text-accent transition-colors font-medium"
                      >
                        Clear
                      </motion.button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Viewing events in:
                    </p>
                    <motion.div
                      variants={scaleIn}
                      className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold text-center shadow-sm"
                    >
                      {selectedCategory}
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      {filteredEvents.length}{" "}
                      {filteredEvents.length === 1 ? "event" : "events"} found
                    </p>
                  </motion.div>
                </ScrollFade>
              )}

              <ScrollFade>
                <motion.div
                  variants={scaleIn}
                  className="bg-card rounded-xl p-5 shadow-lg border border-border"
                >
                  <h3 className="text-base font-display font-bold text-foreground mb-3">
                    Event Tips
                  </h3>
                  <motion.ul
                    variants={staggerContainer}
                    className="space-y-2 text-xs text-muted-foreground"
                  >
                    <motion.li
                      variants={fadeInUp}
                      className="flex items-start gap-2"
                    >
                      <Clock className="h-3 w-3 text-accent mt-0.5 flex-shrink-0" />
                      <span>Register early for best rates</span>
                    </motion.li>
                    <motion.li
                      variants={fadeInUp}
                      className="flex items-start gap-2"
                    >
                      <Users className="h-3 w-3 text-accent mt-0.5 flex-shrink-0" />
                      <span>Network with fellow attendees</span>
                    </motion.li>
                    <motion.li
                      variants={fadeInUp}
                      className="flex items-start gap-2"
                    >
                      <Calendar className="h-3 w-3 text-accent mt-0.5 flex-shrink-0" />
                      <span>Add events to your calendar</span>
                    </motion.li>
                  </motion.ul>
                </motion.div>
              </ScrollFade>
            </aside>
          </div>
        </div>
      </section>

      <ScrollFade>
        <Cta />
      </ScrollFade>
    </main>
  );
}
