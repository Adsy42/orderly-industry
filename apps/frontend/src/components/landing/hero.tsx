"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { HeroAnimation } from "./hero-animation";
import { WaitlistForm } from "./waitlist-form";
import { Shield } from "lucide-react";

const ANIMATED_PHRASES = [
  "Research Case Law",
  "Draft Contracts",
  "Review Advice",
  "Automate Discovery",
];

const CYCLE_DURATION = 2500;
const TRANSITION_DURATION = 400;

function AnimatedText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedText, setDisplayedText] = useState(ANIMATED_PHRASES[0]);
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined);
  const measureRef = useRef<HTMLSpanElement>(null);

  const measureMaxWidth = useCallback(() => {
    if (!measureRef.current) return;
    let max = 0;
    for (const phrase of ANIMATED_PHRASES) {
      measureRef.current.textContent = phrase;
      max = Math.max(max, measureRef.current.offsetWidth);
    }
    setMaxWidth(max);
  }, []);

  useEffect(() => {
    measureMaxWidth();
    window.addEventListener("resize", measureMaxWidth);
    return () => window.removeEventListener("resize", measureMaxWidth);
  }, [measureMaxWidth]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        const nextIndex = (currentIndex + 1) % ANIMATED_PHRASES.length;
        setCurrentIndex(nextIndex);
        setDisplayedText(ANIMATED_PHRASES[nextIndex]);
        requestAnimationFrame(() => setIsTransitioning(false));
      }, TRANSITION_DURATION);
    }, CYCLE_DURATION);
    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <>
      {/* Hidden measure element */}
      <span
        ref={measureRef}
        className="invisible absolute px-3 font-medium whitespace-nowrap"
        style={{ fontSize: "inherit" }}
        aria-hidden="true"
      />
      {/* Animated text container with black background */}
      <span
        className="relative inline-flex h-[1.4em] items-center justify-center overflow-hidden rounded-md bg-zinc-900 px-3 dark:bg-white"
        style={{ width: maxWidth }}
      >
        <span
          className={`text-center font-medium whitespace-nowrap text-white transition-all duration-400 ease-out dark:text-zinc-900 ${
            isTransitioning
              ? "-translate-y-full opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          {displayedText}
        </span>
      </span>
    </>
  );
}

export function Hero() {
  return (
    <>
      {/* Hero Text Section */}
      <section
        id="waitlist-form"
        className="mx-auto max-w-[1800px] px-6 pt-16 pb-10 text-center md:pt-32 md:pb-16"
      >
        <h1 className="mb-4 font-serif text-3xl leading-[1.15] tracking-tight text-zinc-950 sm:text-4xl md:mb-6 md:text-7xl md:leading-[1.1] dark:text-white">
          Legal AI built for Australian law.
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-zinc-600 md:mb-10 md:text-2xl dark:text-slate-300">
          <AnimatedText /> All grounded in Australian law—and priced for firms
          of every size.
        </p>
        <div className="flex flex-col items-center gap-4">
          <WaitlistForm variant="hero" />
          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-slate-500">
            <Shield className="h-4 w-4" />
            <span>Your data never leaves Australia. Never trains AI.</span>
          </div>
        </div>
      </section>

      {/* Hero Visual Section */}
      <HeroAnimation />
    </>
  );
}
