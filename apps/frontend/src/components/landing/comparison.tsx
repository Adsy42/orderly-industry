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
      "Fast and free, but not built for legal work. No Australian-law grounding, no verified citations, and your data may train future models.",
    logos: [
      { name: "ChatGPT", component: ChatGPTLogo },
      { name: "Claude", component: ClaudeLogo },
      { name: "Gemini", component: GeminiLogo },
    ],
  },
  {
    id: "enterprise-legal",
    heading: "Enterprise Legal AI",
    description:
      "Powerful platforms for global firms. But US-centric training, enterprise pricing, and lengthy onboarding put them out of reach for most Australian practices.",
    logos: [
      { name: "Harvey AI", component: HarveyLogo },
      { name: "LexisNexis", component: LexisNexisLogo },
      { name: "Legora", component: LegoraLogo },
    ],
  },
  {
    id: "point-solutions",
    heading: "Legal AI point solutions",
    description:
      "Helpful for specific tasks, but fragmented. Multiple subscriptions that don't integrate—and still not built for Australian law.",
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
  enterpriseLegal: boolean | "partial";
  pointSolutions: boolean | "partial";
}> = [
  {
    feature: "Australian law focus",
    orderly: true,
    generalAi: false,
    enterpriseLegal: "partial",
    pointSolutions: false,
  },
  {
    feature: "Verified legal citations",
    orderly: true,
    generalAi: false,
    enterpriseLegal: true,
    pointSolutions: "partial",
  },
  {
    feature: "Full platform (research, review, draft)",
    orderly: true,
    generalAi: false,
    enterpriseLegal: true,
    pointSolutions: false,
  },
  {
    feature: "No training on your data",
    orderly: true,
    generalAi: false,
    enterpriseLegal: true,
    pointSolutions: "partial",
  },
  {
    feature: "Australian data residency",
    orderly: true,
    generalAi: false,
    enterpriseLegal: false,
    pointSolutions: false,
  },
  {
    feature: "No enterprise onboarding",
    orderly: true,
    generalAi: true,
    enterpriseLegal: false,
    pointSolutions: true,
  },
  {
    feature: "Accessible pricing",
    orderly: true,
    generalAi: true,
    enterpriseLegal: false,
    pointSolutions: "partial",
  },
];

const columnLabels = [
  { key: "orderly", label: "Orderly", highlight: true },
  { key: "generalAi", label: "General AI", highlight: false },
  { key: "enterpriseLegal", label: "Enterprise", highlight: false },
  { key: "pointSolutions", label: "Point Solutions", highlight: false },
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

function StatusIcon({
  status,
  size = "normal",
}: {
  status: boolean | "partial";
  size?: "normal" | "small";
}) {
  const sizeClasses = size === "small" ? "h-5 w-5" : "h-6 w-6";
  const iconClasses = size === "small" ? "h-3 w-3" : "h-4 w-4";

  if (status === true) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 ${sizeClasses}`}
      >
        <Check
          className={`text-emerald-600 dark:text-emerald-400 ${iconClasses}`}
        />
      </div>
    );
  }
  if (status === "partial") {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 ${sizeClasses}`}
      >
        <Minus
          className={`text-amber-600 dark:text-amber-400 ${iconClasses}`}
        />
      </div>
    );
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-zinc-100 dark:bg-slate-800 ${sizeClasses}`}
    >
      <X className={`text-zinc-400 dark:text-slate-500 ${iconClasses}`} />
    </div>
  );
}

function MobileComparisonCard({
  row,
}: {
  row: (typeof comparisonTable)[number];
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <p className="mb-3 text-sm font-medium text-zinc-900 dark:text-white">
        {row.feature}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {columnLabels.map((col) => (
          <div
            key={col.key}
            className="flex items-center gap-2"
          >
            <StatusIcon
              status={row[col.key as keyof typeof row] as boolean | "partial"}
              size="small"
            />
            <span
              className={`text-sm ${
                col.highlight
                  ? "font-medium text-zinc-900 dark:text-white"
                  : "text-zinc-500 dark:text-slate-400"
              }`}
            >
              {col.label}
            </span>
          </div>
        ))}
      </div>
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
            Built specifically for Australian legal practice.
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

        {/* Mobile Comparison Cards */}
        <div className="space-y-3 md:hidden">
          {/* Mobile Header */}
          <div className="mb-4 rounded-xl bg-zinc-50 p-4 dark:bg-slate-800">
            <div className="grid grid-cols-2 gap-3">
              {columnLabels.map((col) => (
                <div
                  key={col.key}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`text-sm ${
                      col.highlight
                        ? "font-semibold text-zinc-900 dark:text-white"
                        : "font-medium text-zinc-500 dark:text-slate-400"
                    }`}
                  >
                    {col.label}
                  </span>
                  {col.highlight && (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Coming soon
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          {comparisonTable.map((row) => (
            <MobileComparisonCard
              key={row.feature}
              row={row}
            />
          ))}
        </div>

        {/* Desktop Comparison Table */}
        <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white md:block dark:border-slate-700 dark:bg-slate-800/50">
          <div className="overflow-x-auto">
            <table className="w-full">
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
                        Coming soon
                      </span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-zinc-500 dark:text-slate-400">
                    General AI
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-zinc-500 dark:text-slate-400">
                    Enterprise Legal AI
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-zinc-500 dark:text-slate-400">
                    Point Solutions
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
                        <StatusIcon status={row.enterpriseLegal} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <StatusIcon status={row.pointSolutions} />
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
            Orderly: Enterprise-grade legal AI. Australian-first. Private by
            design. Accessible to every firm.
          </p>
        </div>
      </div>
    </section>
  );
}
