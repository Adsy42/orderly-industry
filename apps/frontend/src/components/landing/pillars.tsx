import { Scale, Shield, Wallet } from "lucide-react";

const pillars = [
  {
    icon: Scale,
    title: "Australian-First",
    description:
      "Built on Australian statute and case law from day one. Not a US product with a local skin.",
  },
  {
    icon: Shield,
    title: "Private by Design",
    description:
      "Your data stays in Australia, encrypted and isolated. Never used to train AI. Client confidentiality, built in.",
  },
  {
    icon: Wallet,
    title: "Accessible to All",
    description:
      "Enterprise-grade capability without the enterprise price tag. No six-month onboarding. Try instantly.",
  },
];

export function Pillars() {
  return (
    <section className="dark:bg-midnight border-t border-zinc-100 bg-white py-24 dark:border-slate-800/30">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900 dark:bg-slate-800 dark:text-white">
                <pillar.icon className="h-7 w-7 stroke-[1.5]" />
              </div>
              <h3 className="mb-3 text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                {pillar.title}
              </h3>
              <p className="text-base leading-relaxed text-zinc-600 dark:text-slate-400">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
