// NO "use client" — this is a Server Component
import { Navbar } from "@/components/navbar/Navbar";

import Cta from "@/components/common/Cta";
import { pressConfig } from "@/lib/pageConfigs";
import type { BaseApiResponse } from "@/components/content/types";
import { ContentBanner, ContentGridClient, FeaturedSection, fetchInitialContent } from "@/components/content";

// ISR: page HTML rebuilt every 60 seconds in the background.
export const revalidate = 60;

export const metadata = {
  title:       "Press & Media Coverage | She At Work",
  description: "Read the latest press releases, media features, and coverage about She At Work and the women entrepreneurs we support.",
};

export default async function PressPage() {
  const data = (await fetchInitialContent("PRESS", 12)) as BaseApiResponse | null;

  const items      = data?.items      ?? [];
  const featured   = items[0]         ?? null;
  const headlines  = items.slice(0, 4);
  const categories = data?.categories ?? [];
  const buckets    = data?.readingTimes ?? [];

  return (
    <main className="bg-background min-h-screen">
      <Navbar />

      {/* ── Server-rendered, zero JS ──────────────────────────────────── */}
      <ContentBanner
        bannerDesktop={pressConfig.bannerDesktop}
        bannerMobile={pressConfig.bannerMobile}
        bannerAlt={pressConfig.bannerAlt}
        bannerTitle={pressConfig.bannerTitle}
        bannerSubtitle={pressConfig.bannerSubtitle}
      />

      <FeaturedSection
        featuredItem={featured}
        latestItems={headlines}
        config={pressConfig}
        gridSectionId={pressConfig.gridSectionId}
      />

      {/* ── Client island: only filters + grid are interactive ───────── */}
      <ContentGridClient
        config={pressConfig}
        initialItems={items}
        initialTotal={data?.totalItems ?? 0}
        initialPages={data?.totalPages ?? 1}
        categories={categories}
        readingTimeBuckets={buckets}
      />

      <Cta />
    </main>
  );
}