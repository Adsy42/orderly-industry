import Link from "next/link";
import { Check } from "lucide-react";

// Simple monochrome logo components
function ChatGPTLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-6 w-6 text-zinc-400"
    >
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

function ClaudeLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-6 w-6 text-zinc-400"
    >
      <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79.038-2.2.107-1.44.058-.79.01-.338-.107.173-.543.087-.39.125-.418.298-.908.587-1.816.376-1.168.26-.742.606-1.696.096-.24.192-.019.357.154.578.289.385.221.26.202.116.164-.068.222-.26.946-.722 2.503-.645 2.195-.395 1.312-.193.657-.048.25.077.135.193.068.56-.01 1.236-.048 1.101-.058.347-.019.135.058.164.289.135.415.087.52.039.569.019.318-.039.26-.154.52-.375 1.254-.356 1.226-.154.472-.048.26.019.154.135.135.27.029.52-.039.781-.106 1.168-.174.627-.077.318-.01.183.087.154.405.241.829.462.27.173.116.173-.068.212-.26.559-.82 1.696-1.158 2.35-.809 1.58-.347.657-.386.733-.52.967-.376.695-.289.52-.212.366-.433.183-.415-.106-.675-.26-1.005-.482-.926-.49-.722-.424-.54-.366-.26-.193-.231-.279-.232-.558-.154-.502-.058-.395.029-.569.135-1.003.26-1.004.27-.849.212-.59.106-.308-.019-.318-.212-.462-.463-.926-.386-.772-.173-.424-.01-.26.116-.52.212-.78.396-1.312.694-2.234.839-2.619.405-1.216.096-.26-.029-.173-.125-.164-.308-.26-.733-.616-1.043-.926-.463-.433-.125-.154-.058-.174.077-.24.298-.695.665-1.542.665-1.505.347-.733.173-.356.212-.106z" />
    </svg>
  );
}

function GeminiLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-6 w-6 text-zinc-400"
    >
      <path d="M12 0C5.352 0 0 5.352 0 12s5.352 12 12 12 12-5.352 12-12S18.648 0 12 0zm0 21.6c-5.304 0-9.6-4.296-9.6-9.6S6.696 2.4 12 2.4s9.6 4.296 9.6 9.6-4.296 9.6-9.6 9.6zm0-16.8c-3.96 0-7.2 3.24-7.2 7.2s3.24 7.2 7.2 7.2 7.2-3.24 7.2-7.2-3.24-7.2-7.2-7.2z" />
    </svg>
  );
}

function HarveyLogo() {
  return (
    <div className="flex items-center gap-1.5 text-zinc-400">
      <span className="text-sm font-semibold tracking-tight">Harvey</span>
    </div>
  );
}

function LexisNexisLogo() {
  return (
    <div className="flex items-center gap-1.5 text-zinc-400">
      <span className="text-sm font-semibold tracking-tight">LexisNexis</span>
    </div>
  );
}

function ThomsonReutersLogo() {
  return (
    <div className="flex items-center gap-1.5 text-zinc-400">
      <span className="text-sm font-semibold tracking-tight">
        Thomson Reuters
      </span>
    </div>
  );
}

function SpellbookLogo() {
  return (
    <div className="flex items-center gap-1.5 text-zinc-400">
      <span className="text-sm font-semibold tracking-tight">Spellbook</span>
    </div>
  );
}

function LuminanceLogo() {
  return (
    <div className="flex items-center gap-1.5 text-zinc-400">
      <span className="text-sm font-semibold tracking-tight">Luminance</span>
    </div>
  );
}

function IvoLogo() {
  return (
    <div className="flex items-center gap-1.5 text-zinc-400">
      <span className="text-sm font-semibold tracking-tight">Ivo</span>
    </div>
  );
}

interface ComparisonBlockProps {
  heading: string;
  copy: string;
  logos: React.ReactNode[];
}

