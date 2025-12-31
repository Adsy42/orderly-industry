import Link from "next/link";
import { HeroAnimation } from "./hero-animation";

export function Hero() {
  return (
    <>
      {/* Hero Text Section */}
      <section className="mx-auto max-w-[1800px] px-6 pt-20 pb-12 text-center md:pt-32 md:pb-16">
        <h1 className="mb-6 font-serif text-5xl leading-[1.1] tracking-tight text-zinc-950 md:text-7xl dark:text-white">
          Legal AI built for Australian law.
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed font-light text-zinc-600 md:text-2xl dark:text-slate-300">
          Contract review and legal analysis designed for Australian practice.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/auth/sign-up"
            className="dark:text-midnight rounded-full bg-zinc-900 px-8 py-4 text-lg font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:hover:bg-blue-50"
          >
            Try it free on a contract
          </Link>
          <p className="text-sm text-zinc-500 dark:text-slate-500">
            No credit card. No sales call.
          </p>
        </div>
      </section>

      {/* Hero Visual Section */}
      <HeroAnimation />
    </>
  );
}
