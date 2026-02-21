/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
// Define types for your news data
export interface NewsItem {
  ID: string;
  post_title: string;
  post_content: string;
  post_date: string;
  post_excerpt: string;
  featured_image_url: string;
  external_url: string | null;
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
  post_name?: string;
}

// Extended interface for processed news with location data
export interface ProcessedNewsItem {
  slug: any;
  id: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  rawDate: Date;
  readTime: string;
  source: string;
  sourceType: string;
  image: string;
  externalUrl: string | null;
  fullContent: string;
  modifiedDate?: string;
  modifiedRawDate?: Date;
  state?: string;
  country?: string;
  city?: string;
  region?: string;
  topicTags: string[];
}

// Helper function to safely extract domain from URL
export const getSourceFromUrl = (url: string | null): string => {
  if (!url || url.trim() === "" || url === "null") return "She at Work";

  try {
    const urlPattern =
      /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\- .\/?%&=]*)?$/i;

    if (!urlPattern.test(url)) {
      return "She at Work";
    }

    const urlWithProtocol = url.startsWith("http") ? url : `https://${url}`;
    const parsedUrl = new URL(urlWithProtocol);
    const hostname = parsedUrl.hostname.replace("www.", "");

    const domainParts = hostname.split(".");
    if (domainParts.length >= 2) {
      const mainDomain = domainParts[domainParts.length - 2];
      const formattedName = mainDomain
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .replace(/[_-]/g, " ")
        .trim();

      return formattedName || hostname;
    }

    return hostname;
  } catch (error) {
    console.warn("Invalid URL, using default source:", url, error);
    return "She at Work";
  }
};

// Determine source type based on URL
export const getSourceType = (url: string | null, content: string): string => {
  if (!url || url.trim() === "" || url === "null") {
    // Check if content looks like an official press release
    const contentLower = content.toLowerCase();
    if (
      contentLower.includes("press release") ||
      contentLower.includes("for immediate release") ||
      contentLower.includes("government") ||
      contentLower.includes("ministry") ||
      contentLower.includes(".gov.")
    ) {
      return "Official Press Release";
    }
    return "She at Work";
  }

  try {
    const urlWithProtocol = url.startsWith("http") ? url : `https://${url}`;
    const parsedUrl = new URL(urlWithProtocol);
    const hostname = parsedUrl.hostname.toLowerCase();

    // Check for official/government sites
    if (
      hostname.includes(".gov") ||
      hostname.includes(".nic.in") ||
      hostname.includes("pib.gov") ||
      hostname.includes("pressrelease") ||
      hostname.includes("prnewswire")
    ) {
      return "Official Press Release";
    }

    // Check for news/media sites (likely editorial)
    if (
      hostname.includes("news") ||
      hostname.includes("times") ||
      hostname.includes("post") ||
      hostname.includes("tribune") ||
      hostname.includes("express") ||
      hostname.includes("media") ||
      hostname.includes("blog") ||
      hostname.includes("medium")
    ) {
      return "Editorial Analysis";
    }

    return "Other Sources";
  } catch (error) {
    return "She at Work";
  }
};

