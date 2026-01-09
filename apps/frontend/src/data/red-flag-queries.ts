import type { RedFlagQuery } from "@/types/contract-analysis";

/**
 * CONTRACT OF SALE - IQL Playbook Queries
 * Based on Victorian REIV/LIV Standard Contract
 * Organized by section from the IQL Playbook
 */
export const CONTRACT_QUERIES: RedFlagQuery[] = [
  // ============================================
  // SECTION 1: PARTIES
  // ============================================

  // 1.1 Vendor Identity
  {
    id: "cos_foreign_vendor",
    name: "Foreign Resident Vendor",
    query:
      "{IS clause that identifies the vendor as a foreign resident or non-Australian entity}",
    severity: "CRITICAL",
    category: "Vendor",
    description:
      "Vendor is identified as a foreign resident or overseas entity",
    action:
      "12.5% FIRB withholding applies. Purchaser must withhold at settlement unless clearance certificate provided.",
    financial_impact: "12.5% of purchase price withheld at settlement",
  },
  {
    id: "cos_corporate_vendor",
    name: "Corporate Vendor",
    query:
      "{IS clause that identifies the vendor as a company or corporation rather than an individual}",
    severity: "MEDIUM",
    category: "Vendor",
    description: "Vendor is a company or corporation",
    action:
      "Check ABN/ACN validity, director guarantees, company capacity to sell.",
    financial_impact: "Potential solvency risk",
  },
  {
    id: "cos_poa_vendor",
    name: "Vendor Acting Under Power of Attorney",
    query:
      "{IS clause that identifies a vendor acting under power of attorney}",
    severity: "MEDIUM",
    category: "Vendor",
    description: "Vendor is acting under power of attorney",
    action: "Verify POA validity and scope.",
    financial_impact: "Risk of invalid authority",
  },

  // 1.2 Purchaser Representation
  {
    id: "cos_lawyer_tba",
    name: "Purchaser Lawyer TBA",
    query:
      "{IS clause where the purchaser's legal practitioner is listed as TBA or to be advised}",
    severity: "MEDIUM",
    category: "Representation",
    description:
      "Purchaser's legal practitioner is listed as TBA or to be advised",
    action:
      "Purchaser has no independent legal advice. May not understand contract risks.",
    financial_impact: "Risk of uninformed decisions",
  },
  {
    id: "cos_lawyer_missing",
    name: "Purchaser Lawyer Details Missing",
    query:
      "{IS clause where the purchaser's legal practitioner details are blank or missing}",
    severity: "MEDIUM",
    category: "Representation",
    description: "Purchaser's legal practitioner details are blank or missing",
    action: "Same as above - purchaser may lack independent legal advice.",
    financial_impact: "Risk of uninformed decisions",
  },

  // ============================================
  // SECTION 2: FINANCIAL TERMS
  // ============================================

  // 2.1 Purchase Price & GST
  {
    id: "cos_gst_additional",
    name: "GST Payable on Top of Price",
    query:
      "{IS clause that states GST is payable in addition to or on top of the purchase price}",
    severity: "HIGH",
    category: "Financial",
    description: "GST is not included in the contract price",
    action:
      "Additional 10% cost. Major budget impact. Confirm margin scheme applicability.",
    financial_impact: "Up to 10% additional cost ($185K on $1.85M property)",
  },
  {
    id: "cos_taxable_supply",
    name: "Taxable Supply for GST",
    query:
      "{IS clause that indicates the sale is a taxable supply for GST purposes}",
    severity: "MEDIUM",
    category: "Financial",
    description: "Sale is indicated as a taxable supply for GST purposes",
    action: "May trigger GST obligations. Confirm margin scheme applicability.",
    financial_impact: "Potential GST liability",
  },
  {
    id: "cos_margin_scheme",
    name: "Margin Scheme Reference",
    query: "{IS clause that references the margin scheme for GST calculation}",
    severity: "LOW",
    category: "Financial",
    description: "Contract references the margin scheme for GST",
    action:
      "Affects GST calculation method. Generally favourable for purchaser.",
    financial_impact: "Usually beneficial",
  },

  // 2.2 Deposit
  {
    id: "cos_high_deposit",
    name: "Deposit Exceeds 10%",
    query:
      "{IS clause that specifies a deposit exceeding 10% of the purchase price}",
    severity: "HIGH",
    category: "Financial",
    description: "Deposit percentage is above the standard 10% maximum",
    action:
      "Standard is 10%. Higher deposit = more money at risk if contract fails.",
    financial_impact: "Increased capital at risk",
  },
  {
    id: "cos_deposit_15_percent",
    name: "Deposit 15% or More",
    query:
      "{IS clause that specifies a deposit of 15% or more of purchase price}",
    severity: "HIGH",
    category: "Financial",
    description: "Deposit is 15% or more of purchase price",
    action:
      "Significantly above market standard. Query why vendor requires this.",
    financial_impact: "Substantial capital at risk",
  },
  {
    id: "cos_deposit_release",
    name: "Early Deposit Release to Vendor",
    query:
      "{IS clause that allows the vendor to use the deposit before settlement}",
    severity: "HIGH",
    category: "Financial",
    description: "Vendor may use deposit before settlement",
    action:
      "If vendor defaults or becomes insolvent, deposit recovery is difficult.",
    financial_impact: "Full deposit at risk",
  },
  {
    id: "cos_non_refundable_deposit",
    name: "Non-Refundable Deposit",
    query: "{IS clause that specifies the deposit is non-refundable}",
    severity: "CRITICAL",
    category: "Financial",
    description: "Deposit is stated as non-refundable",
    action: "Purchaser loses deposit regardless of circumstances.",
    financial_impact: "Full deposit forfeiture risk",
  },

  // 2.3 Penalty Interest
  {
    id: "cos_high_penalty_interest",
    name: "High Penalty Interest Rate",
    query:
      "{IS clause that specifies penalty interest exceeding 2% per month or 24% per annum}",
    severity: "HIGH",
    category: "Financial",
    description:
      "Penalty interest rate exceeds standard (>2%/month or >24%/year)",
    action: "Predatory rate. Standard is ~2% above RBA cash rate.",
    financial_impact: "Severe cost if settlement delayed",
  },
  {
    id: "cos_daily_interest",
    name: "Daily Calculated Interest",
    query: "{IS clause that specifies default interest calculated daily}",
    severity: "MEDIUM",
    category: "Financial",
    description: "Default interest is calculated daily",
    action: "Compounds quickly. Check rate is reasonable.",
    financial_impact: "Rapid compounding cost",
  },

  // ============================================
  // SECTION 3: SETTLEMENT
  // ============================================

  // 3.1 Settlement Period
  {
    id: "cos_settlement_under_30",
    name: "Settlement Under 30 Days",
    query:
      "{IS clause that specifies a settlement period of less than 30 days}",
    severity: "CRITICAL",
    category: "Settlement",
    description: "Settlement period is less than 30 days",
    action: "Insufficient time for finance approval, searches, inspections.",
    financial_impact: "Risk of default if unable to settle in time",
  },
  {
    id: "cos_settlement_14_days",
    name: "Settlement Within 14 Days",
    query:
      "{IS clause that specifies settlement within 14 days of contract date}",
    severity: "CRITICAL",
    category: "Settlement",
    description: "Settlement is required within 14 days",
    action: "Virtually impossible to complete due diligence. Major red flag.",
    financial_impact: "High default risk",
  },
  {
    id: "cos_settlement_45_days",
    name: "Settlement 45 Days or Less",
    query: "{IS clause that specifies settlement within 45 days or less}",
    severity: "MEDIUM",
    category: "Settlement",
    description: "Settlement is 45 days or less",
    action:
      "Tighter than standard 60 days. May be acceptable but check finance timeline.",
    financial_impact: "Moderate time pressure",
  },
  {
    id: "cos_indefinite_settlement",
    name: "Indefinite Settlement Date",
    query:
      "{IS clause that specifies an indefinite or open-ended settlement date}",
    severity: "MEDIUM",
    category: "Settlement",
    description: "Settlement date is indefinite or open-ended",
    action: "Creates uncertainty. May favour one party.",
    financial_impact: "Unpredictable timeline",
  },

  // 3.2 Sunset Clause
  {
    id: "cos_vendor_only_sunset",
    name: "Vendor-Only Sunset Termination",
    query:
      "{IS clause that allows only the vendor to terminate under a sunset clause}",
    severity: "HIGH",
    category: "Settlement",
    description: "Only vendor can terminate under sunset clause",
    action: "One-sided. Vendor can walk away; purchaser cannot.",
    financial_impact: "Purchaser locked in while vendor has exit option",
  },
  {
    id: "cos_sunset_deposit_retention",
    name: "Vendor Retains Deposit on Sunset",
    query:
      "{IS clause that allows the vendor to retain the deposit upon sunset termination}",
    severity: "CRITICAL",
    category: "Settlement",
    description: "Vendor keeps deposit if sunset termination occurs",
    action: "Purchaser loses deposit through no fault of their own.",
    financial_impact: "Full deposit loss risk",
  },
  {
    id: "cos_short_sunset",
    name: "Short Sunset Period",
    query:
      "{IS clause that contains a sunset clause with termination date less than 12 months}",
    severity: "MEDIUM",
    category: "Settlement",
    description: "Sunset clause is less than 12 months",
    action: "Short sunset may indicate development risk or vendor pressure.",
    financial_impact: "Early termination risk",
  },

  // ============================================
  // SECTION 4: CONDITIONS
  // ============================================

  // 4.1 Finance Clause
  {
    id: "cos_no_finance",
    name: "No Finance Clause",
    query:
      "{IS clause that states the contract is NOT subject to finance or loan approval}",
    severity: "CRITICAL",
    category: "Conditions",
    description: "Contract is not conditional on loan approval",
    action: "If loan rejected, purchaser loses entire deposit.",
    financial_impact: "Deposit at risk if loan not approved",
  },
  {
    id: "cos_short_finance_period",
    name: "Short Finance Approval Period",
    query:
      "{IS clause that specifies a finance approval period of less than 14 days}",
    severity: "HIGH",
    category: "Conditions",
    description: "Finance approval period is less than 14 days",
    action: "Banks typically need 2-3 weeks minimum for approval.",
    financial_impact: "Risk of unconditional contract without finance",
  },
  {
    id: "cos_specific_lender",
    name: "Specific Lender Only",
    query:
      "{IS clause that limits the finance condition to a specific lender only}",
    severity: "MEDIUM",
    category: "Conditions",
    description: "Finance condition limited to specific lender",
    action: "Restricts purchaser's options if preferred lender declines.",
    financial_impact: "Limited financing options",
  },
  {
    id: "cos_accept_any_loan",
    name: "Must Accept Any Loan Terms",
    query:
      "{IS clause that requires the purchaser to accept any loan terms offered}",
    severity: "HIGH",
    category: "Conditions",
    description: "Purchaser must accept any loan terms offered",
    action: "Purchaser may be forced to accept unfavourable loan terms.",
    financial_impact: "Risk of unfavourable financing",
  },

  // 4.2 Cooling-Off Period
  {
    id: "cos_cooling_off_waived",
    name: "Cooling-Off Period Waived",
    query: "{IS clause where the purchaser waives the cooling-off period}",
    severity: "HIGH",
    category: "Conditions",
    description: "Purchaser has waived the cooling-off period",
    action: "No 3-day escape. Purchaser locked in immediately.",
    financial_impact: "No right to rescind",
  },
  {
    id: "cos_auction_purchase",
    name: "Auction Purchase",
    query:
      "{IS clause that acknowledges the property was purchased at auction}",
    severity: "LOW",
    category: "Conditions",
    description: "Property was purchased at auction",
    action: "Cooling-off doesn't apply to auctions (legitimate exclusion).",
    financial_impact: "Standard auction terms",
  },
  {
    id: "cos_section32_certificate",
    name: "Section 32 Waiver Certificate",
    query:
      "{IS clause that provides a Section 32 certificate from purchaser's solicitor}",
    severity: "LOW",
    category: "Conditions",
    description: "Section 32 certificate from purchaser's solicitor provided",
    action: "Legitimate waiver if purchaser had legal advice.",
    financial_impact: "Informed waiver",
  },

  // 4.3 Building & Pest Inspection
  {
    id: "cos_no_inspection",
    name: "No Building/Pest Inspection Clause",
    query:
      "{IS clause that states the contract is NOT subject to building or pest inspection}",
    severity: "MEDIUM",
    category: "Conditions",
    description: "Contract not subject to building or pest inspection",
    action:
      "Purchaser accepts property condition without independent assessment.",
    financial_impact: "Unknown defect exposure",
  },
  {
    id: "cos_short_inspection_period",
    name: "Short Inspection Period",
    query:
      "{IS clause that specifies a building inspection period of less than 7 days}",
    severity: "MEDIUM",
    category: "Conditions",
    description: "Building inspection period is less than 7 days",
    action: "May be difficult to arrange inspection in time.",
    financial_impact: "Risk of missed inspections",
  },

  // ============================================
  // SECTION 5: PROPERTY CONDITION
  // ============================================

  // 5.1 As-Is Clauses
  {
    id: "cos_as_is",
    name: "As-Is Sale",
    query:
      '{IS clause that sells the property "as is" or "as is where is" without warranties}',
    severity: "MEDIUM",
    category: "Property",
    description: "Property sold as-is without warranties",
    action: "Vendor accepts no responsibility for defects.",
    financial_impact: "No recourse for defects",
  },
  {
    id: "cos_no_warranties",
    name: "All Warranties Excluded",
    query:
      "{IS clause that excludes all vendor warranties regarding property condition}",
    severity: "MEDIUM",
    category: "Property",
    description: "All vendor warranties about condition are excluded",
    action: "May conflict with statutory warranties. Check scope.",
    financial_impact: "No warranty claims available",
  },
  {
    id: "cos_no_compliance_rep",
    name: "No Compliance Representations",
    query:
      "{IS clause that states the vendor makes no representations about compliance with laws}",
    severity: "HIGH",
    category: "Property",
    description: "Vendor makes no compliance representations",
    action: "Property may have compliance issues (permits, zoning, etc.).",
    financial_impact: "Potential compliance costs",
  },

  // 5.2 Inspections
  {
    id: "cos_limited_inspections",
    name: "Limited Inspection Rights",
    query:
      "{IS clause that limits purchaser inspections to one inspection or less than 2 inspections}",
    severity: "MEDIUM",
    category: "Property",
    description: "Inspections limited to one or fewer",
    action: "Standard is 2-3 inspections plus pre-settlement.",
    financial_impact: "Limited verification opportunity",
  },
  {
    id: "cos_short_inspection_time",
    name: "Short Inspection Duration",
    query: "{IS clause that limits inspection duration to 30 minutes or less}",
    severity: "MEDIUM",
    category: "Property",
    description: "Inspection duration limited to 30 minutes or less",
    action: "Insufficient time for thorough inspection.",
    financial_impact: "Risk of missed issues",
  },
  {
    id: "cos_inspection_notice",
    name: "Extended Inspection Notice",
    query: "{IS clause that requires 48 hours or more notice for inspections}",
    severity: "LOW",
    category: "Property",
    description: "48+ hours notice required for inspections",
    action: "Reasonable but may delay access.",
    financial_impact: "Minor scheduling impact",
  },
  {
    id: "cos_business_hours_only",
    name: "Business Hours Inspections Only",
    query: "{IS clause that restricts inspections to business hours only}",
    severity: "LOW",
    category: "Property",
    description: "Inspections restricted to business hours",
    action: "May be inconvenient but generally standard.",
    financial_impact: "Scheduling limitation",
  },

  // ============================================
  // SECTION 6: INCLUSIONS & EXCLUSIONS
  // ============================================

  {
    id: "cos_high_value_exclusions",
    name: "High-Value Fixtures Excluded",
    query:
      "{IS clause that excludes fixtures or chattels valued over $10,000 from the sale}",
    severity: "MEDIUM",
    category: "Inclusions",
    description: "Fixtures/chattels over $10,000 excluded from sale",
    action: "High-value items being removed. Verify what's included.",
    financial_impact: "Replacement cost significant",
  },
  {
    id: "cos_appliances_excluded",
    name: "Integrated Appliances Excluded",
    query:
      "{IS clause that excludes integrated appliances such as refrigerator, dishwasher, or wine cellar}",
    severity: "MEDIUM",
    category: "Inclusions",
    description: "Integrated appliances excluded from sale",
    action: "These are typically included. Replacement cost significant.",
    financial_impact: "Appliance replacement costs",
  },
  {
    id: "cos_vague_inclusions",
    name: "Vague Inclusions Description",
    query:
      '{IS clause where inclusions are described as "as inspected" without specific list}',
    severity: "LOW",
    category: "Inclusions",
    description: "Inclusions described vaguely as 'as inspected'",
    action: "Vague. Could lead to disputes.",
    financial_impact: "Potential disputes",
  },
  {
    id: "cos_vendor_discretion",
    name: "Vendor Discretion on Removals",
    query: "{IS clause that allows vendor to remove items at their discretion}",
    severity: "MEDIUM",
    category: "Inclusions",
    description: "Vendor can remove items at their discretion",
    action: "Creates uncertainty about what purchaser will receive.",
    financial_impact: "Unknown final inclusions",
  },

  // ============================================
  // SECTION 7: TENANCIES & POSSESSION
  // ============================================

  {
    id: "cos_existing_tenancy",
    name: "Existing Tenancy Disclosed",
    query:
      "{IS clause that discloses an existing tenancy or lease affecting the property}",
    severity: "MEDIUM",
    category: "Tenancy",
    description: "Property subject to existing tenancy or lease",
    action: "Purchaser cannot occupy immediately. Check lease terms.",
    financial_impact: "Delayed possession",
  },
  {
    id: "cos_long_tenancy",
    name: "Long-Term Tenancy",
    query:
      "{IS clause that discloses a tenancy extending more than 12 months beyond settlement}",
    severity: "HIGH",
    category: "Tenancy",
    description: "Tenancy extends more than 12 months beyond settlement",
    action: "Long-term commitment purchaser inherits. Check rent vs market.",
    financial_impact: "Extended vacancy restriction",
  },
  {
    id: "cos_related_tenant",
    name: "Related Party Tenant",
    query:
      "{IS clause that identifies the tenant as a related party to the vendor}",
    severity: "HIGH",
    category: "Tenancy",
    description: "Tenant is related party to vendor",
    action: "May be non-arm's length arrangement. Check rent, lease terms.",
    financial_impact: "Potential below-market terms",
  },
  {
    id: "cos_below_market_rent",
    name: "Below Market Rent",
    query: "{IS clause that discloses rent significantly below market rate}",
    severity: "MEDIUM",
    category: "Tenancy",
    description: "Rent is significantly below market rate",
    action:
      "Below-market rent may indicate related party or problematic tenant.",
    financial_impact: "Reduced rental income",
  },
  {
    id: "cos_no_vacant_possession",
    name: "No Vacant Possession",
    query:
      "{IS clause that does NOT provide for vacant possession at settlement}",
    severity: "MEDIUM",
    category: "Tenancy",
    description: "Vacant possession not provided at settlement",
    action: "Confirm purchaser understands they cannot move in.",
    financial_impact: "Cannot occupy property",
  },

  // ============================================
  // SECTION 8: DISPUTE RESOLUTION
  // ============================================

  {
    id: "cos_foreign_jurisdiction",
    name: "Foreign Jurisdiction for Disputes",
    query:
      "{IS clause that requires disputes to be resolved in a foreign jurisdiction}",
    severity: "HIGH",
    category: "Disputes",
    description: "Disputes must be resolved in foreign jurisdiction",
    action: "Expensive and impractical to pursue claims overseas.",
    financial_impact: "High legal costs if dispute arises",
  },
  {
    id: "cos_arbitration_required",
    name: "Arbitration Required",
    query:
      "{IS clause that requires arbitration rather than court proceedings}",
    severity: "MEDIUM",
    category: "Disputes",
    description: "Arbitration required instead of court",
    action: "May limit remedies. Check arbitration rules.",
    financial_impact: "Limited dispute options",
  },
  {
    id: "cos_foreign_law",
    name: "Foreign Law Governs Contract",
    query: "{IS clause that specifies the contract is governed by foreign law}",
    severity: "HIGH",
    category: "Disputes",
    description: "Contract governed by foreign law",
    action: "Victorian consumer protections may not apply.",
    financial_impact: "Reduced legal protections",
  },

  // ============================================
  // SECTION 9: SPECIAL CONDITIONS - RED FLAGS
  // ============================================

  {
    id: "cos_unusual_conditions",
    name: "Unusual Special Conditions",
    query:
      "{IS clause that contains unusual or non-standard special conditions}",
    severity: "MEDIUM",
    category: "Special",
    description: "Contract contains unusual or non-standard conditions",
    action: "May contain hidden risks. Review carefully.",
    financial_impact: "Unknown risks",
  },
  {
    id: "cos_waived_statutory_rights",
    name: "Statutory Rights Waived",
    query: "{IS clause that waives or limits the purchaser's statutory rights}",
    severity: "HIGH",
    category: "Special",
    description: "Purchaser's statutory rights are waived or limited",
    action: "May be unenforceable but creates risk.",
    financial_impact: "Reduced legal protections",
  },
  {
    id: "cos_vendor_indemnity",
    name: "Broad Vendor Indemnity",
    query: "{IS clause that indemnifies the vendor against all claims}",
    severity: "HIGH",
    category: "Special",
    description: "Purchaser indemnifies vendor against all claims",
    action: "Shifts all risk to purchaser.",
    financial_impact: "Full liability exposure",
  },
  {
    id: "cos_property_substitution",
    name: "Property Substitution Allowed",
    query: "{IS clause that allows the vendor to substitute the property}",
    severity: "CRITICAL",
    category: "Special",
    description: "Vendor can substitute a different property",
    action: "Purchaser may receive different property than contracted.",
    financial_impact: "Complete uncertainty",
  },
];

