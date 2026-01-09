"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const practiceTypes = [
  { value: "", label: "Practice type" },
  { value: "solo", label: "Solo Practitioner" },
  { value: "small", label: "Small Firm (2-10)" },
  { value: "mid", label: "Mid-size Firm (11-50)" },
  { value: "large", label: "Large Firm (50+)" },
  { value: "inhouse", label: "In-house Counsel" },
  { value: "barrister", label: "Barrister" },
  { value: "other", label: "Other" },
];

interface WaitlistFormProps {
  variant?: "hero" | "footer";
}

export function WaitlistForm({ variant = "hero" }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [practiceType, setPracticeType] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from("waitlist_signups")
        .insert({
          email: email.toLowerCase().trim(),
          practice_type: practiceType,
          source: variant === "hero" ? "hero" : "footer",
        });

      if (insertError) {
        if (insertError.code === "23505") {
          // Unique constraint violation - email already exists
          setError("This email is already on the waitlist!");
        } else {
          setError("Something went wrong. Please try again.");
          console.error(
            "Waitlist signup error:",
            insertError.message,
            insertError.code,
            insertError.details,
          );
        }
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("Waitlist signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-slate-800">
          <svg
            className="h-6 w-6 text-zinc-900 dark:text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-lg font-medium text-zinc-900 dark:text-white">
          You&apos;re on the list!
        </p>
        <p className="text-sm text-zinc-500 dark:text-slate-400">
          We&apos;ll email you when Orderly is ready.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col items-center gap-5"
    >
      <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          className="flex-1 rounded-full border border-zinc-200 bg-white px-5 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-700"
        />
        <div className="relative">
          <select
            value={practiceType}
            onChange={(e) => setPracticeType(e.target.value)}
            required
            className="w-full appearance-none rounded-full border border-zinc-200 bg-white py-3 pr-10 pl-5 text-base text-zinc-900 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 focus:outline-none sm:w-auto dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-700"
          >
            {practiceTypes.map((type) => (
              <option
                key={type.value}
                value={type.value}
                disabled={type.value === ""}
                className="text-zinc-900 dark:text-white"
              >
                {type.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-slate-500" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="dark:text-midnight rounded-full bg-zinc-900 px-6 py-3 text-base font-medium whitespace-nowrap text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:hover:bg-blue-50"
        >
          {loading ? "Joining..." : "Join Waitlist"}
        </button>
      </div>
      {error && (
        <p className="text-center text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <p className="text-center text-base font-semibold text-zinc-700 dark:text-slate-300">
        {variant === "hero"
          ? "Launching Q1 2026. First 100 signups get a free month."
          : "Join the waitlist for early access and a free month trial."}
      </p>
    </form>
  );
}
