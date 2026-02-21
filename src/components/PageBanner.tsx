"use client";

import { ReactNode } from "react";

interface PageBannerProps {
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  children?: ReactNode;
  /** Optional custom height class, defaults to 2/3 of viewport height */
  heightClass?: string;
}

export const PageBanner = ({
  title,
  subtitle,
  description,
  image,
  children,
  heightClass,
}: PageBannerProps) => {
  // Calculate 2/3 of viewport height minus navbar (96px)
  const bannerHeight = heightClass || "h-[470px]";
  
  return (
    <section className={`relative ${bannerHeight} overflow-hidden pt-24`}>
      {/* Background Image */}
      <div className="absolute inset-0" style={{ top: "96px" }}>
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url(${image})`,
            backgroundPosition: "center center",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* Overlay for better text readability */}
        {/* <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" /> */}
      </div>

      {/* Content - Left aligned */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl px-4 sm:px-6 lg:px-8">
            {/* Title */}
            <h1 className="text-white leading-tight">
              <span className="block text-3xl sm:text-4xl lg:text-5xl font-bold sm:font-bold ">
                {title}
              </span>
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <h2 className="mt-3 sm:mt-4 text-lg sm:text-2xl lg:text-3xl text-white/90 font-semibold">
                {subtitle}
              </h2>
            )}

            {/* Description */}
            {description && (
              <p className="mt-4 sm:mt-6 text-md sm:text-base md:text-xl text-white/90 leading-relaxed max-w-3xl">
                {description}
              </p>
            )}

            {/* Custom content (e.g., buttons, filters, etc.) */}
            {children && (
              <div className="mt-6 sm:mt-8">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};