"use client";

import * as React from "react";
import { Scale, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCORE_RANGES, USAGE_TIPS } from "@/lib/iql-help-content";

interface IQLUnderstandingResultsProps {
  className?: string;
}

export function IQLUnderstandingResults({
  className,
}: IQLUnderstandingResultsProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Scale className="h-5 w-5 text-indigo-500" />
            Understanding Confidence Scores
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Clause Finder returns confidence scores from 0% to 100%. Think of it
            like a junior associate's assessment.
          </p>
        </div>

        {/* Score ranges */}
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-xs">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Score
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Meaning
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {SCORE_RANGES.map((range, i) => (
                <tr
                  key={i}
                  className="border-b last:border-b-0"
                >
                  <td className="px-3 py-2 font-mono">
                    {range.min}-{range.max}%
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {range.legalInterpretation}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {range.recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="space-y-3">
        <h4 className="text-base font-semibold text-gray-900">
          Tips for Effective Searches
        </h4>
        <div className="grid gap-2">
          {USAGE_TIPS.map((tip, i) => (
            <div
              key={i}
              className="flex gap-2 rounded-lg border bg-white p-3"
            >
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div>
                <h5 className="text-sm font-medium text-gray-900">
                  {tip.title}
                </h5>
                <p className="mt-0.5 text-xs text-gray-600">
                  {tip.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export type { IQLUnderstandingResultsProps };