// Enhanced category mapping with topic tags
export const getCategoryAndTagsFromContent = (
  content: string,
): { category: string; topicTags: string[] } => {
  const contentLower = content.toLowerCase();
  const topicTags: string[] = [];

  // Funding & Investment
  if (
    contentLower.includes("funding") ||
    contentLower.includes("investment") ||
    contentLower.includes("raise") ||
    contentLower.includes("$") ||
    contentLower.includes("venture capital") ||
    contentLower.includes("seed round") ||
    contentLower.includes("series a") ||
    contentLower.includes("series b") ||
    contentLower.includes("angel investor") ||
    contentLower.includes("vc funding")
  ) {
    topicTags.push("funding", "investment");
    return {
      category: "Funding & Investment",
      topicTags,
    };
  }

  // Policy & Government Schemes
  if (
    contentLower.includes("policy") ||
    contentLower.includes("government") ||
    contentLower.includes("scheme") ||
    contentLower.includes("initiative") ||
    contentLower.includes("subsidy") ||
    contentLower.includes("program") ||
    contentLower.includes("ministry") ||
    contentLower.includes("regulation") ||
    contentLower.includes("law") ||
    contentLower.includes("bill") ||
    contentLower.includes("act")
  ) {
    topicTags.push("policy", "government");
    return {
      category: "Policy & Government Schemes",
      topicTags,
    };
  }

  // Technology & Innovation
  if (
    contentLower.includes("technology") ||
    contentLower.includes("innovation") ||
    contentLower.includes("ai") ||
    contentLower.includes("tech") ||
    contentLower.includes("digital") ||
    contentLower.includes("platform") ||
    contentLower.includes("software") ||
    contentLower.includes("app") ||
    contentLower.includes("blockchain") ||
    contentLower.includes("iot") ||
    contentLower.includes("fintech") ||
    contentLower.includes("edtech")
  ) {
    topicTags.push("technology", "innovation");
    return {
      category: "Technology & Innovation",
      topicTags,
    };
  }

  // Awards & Recognition
  if (
    contentLower.includes("award") ||
    contentLower.includes("recognition") ||
    contentLower.includes("honor") ||
    contentLower.includes("prize") ||
    contentLower.includes("accolade") ||
    contentLower.includes("achievement") ||
    contentLower.includes("winner") ||
    contentLower.includes("certificate") ||
    contentLower.includes("title") ||
    contentLower.includes("ranking")
  ) {
    topicTags.push("awards", "recognition");
    return {
      category: "Awards & Recognition",
      topicTags,
    };
  }

  // Launches
  if (
    contentLower.includes("launch") ||
    contentLower.includes("debut") ||
    contentLower.includes("introduce") ||
    contentLower.includes("release") ||
    contentLower.includes("unveil") ||
    contentLower.includes("new product") ||
    contentLower.includes("new service")
  ) {
    topicTags.push("launches");
    return {
      category: "Launches",
      topicTags,
    };
  }

  // Partnerships
  if (
    contentLower.includes("partner") ||
    contentLower.includes("collaboration") ||
    contentLower.includes("joint") ||
    contentLower.includes("alliance") ||
    contentLower.includes("tie-up") ||
    contentLower.includes("agreement") ||
    contentLower.includes("mou")
  ) {
    topicTags.push("partnerships");
    return {
      category: "Partnerships",
      topicTags,
    };
  }

  // Success Stories
  if (
    contentLower.includes("success") ||
    contentLower.includes("journey") ||
    contentLower.includes("story") ||
    contentLower.includes("empire") ||
    contentLower.includes("growth story") ||
    contentLower.includes("entrepreneur journey")
  ) {
    topicTags.push("success-stories");
    return {
      category: "Success Stories",
      topicTags,
    };
  }

  // Industry Trends
  if (
    contentLower.includes("trend") ||
    contentLower.includes("growth") ||
    contentLower.includes("industry") ||
    contentLower.includes("market") ||
    contentLower.includes("analysis") ||
    contentLower.includes("report") ||
    contentLower.includes("study") ||
    contentLower.includes("research") ||
    contentLower.includes("forecast") ||
    contentLower.includes("outlook")
  ) {
    topicTags.push("trends", "industry");
    return {
      category: "Industry Trends",
      topicTags,
    };
  }

  topicTags.push("general");
  return {
    category: "General News",
    topicTags,
  };
};

