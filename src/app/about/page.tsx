// app/about/page.tsx
// NO "use client" — Server Component.
// Previously delegated to AboutPage which was fully "use client".
// Now: Navbar + metadata on server, AboutPage renders as client island.

import type { Metadata } from "next";
import { Navbar } from "@/components/navbar/Navbar";
import AboutPage from "@/components/about/AboutPage";

export const metadata: Metadata = {
  title: "About Us | She At Work",
  description:
    "Learn about She At Work — empowering women entrepreneurs globally since 2017 through knowledge, community, and innovation.",
  openGraph: {
    title: "About She At Work",
    description:
      "A dynamic one-stop knowledge hub dedicated to amplifying the voices, achievements, and insights of women entrepreneurs globally.",
    images: ["/aboutus/finalAboutusbanner.png"],
  },
};

export default function About() {
  return (
    <>
      <Navbar />
      <AboutPage />
    </>
  );
}