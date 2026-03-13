// categoryIcons.tsx
// NO "use client" — this file is intentionally server-safe.
// getCategoryIcon returns JSX but does NOT use any hooks or browser APIs,
// so it can be imported by both server components and client components.

import {
  Award,
  BookOpen,
  Building,
  FileText,
  Globe,
  Handshake,
  Heart,
  Lightbulb,
  MessageCircle,
  Rocket,
  Scale,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

const SIZE = "h-4 w-4";

/**
 * Returns a small icon JSX element matching the category name.
 * Falls back to <FileText> for unknown categories.
 *
 * Covers all categories across News, Blogs, and EntreChat.
 */
export function getCategoryIcon(category: string) {
  // Normalise — case-insensitive prefix match so minor wording
  // differences (e.g. "Funding & Investment" vs "Funding") still resolve.
  const c = category.toLowerCase();

  if (c.includes("funding") || c.includes("investment") || c.includes("finance"))
    return <TrendingUp className={SIZE} />;

  if (c.includes("policy") || c.includes("government") || c.includes("scheme") || c.includes("regulation"))
    return <Building className={SIZE} />;

  if (c.includes("tech") || c.includes("innovation") || c.includes("digital") || c.includes("ai"))
    return <Zap className={SIZE} />;

  if (c.includes("award") || c.includes("recognition") || c.includes("honour") || c.includes("honor"))
    return <Award className={SIZE} />;

  if (c.includes("launch") || c.includes("startup") || c.includes("new venture"))
    return <Rocket className={SIZE} />;

  if (c.includes("partner") || c.includes("collab"))
    return <Handshake className={SIZE} />;

  if (c.includes("success") || c.includes("story") || c.includes("journey") || c.includes("founder"))
    return <Star className={SIZE} />;

  if (c.includes("industry") || c.includes("trend") || c.includes("market"))
    return <Target className={SIZE} />;

  if (c.includes("community") || c.includes("network") || c.includes("people"))
    return <Users className={SIZE} />;

  if (c.includes("interview") || c.includes("entrechat") || c.includes("conversation") || c.includes("chat"))
    return <MessageCircle className={SIZE} />;

  if (c.includes("health") || c.includes("wellness") || c.includes("wellbeing"))
    return <Heart className={SIZE} />;

  if (c.includes("legal") || c.includes("law") || c.includes("compliance"))
    return <Scale className={SIZE} />;

  if (c.includes("global") || c.includes("international") || c.includes("world"))
    return <Globe className={SIZE} />;

  if (c.includes("insight") || c.includes("opinion") || c.includes("blog") || c.includes("article"))
    return <BookOpen className={SIZE} />;

  if (c.includes("idea") || c.includes("strategy") || c.includes("growth"))
    return <Lightbulb className={SIZE} />;

  // Default fallback
  return <FileText className={SIZE} />;
}