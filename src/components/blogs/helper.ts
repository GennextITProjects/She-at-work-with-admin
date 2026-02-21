


// Define types for your blog data
export interface BlogItem {
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
  post_date_gmt?: string;
  post_content_filtered?: string;
  post_parent?: string;
  guid?: string;
  menu_order?: string;
  post_type?: string;
  post_mime_type?: string;
  comment_count?: string;
  section_id?: string;
}

// Extended interface for processed blogs
export interface ProcessedBlogItem {
  slug: string;
  id: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  rawDate: Date;
  readTime: string;
  readingTimeCategory: string;
  proficiencyLevel: string;
  author: string;
  image: string | null;
  fullContent: string;
  modifiedDate?: string;
  modifiedRawDate?: Date;
  state?: string;
  country?: string;
}

// Extract categories from content
export const getCategoryFromContent = (content: string): string => {
  const contentLower = content.toLowerCase();
  if (contentLower.includes("digital") || contentLower.includes("marketing")) return "Digital Marketing";
  if (contentLower.includes("leadership") || contentLower.includes("mindset")) return "Leadership & Mindset";
  if (contentLower.includes("legal") || contentLower.includes("compliance")) return "Legal & Compliance";
  if (contentLower.includes("finance") || contentLower.includes("financial") || contentLower.includes("management")) return "Financial Management";
  if (contentLower.includes("e-commerce") || contentLower.includes("ecommerce")) return "E-commerce";
  if (contentLower.includes("edtech") || contentLower.includes("education")) return "EdTech";
  if (contentLower.includes("health") || contentLower.includes("wellness")) return "Health & Wellness";
  if (contentLower.includes("growth") || contentLower.includes("scale")) return "Growth & Scaling";
  if (contentLower.includes("innovation") || contentLower.includes("tech")) return "Technology & Innovation";
  if (contentLower.includes("success") || contentLower.includes("story")) return "Success Stories";
  if (contentLower.includes("strategy") || contentLower.includes("planning")) return "Business Strategy";
  if (contentLower.includes("brand") || contentLower.includes("social")) return "Brand Building";
  return "General";
};

// Calculate reading time category
export const getReadingTimeCategory = (text: string): string => {
  if (!text) return "Quick Reads";
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / 200);
  return minutes < 5 ? "Quick Reads (<5 mins)" : "Deep Dives (5+ mins)";
};

// Determine proficiency level
export const getProficiencyLevel = (content: string): string => {
  const contentLower = content.toLowerCase();
  const beginnerKeywords = ["beginner", "starting", "basic", "fundamental", "intro", "guide"];
  const advancedKeywords = ["advanced", "scaling", "expert", "master", "optimize", "scale"];
  
  const beginnerCount = beginnerKeywords.filter(keyword => contentLower.includes(keyword)).length;
  const advancedCount = advancedKeywords.filter(keyword => contentLower.includes(keyword)).length;
  
  return advancedCount > beginnerCount ? "Advanced (Scaling Up)" : "Beginner (Starting Up)";
};

