"use client";

import React from "react";
import { Check, X, Minus } from "lucide-react";
import {
  ChatGPTLogo,
  ClaudeLogo,
  GeminiLogo,
  HarveyLogo,
  LexisNexisLogo,
  LegoraLogo,
  SpellbookLogo,
  LuminanceLogo,
  IvoLogo,
} from "./company-logos";

const comparisonData = [
  {
    id: "general-ai",
    heading: "General AI",
    description:
      "General-purpose AI tools are fast for drafting and summarising text, but they are not trained on Australian law, do not provide reliable legal citations, and require full manual verification.",
    logos: [
      { name: "ChatGPT", component: ChatGPTLogo },
      { name: "Claude", component: ClaudeLogo },
      { name: "Gemini", component: GeminiLogo },
    ],
  },
  {
    id: "global-legal",
    heading: "Global legal AI platforms",
    description:
      "Broad legal AI systems are designed for research, drafting, and large enterprise workflows across multiple jurisdictions. They are powerful, but often global or US-centric and typically require enterprise onboarding to try.",
    logos: [
      { name: "Harvey AI", component: HarveyLogo },
      { name: "LexisNexis", component: LexisNexisLogo },
      { name: "Legora", component: LegoraLogo },
    ],
  },
  {
    id: "contract-drafting",
    heading: "Contract drafting assistants",
    description:
      "These tools focus on inline drafting and clause suggestions, often inside Word. They are helpful for writing contracts, but are not designed for fast, verified Australian contract risk review.",
    logos: [
      { name: "Spellbook", component: SpellbookLogo },
      { name: "Luminance", component: LuminanceLogo },
      { name: "Ivo", component: IvoLogo },
    ],
  },
];

const comparisonTable: Array<{
  feature: string;
  orderly: boolean | "partial";
  generalAi: boolean | "partial";
  globalLegal: boolean | "partial";
  contractDrafting: boolean | "partial";
}> = [
  {
    feature: "Australian law focus",
    orderly: true,
    generalAi: false,
    globalLegal: "partial",
    contractDrafting: false,
  },
  {
    feature: "Verified legal citations",
    orderly: true,
    generalAi: false,
    globalLegal: true,
    contractDrafting: "partial",
  },
  {
    feature: "Contract risk review",
    orderly: true,
    generalAi: false,
    globalLegal: "partial",
    contractDrafting: true,
  },
  {
    feature: "No enterprise onboarding",
    orderly: true,
    generalAi: true,
    globalLegal: false,
    contractDrafting: "partial",
  },
  {
    feature: "Try free instantly",
    orderly: true,
    generalAi: true,
    globalLegal: false,
    contractDrafting: false,
  },
];

interface LogoItem {
  name: string;
  component: React.ComponentType<{ className?: string }>;
}

function CompanyLogo({ logo }: { logo: LogoItem }) {
  const LogoComponent = logo.component;
  return (
    <div
      className="flex h-14 flex-1 items-center justify-center rounded-lg bg-zinc-100 px-4 dark:bg-slate-800"
      title={logo.name}
    >
      <LogoComponent className="h-6 w-auto text-zinc-500 dark:text-slate-400" />
    </div>
  );
}

function StatusIcon({ status }: { status: boolean | "partial" }) {
  if (status === true) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  }
  if (status === "partial") {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
        <Minus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      </div>
    );
  }
  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 dark:bg-slate-800">
      <X className="h-4 w-4 text-zinc-400 dark:text-slate-500" />
    </div>
  );
}

export function Comparison() {
  return (
    <section className="dark:bg-midnight border-t border-zinc-100 bg-white py-24 dark:border-slate-800/30">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-slate-400">
            Why Orderly
          </h2>
          <p className="font-serif text-3xl leading-tight text-zinc-900 md:text-4xl dark:text-white">
            Built specifically for Australian contract review.
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="mb-20 grid grid-cols-1 gap-6 md:grid-cols-3">
          {comparisonData.map((item) => (
            <div
              key={item.id}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-white">
                {item.heading}
              </h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-slate-400">
                {item.description}
              </p>
              <div className="mt-auto flex items-stretch gap-2">
                {item.logos.map((logo) => (
                  <CompanyLogo
                    key={logo.name}
                    logo={logo}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-slate-700 dark:bg-slate-800/50">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-slate-700 dark:bg-slate-800">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                        Orderly
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        You are here
                      </span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-zinc-500 dark:text-slate-400">
                    General AI
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-zinc-500 dark:text-slate-400">
                    Global Legal AI
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-zinc-500 dark:text-slate-400">
                    Contract Drafting
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonTable.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={
                      idx !== comparisonTable.length - 1
                        ? "border-b border-zinc-100 dark:border-slate-700/50"
                        : ""
                    }
                  >
                    <td className="px-6 py-4 text-sm font-medium text-zinc-700 dark:text-slate-300">
                      {row.feature}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <StatusIcon status={row.orderly} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <StatusIcon status={row.generalAi} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <StatusIcon status={row.globalLegal} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <StatusIcon status={row.contractDrafting} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-zinc-500 dark:text-slate-400">
            Orderly is purpose-built for Australian lawyers who need fast,
            reliable contract risk review.
          </p>
        </div>
      </div>
    </section>
  );
}
