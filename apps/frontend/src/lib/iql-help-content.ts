/**
 * Clause Finder Help Content - Law-Firm-Friendly Documentation
 *
 * Content structured for legal professionals, organized by
 * use case rather than technical syntax.
 *
 * Note: "Clause Finder" is the user-friendly name for the underlying
 * Isaacus Query Language (IQL) functionality.
 */

export interface IQLExample {
  title: string;
  description: string;
  query: string;
  tip?: string;
}

export interface IQLSection {
  id: string;
  title: string;
  description?: string;
  items: IQLExample[];
}

/**
 * Quick Wins - Copy-paste queries for common risk flags
 */
export const QUICK_WINS: IQLExample[] = [
  {
    title: "One-sided obligations against your client",
    description:
      "Find clauses that impose duties only on one party, specifically your client",
    query: '{IS unilateral clause} AND {IS clause obligating "Client"}',
    tip: 'Replace "Client" with your client\'s defined term in the contract',
  },
  {
    title: "Non-mutual NDAs",
    description:
      "Identify confidentiality provisions that don't bind both parties equally",
    query: "{IS confidentiality clause} AND {IS unilateral clause}",
  },
  {
    title: "Uncapped indemnity risk",
    description: "Flag indemnification clauses without liability limits",
    query: "{IS indemnity clause} AND NOT {IS liability cap clause}",
  },
  {
    title: "Termination for convenience (one-sided)",
    description: "Find termination rights that favor only one party",
    query: "{IS termination for convenience clause} AND {IS unilateral clause}",
  },
  {
    title: "Missing limitation of liability",
    description:
      "Identify clauses creating liability without caps or exclusions",
    query: "{IS obligation} AND NOT {IS liability limitation clause}",
    tip: "Useful for assessing overall contract risk exposure",
  },
  {
    title: "Force majeure gaps",
    description:
      "Find termination provisions that lack force majeure protections",
    query:
      "{IS termination clause} AND NOT {IS force majeure termination clause}",
  },
];

/**
 * Practice Area Examples - Organized by legal workflow
 */
export const PRACTICE_AREAS: IQLSection[] = [
  {
    id: "contract-review",
    title: "Contract Review",
    description: "Standard contract analysis and risk identification",
    items: [
      {
        title: "Key commercial terms",
        description: "Find payment and pricing provisions",
        query: "{IS payment clause}",
      },
      {
        title: "Termination rights",
        description: "All termination-related provisions",
        query: "{IS termination clause}",
      },
      {
        title: "Party obligations comparison",
        description: "Compare obligations between parties",
        query:
          '{IS clause obligating "Customer"} > {IS clause obligating "Supplier"}',
        tip: "Returns clauses where Customer has greater obligations",
      },
      {
        title: "Representations & warranties",
        description: "All reps and warranties in the agreement",
        query: "{IS representation or warranty clause}",
      },
      {
        title: "Dispute resolution",
        description: "Governing law, venue, and ADR provisions",
        query:
          "{IS governing law clause} OR {IS choice of venue clause} OR {IS adr clause}",
      },
    ],
  },
  {
    id: "due-diligence",
    title: "Due Diligence",
    description: "M&A and investment transaction review",
    items: [
      {
        title: "Change of control provisions",
        description: "Clauses triggered by ownership changes",
        query: '{IS clause that "relates to change of control or assignment"}',
      },
      {
        title: "IP rights and licenses",
        description: "Intellectual property assignments and licenses",
        query: "{IS ip assignment or license}",
      },
      {
        title: "Non-compete restrictions",
        description: "Competitive restriction provisions",
        query: "{IS non-compete clause}",
      },
      {
        title: "Material contract provisions",
        description: "Key terms that could affect deal value",
        query:
          "{IS liability limitation clause} OR {IS indemnity clause} OR {IS termination clause}",
      },
      {
        title: "Third-party consents required",
        description: "Assignment or change of control consent requirements",
        query: '{IS clause that "requires consent for assignment"}',
      },
    ],
  },
  {
    id: "compliance",
    title: "Compliance & Regulatory",
    description: "Regulatory and policy compliance review",
    items: [
      {
        title: "Confidentiality obligations",
        description: "All confidentiality and NDA provisions",
        query: "{IS confidentiality clause}",
      },
      {
        title: "Data protection clauses",
        description: "Privacy and data handling provisions",
        query: '{IS clause that "relates to data protection or privacy"}',
      },
      {
        title: "AI and technology provisions",
        description: "Clauses relevant to AI law and regulation",
        query: "{IS relevant to ai law}",
      },
      {
        title: "Compliance representations",
        description: "Regulatory compliance warranties",
        query:
          '{IS representation or warranty clause} AND {IS clause that "relates to compliance or regulation"}',
      },
    ],
  },
  {
    id: "litigation",
    title: "Litigation Support",
    description: "Contract analysis for dispute resolution",
    items: [
      {
        title: "Breach remedies",
        description: "Remedial provisions and liquidated damages",
        query: "{IS remedial clause}",
      },
      {
        title: "Limitation periods",
        description: "Time limitations on claims",
        query: '{IS clause that "specifies a limitation period or time bar"}',
      },
      {
        title: "Entire agreement clause",
        description: "Integration and merger clauses",
        query: "{IS entire agreement clause}",
      },
      {
        title: "Indemnification scope",
        description: "Indemnity provisions and their limits",
        query: "{IS indemnity clause}",
      },
    ],
  },
];

