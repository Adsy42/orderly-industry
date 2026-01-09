import type { AnalysisResults, DetectedFlag } from "@/types/contract-analysis";
import { CONTRACT_QUERIES, SECTION32_QUERIES } from "./red-flag-queries";

// Helper to create a detected flag from a query
function createDetectedFlag(
  query: (typeof CONTRACT_QUERIES)[0],
  confidence: number,
  matchedText: string,
  startChar: number,
): DetectedFlag {
  return {
    ...query,
    confidence,
    start_char: startChar,
    end_char: startChar + matchedText.length,
    matched_text: matchedText,
  };
}

// Demo results for Contract of Sale sample
export const DEMO_CONTRACT_RESULTS: AnalysisResults = {
  document_type: "contract_of_sale",
  document_name: "Sample Contract of Sale - 42 Example Street, Richmond VIC",
  risk_score: 72,
  flags: [
    createDetectedFlag(
      CONTRACT_QUERIES.find((q) => q.id === "high_deposit")!,
      0.94,
      "The Purchaser shall pay a deposit of fifteen percent (15%) of the purchase price...",
      1245,
    ),
    createDetectedFlag(
      CONTRACT_QUERIES.find((q) => q.id === "short_settlement")!,
      0.89,
      "Settlement shall occur within twenty-one (21) days of the contract date...",
      2890,
    ),
    createDetectedFlag(
      CONTRACT_QUERIES.find((q) => q.id === "gst_additional")!,
      0.87,
      "GST is payable in addition to the purchase price if applicable under the GST Act...",
      3456,
    ),
    createDetectedFlag(
      CONTRACT_QUERIES.find((q) => q.id === "no_finance")!,
      0.92,
      "This contract is not subject to finance approval. The Purchaser warrants that they have sufficient funds...",
      4120,
    ),
    createDetectedFlag(
      CONTRACT_QUERIES.find((q) => q.id === "sunset_clause")!,
      0.85,
      "The Vendor may rescind this contract by notice in writing if settlement has not occurred by the Sunset Date...",
      5678,
    ),
    createDetectedFlag(
      CONTRACT_QUERIES.find((q) => q.id === "cooling_off_waived")!,
      0.91,
      "The Purchaser acknowledges that they have received independent legal advice and hereby waives the cooling-off period pursuant to Section 31...",
      6789,
    ),
    createDetectedFlag(
      CONTRACT_QUERIES.find((q) => q.id === "as_is_condition")!,
      0.78,
      "The property is sold in its present condition and the Vendor makes no warranties as to the condition...",
      7890,
    ),
    createDetectedFlag(
      CONTRACT_QUERIES.find((q) => q.id === "fixtures_excluded")!,
      0.72,
      "The following items are specifically excluded from the sale: built-in dishwasher, wall-mounted television brackets...",
      8901,
    ),
  ],
  analyzed_at: new Date().toISOString(),
};

// Demo results for Section 32 sample
export const DEMO_SECTION32_RESULTS: AnalysisResults = {
  document_type: "section_32",
  document_name:
    "Section 32 Vendor Statement - 42 Example Street, Richmond VIC",
  risk_score: 81,
  flags: [
    createDetectedFlag(
      SECTION32_QUERIES.find((q) => q.id === "caveat_on_title")!,
      0.96,
      "A caveat has been lodged on the Certificate of Title by National Australia Bank Limited claiming an interest as mortgagee...",
      890,
    ),
    createDetectedFlag(
      SECTION32_QUERIES.find((q) => q.id === "owner_builder")!,
      0.88,
      "Building work was carried out by the owner as an owner-builder under permit number OB-2022-4567 dated 15 March 2022...",
      2340,
    ),
    createDetectedFlag(
      SECTION32_QUERIES.find((q) => q.id === "heritage_overlay")!,
      0.91,
      "The property is affected by Heritage Overlay HO234 under the Yarra Planning Scheme...",
      3456,
    ),
    createDetectedFlag(
      SECTION32_QUERIES.find((q) => q.id === "flood_risk")!,
      0.84,
      "The land is subject to Special Building Overlay (SBO) as shown in the Planning Certificate...",
      4567,
    ),
    createDetectedFlag(
      SECTION32_QUERIES.find((q) => q.id === "easements")!,
      0.89,
      "The following easements are registered on the Certificate of Title: E-1 drainage easement 2.0m wide...",
      5678,
    ),
    createDetectedFlag(
      SECTION32_QUERIES.find((q) => q.id === "outstanding_rates")!,
      0.76,
      "Council rates: $1,245.67 outstanding as at the date of this statement...",
      6789,
    ),
    createDetectedFlag(
      SECTION32_QUERIES.find((q) => q.id === "missing_occupancy")!,
      0.82,
      "The rear extension constructed in 2021 has not yet received an Occupancy Permit...",
      7890,
    ),
    createDetectedFlag(
      SECTION32_QUERIES.find((q) => q.id === "bushfire_prone")!,
      0.71,
      "The property is located in a designated bushfire prone area under the Building Regulations 2018...",
      8901,
    ),
    createDetectedFlag(
      SECTION32_QUERIES.find((q) => q.id === "special_levy")!,
      0.87,
      "The Owners Corporation has passed a special resolution for a levy of $45,000 per lot for external cladding remediation...",
      9012,
    ),
  ],
  analyzed_at: new Date().toISOString(),
};

