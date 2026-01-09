"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Note: Link still used for logo

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 w-full border-b backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? "dark:bg-midnight/95 border-zinc-200/50 bg-white/95 shadow-sm dark:border-slate-800/50"
          : "dark:bg-midnight/80 border-transparent bg-white/80 dark:border-slate-800/50"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-[1800px] items-center justify-between px-4 transition-all duration-300 md:px-12 ${
          scrolled ? "py-3 md:py-4" : "py-4 md:py-6"
        }`}
      >
        {/* Logo - Left on mobile, centered on desktop */}
        <div className="flex items-center md:flex-1">
          <Link
            href="/"
            className="group flex items-center gap-2 md:gap-3"
          >
            <div
              className={`relative text-zinc-950 transition-all duration-300 dark:text-blue-400 ${
                scrolled ? "h-8 w-8 md:h-10 md:w-10" : "h-9 w-9 md:h-12 md:w-12"
              }`}
            >
              <svg
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full stroke-current stroke-2"
              >
                <path
                  d="M12 10C12 10 16 8 18 12C20 16 16 20 16 24C16 28 20 30 22 30"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M10 14C10 14 8 12 8 10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M24 26C24 26 26 28 26 30"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M18 12C18 12 22 10 22 14C22 18 18 20 18 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-50"
                ></path>
              </svg>
            </div>
            <span
              className={`font-sans font-medium tracking-tight text-zinc-950 transition-all duration-300 dark:text-white ${
                scrolled ? "text-lg md:text-xl" : "text-xl md:text-2xl"
              }`}
            >
              Orderly
            </span>
          </Link>
        </div>

        {/* Spacer - Only on desktop for centering */}
        <div className="hidden md:flex md:flex-1"></div>

        {/* Right side buttons */}
        <div className="flex items-center gap-3 md:flex-1 md:justify-end md:gap-6">
          <button
            onClick={() => {
              document
                .getElementById("waitlist-form")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="dark:text-midnight rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 md:px-4 md:py-2 md:text-base dark:bg-white dark:hover:bg-blue-50"
          >
            Join Waitlist
          </button>
        </div>
      </div>
    </nav>
  );
}
