"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DemoStep } from "@/types/contract-analysis";

interface StepIndicatorProps {
  currentStep: DemoStep;
}

const steps: { id: DemoStep; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "playbook", label: "Playbook" },
  { id: "analyzing", label: "Analyzing" },
  { id: "results", label: "Results" },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                    isComplete &&
                      "border-stone-800 bg-stone-800 text-white dark:border-stone-200 dark:bg-stone-200 dark:text-stone-900",
                    isCurrent &&
                      "border-stone-400 bg-stone-100 text-stone-700 ring-2 ring-stone-200 dark:border-stone-500 dark:bg-stone-800 dark:text-stone-200 dark:ring-stone-700",
                    isPending &&
                      "border-zinc-300 bg-white text-zinc-400 dark:border-slate-600 dark:bg-slate-800",
                  )}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-sm font-medium transition-colors duration-300",
                    isComplete && "text-stone-800 dark:text-stone-200",
                    isCurrent && "text-foreground",
                    isPending && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-4 h-0.5 w-24 transition-colors duration-500",
                    index < currentIndex
                      ? "bg-stone-800 dark:bg-stone-300"
                      : "bg-zinc-200 dark:bg-slate-700",
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
