import { ClauseFinderCTA } from "@/components/landing/clause-finder-cta";
import { Comparison } from "@/components/landing/comparison";
import { FAQ } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { Pillars } from "@/components/landing/pillars";
import { SocialProof } from "@/components/landing/social-proof";

export default function LandingPage() {
  return (
    <div className="animate-intro dark:bg-midnight min-h-screen w-full bg-white">
      <Navbar />
      <main>
        <Hero />
        <Pillars />
        <Comparison />
        <Features />
        <ClauseFinderCTA />
        <SocialProof />
        <FAQ />
        {/* Final CTA Section */}
        <section className="dark:bg-midnight border-t border-zinc-100 bg-white py-24 text-center dark:border-slate-800/30">
          <div className="mx-auto max-w-2xl px-6">
            <h2 className="mb-4 font-serif text-3xl leading-tight tracking-tight text-zinc-950 md:text-4xl dark:text-white">
              The legal AI platform Australian firms have been waiting for.
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-lg text-zinc-600 dark:text-slate-400">
              Sign up free and start analysing contracts in minutes.
            </p>
            <a
              href="/auth/sign-up"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-blue-50"
            >
              Create your free account
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
