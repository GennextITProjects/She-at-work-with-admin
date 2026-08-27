// app/robots.ts
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS — Neon CU, not SEO.
//
// Neon bills compute by WALL-CLOCK TIME AWAKE, not by query count. The compute
// only suspends after ~5 minutes with zero queries. So a single DB touch every
// 4 minutes costs exactly as much as thousands of queries per minute.
//
// The site has ~1900 published rows. Crawlers walking that long tail — plus the
// background ISR regeneration each crawled URL triggers — kept the gap between
// DB queries permanently under 5 minutes, which is why the earlier ISR work
// reduced query VOLUME without reducing the Neon bill at all.
//
// Observed in logs: bingbot, Sogou spider, Reflectionbot (reflection.ai), and
// generic headless-Chrome user agents.
//
// Policy below:
//   - Googlebot / Bingbot: allowed (real referral traffic), crawl-delayed.
//   - Sogou, Yandex, Baidu: disallowed — near-zero audience overlap for this
//     site, historically aggressive crawl rates.
//   - AI scrapers (GPTBot, ClaudeBot, CCBot, Reflectionbot, …): disallowed.
//     They generate no referral traffic and crawl exhaustively.
//   - Everyone: /api/*, /dashboard/*, /auth/* and every query-string URL are
//     off-limits. Filter/pagination query strings are an unbounded crawl trap:
//     each unique combination is a CDN cache miss and therefore a fresh DB hit.
//
// robots.txt only works on bots that honour it. Anything that ignores it must
// be handled at the Vercel Firewall — see docs/neon-cu-runbook.md.
// ─────────────────────────────────────────────────────────────────────────────

import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sheatwork.com";

/** Paths no crawler should ever fetch — they always cost a DB query. */
const NEVER_CRAWL = [
  "/api/",
  "/dashboard/",
  "/auth/",
  "/*?*", // any URL carrying a query string (filters, pagination, search)
];

/**
 * Search engines that send real traffic. Allowed, but rate-limited.
 * Google ignores Crawl-delay (configure the rate in Search Console instead);
 * Bing honours it.
 */
const ALLOWED_SEARCH_BOTS = ["Googlebot", "Bingbot", "DuckDuckBot", "Applebot"];

/**
 * Bots that crawl exhaustively and return nothing. Each entry here is a bot
 * that was either observed in the access logs or is a known high-volume
 * AI/archive crawler.
 */
const BLOCKED_BOTS = [
  // Observed in access logs
  "Sogou web spider",
  "Sogou inst spider",
  "Reflectionbot",
  // Other search engines with no audience overlap
  "YandexBot",
  "Baiduspider",
  "PetalBot",
  "SeznamBot",
  // AI training / retrieval crawlers
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "Amazonbot",
  "Meta-ExternalAgent",
  "FacebookBot",
  "CCBot",
  "cohere-ai",
  "Diffbot",
  "Timpibot",
  "Omgilibot",
  "ImagesiftBot",
  // SEO tools — crawl every URL, send no visitors
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "DataForSeoBot",
  "BLEXBot",
  "Barkrowler",
  "SerpstatBot",
  "ZoominfoBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Search engines worth having: allowed, throttled ──────────────────
      {
        userAgent: ALLOWED_SEARCH_BOTS,
        allow: "/",
        disallow: NEVER_CRAWL,
        crawlDelay: 10,
      },

      // ── Everything else that identifies itself and honours robots.txt ────
      {
        userAgent: BLOCKED_BOTS,
        disallow: "/",
      },

      // ── Default: unknown agents get the content pages, never the DB-heavy
      //    endpoints, and at a slow rate.
      {
        userAgent: "*",
        allow: "/",
        disallow: NEVER_CRAWL,
        crawlDelay: 30,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
