// NO "use client" — Server Component
// Replaces the old global-schemes/page.tsx (or GlobalScheme route).
// GlobalschemeComponent is kept as-is; this page provides the server
// entry point with metadata and ISR caching.
import { Navbar } from "@/components/navbar/Navbar";
import GlobalschemeComponent from "@/components/Globalschemes";

// Government scheme data changes infrequently — cache for 10 minutes.
export const revalidate = 600;

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