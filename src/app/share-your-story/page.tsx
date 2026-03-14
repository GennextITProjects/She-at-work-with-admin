// app/share-your-story/page.tsx
// NO "use client" — Server Component.
// ShareYourStory stays "use client" (useState for form/captcha/success/error,
// useRef + useEffect for auto-scroll-to-form on load).

import type { Metadata } from "next";
import { Navbar } from "@/components/navbar/Navbar";
import ShareYourStory from "@/components/share-your-story/Shareyourstory";

export const metadata: Metadata = {
  title: "Share Your Story | She At Work",
  description:
    "Share your entrepreneurial journey with She At Work's community of 975+ published stories. Inspire the next generation of women entrepreneurs.",
  openGraph: {
    title: "Share Your Story | She At Work",
    description:
      "Your story has the power to inspire the next generation of women entrepreneurs. Join our community and make your voice heard.",
    images: ["/shareyourstory/finalshareyourstorybanner.png"],
  },
};

export default function ShareyourStory() {
  return (
    <>
      <Navbar />
      <ShareYourStory />
    </>
  );
}