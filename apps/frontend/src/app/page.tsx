import { Comparison } from "@/components/landing/comparison";
import { FAQ } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { Pillars } from "@/components/landing/pillars";
import { SocialProof } from "@/components/landing/social-proof";
import { WaitlistForm } from "@/components/landing/waitlist-form";

export default function LandingPage() {
  return (
    <div className="animate-intro dark:bg-midnight min-h-screen w-full bg-white">
      <Navbar />
      <main>
        <Hero />
        <Pillars />
        <Comparison />
        <Features />
        <SocialProof />
        <FAQ />
        {/* Final CTA Section */}
        <section className="dark:bg-midnight border-t border-zinc-100 bg-white py-24 text-center dark:border-slate-800/30">
          <div className="mx-auto max-w-2xl px-6">
            <h2 className="mb-4 font-serif text-3xl leading-tight tracking-tight text-zinc-950 md:text-4xl dark:text-white">
              Be first in line for the legal AI platform Australian firms have
              been waiting for.
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-lg text-zinc-600 dark:text-slate-400">
              Join the waitlist for early access—and the pricing that comes with
              it.
            </p>
            <WaitlistForm variant="footer" />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
