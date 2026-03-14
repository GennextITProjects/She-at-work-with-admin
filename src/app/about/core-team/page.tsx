// app/about/core-team/page.tsx
// NO "use client" — Server Component.
// CoreTeamPage stays "use client" (needs useSearchParams, useRef, useState for
// scroll-to-member and expand/collapse). It renders as a client island here.

import type { Metadata } from "next";
import { Navbar } from "@/components/navbar/Navbar";

import { Suspense } from "react";
import CoreTeamPage from "@/components/about/Coreteam";

export const metadata: Metadata = {
  title: "Core Team | She At Work",
  description:
    "Meet the passionate individuals and advisors who drive our mission to empower women entrepreneurs through knowledge, community, and innovation.",
  openGraph: {
    title: "Our Core Team | She At Work",
    description:
      "Meet the passionate individuals and advisors behind She At Work.",
  },
};

export default function CoreTeam() {
  return (
    <>
      <Navbar />
      {/*
        Suspense is required here because CoreTeamPage calls useSearchParams()
        internally. Next.js requires any component using useSearchParams to be
        wrapped in a Suspense boundary when used inside a server component page.
        Without this, the build will warn or throw.
      */}
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <CoreTeamPage />
      </Suspense>
    </>
  );
}