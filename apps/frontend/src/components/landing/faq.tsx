"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    id: 1,
    question: "When does Orderly launch?",
    answer:
      "Q1 2026. Waitlist members will be first to know—and first to access.",
  },
  {
    id: 2,
    question: "What can I do at launch?",
    answer:
      "Contract review and drafting, grounded in Australian law. Research, workflows, and more coming throughout 2026.",
  },
  {
    id: 3,
    question: "Is my data used to train AI?",
    answer:
      "Never. Your documents are encrypted, isolated, and used only to serve your requests.",
  },
  {
    id: 4,
    question: "Where is my data stored?",
    answer:
      "In Australia, on Australian infrastructure. Your data never leaves the country.",
  },
  {
    id: 5,
    question: "How much will it cost?",
    answer:
      "We'll announce pricing at launch. Waitlist members get early-bird rates.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-zinc-200 last:border-b-0 dark:border-slate-700/50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between py-5 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-zinc-900 dark:text-white">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 dark:text-slate-400 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="pb-5">
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-slate-400">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

export function FAQ() {
  return (
    <section className="bg-zinc-50 py-24 dark:bg-slate-900/50">
      <div className="mx-auto max-w-3xl px-6">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-slate-400">
            FAQ
          </h2>
          <p className="font-serif text-3xl leading-tight text-zinc-900 md:text-4xl dark:text-white">
            Common questions
          </p>
        </div>

        {/* FAQ List */}
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 dark:border-slate-700 dark:bg-slate-800/50">
          {faqs.map((faq) => (
            <FAQItem
              key={faq.id}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
