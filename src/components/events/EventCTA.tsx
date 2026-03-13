"use client";
// components/events/EventCTA.tsx
// Tiny client island — the ONLY reason this needs "use client" is that
// openEventRegistrationEmail() calls window.location.href internally.
// Everything else on the events detail page is server-rendered.

import { Button } from "@/components/ui/button";
import { openEventRegistrationEmail } from "@/hooks/Emailutils";
import { Mail } from "lucide-react";

interface EventCTAProps {
  title: string;
  date: string;
  location: string;
  format: string;
  price: string;
  category: string;
}

export function EventCTA({ title, date, location, format, price, category }: EventCTAProps) {
  return (
    <div className="mt-12 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-display font-bold text-foreground mb-2">Interested in this event?</h3>
          <p className="text-foreground/80">Get in touch with us to know more or to register your interest.</p>
        </div>
        <Button
          onClick={() => openEventRegistrationEmail({ title, date, time: undefined, location, format, price, category })}
          className="bg-accent text-white font-semibold gap-2 whitespace-nowrap"
        >
          <Mail className="h-4 w-4" />
          Contact via Email
        </Button>
      </div>
    </div>
  );
}