import Link from "next/link";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";

export default function LandingPage() {
  return (
    <div className="animate-intro dark:bg-midnight min-h-screen w-full bg-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
        {/* CTA Section */}
        <section className="dark:bg-midnight border-t border-zinc-100 bg-white py-24 text-center dark:border-slate-800/30">
          <div className="mx-auto max-w-2xl px-6">
            <h2 className="mb-8 font-serif text-3xl tracking-tight text-zinc-950 md:text-5xl dark:text-white">
              See it work on a real Australian contract.
            </h2>
            <div className="flex flex-col items-center gap-4">
              <Link
                href="/auth/sign-up"
                className="dark:text-midnight rounded-full bg-zinc-900 px-8 py-4 text-lg font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:hover:bg-blue-50"
              >
                Try it free now
              </Link>
              <p className="text-sm text-zinc-500 dark:text-slate-500">
                No credit card. No obligation.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
