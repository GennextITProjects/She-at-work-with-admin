// app/not-found.tsx
// ─────────────────────────────────────────────────────────────────────────────
// A real 404. This was previously a client component that ran
// `router.replace("/")` on mount, which caused two problems visible in the
// access logs:
//
//   1. Every 404 cost TWO requests — the not-found render, then a full home page
//      load one to two seconds later. With dead WordPress permalinks making up
//      ~36% of traffic, that was a large share of all invocations.
//
//   2. Search engines saw ~1900 indexed URLs "soft-404" into the home page
//      instead of returning a status they could act on, so crawlers kept
//      re-checking them indefinitely and no ranking signal was ever released.
//
// Genuine old article URLs are now recovered by app/[legacySlug]/page.tsx, which
// redirects them to their real location. Anything reaching this page really does
// not exist, and says so — statically, with no JavaScript and no second request.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar/Navbar";

export const metadata: Metadata = {
  title: "Page not found | She At Work",
  // Keep 404s out of the index even if one is ever linked.
  robots: { index: false, follow: true },
};

const SUGGESTIONS = [
  { href: "/", label: "Home" },
  { href: "/blogs", label: "Blogs" },
  { href: "/news", label: "News" },
  { href: "/entrechat", label: "EntreChat" },
  { href: "/events", label: "Events" },
  { href: "/about/press-room", label: "Press Room" },
];

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen items-center justify-center bg-background px-4 pt-28 pb-16">
        <div className="w-full max-w-xl text-center">
          <p className="font-heading text-6xl font-bold text-primary sm:text-7xl">
            404
          </p>

          <h1 className="mt-4 font-heading text-2xl font-bold text-foreground sm:text-3xl">
            We couldn&apos;t find that page
          </h1>

          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            The link may be out of date, or the page may have moved. Try one of
            these instead:
          </p>

          <nav
            aria-label="Suggested pages"
            className="mt-8 flex flex-wrap justify-center gap-2"
          >
            {SUGGESTIONS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </main>
    </>
  );
}
