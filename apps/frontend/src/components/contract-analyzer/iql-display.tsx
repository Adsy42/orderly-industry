"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface IqlDisplayProps {
  iql: string;
  label?: string;
  variant?: "inline" | "block";
  showCopy?: boolean;
  className?: string;
}

export function IqlDisplay({
  iql,
  label,
  variant = "inline",
  showCopy = false,
  className,
}: IqlDisplayProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(iql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple syntax highlighting for IQL keywords - using neutral B&W theme
  const highlightedIql = React.useMemo(() => {
    return iql
      .replace(
        /\{IS\s/g,
        '<span class="text-stone-800 font-semibold dark:text-stone-200">{IS </span>',
      )
      .replace(
        /\bAND\b/g,
        '<span class="text-stone-600 font-semibold dark:text-stone-400">AND</span>',
      )
      .replace(
        /\bOR\b/g,
        '<span class="text-stone-600 font-semibold dark:text-stone-400">OR</span>',
      )
      .replace(
        /\bNOT\b/g,
        '<span class="text-red-600 font-semibold dark:text-red-400">NOT</span>',
      )
      .replace(
        /\}/g,
        '<span class="text-stone-800 font-semibold dark:text-stone-200">}</span>',
      );
  }, [iql]);

  if (variant === "inline") {
    return (
      <span
        className={cn(
          "text-muted-foreground inline font-mono text-xs",
          className,
        )}
      >
        {iql}
      </span>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {label && (
        <span className="text-muted-foreground mb-1 block text-xs font-medium">
          {label}
        </span>
      )}
      <div
        className={cn(
          "relative overflow-x-auto rounded-lg border border-stone-200 bg-stone-50 p-3",
          "dark:border-stone-700 dark:bg-stone-800/50",
        )}
      >
        <pre className="font-mono text-xs leading-relaxed text-stone-700 dark:text-stone-300">
          <code dangerouslySetInnerHTML={{ __html: highlightedIql }} />
        </pre>

        {showCopy && (
          <button
            onClick={handleCopy}
            className={cn(
              "absolute top-2 right-2 rounded-md p-1.5 transition-colors",
              "text-muted-foreground hover:bg-stone-200 hover:text-stone-700",
              "dark:hover:bg-stone-700 dark:hover:text-stone-300",
            )}
            aria-label="Copy IQL"
          >
            {copied ? (
              <Check className="h-4 w-4 text-stone-800 dark:text-stone-200" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