/**
 * Operator Reference - Explained with legal analogies
 */
export interface OperatorInfo {
  operator: string;
  name: string;
  legalAnalogy: string;
  description: string;
  example: string;
  exampleExplanation: string;
}

export const OPERATORS: OperatorInfo[] = [
  {
    operator: "AND",
    name: "Both Must Match",
    legalAnalogy: 'Like Westlaw\'s "AND" connector',
    description:
      "Returns the minimum score of both conditions. Both must be true for a high score.",
    example: "{IS confidentiality clause} AND {IS unilateral clause}",
    exampleExplanation:
      "Finds clauses that are BOTH confidentiality provisions AND one-sided",
  },
  {
    operator: "OR",
    name: "Either Matches",
    legalAnalogy: 'Like Westlaw\'s "OR" connector',
    description:
      "Returns the maximum score of either condition. Matches if either is true.",
    example: "{IS termination clause} OR {IS remedial clause}",
    exampleExplanation:
      "Finds clauses that are termination OR remedial provisions",
  },
  {
    operator: "NOT",
    name: "Exclude",
    legalAnalogy: 'Like Westlaw\'s "BUT NOT" or "AND NOT"',
    description:
      "Inverts the score (1 minus original). Excludes matching results.",
    example: "NOT {IS liability limitation clause}",
    exampleExplanation: "Finds clauses that are NOT liability limitations",
  },
  {
    operator: ">",
    name: "Greater Than",
    legalAnalogy: "Comparative analysis - which party bears more burden?",
    description:
      "Returns first score if greater than second, otherwise 0. Useful for comparing party obligations.",
    example:
      '{IS clause obligating "Customer"} > {IS clause obligating "Supplier"}',
    exampleExplanation:
      "Returns clauses where Customer has greater obligations than Supplier",
  },
  {
    operator: "<",
    name: "Less Than",
    legalAnalogy: "Inverse comparative analysis",
    description: "Returns second score if greater than first, otherwise 0.",
    example:
      '{IS clause obligating "Customer"} < {IS clause obligating "Supplier"}',
    exampleExplanation:
      "Returns clauses where Supplier has greater obligations than Customer",
  },
  {
    operator: "+",
    name: "Average",
    legalAnalogy: "Balanced assessment across multiple criteria",
    description: "Averages all statement scores together.",
    example: "{IS confidentiality clause} + {IS non-compete clause}",
    exampleExplanation: "Returns average confidence across both clause types",
  },
];