// Helper function to extract author from content
export const extractAuthor = (content: string): string => {
  const authorMatch = content.match(/by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i) || 
                     content.match(/Written by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i) ||
                     content.match(/Author:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
  return authorMatch ? authorMatch[1] : "She at Work Team";
};

// Mock location data
const mockLocationData: Record<string, { state?: string; country?: string }> = {
  // Add location data for your blogs here
};

// Get location from mock data or extract from content as fallback
export const getLocationData = (id: string, content: string): { state?: string; country?: string } => {
  if (mockLocationData[id]) {
    return mockLocationData[id];
  }
  
  const contentLower = content.toLowerCase();
  let state: string | undefined;
  let country: string | undefined;
  
  const statePatterns = [
    { pattern: /\bcalifornia\b/i, value: "California" },
    { pattern: /\bnew york\b/i, value: "New York" },
    { pattern: /\btexas\b/i, value: "Texas" },
    { pattern: /\bflorida\b/i, value: "Florida" },
    { pattern: /\bontario\b/i, value: "Ontario" },
    { pattern: /\blondon\b/i, value: "London" },
  ];
  
  const countryPatterns = [
    { pattern: /\bus(a)?\b/i, value: "USA" },
    { pattern: /\bunited states\b/i, value: "USA" },
    { pattern: /\bcanada\b/i, value: "Canada" },
    { pattern: /\buk\b/i, value: "UK" },
    { pattern: /\baustralia\b/i, value: "Australia" },
    { pattern: /\bindia\b/i, value: "India" },
    { pattern: /\bgermany\b/i, value: "Germany" },
  ];
  
  for (const statePattern of statePatterns) {
    if (statePattern.pattern.test(contentLower)) {
      state = statePattern.value;
      break;
    }
  }
  
  for (const countryPattern of countryPatterns) {
    if (countryPattern.pattern.test(contentLower)) {
      country = countryPattern.value;
      break;
    }
  }
  
  return { state, country };
};

// Blog categories based on your requirements
export const blogCategories = [
  "All Blogs",
  "Digital Marketing",
  "Leadership & Mindset",
  "Legal & Compliance",
  "Financial Management",
  "E-commerce",
  "EdTech",
  "Health & Wellness",
  "Growth & Scaling",
  "Technology & Innovation",
  "Success Stories",
  "Business Strategy",
  "Brand Building",
  "General",
];

// Format date function
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Date unavailable';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Invalid date:', dateString, error);
    return 'Date unavailable';
  }
};

// Extract excerpt from content
export const extractExcerpt = (content: string, maxLength: number = 150): string => {
  if (!content) return 'No excerpt available';
  
  try {
    const plainText = content.replace(/<[^>]*>/g, '');
    const cleanText = plainText.replace(/\s+/g, ' ').trim();
    
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + '...';
  } catch (error) {
    console.warn('Error extracting excerpt:', error);
    return 'No excerpt available';
  }
};

// Calculate read time
export const calculateReadTime = (text: string): string => {
  if (!text) return '1 min read';
  
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
};

// Items per page for pagination
export const ITEMS_PER_PAGE = 12;

// Predefined date ranges
export const predefinedDateRanges = [
  { value: "24h", label: "24 Hours" },
  { value: "week", label: "Past Week" },
  { value: "month", label: "Past Month" },
  { value: "3months", label: "Past 3 Months" },
  { value: "custom", label: "Custom Range" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResponse {
  blogs: ProcessedBlogItem[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SearchSuggestion {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  slug: string;
  relevance: number;
}


export function buildApiUrl(p: {
  page: number;
  categories: string[];
  search: string;
  countries: string[];
  dateFrom: string;
  dateTo: string;
  readingTimes: string[];
  proficiencyLevels: string[];
  states: string[];
}) {
  const sp = new URLSearchParams();
  sp.set("page", String(p.page));

  const cat = p.categories.filter((c) => c !== "All Blogs");
  if (cat.length === 1) sp.set("category", cat[0]);
  if (cat.length > 1) sp.set("categories", cat.join(","));

  if (p.search) sp.set("search", p.search);

  if (p.countries.length === 1) sp.set("country", p.countries[0]);
  if (p.countries.length > 1) sp.set("countries", p.countries.join(","));

  if (p.dateFrom) sp.set("dateFrom", p.dateFrom);
  if (p.dateTo) sp.set("dateTo", p.dateTo);

  const rt = p.readingTimes.filter((t) => t !== "All Reading Times");
  if (rt.length) sp.set("readingTimes", rt.join(","));

  const pl = p.proficiencyLevels.filter((l) => l !== "All Levels");
  if (pl.length) sp.set("proficiency", pl.join(","));

  if (p.states.length) sp.set("states", p.states.join(","));

  return `/api/blogs?${sp.toString()}`;
}


export const COLOR_MAP: Record<string, string> = {
  primary: "bg-primary/10 text-primary hover:bg-primary/20",
  blue: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  green: "bg-green-100 text-green-700 hover:bg-green-200",
  purple: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  amber: "bg-amber-100 text-amber-700 hover:bg-amber-200",
};


export function buildPageNumbers(current: number, total: number): (number | "…")[] {
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


