/**
 * IQL (Isaacus Query Language) templates.
 *
 * Pre-built, optimized IQL queries for common legal analysis tasks.
 * Templates are hand-optimized by Isaacus for their models.
 *
 * Token counts and definitions from official Isaacus documentation.
 * @see https://docs.isaacus.com/iql/templates
 */

export interface IQLTemplate {
  name: string;
  displayName: string;
  description: string;
  requiresParameter: boolean;
  parameterName?: string;
  example: string;
  modelTokens: {
    "kanon-universal-classifier": number;
    "kanon-universal-classifier-mini": number;
  };
  category: string;
}

/**
 * All available IQL templates organized by category.
 * Last updated: 2024-12-24 from https://docs.isaacus.com/iql/templates
 */
export const IQL_TEMPLATES: IQLTemplate[] = [
  // Clause Types
  {
    name: "confidentiality clause",
    displayName: "Confidentiality Clause",
    description:
      "A contractual provision that restricts the use of confidential information",
    requiresParameter: false,
    example: "{IS confidentiality clause}",
    modelTokens: {
      "kanon-universal-classifier": 26,
      "kanon-universal-classifier-mini": 22,
    },
    category: "Clauses",
  },
  {
    name: "termination clause",
    displayName: "Termination Clause",
    description:
      "A contractual provision that empowers a contracting party to terminate the contract in certain circumstances",
    requiresParameter: false,
    example: "{IS termination clause}",
    modelTokens: {
      "kanon-universal-classifier": 19,
      "kanon-universal-classifier-mini": 15,
    },
    category: "Clauses",
  },
  {
    name: "termination for convenience clause",
    displayName: "Termination for Convenience",
    description:
      "A contractual provision that allows a contracting party to terminate the contract for any reason",
    requiresParameter: false,
    example: "{IS termination for convenience clause}",
    modelTokens: {
      "kanon-universal-classifier": 29,
      "kanon-universal-classifier-mini": 32,
    },
    category: "Clauses",
  },
  {
    name: "indemnity clause",
    displayName: "Indemnity Clause",
    description:
      "A contractual provision that requires one party to compensate another for losses or damages",
    requiresParameter: false,
    example: "{IS indemnity clause}",
    modelTokens: {
      "kanon-universal-classifier": 18,
      "kanon-universal-classifier-mini": 11,
    },
    category: "Clauses",
  },
  {
    name: "governing law clause",
    displayName: "Governing Law Clause",
    description:
      "A contractual provision that specifies which jurisdiction's laws govern the contract",
    requiresParameter: false,
    example: "{IS governing law clause}",
    modelTokens: {
      // Fixed: was 20, official docs say 26
      "kanon-universal-classifier": 26,
      "kanon-universal-classifier-mini": 18,
    },
    category: "Clauses",
  },
  {
    name: "choice of venue clause",
    displayName: "Choice of Venue Clause",
    description:
      "A contractual provision that specifies the jurisdiction in which disputes should be resolved",
    requiresParameter: false,
    example: "{IS choice of venue clause}",
    modelTokens: {
      "kanon-universal-classifier": 34,
      "kanon-universal-classifier-mini": 41,
    },
    category: "Clauses",
  },
  {
    name: "adr clause",
    displayName: "ADR Clause",
    description:
      "A contractual provision that requires or allows disputes to be resolved through alternative dispute resolution",
    requiresParameter: false,
    example: "{IS adr clause}",
    modelTokens: {
      "kanon-universal-classifier": 24,
      "kanon-universal-classifier-mini": 34,
    },
    category: "Clauses",
  },
  {
    name: "payment clause",
    displayName: "Payment Clause",
    description:
      "A contractual provision that affects the amount, manner, or conditions of payment",
    requiresParameter: false,
    example: "{IS payment clause}",
    modelTokens: {
      "kanon-universal-classifier": 23,
      "kanon-universal-classifier-mini": 31,
    },
    category: "Clauses",
  },
  {
    name: "remedial clause",
    displayName: "Remedial Clause",
    description:
      "A contractual provision that entitles a party to specific remedies (including liquidated damages, late fees, specific performance, termination rights, step-in rights) in the event of non-performance",
    requiresParameter: false,
    example: "{IS remedial clause}",
    modelTokens: {
      "kanon-universal-classifier": 56,
      "kanon-universal-classifier-mini": 32,
    },
    category: "Clauses",
  },
  {
    name: "representation or warranty clause",
    displayName: "Representation or Warranty Clause",
    description:
      "A contractual provision that makes a representation or issues a warranty, or affirms a representation or warranty",
    requiresParameter: false,
    example: "{IS representation or warranty clause}",
    modelTokens: {
      "kanon-universal-classifier": 16,
      "kanon-universal-classifier-mini": 24,
    },
    category: "Clauses",
  },
  {
    name: "non-compete clause",
    displayName: "Non-Compete Clause",
    description:
      "A contractual provision that restricts a party from competing with another party",
    requiresParameter: false,
    example: "{IS non-compete clause}",
    modelTokens: {
      // Fixed: was 22, official docs say 29
      "kanon-universal-classifier": 29,
      "kanon-universal-classifier-mini": 18,
    },
    category: "Clauses",
  },
  {
    name: "unilateral clause",
    displayName: "Unilateral Clause",
    description:
      "A contractual provision that imposes obligations on or grants rights to only one side of the contracting parties",
    requiresParameter: false,
    example: "{IS unilateral clause}",
    modelTokens: {
      "kanon-universal-classifier": 26,
      "kanon-universal-classifier-mini": 32,
    },
    category: "Clauses",
  },
  // NEW: Entire Agreement Clause
  {
    name: "entire agreement clause",
    displayName: "Entire Agreement Clause",
    description:
      "A contractual provision that asserts the contract represents the entire agreement between the parties",
    requiresParameter: false,
    example: "{IS entire agreement clause}",
    modelTokens: {
      "kanon-universal-classifier": 15,
      "kanon-universal-classifier-mini": 20,
    },
    category: "Clauses",
  },
  // NEW: Force Majeure Liability Limitation Clause
  {
    name: "force majeure liability limitation clause",
    displayName: "Force Majeure Liability Limitation",
    description:
      "A contractual provision that limits liability for conditions beyond a party's control (force majeure events)",
    requiresParameter: false,
    example: "{IS force majeure liability limitation clause}",
    modelTokens: {
      "kanon-universal-classifier": 30,
      "kanon-universal-classifier-mini": 21,
    },
    category: "Clauses",
  },
  // NEW: Force Majeure Termination Clause
  {
    name: "force majeure termination clause",
    displayName: "Force Majeure Termination",
    description:
      "A contractual provision that allows termination due to force majeure events",
    requiresParameter: false,
    example: "{IS force majeure termination clause}",
    modelTokens: {
      "kanon-universal-classifier": 36,
      "kanon-universal-classifier-mini": 30,
    },
    category: "Clauses",
  },
  // NEW: IP Assignment or License
  {
    name: "ip assignment or license",
    displayName: "IP Assignment or License",
    description:
      "A contractual provision that assigns or licenses intellectual property rights",
    requiresParameter: false,
    example: "{IS ip assignment or license}",
    modelTokens: {
      "kanon-universal-classifier": 24,
      "kanon-universal-classifier-mini": 20,
    },
    category: "Clauses",
  },
  // NEW: Liability Cap Clause
  {
    name: "liability cap clause",
    displayName: "Liability Cap Clause",
    description:
      "A contractual provision that caps financial liability to a specified monetary maximum",
    requiresParameter: false,
    example: "{IS liability cap clause}",
    modelTokens: {
      "kanon-universal-classifier": 23,
      "kanon-universal-classifier-mini": 29,
    },
    category: "Clauses",
  },
  // NEW: Liability Limitation Clause
  {
    name: "liability limitation clause",
    displayName: "Liability Limitation Clause",
    description:
      "A contractual provision that limits the extent of liability for losses or damages",
    requiresParameter: false,
    example: "{IS liability limitation clause}",
    modelTokens: {
      "kanon-universal-classifier": 37,
      "kanon-universal-classifier-mini": 34,
    },
    category: "Clauses",
  },
  // Rights
  {
    name: "step-in right",
    displayName: "Step-In Right",
    description:
      "A contractual provision that grants a party the right to assume responsibility for a counterparty's obligations or take control of their performance",
    requiresParameter: false,
    example: "{IS step-in right}",
    modelTokens: {
      "kanon-universal-classifier": 37,
      "kanon-universal-classifier-mini": 38,
    },
    category: "Rights",
  },
  {
    name: "right",
    displayName: "Right",
    description: "A contractual provision that grants a right",
    requiresParameter: false,
    example: "{IS right}",
    modelTokens: {
      "kanon-universal-classifier": 25,
      "kanon-universal-classifier-mini": 15,
    },
    category: "Rights",
  },
  // Obligations
  {
    name: "obligation",
    displayName: "Obligation",
    description: "A contractual provision that imposes an obligation",
    requiresParameter: false,
    example: "{IS obligation}",
    modelTokens: {
      "kanon-universal-classifier": 18,
      "kanon-universal-classifier-mini": 11,
    },
    category: "Obligations",
  },
  // Generic
  {
    name: "clause",
    displayName: "Clause",
    description: "A contractual provision",
    requiresParameter: false,
    example: "{IS clause}",
    modelTokens: {
      "kanon-universal-classifier": 16,
      "kanon-universal-classifier-mini": 16,
    },
    category: "Generic",
  },
  {
    name: "clause that",
    displayName: "Clause That",
    description:
      "A contractual clause that matches a particular description you provide",
    requiresParameter: true,
    parameterName: "description",
    example: '{IS clause that "imposes a duty of confidence"}',
    modelTokens: {
      "kanon-universal-classifier": 18,
      "kanon-universal-classifier-mini": 11,
    },
    category: "Generic",
  },
  // Party-Specific Templates
  {
    name: "clause obligating",
    displayName: "Clause Obligating Party",
    description:
      "A contractual provision that imposes a legal duty on a specified party",
    requiresParameter: true,
    parameterName: "party name",
    example: '{IS clause obligating "Customer"}',
    modelTokens: {
      "kanon-universal-classifier": 31,
      "kanon-universal-classifier-mini": 24,
    },
    category: "Parties",
  },
  {
    name: "clause entitling",
    displayName: "Clause Entitling Party",
    description:
      "A contractual provision that grants a right to a specified party",
    requiresParameter: true,
    parameterName: "party name",
    example: '{IS clause entitling "Supplier"}',
    modelTokens: {
      // Fixed: was 28, official docs say 29
      "kanon-universal-classifier": 29,
      "kanon-universal-classifier-mini": 22,
    },
    category: "Parties",
  },
  // NEW: Clause Called (parameterized)
  {
    name: "clause called",
    displayName: "Clause Called",
    description:
      "A contractual provision with a specific name/heading (e.g., 'Confidentiality', 'Termination')",
    requiresParameter: true,
    parameterName: "clause name",
    example: '{IS clause called "Confidentiality"}',
    modelTokens: {
      "kanon-universal-classifier": 15,
      "kanon-universal-classifier-mini": 15,
    },
    category: "Parties",
  },
  // Specialized
  {
    name: "relevant to ai law",
    displayName: "Relevant to AI Law",
    description:
      "A text that is substantively relevant to artificial intelligence law (not merely mentioned in passing)",
    requiresParameter: false,
    example: "{IS relevant to ai law}",
    modelTokens: {
      "kanon-universal-classifier": 23,
      "kanon-universal-classifier-mini": 16,
    },
    category: "Specialized",
  },
];

/**
 * Get all templates grouped by category.
 */
export function getTemplatesByCategory(): Record<string, IQLTemplate[]> {
  const grouped: Record<string, IQLTemplate[]> = {};
  for (const template of IQL_TEMPLATES) {
    if (!grouped[template.category]) {
      grouped[template.category] = [];
    }
    grouped[template.category].push(template);
  }
  return grouped;
}

/**
 * Get a template by name.
 */
export function getTemplateByName(name: string): IQLTemplate | undefined {
  return IQL_TEMPLATES.find((t) => t.name.toLowerCase() === name.toLowerCase());
}

/**
 * Generate IQL query string from template.
 */
export function generateIQLQuery(
  template: IQLTemplate,
  parameter?: string,
): string {
  if (template.requiresParameter) {
    if (!parameter) {
      throw new Error(
        `Template "${template.name}" requires parameter: ${template.parameterName}`,
      );
    }
    return `{IS ${template.name} "${parameter}"}`;
  }
  return `{IS ${template.name}}`;
}

/**
 * Get all unique categories.
 */
export function getCategories(): string[] {
  return Array.from(new Set(IQL_TEMPLATES.map((t) => t.category)));
}