/**
 * Operator precedence (same as Python)
 */
export const OPERATOR_PRECEDENCE = [
  { operators: "()", description: "Parentheses - highest priority" },
  { operators: "+", description: "Average" },
  { operators: "> <", description: "Comparison operators" },
  { operators: "NOT", description: "Negation" },
  { operators: "AND", description: "Conjunction" },
  { operators: "OR", description: "Disjunction - lowest priority" },
];

/**
 * Confidence scores - law-firm-friendly interpretation
 */
export interface ScoreRange {
  min: number;
  max: number;
  label: string;
  legalInterpretation: string;
  recommendation: string;
}

export const SCORE_RANGES: ScoreRange[] = [
  {
    min: 0,
    max: 30,
    label: "Low confidence",
    legalInterpretation: "Unlikely to be what you're looking for",
    recommendation: "Generally safe to exclude from review",
  },
  {
    min: 30,
    max: 50,
    label: "Uncertain",
    legalInterpretation: "Possible match, but inconclusive",
    recommendation: "Review if conducting comprehensive due diligence",
  },
  {
    min: 50,
    max: 70,
    label: "More likely than not",
    legalInterpretation: 'Preponderance standard - "probably" a match',
    recommendation: "Include in standard review",
  },
  {
    min: 70,
    max: 85,
    label: "Likely",
    legalInterpretation: "Strong indication of a match",
    recommendation: "Prioritize for review",
  },
  {
    min: 85,
    max: 100,
    label: "Highly confident",
    legalInterpretation: "Very strong match",
    recommendation: "Almost certainly what you're looking for",
  },
];

/**
 * Tips for effective Clause Finder usage
 */
export const USAGE_TIPS = [
  {
    title: "Use Natural Language mode for easy searches",
    description:
      "In Natural Language mode, describe what you're looking for in plain English (e.g., 'one-sided confidentiality clauses'). The system automatically translates your description to optimized IQL syntax. Toggle to IQL mode for direct syntax input.",
  },
  {
    title: "Use built-in clause types over custom searches",
    description:
      "Built-in clause types like {IS confidentiality clause} are optimized for accuracy. They outperform custom descriptions in most cases.",
  },
  {
    title: 'Use "clause that" for custom searches',
    description:
      'When built-in types don\'t cover your need, use {IS clause that "your description"} for best results.',
  },
  {
    title: "Adjust thresholds based on review type",
    description:
      "Cast a wider net (lower threshold) for comprehensive due diligence. Use higher thresholds for targeted extraction.",
  },
  {
    title: "Combine searches for precision",
    description:
      "Use AND to narrow results, OR to broaden them. Combine clause types with party-specific queries for targeted analysis.",
  },
  {
    title: "Compare party obligations",
    description:
      'Use > and < operators to find imbalanced provisions. E.g., {IS clause obligating "You"} > {IS clause obligating "Company"} shows one-sided duties.',
  },
];

/**
 * Template categories with descriptions
 */
export const TEMPLATE_CATEGORIES = [
  {
    category: "Clauses",
    description: "Common contractual provision types",
    examples: [
      "confidentiality clause",
      "termination clause",
      "indemnity clause",
      "governing law clause",
    ],
  },
  {
    category: "Rights",
    description: "Provisions granting entitlements",
    examples: ["right", "step-in right"],
  },
  {
    category: "Obligations",
    description: "Provisions imposing duties",
    examples: ["obligation"],
  },
  {
    category: "Parties",
    description: "Party-specific analysis",
    examples: ['clause obligating "Party"', 'clause entitling "Party"'],
  },
  {
    category: "Generic",
    description: "Flexible templates for custom searches",
    examples: ["clause", 'clause that "description"'],
  },
  {
    category: "Specialized",
    description: "Domain-specific analysis",
    examples: ["relevant to ai law"],
  },
];
