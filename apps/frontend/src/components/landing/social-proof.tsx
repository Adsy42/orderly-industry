import { Shield, MapPin, Lock } from "lucide-react";

const trustBadges = [
  {
    icon: Shield,
    text: "Zero-Training Policy",
  },
  {
    icon: MapPin,
    text: "Australian Data Residency",
  },
  {
    icon: Lock,
    text: "Bank-Level Encryption",
  },
];

export function SocialProof() {
  return (
    <section className="dark:bg-midnight border-t border-zinc-100 bg-white py-16 dark:border-slate-800/30">
      <div className="mx-auto max-w-4xl px-6">
        {/* Waitlist Message */}
        <p className="mb-8 text-center text-lg font-medium text-zinc-700 dark:text-slate-300">
          Be among the{" "}
          <span className="text-zinc-900 dark:text-white">
            first Australian lawyers
          </span>{" "}
          to try Orderly
        </p>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {trustBadges.map((badge) => (
            <div
              key={badge.text}
              className="flex items-center gap-2 text-sm text-zinc-600 dark:text-slate-400"
            >
              <badge.icon className="h-4 w-4 text-zinc-400 dark:text-slate-500" />
              <span>{badge.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
