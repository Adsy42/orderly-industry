"use client";

import Image from "next/image";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Sparkles,
} from "lucide-react";

export function HeroAnimation() {
  return (
    <div className="group dark:bg-midnight relative w-full overflow-hidden bg-[#EAE4D3] transition-colors duration-500">
      {/* Layout Container - Overlapping on mobile, side-by-side on desktop */}
      <div className="relative md:flex md:min-h-[85vh] md:flex-row md:items-stretch">
        {/* Image Container - Full width on mobile, left side on desktop */}
        <div className="relative h-[650px] w-full overflow-hidden md:h-auto md:w-1/2">
          <Image
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2576&auto=format&fit=crop"
            alt="Legal Professional"
            fill
            className="object-cover object-top opacity-90 mix-blend-multiply contrast-[1.1] grayscale-[20%] transition-all duration-500 dark:opacity-70 dark:mix-blend-overlay dark:grayscale-[40%]"
            priority
          />
          <div className="dark:to-midnight/40 pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-transparent"></div>
        </div>

        {/* Floating AI Interface - Overlapping on mobile, right side on desktop */}
        <div className="absolute right-4 -bottom-4 left-4 z-20 md:relative md:right-auto md:bottom-auto md:left-auto md:flex md:w-1/2 md:items-center md:justify-center md:px-8 md:py-0">
          {/* Card Container */}
          <div className="dark:bg-navy w-full max-w-xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25)] ring-1 ring-black/5 dark:border-slate-700/50 dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] dark:ring-white/5">
            {/* Window Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-slate-600"></div>
                <div className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-slate-600"></div>
              </div>
              <div className="flex items-center gap-2 font-sans text-xs font-medium text-zinc-500 dark:text-slate-400">
                <FileText className="h-3 w-3" />
                Commercial Lease Agreement (NSW).docx
              </div>
              <div className="w-4"></div>
            </div>

            {/* Main Document View */}
            <div className="relative flex h-[380px] flex-col md:h-[450px]">
              {/* Document Text */}
              <div className="hide-scrollbar dark:bg-navy relative flex-1 overflow-hidden bg-white p-6 pb-20 font-serif text-sm leading-relaxed text-zinc-800 md:overflow-y-auto md:p-8 md:pb-24 md:text-base dark:text-slate-300">
                {/* Bottom gradient fade to hide text behind prompt */}
                <div className="dark:from-navy pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-white via-white/90 to-transparent md:h-28 dark:via-[#0f172a]/90"></div>
                <div className="pointer-events-none space-y-6 opacity-40 transition-opacity duration-700 select-none">
                  <p className="text-zinc-600 dark:text-slate-500">
                    1.1 This Agreement is subject to the Retail Leases Act 1994
                    (NSW) and the Australian Consumer Law as set out in Schedule
                    2 of the Competition and Consumer Act 2010 (Cth).
                  </p>
                  <p className="text-zinc-600 dark:text-slate-500">
                    2.1 The Lessor grants to the Lessee a lease of the Premises
                    for the Term commencing on the Commencement Date.
                  </p>
                </div>
                <div className="mt-6 space-y-6">
                  {/* Cycle 1: ACL Exclusion Clause */}
                  <div className="group relative">
                    <div className="animate-cycle-1 absolute -inset-2 rounded-lg bg-red-50 opacity-0 transition-opacity dark:bg-red-900/20"></div>
                    <div className="animate-pop-1 pointer-events-none absolute -top-16 right-0 z-20 w-56 opacity-0 md:-right-4 md:w-64">
                      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-white p-3 shadow-xl dark:border-red-800/50 dark:bg-slate-800">
                        <div className="mt-0.5 shrink-0 rounded-full bg-red-100 p-1 dark:bg-red-900/30">
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-semibold text-zinc-900 dark:text-white">
                            ACL Risk Detected
                          </p>
                          <p className="text-xs leading-snug text-zinc-600 dark:text-slate-300">
                            This clause may breach s.64A of the Australian
                            Consumer Law - consumer guarantees cannot be
                            excluded.
                          </p>
                        </div>
                      </div>
                      <div className="absolute top-full right-1/2 -mt-[1px] h-3 w-3 translate-x-1/2 rotate-45 transform border-r border-b border-red-200 bg-white dark:border-red-800/50 dark:bg-slate-800"></div>
                    </div>
                    <p className="relative z-10 text-zinc-800 dark:text-slate-200">
                      <strong>8.3 Exclusion of Liability.</strong> To the
                      fullest extent permitted by law, the Lessor excludes
                      <span className="border-b border-zinc-300 dark:border-zinc-600">
                        {" "}
                        all warranties, conditions and guarantees
                      </span>{" "}
                      implied by statute, general law or custom.
                    </p>
                  </div>
                  {/* Cycle 2: Retail Leases Act Compliance */}
                  <div className="group relative">
                    <div className="animate-cycle-2 absolute -inset-2 rounded-lg bg-blue-50 opacity-0 transition-opacity dark:bg-blue-900/20"></div>
                    <div className="animate-pop-2 pointer-events-none absolute -top-16 right-0 z-20 w-56 opacity-0 md:-right-4 md:w-64">
                      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-white p-3 shadow-xl dark:border-blue-800/50 dark:bg-slate-800">
                        <div className="mt-0.5 shrink-0 rounded-full bg-blue-100 p-1 dark:bg-blue-900/30">
                          <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-semibold text-zinc-900 dark:text-white">
                            RLA Compliant
                          </p>
                          <p className="text-xs leading-snug text-zinc-600 dark:text-slate-300">
                            Disclosure statement complies with s.11 Retail
                            Leases Act 1994 (NSW) requirements.
                          </p>
                        </div>
                      </div>
                      <div className="absolute top-full right-1/2 -mt-[1px] h-3 w-3 translate-x-1/2 rotate-45 transform border-r border-b border-blue-200 bg-white dark:border-blue-800/50 dark:bg-slate-800"></div>
                    </div>
                    <p className="relative z-10 text-zinc-800 dark:text-slate-200">
                      <strong>Schedule 1 - Disclosure Statement.</strong> The
                      Lessor has provided all information required under Part 2
                      of the Retail Leases Act 1994 (NSW).
                    </p>
                  </div>
                  {/* Cycle 3: PPSA Registration */}
                  <div className="group relative">
                    <div className="animate-cycle-3 absolute -inset-2 rounded-lg bg-amber-50 opacity-0 transition-opacity dark:bg-amber-900/20"></div>
                    <div className="animate-pop-3 pointer-events-none absolute -top-16 right-0 z-20 w-56 opacity-0 md:-right-4 md:w-64">
                      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-white p-3 shadow-xl dark:border-amber-800/50 dark:bg-slate-800">
                        <div className="mt-0.5 shrink-0 rounded-full bg-amber-100 p-1 dark:bg-amber-900/30">
                          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-semibold text-zinc-900 dark:text-white">
                            PPSA Action Required
                          </p>
                          <p className="text-xs leading-snug text-zinc-600 dark:text-slate-300">
                            Security interest should be registered on the PPSR
                            within 20 business days per s.588FL Corporations
                            Act.
                          </p>
                        </div>
                      </div>
                      <div className="absolute top-full right-1/2 -mt-[1px] h-3 w-3 translate-x-1/2 rotate-45 transform border-r border-b border-amber-200 bg-white dark:border-amber-800/50 dark:bg-slate-800"></div>
                    </div>
                    <p className="relative z-10 text-zinc-800 dark:text-slate-200">
                      <strong>12.1 Security Interest.</strong> The Lessee grants
                      a security interest in the Fixtures and Fittings under the
                      Personal Property Securities Act 2009 (Cth).
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Prompt Interface (Bottom Overlay) */}
              <div className="absolute right-3 bottom-3 left-3 z-30 md:right-5 md:bottom-5 md:left-5">
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-1 pr-2 shadow-lg md:gap-3 md:pr-3 dark:border-slate-700 dark:bg-slate-900">
                  <div className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-100 dark:bg-slate-800">
                    <Sparkles className="h-4 w-4 text-zinc-900 dark:text-blue-400" />
                  </div>
                  <div className="relative flex h-8 flex-1 items-center overflow-hidden">
                    {/* Cycle 1 prompt */}
                    <div className="animate-prompt-1 absolute inset-y-0 left-0 flex w-fit items-center opacity-0">
                      <div className="relative">
                        <span
                          className="pr-1 text-xs font-medium opacity-0 md:text-sm"
                          aria-hidden="true"
                        >
                          Check ACL compliance for exclusion clauses...
                        </span>
                        <span className="type-cycle-1 absolute top-0 left-0 text-xs font-medium text-zinc-800 md:text-sm dark:text-slate-200">
                          Check ACL compliance for exclusion clauses...
                        </span>
                      </div>
                    </div>
                    {/* Cycle 2 prompt */}
                    <div className="animate-prompt-2 absolute inset-y-0 left-0 flex w-fit items-center opacity-0">
                      <div className="relative">
                        <span
                          className="pr-1 text-xs font-medium opacity-0 md:text-sm"
                          aria-hidden="true"
                        >
                          Verify Retail Leases Act disclosure...
                        </span>
                        <span className="type-cycle-2 absolute top-0 left-0 text-xs font-medium text-zinc-800 md:text-sm dark:text-slate-200">
                          Verify Retail Leases Act disclosure...
                        </span>
                      </div>
                    </div>
                    {/* Cycle 3 prompt */}
                    <div className="animate-prompt-3 absolute inset-y-0 left-0 flex w-fit items-center opacity-0">
                      <div className="relative">
                        <span
                          className="pr-1 text-xs font-medium opacity-0 md:text-sm"
                          aria-hidden="true"
                        >
                          Flag PPSA registration requirements...
                        </span>
                        <span className="type-cycle-3 absolute top-0 left-0 text-xs font-medium text-zinc-800 md:text-sm dark:text-slate-200">
                          Flag PPSA registration requirements...
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="sending-dots-sync flex h-5 w-5 items-center justify-center opacity-0">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-slate-600 dark:border-t-blue-400"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="dark:from-midnight pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
    </div>
  );
}