// Enhanced location extraction with global support
export const getLocationData = (
  content: string,
): { state?: string; country?: string; city?: string; region?: string } => {
  const contentLower = content.toLowerCase();
  let state: string | undefined;
  let country: string | undefined;
  let city: string | undefined;
  let region: string | undefined;

  // Extensive location patterns
  const countryPatterns = [
    { pattern: /\busa\b|\bunited states\b|\bus\b/i, value: "USA" },
    { pattern: /\bindia\b/i, value: "India" },
    { pattern: /\buk\b|\bunited kingdom\b|\bgb\b/i, value: "UK" },
    { pattern: /\bcanada\b/i, value: "Canada" },
    { pattern: /\baustralia\b/i, value: "Australia" },
    { pattern: /\bgermany\b/i, value: "Germany" },
    { pattern: /\bfrance\b/i, value: "France" },
    { pattern: /\bjapan\b/i, value: "Japan" },
    { pattern: /\bsingapore\b/i, value: "Singapore" },
    { pattern: /\buae\b|\bdubai\b|\babu dhabi\b/i, value: "UAE" },
    { pattern: /\bsouth korea\b|\bkorea\b/i, value: "South Korea" },
    { pattern: /\bchina\b/i, value: "China" },
    { pattern: /\bnetherlands\b/i, value: "Netherlands" },
    { pattern: /\bsweden\b/i, value: "Sweden" },
    { pattern: /\bisrael\b/i, value: "Israel" },
  ];

  const statePatterns = [
    // USA States
    { pattern: /\bcalifornia\b|\bca\b/i, value: "California", country: "USA" },
    { pattern: /\bnew york\b|\bny\b/i, value: "New York", country: "USA" },
    { pattern: /\btexas\b|\btx\b/i, value: "Texas", country: "USA" },
    { pattern: /\bflorida\b|\bfl\b/i, value: "Florida", country: "USA" },
    { pattern: /\billinois\b|\bil\b/i, value: "Illinois", country: "USA" },
    { pattern: /\bwashington\b|\bwa\b/i, value: "Washington", country: "USA" },
    
    // India States
    { pattern: /\bmaharashtra\b/i, value: "Maharashtra", country: "India" },
    { pattern: /\bkarnataka\b/i, value: "Karnataka", country: "India" },
    { pattern: /\btamil nadu\b/i, value: "Tamil Nadu", country: "India" },
    { pattern: /\bdelhi\b/i, value: "Delhi", country: "India" },
    { pattern: /\bbengaluru\b|\bbangalore\b/i, value: "Bengaluru", country: "India" },
    { pattern: /\bmumbai\b/i, value: "Mumbai", country: "India" },
    
    // Other countries
    { pattern: /\bontario\b/i, value: "Ontario", country: "Canada" },
    { pattern: /\bqueensland\b/i, value: "Queensland", country: "Australia" },
    { pattern: /\bbavaria\b/i, value: "Bavaria", country: "Germany" },
  ];

  const cityPatterns = [
    // Global cities
    { pattern: /\blondon\b/i, value: "London", country: "UK" },
    { pattern: /\btoronto\b/i, value: "Toronto", country: "Canada" },
    { pattern: /\bsydney\b/i, value: "Sydney", country: "Australia" },
    { pattern: /\bberlin\b/i, value: "Berlin", country: "Germany" },
    { pattern: /\bparis\b/i, value: "Paris", country: "France" },
    { pattern: /\btokyo\b/i, value: "Tokyo", country: "Japan" },
    
    // Indian cities
    { pattern: /\bchennai\b/i, value: "Chennai", country: "India" },
    { pattern: /\bhyderabad\b/i, value: "Hyderabad", country: "India" },
    { pattern: /\bpune\b/i, value: "Pune", country: "India" },
    { pattern: /\bjaipur\b/i, value: "Jaipur", country: "India" },
    { pattern: /\bkolkata\b/i, value: "Kolkata", country: "India" },
    { pattern: /\bkochi\b/i, value: "Kochi", country: "India" },
  ];

  // Extract country
  for (const pattern of countryPatterns) {
    if (pattern.pattern.test(contentLower)) {
      country = pattern.value;
      break;
    }
  }

  // Extract state
  for (const pattern of statePatterns) {
    if (pattern.pattern.test(contentLower)) {
      state = pattern.value;
      if (!country && pattern.country) {
        country = pattern.country;
      }
      break;
    }
  }

  // Extract city
  for (const pattern of cityPatterns) {
    if (pattern.pattern.test(contentLower)) {
      city = pattern.value;
      if (!country && pattern.country) {
        country = pattern.country;
      }
      break;
    }
  }

  // Determine region based on country
  if (country) {
    const asianCountries = ["India", "China", "Japan", "Singapore", "South Korea"];
    const europeanCountries = ["UK", "Germany", "France", "Netherlands", "Sweden"];
    const northAmericanCountries = ["USA", "Canada"];
    const oceaniaCountries = ["Australia"];
    const middleEastCountries = ["UAE", "Israel"];

    if (asianCountries.includes(country)) region = "Asia";
    else if (europeanCountries.includes(country)) region = "Europe";
    else if (northAmericanCountries.includes(country)) region = "North America";
    else if (oceaniaCountries.includes(country)) region = "Oceania";
    else if (middleEastCountries.includes(country)) region = "Middle East";
  }

  return { state, country, city, region };
};

export const newsCategories = [
  "All News",
  "Funding & Investment",
  "Policy & Government Schemes",
  "Technology & Innovation",
  "Awards & Recognition",
  "Launches",
  "Partnerships",
  "Success Stories",
  "Industry Trends",
  "General News",
];

export const sourceTypes = [
  "All Sources",
  "Official Press Release",
  "Editorial Analysis",
  "She at Work",
  "Other Sources",
];

export const predefinedDateRanges = [
  { label: "Last 24 Hours", value: "24h" },
  { label: "Last Week", value: "week" },
  { label: "Last Month", value: "month" },
  { label: "Last 3 Months", value: "3months" },
  { label: "Custom Range", value: "custom" },
];

// Format date function
export const formatDate = (dateString: string): string => {
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
export const extractExcerpt = (content: string, maxLength: number = 150): string => {
  if (!content) return "No excerpt available";

  try {
    const plainText = content.replace(/<[^>]*>/g, "");
    const cleanText = plainText.replace(/\s+/g, " ").trim();

    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + "...";
  } catch (error) {
    console.warn("Error extracting excerpt:", error);
    return "No excerpt available";
  }
};

// Calculate read time
export const calculateReadTime = (text: string): string => {
  if (!text) return "1 min read";

  const wordCount = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
};

// Items per page for pagination
export const ITEMS_PER_PAGE = 12;

export interface NewsApiResponse {
  news: ProcessedNewsItem[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}