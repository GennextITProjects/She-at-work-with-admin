// Define types for your entrechat data
export interface EntreChatItem {
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
}

// Extended interface for processed entrechat
export interface ProcessedEntreChatItem {
  slug: string;
  id: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  rawDate: Date;
  readTime: string;
  interviewee: string;
  image: string | null;
  fullContent: string;
  modifiedDate?: string;
  modifiedRawDate?: Date;
  state?: string;
  country?: string;
  industrySector: string;
  businessStage: string;
  interviewFormat: string;
  founderRegion: string;
  successFactor: string;
}

// Extract categories from content
export const getCategoryFromContent = (content: string): string => {
  const contentLower = content.toLowerCase();
  if (
    contentLower.includes("design") ||
    contentLower.includes("interior") ||
    contentLower.includes("architecture")
  )
    return "Design & Architecture";
  if (
    contentLower.includes("wellness") ||
    contentLower.includes("health") ||
    contentLower.includes("mindfulness") ||
    contentLower.includes("yoga") ||
    contentLower.includes("meditation")
  )
    return "Wellness & Health";
  if (
    contentLower.includes("funding") ||
    contentLower.includes("finance") ||
    contentLower.includes("investment") ||
    contentLower.includes("capital") ||
    content.includes("$")
  )
    return "Funding & Finance";
  if (
    contentLower.includes("technology") ||
    contentLower.includes("tech") ||
    contentLower.includes("ai") ||
    contentLower.includes("digital") ||
    contentLower.includes("software")
  )
    return "Technology";
  if (
    contentLower.includes("leadership") ||
    contentLower.includes("management") ||
    contentLower.includes("ceo") ||
    contentLower.includes("director")
  )
    return "Leadership";
  if (
    contentLower.includes("marketing") ||
    contentLower.includes("brand") ||
    contentLower.includes("social media") ||
    contentLower.includes("advertising")
  )
    return "Marketing";
  if (
    contentLower.includes("product") ||
    contentLower.includes("development") ||
    contentLower.includes("innovation")
  )
    return "Product Development";
  if (
    contentLower.includes("balance") ||
    contentLower.includes("family") ||
    contentLower.includes("work-life") ||
    contentLower.includes("parent")
  )
    return "Work-Life Balance";
  if (
    contentLower.includes("legal") ||
    contentLower.includes("compliance") ||
    contentLower.includes("regulation") ||
    contentLower.includes("law")
  )
    return "Legal & Compliance";
  return "Entrepreneurship";
};

// Extract industry sector from content
export const getIndustrySector = (content: string): string => {
  const contentLower = content.toLowerCase();
  if (contentLower.includes("fashion") || contentLower.includes("lifestyle") || contentLower.includes("clothing") || contentLower.includes("apparel")) 
    return "Fashion & Lifestyle";
  if (contentLower.includes("food") || contentLower.includes("beverage") || contentLower.includes("restaurant") || contentLower.includes("culinary")) 
    return "Food & Beverage";
  if (contentLower.includes("social") || contentLower.includes("impact") || contentLower.includes("nonprofit") || contentLower.includes("ngo")) 
    return "Social Impact";
  if (contentLower.includes("tech") || contentLower.includes("software") || contentLower.includes("ai") || contentLower.includes("digital")) 
    return "Technology";
  return "General Business";
};

// Determine business stage
export const getBusinessStage = (content: string): string => {
  const contentLower = content.toLowerCase();
  const earlyKeywords = ["early stage", "startup", "ideation", "launching", "just started"];
  const growthKeywords = ["growth", "scaling", "expanding", "hiring", "funding round"];
  const establishedKeywords = ["established", "enterprise", "corporate", "mature", "years in business"];
  
  const earlyCount = earlyKeywords.filter(keyword => contentLower.includes(keyword)).length;
  const growthCount = growthKeywords.filter(keyword => contentLower.includes(keyword)).length;
  const establishedCount = establishedKeywords.filter(keyword => contentLower.includes(keyword)).length;
  
  if (establishedCount > growthCount && establishedCount > earlyCount) return "Established Enterprise";
  if (growthCount > earlyCount) return "Growth/Scaling";
  return "Early Stage/Ideation";
};

// Determine interview format
export const getInterviewFormat = (content: string): string => {
  const contentLower = content.toLowerCase();
  if (contentLower.includes("video") || contentLower.includes("youtube") || contentLower.includes("watch")) 
    return "Video Interview";
  if (contentLower.includes("podcast") || contentLower.includes("audio") || contentLower.includes("listen")) 
    return "Podcast/Audio";
  return "Text Interview";
};

// Determine founder region
export const getFounderRegion = (content: string): string => {
  const contentLower = content.toLowerCase();
  const asiaKeywords = ["india", "china", "japan", "singapore", "asia", "asian"];
  const europeKeywords = ["europe", "uk", "london", "germany", "france", "european"];
  const northAmericaKeywords = ["usa", "us", "america", "canada", "new york", "california", "silicon valley"];
  
  const asiaCount = asiaKeywords.filter(keyword => contentLower.includes(keyword)).length;
  const europeCount = europeKeywords.filter(keyword => contentLower.includes(keyword)).length;
  const northAmericaCount = northAmericaKeywords.filter(keyword => contentLower.includes(keyword)).length;
  
  if (northAmericaCount > europeCount && northAmericaCount > asiaCount) return "North America";
  if (europeCount > asiaCount) return "Europe";
  if (asiaCount > 0) return "Asia-Pacific";
  return "Global";
};

// Determine success factor
export const getSuccessFactor = (content: string): string => {
  const contentLower = content.toLowerCase();
  if (contentLower.includes("bootstrapped") || contentLower.includes("self-funded") || contentLower.includes("no funding")) 
    return "Bootstrapped";
  if (contentLower.includes("vc") || contentLower.includes("venture capital") || contentLower.includes("funded")) 
    return "VC Funded";
  if (contentLower.includes("angel") || contentLower.includes("investor")) 
    return "Angel Backed";
  if (contentLower.includes("grant") || contentLower.includes("government")) 
    return "Grant Supported";
  return "Mixed Funding";
};

// Helper function to extract interviewee name from title
export const extractInterviewee = (title: string): string => {
  const cleaned = title.replace(/Entrechat\s+(?:With|with)\s+/i, "").trim();
  const finalName = cleaned.replace(/^(Ms\.|Mr\.)\s+/i, "").trim();
  return finalName || "Interviewee";
};

// Mock location data
export const mockLocationData: Record<string, { state?: string; country?: string }> = {
  // Add location data for your interviews here
};

// Get location from mock data or extract from content as fallback
export const getLocationData = (
  id: string,
  content: string,
): { state?: string; country?: string } => {
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

// Interview categories
export const entrechatCategories = [
  "All Interviews",
  "Design & Architecture",
  "Wellness & Health",
  "Funding & Finance",
  "Technology",
  "Leadership",
  "Marketing",
  "Product Development",
  "Work-Life Balance",
  "Legal & Compliance",
  "Entrepreneurship",
];

// Predefined date ranges
export const predefinedDateRanges = [
  { value: "24h", label: "24 Hours" },
  { value: "week", label: "Past Week" },
  { value: "month", label: "Past Month" },
  { value: "3months", label: "Past 3 Months" },
  { value: "custom", label: "Custom Range" },
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
