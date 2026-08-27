// NO "use client" — Server Component
// Replaces the old getting-started/page.tsx which was a client-only wrapper.
// Gettingstartedcomponent is kept as-is; this page just provides the
// correct server entry point with metadata, ISR, and proper layout.
import { Navbar } from "@/components/navbar/Navbar";
import Gettingstartedcomponent from "@/components/Gettingstarted";

// Static content — revalidate every 10 minutes.
// If this page is fully static (no DB data), use:
//   export const dynamic = "force-static";
// instead.
// NEON CU: a daily backstop, not the update mechanism.
//
// Content edits reach this page instantly via revalidateContent() in
// lib/revalidate.ts. This TTL only exists so an out-of-band database change
// (a manual SQL edit, a restored backup) cannot pin a stale page forever.
// There are ~10 listing routes in total, so this costs ~10 DB queries per day
// — far inside Neon's 5-minute suspend window. It was 1800s, which meant every
// listing regenerated 48x/day per edge region and kept the compute awake.
export const revalidate = 86400;

export const metadata = {
  title:       "Getting Started | She At Work",
  description: "Your guide to starting, launching, and growing your business as a woman entrepreneur. Resources, tools, and step-by-step guidance to help you take the first step.",
};

export default function GettingStartedPage() {
  return (
    <>
      <Navbar />
      <Gettingstartedcomponent />
    </>
  );
}