// Which queries should be "detected" in demo mode for each document type
export const DEMO_DETECTED_CONTRACT_IDS = DEMO_CONTRACT_RESULTS.flags.map(
  (f) => f.id,
);
export const DEMO_DETECTED_SECTION32_IDS = DEMO_SECTION32_RESULTS.flags.map(
  (f) => f.id,
);

// Demo timing configuration
export const DEMO_TIMING = {
  queryDelay: 180, // ms between each query check
  checkingDuration: 280, // ms spent "checking" each query
  totalQueries: 27,
  get totalDuration() {
    return this.totalQueries * (this.queryDelay + this.checkingDuration);
  },
};

// Sample document text for preview (abbreviated)
export const SAMPLE_CONTRACT_TEXT = `CONTRACT OF SALE OF REAL ESTATE
42 Example Street, Richmond VIC 3121

PARTIES
Vendor: John Smith and Jane Smith
Purchaser: [To be completed]

PROPERTY
The land comprised in Certificate of Title Volume 12345 Folio 678
Known as 42 Example Street, Richmond VIC 3121

PURCHASE PRICE
$1,250,000 (One Million Two Hundred and Fifty Thousand Dollars)

DEPOSIT
The Purchaser shall pay a deposit of fifteen percent (15%) of the purchase price being $187,500 upon signing this contract. The deposit shall be held in trust by the Vendor's legal representative until settlement.

SETTLEMENT
Settlement shall occur within twenty-one (21) days of the contract date. Time is of the essence in respect of settlement.

GST
GST is payable in addition to the purchase price if applicable under the GST Act. The Vendor warrants that the property is not a new residential premises for GST purposes.

FINANCE
This contract is not subject to finance approval. The Purchaser warrants that they have sufficient funds available to complete this purchase without requiring loan approval from any financial institution.

SUNSET CLAUSE
The Vendor may rescind this contract by notice in writing if settlement has not occurred by the Sunset Date, being 90 days from the contract date. Upon such rescission, the Vendor shall be entitled to retain the deposit as liquidated damages.

COOLING OFF
The Purchaser acknowledges that they have received independent legal advice and hereby waives the cooling-off period pursuant to Section 31 of the Sale of Land Act 1962 (Vic).

CONDITION
The property is sold in its present condition and the Vendor makes no warranties as to the condition, fitness for purpose, or compliance with any building regulations or standards.

EXCLUSIONS
The following items are specifically excluded from the sale: built-in dishwasher, wall-mounted television brackets, garden shed, and all potted plants.`;

export const SAMPLE_SECTION32_TEXT = `SECTION 32 VENDOR STATEMENT
Sale of Land Act 1962

PROPERTY: 42 Example Street, Richmond VIC 3121
VENDOR: John Smith and Jane Smith

TITLE PARTICULARS
Certificate of Title: Volume 12345 Folio 678
A caveat has been lodged on the Certificate of Title by National Australia Bank Limited claiming an interest as mortgagee under Mortgage No. AP123456.

OWNER BUILDER WARRANTY
Building work was carried out by the owner as an owner-builder under permit number OB-2022-4567 dated 15 March 2022. The work comprised a rear extension and renovation of the kitchen. As owner-builder work, no domestic building insurance applies.

PLANNING CONTROLS
The property is affected by Heritage Overlay HO234 under the Yarra Planning Scheme. Any external alterations require a planning permit.

The land is subject to Special Building Overlay (SBO) as shown in the Planning Certificate. This indicates the land may be subject to flooding.

EASEMENTS AND COVENANTS
The following easements are registered on the Certificate of Title: E-1 drainage easement 2.0m wide along the southern boundary in favour of Melbourne Water.

RATES AND CHARGES
Council rates: $1,245.67 outstanding as at the date of this statement. Land Tax: Paid in full.

BUILDING PERMITS
The rear extension constructed in 2021 has not yet received an Occupancy Permit. The building surveyor report is attached.

BUSHFIRE RISK
The property is located in a designated bushfire prone area under the Building Regulations 2018. A BAL assessment may be required for any future building work.

OWNERS CORPORATION
The Owners Corporation has passed a special resolution for a levy of $45,000 per lot for external cladding remediation works to be completed by December 2025. Payment schedule: 50% due March 2025, 50% due September 2025.`;
