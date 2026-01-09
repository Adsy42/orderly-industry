"use client";

import * as React from "react";
import { Copy, Check, Zap, Briefcase, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  QUICK_WINS,
  PRACTICE_AREAS,
  type IQLExample,
} from "@/lib/iql-help-content";

interface IQLExampleQueriesProps {
  onInsertQuery?: (query: string) => void;
  className?: string;
}

interface QueryCardProps {
  example: IQLExample;
  onInsert?: (query: string) => void;
}

function QueryCard({ example, onInsert }: QueryCardProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(example.query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    onInsert?.(example.query);
  };

  return (
    <div className="space-y-2 rounded-lg border bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-gray-900">{example.title}</h4>
          <p className="mt-0.5 text-xs text-gray-600">{example.description}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          {onInsert && (
            <button
              type="button"
              onClick={handleInsert}
              className="rounded p-1.5 text-stone-700 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700"
              title="Insert into query"
            >
              <Zap className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
      <code className="block rounded bg-gray-100 px-2 py-1.5 font-mono text-xs break-all text-gray-800">
        {example.query}
      </code>
      {example.tip && (
        <p className="flex items-start gap-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
          <Lightbulb className="mt-0.5 h-3 w-3 shrink-0" />
          {example.tip}
        </p>
      )}
    </div>
  );
}

export function IQLExampleQueries({
  onInsertQuery,
  className,
}: IQLExampleQueriesProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Quick Wins */}
      <div className="space-y-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Zap className="h-5 w-5 text-amber-500" />
            Quick Wins - Find Issues Fast
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Copy-paste these queries to find common contract risks in seconds
          </p>
        </div>
        <div className="grid gap-2">
          {QUICK_WINS.map((example, i) => (
            <QueryCard
              key={i}
              example={example}
              onInsert={onInsertQuery}
            />
          ))}
        </div>
      </div>

      {/* Practice Areas */}
      {PRACTICE_AREAS.map((area) => (
        <div
          key={area.id}
          className="space-y-3"
        >
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Briefcase className="h-5 w-5 text-stone-600 dark:text-stone-400" />
              {area.title}
            </h3>
            {area.description && (
              <p className="mt-1 text-sm text-gray-600">{area.description}</p>
            )}
          </div>
          <div className="grid gap-2">
            {area.items.map((example, i) => (
              <QueryCard
                key={i}
                example={example}
                onInsert={onInsertQuery}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export type { IQLExampleQueriesProps };
