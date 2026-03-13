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
export const revalidate = 600;

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