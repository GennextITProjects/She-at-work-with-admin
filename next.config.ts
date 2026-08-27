// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["jsdom"],

  // Legacy WordPress paths that map to a fixed destination and therefore need
  // no database lookup. Article permalinks are handled separately by
  // app/[legacySlug]/page.tsx, which has to resolve the slug against `content`.
  //
  // These are matched at the edge before any function runs, so scanner traffic
  // hitting /author/* costs nothing.
  async redirects() {
    return [
      {
        // Old scheme browser lived at /global-schemes/<country>.
        source: "/global-schemes/:path*",
        destination: "/gettingstarted/global-schemes",
        permanent: true,
      },
      {
        // WordPress author archives — no equivalent page exists.
        source: "/author/:path*",
        destination: "/",
        permanent: true,
      },
      {
        // WordPress category/tag archives map onto the blogs filter.
        source: "/category/:path*",
        destination: "/blogs",
        permanent: true,
      },
      {
        source: "/tag/:path*",
        destination: "/blogs",
        permanent: true,
      },
      // Casing. The route segment is `sheDiaries` (app/sheDiaries/) and Next's
      // filesystem routing is case-sensitive, so the lowercase form is not a
      // route — it falls through to app/[legacySlug]/page.tsx, passes the slug
      // shape guard, spends a Neon query, 404s, and (revalidate = false) caches
      // that 404 forever. Production logs show real browsers hitting it.
      {
        source: "/shediaries",
        destination: "/sheDiaries",
        permanent: true,
      },
      {
        source: "/shediaries/:path*",
        destination: "/sheDiaries/:path*",
        permanent: true,
      },
    ];
  },

  // Force Vercel's CDN to cache content API responses.
  // Without this, Vercel ignores Cache-Control headers set inside route handlers
  // for dynamic routes. This config applies them at the infrastructure level.
  // next.config.ts
async headers() {
  return [
    {
      // Let the route handler set Cache-Control per endpoint type
      // (meta=600s, suggestions=30s, listing=60s)
      // Only set Vary so CDN caches per query string correctly
      source: "/api/content",
      headers: [
        {
          key: "Vary",
          value: "Accept-Encoding",
        },
      ],
    },
    {
      source: "/api/content/:slug*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, s-maxage=300, stale-while-revalidate=600",
        },
      ],
    },
  ];
},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "sheatwork.com",              pathname: "/**" },
      { protocol: "http",  hostname: "sheatwork.com",              pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com",        pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com",         pathname: "/**" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com", pathname: "/**" },
      {
      protocol: "https",
      hostname: "i.ytimg.com",
    },
    ],
  },
};

export default nextConfig;