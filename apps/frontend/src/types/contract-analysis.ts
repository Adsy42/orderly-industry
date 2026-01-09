/**
 * TypeScript types for contract analysis features.
 */

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface DetectedFlag {
  id: string;
  name: string;
  category: string;
  description: string;
  severity: Severity;
  start_char: number;
  end_char: number;
}
