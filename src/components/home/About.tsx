// components/home/About.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Heart, Lightbulb, Target, Users } from "lucide-react";
import Link from "next/link";
import { easeOut, motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

const values = [
  {
    icon: Heart,
    title: "Empowerment",
    description:
      `We believe in uplifting women by providing a "storehouse of information"—from government schemes to funding avenues—that unlocks their potential to succeed.`,
  },
  {
    icon: Users,
    title: "Community",
    description:
      "We cultivate an ecosystem where women entrepreneurs connect to exchange best practices, share experiences, and widen their opportunities together.",
  },
  {
    icon: Target,
    title: "Impact",
    description:
      "We are committed to driving positive change, offering mentorship programs to support rural enterprises and amplify women's voices in the business landscape.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "We embrace forward-thinking approaches, keeping our community updated with the latest industry trends, digital skills, and creative business solutions.",
  },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.13 },
  },
};

const item = {
  hidden: { opacity: 0, y: 36 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut },
  },
};

export const About = () => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.1 });

  useEffect(() => {
    controls.start(isInView ? "show" : "hidden");
  }, [controls, isInView]);

  return (
    <section
      ref={ref}
      className="
        bg-secondary
        py-12 px-4
        sm:py-16 sm:px-8
        md:py-20 md:px-12
        lg:py-24 lg:px-16
        xl:px-20
      "
    >
      <div className="mx-auto max-w-screen-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ── LEFT: Text Content ─────────────────────────────────── */}
          <motion.div
            variants={container}
            initial="hidden"
            animate={controls}
            className="flex flex-col"
          >
            {/* Badge */}
            <motion.span
              variants={item}
              className="
                self-start
                inline-block px-3 py-1 sm:px-4 sm:py-1.5
                rounded-md bg-[#3B2E7E] text-white
                text-xs sm:text-sm font-medium
                mb-3 sm:mb-4
              "
            >
              About She At Work
            </motion.span>

            {/* Heading */}
            <motion.h2
              variants={item}
              className="
                text-2xl sm:text-3xl md:text-4xl
                font-display font-bold text-foreground
                mb-4 sm:mb-5
                leading-tight
              "
            >
              Championing Women&apos;s Voices in Business Since 2017
            </motion.h2>

            {/* Primary paragraph */}
            <motion.p
              variants={item}
              className="
                text-sm sm:text-base md:text-lg
                text-muted-foreground
                mb-3 sm:mb-4
                leading-relaxed
              "
            >
              SheAtWork.com germinated with a singular objective: to support women who are
              looking to start an entrepreneurial venture that aligns with their abilities
              and skills. Launched in January 2017, our aim is to educate, train, support,
              and motivate women entrepreneurs globally.
            </motion.p>

            {/* Secondary paragraph */}
            <motion.p
              variants={item}
              className="
                text-xs sm:text-sm md:text-base
                text-muted-foreground
                mb-6 sm:mb-8
                leading-relaxed
              "
            >
              We provide a storehouse of information to increase awareness on all relevant
              areas of entrepreneurship—from innovative business ideas and startup funding
              avenues to legal support and mentor connections.
            </motion.p>

            {/* CTA */}
            <motion.div variants={item}>
              <Link href="/about">
                <Button
                  className="
                    text-[#3B2E7E] font-semibold
                    bg-transparent border-2 border-white
                    text-sm sm:text-base
                    w-full xs:w-auto
                    px-6 py-2.5
                    hover:bg-white/10 transition-colors duration-200
                  "
                >
                  Learn More About Us
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* ── RIGHT: Values Grid ──────────────────────────────────── */}
          <motion.div
            variants={container}
            initial="hidden"
            animate={controls}
            className="
              grid grid-cols-2
              gap-3 sm:gap-4 lg:gap-5
              mt-2 lg:mt-0
            "
          >
            {values.map((value) => (
              <motion.div
                key={value.title}
                variants={item}
                className="
                  group
                  flex flex-col
                  p-4 sm:p-5 lg:p-6
                  rounded-xl sm:rounded-2xl
                  bg-card border border-border/50
                  transition-all duration-300 ease-out
                  hover:-translate-y-1.5
                  hover:shadow-xl
                  hover:border-[#3B2E7E]/30
                  cursor-default
                "
              >
                {/* Icon */}
                <div
                  className="
                    inline-flex items-center justify-center
                    w-9 h-9 sm:w-11 sm:h-11
                    rounded-lg sm:rounded-xl
                    bg-[#e0bba8]/20 text-[#e0bba8]
                    mb-3 sm:mb-4
                    transition-all duration-300
                    group-hover:scale-110 group-hover:rotate-3
                    shrink-0
                  "
                >
                  <value.icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </div>

                {/* Title */}
                <h3
                  className="
                    text-sm sm:text-base lg:text-lg
                    font-display font-bold
                    mb-1 sm:mb-2
                    leading-snug
                    group-hover:text-[#3B2E7E] transition-colors duration-300
                  "
                >
                  {value.title}
                </h3>

                {/* Description — hidden on xs, visible sm+ */}
                <p
                  className="
                    hidden sm:block
                    text-xs sm:text-sm lg:text-sm
                    text-muted-foreground leading-relaxed
                  "
                >
                  {value.description}
                </p>

                {/* Ultra-compact description for xs only (1–2 lines) */}
                <p className="sm:hidden text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
};