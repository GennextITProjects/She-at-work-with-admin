// app/contact/page.tsx
// NO "use client" — Server Component.
// ContactPage stays "use client" (useState for form, FAQ accordion, loading/success/error).

import type { Metadata } from "next";
import { Navbar } from "@/components/navbar/Navbar";
import ContactPage from "@/components/contactPage/Contact";

export const metadata: Metadata = {
  title: "Contact Us | She At Work",
  description:
    "Get in touch with She At Work. Have questions, want to collaborate, or explore partnerships? We'd love to hear from you.",
  openGraph: {
    title: "Contact She At Work",
    description: "Have questions or want to collaborate? We'd love to hear from you.",
    images: ["/contactus/FinalContactusbanner.png"],
  },
};

export default function Contact() {
  return (
    <>
      <Navbar />
      <ContactPage />
    </>
  );
}