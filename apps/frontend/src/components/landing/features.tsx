import {
  BookOpen,
  FolderKanban,
  GitBranch,
  Library,
  Puzzle,
  Scale,
} from "lucide-react";

const features = [
  {
    icon: Scale,
    title: "Counsel",
    subtitle: "Confident analysis and drafting under Australian law.",
    description:
      "Review contracts and draft clauses using AI grounded in Australian statutes and practice.",
    badge: null,
  },
  {
    icon: Library,
    title: "Research",
    subtitle: "Answers backed by Australian legal authority.",
    description:
      "Reach defensible conclusions faster with cited legislation and case law.",
    badge: "Coming Soon",
  },
  {
    icon: FolderKanban,
    title: "Workspace",
    subtitle: "Documents and matters, review-ready at scale.",
    description:
      "Work securely across single agreements or high-volume Australian matters.",
    badge: "Coming Soon",
  },
  {
    icon: GitBranch,
    title: "Workflows",
    subtitle: "Consistent outcomes for repeatable legal work.",
    description:
      "Standardise common tasks so every review follows the same process.",
    badge: "Coming Soon",
  },
  {
    icon: Puzzle,
    title: "Integrations",
    subtitle: "AI where Australian lawyers already work.",
    description:
      "Use AI inside familiar document workflows without disruption.",
    badge: "Coming Soon",
  },
  {
    icon: BookOpen,
    title: "Playbooks",
    subtitle: "Firm-wide standards, built once and reused.",
    description:
      "Capture proven approaches so quality stays consistent across matters.",
    badge: "Coming Soon",
  },
];

export function Features() {
  return (
    <>
      {/* Trusted By Section */}
      <section className="dark:bg-midnight border-b border-zinc-100 bg-zinc-50 py-24 dark:border-slate-800/30">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-serif text-2xl leading-relaxed text-zinc-800 antialiased md:text-3xl dark:text-slate-200">
            “Everything you need for faster, safer legal work — without
            enterprise lock-in.”
          </p>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="mx-auto max-w-[1600px] px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-slate-400">
            Platform capabilities
          </h2>
          <p className="font-serif text-3xl leading-tight text-zinc-900 md:text-4xl dark:text-white">
            Built for Australian firms, from day one.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl p-6 transition-colors hover:bg-zinc-50 dark:hover:bg-slate-800/50"
            >
              <div className="mb-6 flex h-10 w-10 items-center justify-center text-zinc-900 dark:text-white">
                <feature.icon className="h-6 w-6 stroke-[1.5]" />
              </div>
              <h3 className="mb-3 text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                {feature.title}
                {feature.badge && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 align-middle text-xs font-medium text-zinc-500 dark:bg-slate-700 dark:text-slate-400">
                    {feature.badge}
                  </span>
                )}
              </h3>
              <p className="mb-2 text-base font-medium text-zinc-700 dark:text-slate-200">
                {feature.subtitle}
              </p>
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
