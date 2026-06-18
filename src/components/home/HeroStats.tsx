// components/home/HeroStats.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import type { SiteSettingRow } from "@/lib/db/site-settings";

const AnimatedNumber = ({ 
  target, 
  suffix, 
  startAnimation,
  reset 
}: { 
  target: number; 
  suffix: string; 
  startAnimation: boolean;
  reset: boolean;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startAnimation || target === 0) return;

    const start = 0;
    const duration = 1800;
    const startTime = performance.now();

    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const value = Math.floor(start + (target - start) * progress);
      setCount(value);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [startAnimation, target, reset]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
};

function parseStats(data: SiteSettingRow[]) {
  return data
    .filter((s) => !s.key.endsWith("_suffix"))
    .map((s) => ({
      value: Number(s.value),
      suffix: data.find((x) => x.key === `${s.key}_suffix`)?.value ?? "+",
      label: s.label.replace(" Count", ""),
    }));
}

export const HeroStats = ({ data }: { data: SiteSettingRow[] }) => {
  const sectionRef = useRef(null);
  const [startAnimation, setStartAnimation] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  const stats = parseStats(data);

  const isInView = useInView(sectionRef, { 
    amount: 0.4,
    margin: "0px 0px -100px 0px"
  });

  // Trigger animation when visible - and reset when not visible
  useEffect(() => {
    if (isInView && !startAnimation) {
      setStartAnimation(true);
      setAnimationKey(prev => prev + 1);
    } else if (!isInView && startAnimation) {
      setStartAnimation(false);
    }
  }, [isInView, startAnimation]);

  // Mobile slide logic
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % stats.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="border-t border-border bg-background"
      key={animationKey}
    >
      <div className="mx-auto max-w-screen-xl px-5 py-10 sm:py-14">

        {/* MOBILE */}
        <div className="sm:hidden flex justify-center items-center h-[120px] relative overflow-hidden">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`absolute flex flex-col items-center text-center
                transition-all duration-500 ease-in-out
                ${
                  index === activeIndex
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-6 pointer-events-none"
                }
              `}
            >
              <div className="text-4xl font-bold tracking-tight">
                <AnimatedNumber
                  target={stat.value}
                  suffix={stat.suffix}
                  startAnimation={startAnimation}
                  reset={!isInView}
                />
              </div>
              <span className="mt-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* DESKTOP */}
        <div className="hidden sm:grid grid-cols-4 gap-1 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="text-3xl lg:text-5xl font-medium tracking-tight">
                <AnimatedNumber
                  target={stat.value}
                  suffix={stat.suffix}
                  startAnimation={startAnimation}
                  reset={!isInView}
                />
              </div>
              <span className="mt-3 text-base font-medium text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};