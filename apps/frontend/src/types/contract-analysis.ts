export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type DocumentType = "contract_of_sale" | "section_32";

export interface RedFlagQuery {
  id: string;
  name: string;
  query: string;
  severity: Severity;
  category: string;
  description: string;
  action: string;
  financial_impact?: string;
}

export interface DetectedFlag extends RedFlagQuery {
  confidence: number; // 0.0 - 1.0
  start_char: number;
  end_char: number;
  matched_text: string;
}

export interface AnalysisResults {
  document_type: DocumentType;
  document_name: string;
  risk_score: number; // 0-100
  flags: DetectedFlag[];
  analyzed_at: string;
}

export type QueryStatus = "pending" | "checking" | "complete";

export interface QueryProgress {
  id: string;
  name: string;
  status: QueryStatus;
  detected?: boolean;
  confidence?: number;
}

export type DemoStep = "upload" | "playbook" | "analyzing" | "results";

export const SEVERITY_ORDER: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  CRITICAL: 25,
  HIGH: 15,
  MEDIUM: 8,
  LOW: 3,
};

export function getRiskLevel(
  score: number,
): "low" | "medium" | "high" | "critical" {
  if (score <= 30) return "low";
  if (score <= 60) return "medium";
  if (score <= 80) return "high";
  return "critical";
}

export function getRiskLabel(score: number): string {
  const level = getRiskLevel(score);
  return level.charAt(0).toUpperCase() + level.slice(1) + " Risk";
}
