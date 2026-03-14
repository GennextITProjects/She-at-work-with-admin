// app/page.tsx
// NO "use client" — Server Component.
//
// Previously this was "use client" purely because it imported client components.
// That's wrong — a server component CAN import client components (they render as islands).
// Removing "use client" here means:
//   ✅ Page shell is server-rendered (Navbar, layout structure)
//   ✅ Each section hydrates independently as a client island
//   ✅ No unnecessary JS sent for the page wrapper itself
//   ✅ generateMetadata works properly (requires server component)

import type { Metadata } from "next";
import { Navbar } from "@/components/navbar/Navbar";
import { HeroSection } from "@/components/home/HeroSection";
import { HeroStats } from "@/components/home/HeroStats";
import { About } from "@/components/home/About";
import FeaturedStories from "@/components/home/FeaturedNews";
import { Categories } from "@/components/home/Categories";
import { LatestBlogs } from "@/components/home/LatestBlogs";
import Cta from "@/components/common/Cta";

export const metadata: Metadata = {
  title: "She At Work — Empowering Women Entrepreneurs",
  description:
    "A dynamic knowledge hub dedicated to amplifying the voices, achievements, and insights of women entrepreneurs globally.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      <HeroSection />
      <HeroStats />
      <About />
      <FeaturedStories />
      <Categories />
      <LatestBlogs />
      <Cta />
    </div>
  );
}