import type { Severity, DocumentType } from "./contract-analysis";

/**
 * A single check within a playbook.
 * Each check has a natural language description, the generated IQL, and metadata.
 */
export interface PlaybookCheck {
  id: string;
  /** User-facing title for the check */
  title: string;
  /** Plain English description of what this check looks for */
  description: string;
  /** The IQL query (either from template or NL translation) */
  iql: string;
  /** The severity if this check matches */
  severity: Severity;
  /** Category grouping for UI organization */
  category: string;
  /** What action to take if detected */
  action: string;
  /** Optional financial impact description */
  financialImpact?: string;
  /** Source: 'preset' for built-in, 'custom' for user-added via NL */
  source: "preset" | "custom";
  /** For custom checks: the original NL query that was translated */
  originalNlQuery?: string;
  /** For custom checks: confidence from NL translation */
  translationConfidence?: number;
  /** Templates used during NL translation (if any) */
  templatesUsed?: string[];
}

/**
 * Color themes for playbook cards
 */
export type PlaybookTheme = "blue" | "amber" | "purple" | "emerald" | "red";

/**
 * A playbook is a named collection of checks targeting a specific scenario.
 */
export interface Playbook {
  id: string;
  /** Display name shown in UI */
  name: string;
  /** Short description of what this playbook covers */
  description: string;
  /** Icon identifier for visual distinction (lucide icon name) */
  icon: string;
  /** Target document types this playbook is designed for */
  documentTypes: (DocumentType | "both")[];
  /** The checks included in this playbook */
  checks: PlaybookCheck[];
  /** Whether this is a system preset or user-created */
  isPreset: boolean;
  /** Color theme for the playbook card */
  colorTheme: PlaybookTheme;
}

/**
 * Progress tracking for a single check during analysis.
 */
export interface PlaybookCheckProgress {
  checkId: string;
  title: string;
  iql: string;
  status: "pending" | "checking" | "complete" | "error";
  detected?: boolean;
  confidence?: number;
  matchedText?: string;
  error?: string;
}

/**
 * Result of a single check after analysis.
 */
export interface PlaybookCheckResult {
  check: PlaybookCheck;
  detected: boolean;
  confidence: number;
  matchedText?: string;
  startChar?: number;
  endChar?: number;
}

/**
 * Extended analysis results including playbook context.
 */
export interface PlaybookAnalysisResults {
  playbook: Playbook;
  documentType: DocumentType;
  documentName: string;
  riskScore: number;
  checkResults: PlaybookCheckResult[];
  customChecksAdded: number;
  analyzedAt: string;
}

/**
 * Response from NL-to-IQL translation for custom checks.
 */
export interface NlToIqlTranslation {
  iql: string;
  explanation: string;
  templatesUsed: string[];
  confidence: number;
}

/**
 * Theme colors for playbook cards - Using stone-based B&W aesthetic
 * All themes use the same neutral styling for consistency
 */
export const PLAYBOOK_THEME_COLORS: Record<
  PlaybookTheme,
  { border: string; bg: string; icon: string }
> = {
  blue: {
    border: "border-stone-200 dark:border-stone-700",
    bg: "bg-stone-50 dark:bg-stone-800/50",
    icon: "text-stone-700 dark:text-stone-300",
  },
  amber: {
    border: "border-stone-200 dark:border-stone-700",
    bg: "bg-stone-50 dark:bg-stone-800/50",
    icon: "text-stone-700 dark:text-stone-300",
  },
  purple: {
    border: "border-stone-200 dark:border-stone-700",
    bg: "bg-stone-50 dark:bg-stone-800/50",
    icon: "text-stone-700 dark:text-stone-300",
  },
  emerald: {
    border: "border-stone-200 dark:border-stone-700",
    bg: "bg-stone-50 dark:bg-stone-800/50",
    icon: "text-stone-700 dark:text-stone-300",
  },
  red: {
    border: "border-stone-200 dark:border-stone-700",
    bg: "bg-stone-50 dark:bg-stone-800/50",
    icon: "text-stone-700 dark:text-stone-300",
  },
};
