"use client";
// components/content/ShareBar.tsx
// The ONLY client island on all detail pages.
// "use client" is required purely for window.open + window.location.href.
// All page structure above this component is server-rendered.

import { Button } from "@/components/ui/button";
import { Facebook, Linkedin, Mail, Share2, Twitter } from "lucide-react";

interface ShareBarProps {
  title: string;
  label?: string;
  /** compact = no Share2 icon label, smaller footprint (used at bottom of article) */
  compact?: boolean;
  /** Custom email body prefix — defaults to "Check this out" */
  emailPrefix?: string;
}

function openShare(platform: string, title: string, emailPrefix: string) {
  const url = window.location.href;
  const enc = encodeURIComponent;
  const map: Record<string, string> = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    twitter:  `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
    email:    `mailto:?subject=${enc(title)}&body=${enc(`${emailPrefix}: ${url}`)}`,
  };
  if (platform === "email") { window.location.href = map.email; return; }
  window.open(map[platform], "_blank", "noopener,noreferrer");
}

export function ShareBar({
  title,
  label = "Share this",
  compact = false,
  emailPrefix = "Check this out",
}: ShareBarProps) {
  const platforms = compact
    ? [{ key: "facebook", Icon: Facebook }, { key: "twitter", Icon: Twitter }, { key: "linkedin", Icon: Linkedin }]
    : [{ key: "facebook", Icon: Facebook }, { key: "twitter", Icon: Twitter }, { key: "linkedin", Icon: Linkedin }, { key: "email", Icon: Mail }];

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-secondary/30 rounded-xl">
      {!compact && (
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Share2 className="h-4 w-4 text-muted-foreground" />
          {label}
        </div>
      )}
      {compact && <span className="text-sm font-medium">{label}</span>}
      <div className="flex items-center gap-1">
        {platforms.map(({ key, Icon }) => (
          <Button key={key} variant="ghost" size="sm"
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            onClick={() => openShare(key, title, emailPrefix)}>
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
    </div>
  );
}