/**
 * SECTION 32 VENDOR STATEMENT - IQL Playbook Queries
 * Based on Sale of Land Act 1962 (Vic) requirements
 * InfoTrack standard format
 */
export const SECTION32_QUERIES: RedFlagQuery[] = [
  // ============================================
  // SECTION 1: FINANCIAL MATTERS
  // ============================================

  // 1.1 Rates & Outgoings
  {
    id: "s32_outstanding_rates",
    name: "Outstanding Council Rates",
    query: "{IS clause that discloses outstanding or unpaid council rates}",
    severity: "MEDIUM",
    category: "Financial",
    description: "Council rates are outstanding or unpaid",
    action:
      "Must be cleared at settlement. Large arrears may indicate vendor financial stress.",
    financial_impact: "Amount outstanding plus interest",
  },
  {
    id: "s32_outstanding_water",
    name: "Outstanding Water Rates",
    query: "{IS clause that discloses outstanding or unpaid water rates}",
    severity: "MEDIUM",
    category: "Financial",
    description: "Water rates are outstanding or unpaid",
    action: "Water authority may have charge over property.",
    financial_impact: "Amount outstanding",
  },
  {
    id: "s32_outstanding_land_tax",
    name: "Outstanding Land Tax",
    query: "{IS clause that discloses unpaid or outstanding land tax}",
    severity: "MEDIUM",
    category: "Financial",
    description: "Land tax is unpaid or outstanding",
    action: "SRO may have first charge. Must clear at settlement.",
    financial_impact: "Amount outstanding",
  },
  {
    id: "s32_high_outgoings",
    name: "High Annual Outgoings",
    query:
      "{IS clause that discloses total outgoings exceeding $10,000 per annum}",
    severity: "LOW",
    category: "Financial",
    description: "Total outgoings exceed $10,000 per annum",
    action: "High ongoing costs. Factor into affordability.",
    financial_impact: "$10,000+ per annum",
  },

  // 1.2 Owners Corporation Fees & Levies
  {
    id: "s32_special_levy_high",
    name: "Special Levy Over $10,000",
    query:
      "{IS clause that discloses an owners corporation special levy exceeding $10,000}",
    severity: "HIGH",
    category: "Owners Corp",
    description: "OC special levy exceeds $10,000",
    action: "Major unexpected cost. Check what it's for and payment schedule.",
    financial_impact: "Amount of special levy",
  },
  {
    id: "s32_cladding_levy",
    name: "Cladding Remediation Levy",
    query:
      "{IS clause that discloses an owners corporation special levy for cladding remediation}",
    severity: "HIGH",
    category: "Owners Corp",
    description: "Special levy for cladding remediation",
    action: "Combustible cladding is expensive to fix. Levies can be $50K+.",
    financial_impact: "$50,000+ potential",
  },
  {
    id: "s32_high_oc_fees",
    name: "High OC Annual Fees",
    query:
      "{IS clause that discloses owners corporation fees exceeding $10,000 per annum}",
    severity: "MEDIUM",
    category: "Owners Corp",
    description: "OC fees exceed $10,000 per annum",
    action: "High ongoing cost. Common in CBD/Docklands apartments.",
    financial_impact: "$10,000+ per annum",
  },
  {
    id: "s32_imminent_levy",
    name: "Imminent Special Levy",
    query:
      "{IS clause that discloses a special levy payment due within 90 days of settlement}",
    severity: "HIGH",
    category: "Owners Corp",
    description: "Special levy due within 90 days of settlement",
    action: "Purchaser inherits payment obligation immediately.",
    financial_impact: "Immediate payment required",
  },

  // 1.3 Charges & Mortgages
  {
    id: "s32_undischarged_mortgage",
    name: "Undischarged Mortgage/Charge",
    query:
      "{IS clause that discloses a charge or mortgage that will NOT be discharged at settlement}",
    severity: "CRITICAL",
    category: "Financial",
    description: "Mortgage/charge will not be discharged at settlement",
    action: "Purchaser takes property subject to existing debt.",
    financial_impact: "Inherited debt obligation",
  },
  {
    id: "s32_statutory_charge",
    name: "Statutory Charge on Title",
    query:
      "{IS clause that discloses a statutory charge imposed under any Act}",
    severity: "MEDIUM",
    category: "Financial",
    description: "Statutory charge is registered on title",
    action: "May affect title. Check nature and amount.",
    financial_impact: "Amount of charge",
  },

  // ============================================
  // SECTION 2: INSURANCE & OWNER-BUILDER
  // ============================================

  // 2.1 Owner-Builder Work
  {
    id: "s32_owner_builder",
    name: "Owner-Builder Work (6 Years)",
    query:
      "{IS clause that discloses owner-builder work within the preceding 6 years}",
    severity: "MEDIUM",
    category: "Building",
    description: "Owner-builder work done within past 6 years",
    action: "Triggers Section 137B Building Act requirements. Check insurance.",
    financial_impact: "No warranty recourse for defects",
  },
  {
    id: "s32_no_ob_insurance",
    name: "No Owner-Builder Insurance",
    query:
      "{IS clause that indicates domestic building insurance was NOT obtained for owner-builder work}",
    severity: "CRITICAL",
    category: "Building",
    description: "No domestic building insurance for owner-builder work",
    action: "NO WARRANTY COVERAGE. Purchaser inherits all defect risk.",
    financial_impact: "Full defect liability",
  },
  {
    id: "s32_high_risk_ob_work",
    name: "High-Risk Owner-Builder Work",
    query:
      "{IS clause that discloses owner-builder work to bathroom, kitchen, or structural elements}",
    severity: "HIGH",
    category: "Building",
    description: "Owner-builder work on bathroom, kitchen, or structural",
    action:
      "High-risk areas for defects. Water damage, structural issues common.",
    financial_impact: "Potential major rectification costs",
  },
  {
    id: "s32_ob_over_threshold",
    name: "Owner-Builder Work Over $16K",
    query: "{IS clause that discloses owner-builder work valued over $16,000}",
    severity: "MEDIUM",
    category: "Building",
    description: "Owner-builder work valued over $16,000",
    action: "Above threshold requiring domestic building insurance.",
    financial_impact: "Insurance requirement triggered",
  },

  // 2.2 Building Permits & Certificates
  {
    id: "s32_no_permit",
    name: "Building Work Without Permit",
    query:
      "{IS clause that discloses building work undertaken WITHOUT a building permit}",
    severity: "HIGH",
    category: "Building",
    description: "Building work done without permit",
    action: "Illegal work. Council may require demolition or rectification.",
    financial_impact: "Rectification or demolition costs",
  },
  {
    id: "s32_no_occupancy",
    name: "No Occupancy Certificate",
    query:
      "{IS clause that indicates an occupancy certificate or certificate of final inspection was NOT obtained}",
    severity: "HIGH",
    category: "Building",
    description: "No occupancy certificate or final inspection",
    action: "Building work not signed off. May not comply with Building Code.",
    financial_impact: "Compliance costs unknown",
  },
  {
    id: "s32_recent_permit",
    name: "Recent Building Permit",
    query:
      "{IS clause that discloses a building permit issued in the preceding 7 years}",
    severity: "LOW",
    category: "Building",
    description: "Building permit issued within past 7 years",
    action: "Recent work. Verify completion and compliance.",
    financial_impact: "Verification recommended",
  },
  {
    id: "s32_incomplete_inspection",
    name: "Final Inspection Not Complete",
    query:
      "{IS clause that discloses building work where final inspection has not been completed}",
    severity: "MEDIUM",
    category: "Building",
    description: "Final inspection not completed for building work",
    action: "Work may be incomplete or non-compliant.",
    financial_impact: "Potential compliance issues",
  },

  // 2.3 Building Notices & Orders
  {
    id: "s32_building_order",
    name: "Building Notice/Order",
    query:
      "{IS clause that discloses a building notice, building order, or compliance notice}",
    severity: "CRITICAL",
    category: "Building",
    description: "Building notice, order, or compliance notice exists",
    action:
      "Active enforcement action. Purchaser inherits compliance obligation.",
    financial_impact: "Compliance costs plus potential fines",
  },
  {
    id: "s32_overdue_order",
    name: "Overdue Building Order",
    query:
      "{IS clause that discloses a building order where the compliance deadline has passed}",
    severity: "CRITICAL",
    category: "Building",
    description: "Building order deadline has passed",
    action: "Vendor in breach. Council may prosecute or issue fines.",
    financial_impact: "Fines plus immediate compliance required",
  },
  {
    id: "s32_safety_notice",
    name: "Safety-Related Building Notice",
    query:
      "{IS clause that discloses a building notice relating to balcony, balustrade, or pool fence}",
    severity: "HIGH",
    category: "Building",
    description: "Building notice for balcony, balustrade, or pool fence",
    action: "Safety issues. Common compliance problems.",
    financial_impact: "Safety rectification costs",
  },

  // ============================================
  // SECTION 3: LAND USE & RESTRICTIONS
  // ============================================

  // 3.1 Easements
  {
    id: "s32_easement",
    name: "Easement on Property",
    query: "{IS clause that discloses an easement affecting the property}",
    severity: "LOW",
    category: "Title",
    description: "Easement affects the property",
    action: "May restrict building or use. Common and usually manageable.",
    financial_impact: "May limit building envelope",
  },
  {
    id: "s32_multiple_easements",
    name: "Multiple Easements",
    query:
      "{IS clause that discloses multiple easements affecting the property}",
    severity: "MEDIUM",
    category: "Title",
    description: "Multiple easements affect the property",
    action: "Multiple restrictions compound limitations on property use.",
    financial_impact: "Significant use restrictions",
  },
  {
    id: "s32_drainage_easement",
    name: "Drainage/Sewerage Easement",
    query: "{IS clause that discloses an easement for drainage or sewerage}",
    severity: "LOW",
    category: "Title",
    description: "Drainage or sewerage easement on property",
    action: "Standard. Check width and location relative to dwelling.",
    financial_impact: "Building setback requirements",
  },
  {
    id: "s32_power_easement",
    name: "Electricity/Power Easement",
    query:
      "{IS clause that discloses an easement for electricity or power lines}",
    severity: "MEDIUM",
    category: "Title",
    description: "Electricity or power easement on property",
    action: "May have powerlines overhead or underground infrastructure.",
    financial_impact: "Building restrictions near easement",
  },
  {
    id: "s32_party_wall",
    name: "Party Wall Easement",
    query: "{IS clause that discloses a party wall easement}",
    severity: "LOW",
    category: "Title",
    description: "Party wall easement exists",
    action:
      "Shared structural elements with neighbour. Standard for townhouses/units.",
    financial_impact: "Shared maintenance obligations",
  },

  // 3.2 Covenants & Restrictions
  {
    id: "s32_restrictive_covenant",
    name: "Restrictive Covenant",
    query:
      "{IS clause that discloses a restrictive covenant affecting the property}",
    severity: "MEDIUM",
    category: "Title",
    description: "Restrictive covenant affects property",
    action: "Permanent restriction on use. Cannot be easily removed.",
    financial_impact: "Limited future options",
  },
  {
    id: "s32_single_dwelling",
    name: "Single Dwelling Covenant",
    query:
      "{IS clause that discloses a single dwelling covenant or restriction}",
    severity: "MEDIUM",
    category: "Title",
    description: "Single dwelling covenant or restriction exists",
    action: "Cannot subdivide or build second dwelling. Limits future options.",
    financial_impact: "No subdivision potential",
  },
  {
    id: "s32_no_airbnb",
    name: "Short-Stay Prohibition",
    query:
      "{IS clause that prohibits short-stay accommodation, Airbnb, or holiday rentals}",
    severity: "MEDIUM",
    category: "Title",
    description: "Short-stay/Airbnb prohibited",
    action: "Cannot use for short-term rental income.",
    financial_impact: "No short-term rental option",
  },
  {
    id: "s32_no_commercial",
    name: "Commercial Use Restriction",
    query: "{IS clause that discloses a covenant restricting commercial use}",
    severity: "LOW",
    category: "Title",
    description: "Commercial use restricted",
    action: "Residential use only. Standard for residential zones.",
    financial_impact: "Home business limitations",
  },
  {
    id: "s32_building_restrictions",
    name: "Building Height/Materials Restriction",
    query:
      "{IS clause that discloses a covenant restricting building height or materials}",
    severity: "LOW",
    category: "Title",
    description: "Building height or materials restricted",
    action: "May affect future renovation/extension plans.",
    financial_impact: "Design limitations",
  },

  // 3.3 Road Access
  {
    id: "s32_no_road_access",
    name: "No Legal Road Access",
    query:
      "{IS clause that indicates there is NO legal road access to the property}",
    severity: "CRITICAL",
    category: "Title",
    description: "Property has no legal road access",
    action: "Landlocked property. Major issue for access, services, value.",
    financial_impact: "Severe value impact, access issues",
  },
  {
    id: "s32_private_road",
    name: "Private Road/Right of Way Access",
    query:
      "{IS clause that discloses access via a right of carriageway or private road}",
    severity: "MEDIUM",
    category: "Title",
    description: "Access via right of carriageway or private road",
    action: "Shared access. Check maintenance obligations.",
    financial_impact: "Shared maintenance costs",
  },

  // ============================================
  // SECTION 4: PLANNING & OVERLAYS
  // ============================================

  // 4.1 Planning Zone
  {
    id: "s32_non_residential_zone",
    name: "Non-Residential Zoning",
    query:
      "{IS clause that discloses the property is in a zone other than residential}",
    severity: "MEDIUM",
    category: "Planning",
    description: "Property zoned other than residential",
    action: "May affect permitted uses, future development.",
    financial_impact: "Use restrictions apply",
  },
  {
    id: "s32_nrz",
    name: "Neighbourhood Residential Zone",
    query:
      "{IS clause that discloses the property is in a Neighbourhood Residential Zone}",
    severity: "LOW",
    category: "Planning",
    description: "Property in Neighbourhood Residential Zone",
    action: "More restrictive than General Residential. Height/density limits.",
    financial_impact: "Development limitations",
  },

  // 4.2 Overlays - Environmental
  {
    id: "s32_heritage_overlay",
    name: "Heritage Overlay",
    query:
      "{IS clause that discloses a heritage overlay affecting the property}",
    severity: "HIGH",
    category: "Planning",
    description: "Heritage overlay affects property",
    action: "Severe restrictions on alterations. Heritage permits required.",
    financial_impact: "Renovation costs significantly higher",
  },
  {
    id: "s32_landscape_overlay",
    name: "Significant Landscape Overlay",
    query:
      "{IS clause that discloses a Significant Landscape Overlay affecting the property}",
    severity: "MEDIUM",
    category: "Planning",
    description: "Significant Landscape Overlay affects property",
    action: "Permits required to remove vegetation. May affect development.",
    financial_impact: "Vegetation removal restrictions",
  },
  {
    id: "s32_vegetation_overlay",
    name: "Vegetation Protection Overlay",
    query: "{IS clause that discloses a Vegetation Protection Overlay}",
    severity: "MEDIUM",
    category: "Planning",
    description: "Vegetation Protection Overlay affects property",
    action: "Tree removal restricted. Check before planning works.",
    financial_impact: "Tree preservation requirements",
  },
  {
    id: "s32_environmental_overlay",
    name: "Environmental Significance Overlay",
    query: "{IS clause that discloses an Environmental Significance Overlay}",
    severity: "MEDIUM",
    category: "Planning",
    description: "Environmental Significance Overlay affects property",
    action: "Environmental constraints on development.",
    financial_impact: "Development restrictions",
  },

  // 4.3 Overlays - Hazards
  {
    id: "s32_flood_overlay",
    name: "Flood Risk (SBO)",
    query:
      "{IS clause that discloses a Special Building Overlay or flood overlay}",
    severity: "HIGH",
    category: "Planning",
    description: "Special Building Overlay (flood) affects property",
    action: "FLOOD RISK. Insurance costs higher. Building restrictions apply.",
    financial_impact: "Higher insurance, building requirements",
  },
  {
    id: "s32_inundation",
    name: "Land Subject to Inundation",
    query: "{IS clause that discloses a Land Subject to Inundation Overlay}",
    severity: "HIGH",
    category: "Planning",
    description: "Land Subject to Inundation Overlay affects property",
    action: "Flood prone area. Same concerns as SBO.",
    financial_impact: "Flood risk and insurance issues",
  },
  {
    id: "s32_bushfire",
    name: "Bushfire Prone Area",
    query:
      "{IS clause that designates the land as bushfire prone under the Building Act}",
    severity: "MEDIUM",
    category: "Planning",
    description: "Land designated as bushfire prone",
    action: "Higher insurance, building standards, evacuation planning.",
    financial_impact: "Increased insurance and building costs",
  },
  {
    id: "s32_high_bal",
    name: "High BAL Rating (29+)",
    query: "{IS clause that discloses a BAL rating of BAL-29 or higher}",
    severity: "HIGH",
    category: "Planning",
    description: "BAL rating is 29 or higher",
    action: "High bushfire risk. Significant building requirements.",
    financial_impact: "Major building cost premium",
  },
  {
    id: "s32_erosion",
    name: "Erosion/Landslip Risk",
    query:
      "{IS clause that discloses an Erosion Management Overlay or landslip risk}",
    severity: "HIGH",
    category: "Planning",
    description: "Erosion Management Overlay or landslip risk identified",
    action: "Ground stability issues. May affect building.",
    financial_impact: "Geotechnical assessment required",
  },

  // ============================================
  // SECTION 5: NOTICES & CONTAMINATION
  // ============================================

  // 5.1 Public Authority Notices
  {
    id: "s32_authority_notice",
    name: "Public Authority Notice",
    query:
      "{IS clause that discloses notices, orders, or recommendations from a public authority}",
    severity: "MEDIUM",
    category: "Notices",
    description: "Notice from public authority disclosed",
    action: "May require action or affect property use.",
    financial_impact: "Potential compliance costs",
  },
  {
    id: "s32_vicroads_notice",
    name: "VicRoads Notice",
    query:
      "{IS clause that discloses a notice or proposal from VicRoads affecting the property}",
    severity: "HIGH",
    category: "Notices",
    description: "VicRoads notice or proposal affects property",
    action: "Road widening or acquisition may affect property.",
    financial_impact: "Potential land acquisition",
  },
  {
    id: "s32_neighbour_da",
    name: "Neighbour Planning Application",
    query:
      "{IS clause that discloses a pending planning application on an adjoining property}",
    severity: "LOW",
    category: "Notices",
    description: "Planning application pending on adjoining property",
    action: "Neighbour development may affect amenity, views, privacy.",
    financial_impact: "Potential amenity impact",
  },

  // 5.2 Contamination
  {
    id: "s32_contamination",
    name: "EPA/Contamination Disclosure",
    query:
      "{IS clause that discloses contamination or lists the property on the EPA Priority Sites Register}",
    severity: "CRITICAL",
    category: "Environmental",
    description: "Contamination or EPA Priority Sites Register listing",
    action: "Remediation costs can be enormous. Health risks.",
    financial_impact: "$50K-$500K+ remediation potential",
  },
  {
    id: "s32_high_risk_prior_use",
    name: "High-Risk Prior Use",
    query:
      "{IS clause that discloses the land was previously used for dry cleaning, petrol station, or industrial purposes}",
    severity: "HIGH",
    category: "Environmental",
    description: "Previous high-risk land use disclosed",
    action: "High risk of soil/groundwater contamination.",
    financial_impact: "Environmental assessment required",
  },
  {
    id: "s32_no_audit",
    name: "No Environmental Audit",
    query:
      "{IS clause that indicates an environmental audit has NOT been conducted}",
    severity: "MEDIUM",
    category: "Environmental",
    description: "No environmental audit conducted",
    action: "Unknown contamination status. Consider commissioning audit.",
    financial_impact: "Audit cost $5,000-$20,000",
  },
  {
    id: "s32_agricultural_contamination",
    name: "Agricultural Contamination",
    query:
      "{IS clause that discloses contamination from agricultural chemicals or livestock disease}",
    severity: "MEDIUM",
    category: "Environmental",
    description: "Agricultural chemical or livestock disease contamination",
    action: "May affect land use, particularly for rural properties.",
    financial_impact: "Use restrictions possible",
  },

  // 5.3 Compulsory Acquisition
  {
    id: "s32_compulsory_acquisition",
    name: "Compulsory Acquisition Notice",
    query:
      "{IS clause that discloses a notice of intention to acquire the land}",
    severity: "CRITICAL",
    category: "Title",
    description: "Notice of intention to acquire the land",
    action: "Government taking the property. Do not proceed.",
    financial_impact: "Property will be acquired",
  },

  // ============================================
  // SECTION 6: TITLE MATTERS
  // ============================================

  // 6.1 Caveats
  {
    id: "s32_caveat",
    name: "Caveat on Title",
    query: "{IS clause that discloses a caveat registered on the title}",
    severity: "CRITICAL",
    category: "Title",
    description: "Caveat registered on title",
    action: "Third party claims interest. CANNOT SETTLE until removed.",
    financial_impact: "Settlement blocked",
  },
  {
    id: "s32_caveat_removal_required",
    name: "Caveat Must Be Removed",
    query:
      "{IS clause that indicates a caveat must be removed before settlement can occur}",
    severity: "CRITICAL",
    category: "Title",
    description: "Caveat must be removed before settlement",
    action: "Settlement blocked until resolved. Major risk.",
    financial_impact: "Delayed settlement, legal costs",
  },
  {
    id: "s32_lender_caveat",
    name: "Lender/Financier Caveat",
    query:
      "{IS clause that discloses a caveat lodged by a lender or financier}",
    severity: "CRITICAL",
    category: "Title",
    description: "Caveat lodged by lender or financier",
    action: "Vendor has undisclosed debt secured against property.",
    financial_impact: "Hidden debt exposure",
  },

  // 6.2 Title Issues
  {
    id: "s32_general_law",
    name: "General Law Land (Not Torrens)",
    query:
      "{IS clause that indicates the title is general law land rather than Torrens title}",
    severity: "MEDIUM",
    category: "Title",
    description: "Title is general law rather than Torrens",
    action: "More complex conveyancing. Title insurance recommended.",
    financial_impact: "Higher legal costs",
  },
  {
    id: "s32_unregistered_interest",
    name: "Unregistered Interest on Title",
    query:
      "{IS clause that discloses an unregistered interest affecting the title}",
    severity: "MEDIUM",
    category: "Title",
    description: "Unregistered interest affects title",
    action: "May not appear on title search but still affects property.",
    financial_impact: "Unknown encumbrance",
  },

  // ============================================
  // SECTION 7: OWNERS CORPORATION
  // ============================================

  // 7.1 OC Status
  {
    id: "s32_oc_exists",
    name: "Owners Corporation Exists",
    query:
      "{IS clause that indicates the property is affected by an owners corporation}",
    severity: "LOW",
    category: "Owners Corp",
    description: "Property affected by owners corporation",
    action: "Shared property. Check rules, fees, financial health.",
    financial_impact: "Ongoing OC fees apply",
  },
  {
    id: "s32_oc_litigation",
    name: "OC Litigation",
    query:
      "{IS clause that discloses current litigation involving the owners corporation}",
    severity: "HIGH",
    category: "Owners Corp",
    description: "OC involved in current litigation",
    action: "Legal costs, uncertainty, potential special levies.",
    financial_impact: "Unknown legal cost exposure",
  },
  {
    id: "s32_oc_underinsured",
    name: "OC Inadequate Insurance",
    query:
      "{IS clause that discloses the owners corporation has inadequate insurance}",
    severity: "HIGH",
    category: "Owners Corp",
    description: "OC has inadequate insurance",
    action: "Building may be underinsured. Risk exposure.",
    financial_impact: "Uninsured loss risk",
  },
  {
    id: "s32_oc_deficit",
    name: "OC Financial Deficit",
    query:
      "{IS clause that discloses owners corporation deficits or inadequate sinking fund}",
    severity: "MEDIUM",
    category: "Owners Corp",
    description: "OC has financial deficit or inadequate sinking fund",
    action: "Future special levies likely to cover shortfall.",
    financial_impact: "Future levy risk",
  },

  // 7.2 Building Defects
  {
    id: "s32_building_defects",
    name: "OC Building Defects",
    query:
      "{IS clause that discloses building defects identified in an owners corporation}",
    severity: "HIGH",
    category: "Owners Corp",
    description: "Building defects identified in OC",
    action: "Rectification costs coming. Check scope and timeline.",
    financial_impact: "Levy for rectification",
  },
  {
    id: "s32_combustible_cladding",
    name: "Combustible Cladding",
    query: "{IS clause that discloses combustible cladding on the building}",
    severity: "HIGH",
    category: "Owners Corp",
    description: "Combustible cladding on building",
    action: "$50K+ special levies common. Insurance issues.",
    financial_impact: "$50,000+ levy potential",
  },
  {
    id: "s32_waterproofing_defects",
    name: "Waterproofing/Water Ingress",
    query:
      "{IS clause that discloses waterproofing defects or water ingress issues}",
    severity: "HIGH",
    category: "Owners Corp",
    description: "Waterproofing defects or water ingress issues",
    action: "Expensive to fix. May cause ongoing damage.",
    financial_impact: "Major rectification costs",
  },

  // ============================================
  // SECTION 8: SERVICES
  // ============================================

  {
    id: "s32_no_electricity",
    name: "No Electricity Connection",
    query:
      "{IS clause that indicates electricity is NOT connected to the property}",
    severity: "MEDIUM",
    category: "Services",
    description: "Electricity not connected",
    action: "Connection costs. Common for vacant land.",
    financial_impact: "Connection costs apply",
  },
  {
    id: "s32_no_sewerage",
    name: "No Sewerage Connection",
    query:
      "{IS clause that indicates sewerage is NOT connected to the property}",
    severity: "MEDIUM",
    category: "Services",
    description: "Sewerage not connected",
    action: "May have septic system. Check compliance and condition.",
    financial_impact: "Septic maintenance costs",
  },
  {
    id: "s32_septic",
    name: "Septic Tank System",
    query: "{IS clause that indicates the property has a septic tank system}",
    severity: "LOW",
    category: "Services",
    description: "Property has septic tank system",
    action: "Requires maintenance. Check EPA compliance.",
    financial_impact: "Ongoing maintenance required",
  },
  {
    id: "s32_no_gas",
    name: "No Gas Connection",
    query: "{IS clause that indicates gas is NOT connected to the property}",
    severity: "LOW",
    category: "Services",
    description: "Gas not connected",
    action: "Electric only. May affect appliances/heating options.",
    financial_impact: "Electric appliances required",
  },

  // ============================================
  // SECTION 9: TENANCIES & ADDITIONAL
  // ============================================

  {
    id: "s32_tenancy",
    name: "Existing Tenancy",
    query:
      "{IS clause that discloses an existing tenancy affecting the property}",
    severity: "MEDIUM",
    category: "Tenancy",
    description: "Existing tenancy affects property",
    action: "Purchaser takes subject to lease. Check terms.",
    financial_impact: "Cannot occupy until lease ends",
  },
  {
    id: "s32_related_tenant",
    name: "Related Party Tenant",
    query:
      "{IS clause that identifies the tenant as a related party to the vendor}",
    severity: "HIGH",
    category: "Tenancy",
    description: "Tenant is related party to vendor",
    action: "Non-arm's length. May be below market rent, hard to remove.",
    financial_impact: "Below-market terms possible",
  },
  {
    id: "s32_below_market_rent",
    name: "Below Market Rent",
    query: "{IS clause that discloses rent significantly below market rate}",
    severity: "MEDIUM",
    category: "Tenancy",
    description: "Rent significantly below market rate",
    action: "Locked into unfavourable lease. Check lease expiry.",
    financial_impact: "Reduced rental income",
  },
  {
    id: "s32_long_lease",
    name: "Long-Term Lease (2+ Years)",
    query:
      "{IS clause that discloses a lease term extending more than 2 years beyond settlement}",
    severity: "MEDIUM",
    category: "Tenancy",
    description: "Lease extends more than 2 years beyond settlement",
    action: "Long commitment. Cannot occupy or re-let easily.",
    financial_impact: "Extended vacancy restriction",
  },
];

export const ALL_QUERIES: RedFlagQuery[] = [
  ...CONTRACT_QUERIES,
  ...SECTION32_QUERIES,
];