function ComparisonBlock({ heading, copy, logos }: ComparisonBlockProps) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-6 md:p-8">
      <h3 className="mb-3 text-lg font-medium text-zinc-900">{heading}</h3>
      <p className="mb-6 text-sm leading-relaxed text-zinc-600 md:text-base">
        {copy}
      </p>
      <div className="flex flex-wrap items-center gap-6">{logos}</div>
    </div>
  );
}

export function Comparison() {
  return (
    <section className="border-t border-zinc-100 bg-white py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-6 font-serif text-3xl tracking-tight text-zinc-950 md:text-4xl">
            Why Australian contract review needs a different approach
          </h2>
          <div className="mx-auto max-w-2xl space-y-4 text-zinc-600">
            <p className="text-base leading-relaxed md:text-lg">
              There are more AI tools for lawyers than ever before. Most are
              powerful — but they&apos;re built for global or overseas use
              cases, not the realities of Australian legal practice.
            </p>
            <p className="text-base font-medium text-zinc-800 md:text-lg">
              For contract review, those differences matter.
            </p>
          </div>
        </div>

        {/* Comparison Blocks */}
        <div className="mb-12 space-y-6">
          <ComparisonBlock
            heading="General AI"
            copy="General-purpose AI tools are fast for drafting and summarising text, but they are not trained on Australian law, do not provide reliable legal citations, and require full manual verification."
            logos={[
              <ChatGPTLogo key="chatgpt" />,
              <ClaudeLogo key="claude" />,
              <GeminiLogo key="gemini" />,
            ]}
          />

          <ComparisonBlock
            heading="Global legal AI platforms"
            copy="Broad legal AI systems are designed for research, drafting, and large enterprise workflows across multiple jurisdictions. They are powerful, but often global or US-centric and typically require enterprise onboarding to try."
            logos={[
              <HarveyLogo key="harvey" />,
              <LexisNexisLogo key="lexisnexis" />,
              <ThomsonReutersLogo key="thomsonreuters" />,
            ]}
          />

          <ComparisonBlock
            heading="Contract drafting assistants"
            copy="These tools focus on inline drafting and clause suggestions, often inside Word. They are helpful for writing contracts, but are not designed for fast, verified Australian contract risk review."
            logos={[
              <SpellbookLogo key="spellbook" />,
              <LuminanceLogo key="luminance" />,
              <IvoLogo key="ivo" />,
            ]}
          />
        </div>

        {/* Our Approach Card */}
        <div className="mb-12 rounded-2xl border-2 border-zinc-900 bg-zinc-900 p-8 text-white md:p-10">
          <h3 className="mb-6 text-xl font-medium md:text-2xl">Our approach</h3>
          <ul className="mb-8 space-y-4">
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <span className="text-zinc-200">
                <strong className="text-white">
                  Trained on Australian law
                </strong>{" "}
                — designed around Australian contracts, drafting norms, and
                legal context
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <span className="text-zinc-200">
                <strong className="text-white">
                  Citation and verification grounded
                </strong>{" "}
                — issues are flagged with clear reasoning so lawyers can verify
                quickly
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <span className="text-zinc-200">
                <strong className="text-white">
                  Private, Australian-hosted by default
                </strong>{" "}
                — documents are processed in Australia and never used for model
                training
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <span className="text-zinc-200">
                <strong className="text-white">Focused by design</strong> —
                built specifically for Australian contract review, not generic
                legal tasks
              </span>
            </li>
          </ul>
        </div>

        {/* Summary */}
        <div className="mb-12 text-center">
          <p className="text-lg leading-relaxed text-zinc-600 md:text-xl">
            Other tools help you draft or research.
            <br />
            <span className="font-medium text-zinc-900">
              We help Australian lawyers review contracts — with grounded,
              verifiable results and private local hosting.
            </span>
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/auth/sign-up"
            className="inline-block rounded-full bg-zinc-900 px-8 py-4 text-lg font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Try it free on an Australian contract
          </Link>
          <p className="mt-3 text-sm text-zinc-500">
            No credit card. No obligation.
          </p>
        </div>
      </div>
    </section>
  );
}
