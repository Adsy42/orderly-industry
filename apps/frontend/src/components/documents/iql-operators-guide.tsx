"use client";

import * as React from "react";
import { Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  OPERATORS,
  OPERATOR_PRECEDENCE,
  type OperatorInfo,
} from "@/lib/iql-help-content";

interface IQLOperatorsGuideProps {
  className?: string;
}

function OperatorCard({ op }: { op: OperatorInfo }) {
  return (
    <div className="space-y-2 rounded-lg border bg-white p-3">
      <div className="flex items-center gap-2">
        <code className="rounded bg-blue-100 px-2 py-0.5 font-mono text-sm font-bold text-blue-800">
          {op.operator}
        </code>
        <span className="text-sm font-medium text-gray-900">{op.name}</span>
      </div>
      <p className="text-xs text-gray-600">{op.description}</p>
      <p className="text-xs text-gray-500 italic">{op.legalAnalogy}</p>
      <div className="mt-2 border-t pt-2">
        <code className="block rounded bg-gray-100 px-2 py-1.5 font-mono text-xs break-all text-gray-800">
          {op.example}
        </code>
        <p className="mt-1 text-xs text-gray-500">{op.exampleExplanation}</p>
      </div>
    </div>
  );
}

export function IQLOperatorsGuide({ className }: IQLOperatorsGuideProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Calculator className="h-5 w-5 text-green-500" />
            Combining Queries with Operators
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Use operators to combine multiple searches - similar to Boolean
            search in Westlaw or Lexis.
          </p>
        </div>
        <div className="grid gap-2">
          {OPERATORS.map((op) => (
            <OperatorCard
              key={op.operator}
              op={op}
            />
          ))}
        </div>
      </div>

      {/* Precedence */}
      <div className="rounded-lg border bg-white p-4">
        <h4 className="mb-3 text-sm font-medium text-gray-900">
          Operator Precedence
        </h4>
        <p className="mb-3 text-xs text-gray-600">
          Operators are evaluated in this order (use parentheses to override):
        </p>
        <div className="space-y-2">
          {OPERATOR_PRECEDENCE.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 font-medium text-gray-600">
                {i + 1}
              </span>
              <code className="rounded bg-gray-100 px-2 py-0.5 font-mono">
                {item.operators}
              </code>
              <span className="text-gray-600">{item.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export type { IQLOperatorsGuideProps };
