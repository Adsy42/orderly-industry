import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";

export function ClauseFinderCTA() {
  return (
    <section className="dark:bg-midnight border-t border-zinc-100 bg-white py-24 dark:border-slate-800/30">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
          <Search className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="mb-4 font-serif text-3xl leading-tight tracking-tight text-zinc-950 md:text-4xl dark:text-white">
          Try our Clause Finder—free.
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-600 dark:text-slate-400">
          Upload a contract and instantly identify key clauses, risks, and
          obligations under Australian law. No credit card required.
        </p>
        <Link
          href="/auth/sign-up?next=/protected/iql-analyzer"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
        >
          Get started free
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-4 text-sm text-zinc-500 dark:text-slate-500">
          Sign up in 30 seconds. Start analysing contracts immediately.
        </p>
      </div>
    </section>
  );
}
