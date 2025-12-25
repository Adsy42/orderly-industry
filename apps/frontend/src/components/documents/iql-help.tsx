"use client";

import * as React from "react";
import {
  ChevronDown,
  Copy,
  Check,
  Zap,
  Briefcase,
  BookOpen,
  Calculator,
  Lightbulb,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  QUICK_WINS,
  PRACTICE_AREAS,
  OPERATORS,
  OPERATOR_PRECEDENCE,
  SCORE_RANGES,
  USAGE_TIPS,
  TEMPLATE_CATEGORIES,
  type IQLExample,
  type OperatorInfo,
} from "@/lib/iql-help-content";

interface IQLHelpProps {
  onInsertQuery?: (query: string) => void;
  className?: string;
}

interface AccordionSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({
  id,
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: AccordionSectionProps) {
  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-3 text-left text-sm font-medium transition-colors hover:bg-gray-50"
        aria-expanded={isOpen}
        aria-controls={`section-${id}`}
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-500 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      {isOpen && (
        <div
          id={`section-${id}`}
          className="pt-1 pb-4"
        >
          {children}
        </div>
      )}
    </div>
  );
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
              className="rounded p-1.5 text-blue-600 transition-colors hover:bg-blue-50"
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

export function IQLHelp({ onInsertQuery, className }: IQLHelpProps) {
  const [openSections, setOpenSections] = React.useState<Set<string>>(
    new Set(["quick-wins"]),
  );

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn("rounded-lg border bg-gray-50", className)}>
      {/* Quick Wins */}
      <AccordionSection
        id="quick-wins"
        title="Quick Wins - Find Issues Fast"
        icon={<Zap className="h-4 w-4 text-amber-500" />}
        isOpen={openSections.has("quick-wins")}
        onToggle={() => toggleSection("quick-wins")}
      >
        <div className="space-y-2 px-1">
          <p className="mb-3 text-xs text-gray-600">
            Copy-paste these queries to find common contract risks in seconds:
          </p>
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
      </AccordionSection>

      {/* By Practice Area */}
      <AccordionSection
        id="practice-areas"
        title="Examples by Practice Area"
        icon={<Briefcase className="h-4 w-4 text-blue-500" />}
        isOpen={openSections.has("practice-areas")}
        onToggle={() => toggleSection("practice-areas")}
      >
        <div className="space-y-4 px-1">
          {PRACTICE_AREAS.map((area) => (
            <div
              key={area.id}
              className="space-y-2"
            >
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  {area.title}
                </h4>
                {area.description && (
                  <p className="text-xs text-gray-600">{area.description}</p>
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
      </AccordionSection>

      {/* Clause Types Reference */}
      <AccordionSection
        id="templates"
        title="Clause Types Reference"
        icon={<BookOpen className="h-4 w-4 text-purple-500" />}
        isOpen={openSections.has("templates")}
        onToggle={() => toggleSection("templates")}
      >
        <div className="space-y-3 px-1">
          <p className="text-xs text-gray-600">
            Built-in clause types are optimized for accuracy. Use{" "}
            <code className="rounded bg-gray-200 px-1">
              {"{IS clause type}"}
            </code>{" "}
            format.
          </p>
          <div className="grid gap-3">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <div
                key={cat.category}
                className="rounded-lg border bg-white p-3"
              >
                <h4 className="text-sm font-medium text-gray-900">
                  {cat.category}
                </h4>
                <p className="mt-0.5 text-xs text-gray-600">
                  {cat.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cat.examples.map((ex) => (
                    <code
                      key={ex}
                      className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs"
                    >
                      {ex}
                    </code>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            For parameterized templates, use quotes:{" "}
            <code className="rounded bg-gray-200 px-1">
              {'{IS clause obligating "Customer"}'}
            </code>
          </p>
        </div>
      </AccordionSection>

      {/* Combining Queries */}
      <AccordionSection
        id="operators"
        title="Combining Queries (Operators)"
        icon={<Calculator className="h-4 w-4 text-green-500" />}
        isOpen={openSections.has("operators")}
        onToggle={() => toggleSection("operators")}
      >
        <div className="space-y-3 px-1">
          <p className="text-xs text-gray-600">
            Combine multiple queries using operators - similar to Boolean search
            in Westlaw or Lexis.
          </p>
          <div className="grid gap-2">
            {OPERATORS.map((op) => (
              <OperatorCard
                key={op.operator}
                op={op}
              />
            ))}
          </div>

          {/* Precedence */}
          <div className="mt-3 rounded-lg border bg-white p-3">
            <h4 className="mb-2 text-sm font-medium text-gray-900">
              Operator Precedence
            </h4>
            <p className="mb-2 text-xs text-gray-600">
              Operators are evaluated in this order (use parentheses to
              override):
            </p>
            <div className="space-y-1">
              {OPERATOR_PRECEDENCE.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 font-medium text-gray-600">
                    {i + 1}
                  </span>
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">
                    {item.operators}
                  </code>
                  <span className="text-gray-600">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* Understanding Results */}
      <AccordionSection
        id="scoring"
        title="Understanding Results"
        icon={<Scale className="h-4 w-4 text-indigo-500" />}
        isOpen={openSections.has("scoring")}
        onToggle={() => toggleSection("scoring")}
      >
        <div className="space-y-3 px-1">
          <p className="text-xs text-gray-600">
            Clause Finder returns confidence scores from 0% to 100%. Think of it
            like a junior associate's assessment:
          </p>

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

          {/* Tips */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Pro Tips</h4>
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
      </AccordionSection>
    </div>
  );
}

export type { IQLHelpProps };
