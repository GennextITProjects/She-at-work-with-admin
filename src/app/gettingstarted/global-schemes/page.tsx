// NO "use client" — Server Component
// Replaces the old global-schemes/page.tsx (or GlobalScheme route).
// GlobalschemeComponent is kept as-is; this page provides the server
// entry point with metadata and ISR caching.
import { Navbar } from "@/components/navbar/Navbar";
import GlobalschemeComponent from "@/components/Globalschemes";

// Government scheme data changes infrequently — cache for 10 minutes.
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
  title:       "Global Schemes & Government Programmes | She At Work",
  description: "Explore global government schemes, grants, and support programmes available to women entrepreneurs. Find funding, mentorship, and resources from around the world.",
};

export default function GlobalSchemePage() {
  return (
    <>
      <Navbar />
      <GlobalschemeComponent />
    </>
  );
}