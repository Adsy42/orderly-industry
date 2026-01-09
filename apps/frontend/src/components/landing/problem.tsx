import { Globe, Building2, Puzzle } from "lucide-react";

const painPoints = [
  {
    icon: Globe,
    title: "US-Centric Platforms",
    description:
      "The leading legal AI platforms were built for US law. Australian Consumer Law, the PPSA, state-specific retail leases—they're afterthoughts.",
  },
  {
    icon: Building2,
    title: "Enterprise-Only Access",
    description:
      "Enterprise pricing and months of onboarding lock out 95% of Australian firms. You shouldn't need a Big Four budget to use AI.",
  },
  {
    icon: Puzzle,
    title: "Fragmented Tools",
    description:
      "Point solutions for drafting, research, automation—none of them integrate. And none of them understand Australian law.",
  },
];

export function Problem() {
  return (
    <section className="dark:bg-midnight bg-zinc-50 py-24 dark:bg-slate-900/50">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-slate-400">
            The Problem
          </h2>
          <p className="font-serif text-3xl leading-tight text-zinc-900 md:text-4xl dark:text-white">
            Australian firms deserve better than what&apos;s out there.
          </p>
        </div>

        {/* Pain Point Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {painPoints.map((point) => (
            <div
              key={point.title}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-slate-700 dark:text-slate-300">
                <point.icon className="h-5 w-5 stroke-[1.5]" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
                {point.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-slate-400">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
