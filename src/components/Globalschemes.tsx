// components/GlobalschemeComponent.tsx
"use client";

import { globalSchema } from "@/data/globalschema";
import { motion, Variants } from "framer-motion";
import { ChevronDown, ExternalLink, Globe } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import Cta from "./common/Cta";
import { MultiSelectDropdown } from "./common/MultiSelectDropdown";


// ---------------- TYPES ---------------- //

type Scheme = {
  id: number;
  title: string;
  description: string;
  link: string;
};

type CountrySchema = {
  country: string;
  data: Scheme[];
};

// -------------------------------------- //

export default function GlobalschemeComponent() {
  const countries: CountrySchema[] = globalSchema.countries;

  // Multi-select countries - default to first country
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    countries[0]?.country ? [countries[0].country] : []
  );

  // Track which scheme is expanded (null means none)
  const [expandedScheme, setExpandedScheme] = useState<number | null>(null);
  // Track hover state for cards
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // Get all schemes from selected countries (combine and deduplicate)
  const currentSchemes = selectedCountries.length === 0
    ? []
    : selectedCountries
        .flatMap((countryName) => {
          const country = countries.find((c) => c.country === countryName);
          return country?.data || [];
        })
        .filter((scheme, index, self) => 
          index === self.findIndex(s => s.id === scheme.id)
        );

  // Toggle accordion
  const toggleScheme = (schemeId: number) => {
    setExpandedScheme(expandedScheme === schemeId ? null : schemeId);
  };

  // Helper to truncate description to 1-2 lines (approximately 100 characters)
  const getTruncatedDescription = (description: string) => {
    const maxLength = 100;
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength).trim() + "...";
  };

    const bannerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
  };
  const bannerSubtitleVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] } },
  };
  return (
    <main className="bg-background min-h-screen flex flex-col">
   
         <section className="relative h-[480px] md:h-[600px] lg:h-[470px] overflow-hidden pt-24">
              <div className="absolute inset-0" style={{ top: 96 }}>
                <div className="block lg:hidden relative w-full h-full">
                  <Image
                    src="/gettingstarted/Mobile Getting Started.png"
                    alt="News Banner"
                    fill
                    className="object-cover object-center"
                    priority
                    sizes="(max-width: 1024px) 100vw"
                  />
                </div>
                <div className="hidden lg:block relative w-full h-full">
                  <Image
                    src="/gettingstarted/finalGettingstartedbanner.png"
                    alt="News Banner"
                    fill
                    className="object-cover object-center"
                    priority
                    sizes="(min-width: 1024px) 100vw"
                  />
                </div>
              </div>
      
              {/* ✅ Text Centered Inside Gradient */}
              <div className="relative z-10 h-full flex items-center">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="max-w-3xl px-2 sm:px-6 lg:px-8 -mt-40 lg:mt-0">
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={bannerVariants}
                    >
                      <h1 className="text-white leading-tight">
                        <span className="block text-3xl sm:text-4xl lg:text-6xl font-bold">
                        Government Schemes India
                        </span>
                      </h1>
                    </motion.div>
      
                    <motion.p
                      initial="hidden"
                      animate="visible"
                      variants={bannerSubtitleVariants}
                      className="mt-4 sm:mt-6 text-sm sm:text-base md:text-xl text-white/90 leading-relaxed max-w-xl"
                    >
                    Check out options in the country that can set you up as an independent entrepreneur…your journey starts now!
                    </motion.p>
                  </div>
                </div>
              </div>
            </section>

      {/* ================= MAIN CONTENT ================= */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-secondary/10">
        <div className="max-w-screen-xl mx-auto">
          {/* Header + Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
                Women Entrepreneurship Schemes
              </h2>
              <p className="text-muted-foreground max-w-3xl">
                Discover government and institutional support available for women-led businesses
                {selectedCountries.length > 0
                  ? ` in ${selectedCountries.join(", ")}`
                  : ". Explore opportunities worldwide!"}
              </p>
            </div>

            {/* Multi-Select Dropdown */}
            <div className="w-full sm:w-80">
              <MultiSelectDropdown
                label="Countries"
                icon={<Globe className="h-4 w-4" />}
                options={countries.map((c) => c.country)}
                selectedValues={selectedCountries}
                onChange={(values) => {
                  setSelectedCountries(values);
                  setExpandedScheme(null); // Reset expanded state when countries change
                }}
                placeholder="Select countries"
                allOptionLabel="All Countries"
              />
            </div>
          </div>

          {/* Schemes Accordion List */}
          {currentSchemes.length > 0 ? (
            <div className="space-y-4">
              {currentSchemes.map((scheme) => {
                const isExpanded = expandedScheme === scheme.id;
                const isHovered = hoveredCard === scheme.id;

                return (
                  <div
                    key={scheme.id}
                    onMouseEnter={() => setHoveredCard(scheme.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className={`bg-card rounded-xl overflow-hidden shadow-md transition-all duration-300 border
                               ${isHovered || isExpanded
                                 ? "shadow-2xl border-primary/50 scale-[1.02] -translate-y-1"
                                 : "border-border shadow-md hover:shadow-lg"
                               }`}
                    style={{
                      transformOrigin: "center",
                    }}
                  >
                    {/* Header - Always Visible */}
                    <button
                      onClick={() => toggleScheme(scheme.id)}
                      className={`w-full px-6 py-5 flex items-start justify-between gap-4 text-left 
                                 transition-all duration-300 ${
                                   isHovered || isExpanded
                                     ? "bg-gradient-to-r from-primary/5 to-primary/10"
                                     : "hover:bg-secondary/5"
                                 }`}
                    >
                      <div className="flex-1">
                        <h3
                          className={`text-lg sm:text-xl font-display font-bold mb-2 
                                     transition-all duration-300 ${
                                       isHovered || isExpanded
                                         ? "text-primary scale-[1.02]"
                                         : "text-foreground"
                                     }`}
                        >
                          {scheme.title}
                        </h3>
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                          {isExpanded ? scheme.description : getTruncatedDescription(scheme.description)}
                        </p>
                      </div>

                      {/* Icons */}
                      <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                        {/* Learn More Icon - only show if link exists */}
                        {scheme.link && scheme.link.trim() !== "" && (
                          <a
                            href={scheme.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} // Prevent accordion toggle when clicking link
                            className={`p-1.5 rounded-lg transition-all duration-300 group/link ${
                              isHovered
                                ? "bg-primary/20 scale-110 rotate-12"
                                : "hover:bg-primary/10 hover:scale-110"
                            }`}
                            title="Learn More"
                          >
                            <ExternalLink
                              className={`h-5 w-5 transition-colors ${
                                isHovered ? "text-primary" : "text-primary group-hover/link:text-primary/80"
                              }`}
                            />
                          </a>
                        )}

                        {/* Chevron Icon */}
                        <ChevronDown
                          className={`h-5 w-5 text-primary transition-all duration-300 ${
                            isExpanded ? "rotate-180" : ""
                          } ${isHovered ? "scale-125" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Expanded Content - Learn More Link */}
                    {isExpanded && scheme.link && scheme.link.trim() !== "" && (
                      <div
                        className="px-6 pb-5 pt-2 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300"
                      >
                        <a
                          href={scheme.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary font-medium 
                                     hover:text-primary/80 transition-all hover:gap-3 hover:translate-x-1"
                        >
                          Learn More →
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <p className="text-lg text-muted-foreground">
                No schemes listed yet for {selectedCountries.length === 0 ? "any country" : "the selected countries"}.
              </p>
              <p className="text-sm mt-2 text-muted-foreground/80">
                Data will be updated soon.
              </p>
            </div>
          )}
        </div>
      </section>

      <Cta />
    </main>
  );
}