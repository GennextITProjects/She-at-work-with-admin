// NO "use client" — server component, zero JS
import Image from "next/image";
import type { ContentPageConfig } from "./types";

type Props = Pick<
  ContentPageConfig,
  "bannerDesktop" | "bannerMobile" | "bannerAlt" | "bannerTitle" | "bannerSubtitle"
>;

export function ContentBanner({ bannerDesktop, bannerMobile, bannerAlt, bannerTitle, bannerSubtitle }: Props) {
  return (
    <section className="relative h-[480px] md:h-[600px] lg:h-[470px] overflow-hidden pt-24">
      {/* Background images */}
      <div className="absolute inset-0" style={{ top: 96 }}>
        <div className="block lg:hidden relative w-full h-full">
          <Image
            src={bannerMobile}
            alt={bannerAlt}
            fill
            className="object-cover object-center"
            priority
            sizes="(max-width: 1024px) 100vw"
          />
        </div>
        <div className="hidden lg:block relative w-full h-full">
          <Image
            src={bannerDesktop}
            alt={bannerAlt}
            fill
            className="object-cover object-center"
            priority
            sizes="(min-width: 1024px) 100vw"
          />
        </div>
      </div>

      {/* Text overlay — CSS animation only, no framer-motion, no JS */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl px-2 sm:px-6 lg:px-8 -mt-40 lg:mt-0">
            <div className="banner-fade-up">
              <h1 className="text-white leading-tight">
                <span className="block text-3xl sm:text-4xl lg:text-6xl font-bold">
                  {bannerTitle}
                </span>
              </h1>
            </div>
            <p className="banner-fade-up-delay mt-4 sm:mt-6 text-sm sm:text-base md:text-xl text-white/90 leading-relaxed max-w-xl">
              {bannerSubtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/*
  Add to globals.css:

  @keyframes bannerFadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .banner-fade-up {
    animation: bannerFadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .banner-fade-up-delay {
    opacity: 0;
    animation: bannerFadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards;
  }
*/