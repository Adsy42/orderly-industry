import type { Playbook, PlaybookCheck } from "@/types/playbook";
import type { DocumentType } from "@/types/contract-analysis";
import { CONTRACT_QUERIES, SECTION32_QUERIES } from "./red-flag-queries";

// Helper to convert RedFlagQuery to PlaybookCheck
function fromRedFlagQuery(query: (typeof CONTRACT_QUERIES)[0]): PlaybookCheck {
  return {
    id: query.id,
    title: query.name,
    description: query.description,
    iql: query.query,
    severity: query.severity,
    category: query.category,
    action: query.action,
    financialImpact: query.financial_impact,
    source: "preset",
  };
}

/**
 * CONTRACT OF SALE - IQL Playbook
 * Victorian Property Transactions
 * Based on Victorian REIV/LIV Standard Contract
 */
export const CONTRACT_OF_SALE_PLAYBOOK: Playbook = {
  id: "contract-of-sale",
  name: "Contract of Sale",
  description:
    "Comprehensive Victorian property contract analysis covering parties, financial terms, settlement, conditions, property condition, inclusions, tenancies, and special conditions.",
  icon: "FileText",
  documentTypes: ["both"],
  isPreset: true,
  colorTheme: "blue",
  checks: CONTRACT_QUERIES.map(fromRedFlagQuery),
};

/**
 * SECTION 32 VENDOR STATEMENT - IQL Playbook
 * Victorian Property Transactions
 * Based on Sale of Land Act 1962 (Vic) requirements
 */
export const SECTION32_PLAYBOOK: Playbook = {
  id: "section-32",
  name: "Section 32 Vendor Statement",
  description:
    "Thorough Section 32 analysis covering financial matters, owner-builder work, building permits, land use restrictions, planning overlays, contamination, title matters, owners corporation, and services.",
  icon: "ClipboardCheck",
  documentTypes: ["both"],
  isPreset: true,
  colorTheme: "amber",
  checks: SECTION32_QUERIES.map(fromRedFlagQuery),
};

/**
 * All preset playbooks available in the system.
 */
export const PRESET_PLAYBOOKS: Playbook[] = [
  CONTRACT_OF_SALE_PLAYBOOK,
  SECTION32_PLAYBOOK,
];

/**
 * Get playbooks suitable for a document type.
 */
export function getPlaybooksForDocumentType(docType: DocumentType): Playbook[] {
  return PRESET_PLAYBOOKS.filter(
    (p) =>
      p.documentTypes.includes(docType) || p.documentTypes.includes("both"),
  );
}

/**
 * Get a playbook by ID.
 */
export function getPlaybookById(id: string): Playbook | undefined {
  return PRESET_PLAYBOOKS.find((p) => p.id === id);
}
