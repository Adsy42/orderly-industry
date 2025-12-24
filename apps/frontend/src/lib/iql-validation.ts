/**
 * IQL (Isaacus Query Language) validation utilities.
 *
 * Provides client-side syntax validation for IQL queries to improve UX
 * by catching errors before API calls. Complex operator precedence validation
 * may still require API validation.
 *
 * @see https://docs.isaacus.com/iql/specification
 */

export interface IQLValidationResult {
  valid: boolean;
  error?: string;
  suggestions?: string[];
  warnings?: string[];
}

/**
 * Check if a query contains IQL operators.
 */
function hasIQLOperators(query: string): boolean {
  const wordOperators = ["AND", "OR", "NOT"];
  const symbolOperators = [">", "<", "+"];

  // Build pattern: word operators with word boundaries, symbol operators escaped
  const patterns: string[] = [];
  if (wordOperators.length > 0) {
    patterns.push(`\\b(${wordOperators.join("|")})\\b`);
  }
  if (symbolOperators.length > 0) {
    const escaped = symbolOperators.map((op) =>
      op.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );
    patterns.push(escaped.join("|"));
  }

  const operatorPattern = new RegExp(patterns.join("|"), "i");
  return operatorPattern.test(query);
}

/**
 * Validates basic IQL query syntax.
 *
 * Checks for:
 * - Statement format (curly brackets required for compound queries, optional for standalone)
 * - Template format ({IS template} or {IS template "arg"})
 * - Basic operator syntax
 * - Balanced parentheses
 *
 * Per the IQL specification: "Statements should generally be enclosed in curly brackets,
 * though they technically don't need to be if they are standalone queries."
 *
 * @see https://docs.isaacus.com/iql/introduction
 * @param query - IQL query string to validate
 * @returns Validation result with error message if invalid
 */
export function validateIQLQuery(query: string): IQLValidationResult {
  if (!query || typeof query !== "string") {
    return {
      valid: false,
      error: "Query must be a non-empty string",
    };
  }

  const trimmed = query.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: "Query cannot be empty",
    };
  }

  // Check for balanced curly brackets
  const openBraces = (trimmed.match(/{/g) || []).length;
  const closeBraces = (trimmed.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    return {
      valid: false,
      error: "Unbalanced curly brackets. Each { must have a matching }",
      suggestions: [
        "Ensure all statements are properly enclosed in curly brackets",
      ],
    };
  }

  // Check for balanced parentheses
  const openParens = (trimmed.match(/\(/g) || []).length;
  const closeParens = (trimmed.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return {
      valid: false,
      error: "Unbalanced parentheses. Each ( must have a matching )",
      suggestions: ["Check that all parentheses are properly closed"],
    };
  }

  // Check for statements in curly brackets
  const statementPattern = /\{[^}]*\}/g;
  const statements = trimmed.match(statementPattern) || [];
  const hasOperatorsInQuery = hasIQLOperators(trimmed);

  // If query has operators, curly brackets are REQUIRED around statements
  if (hasOperatorsInQuery && statements.length === 0) {
    return {
      valid: false,
      error:
        "Compound queries with operators require statements in curly brackets",
      suggestions: [
        "Use format: {IS clause 1} AND {IS clause 2}",
        "Or: {custom statement 1} OR {custom statement 2}",
      ],
    };
  }

  // If query has operators, ensure there are at least two statements
  if (hasOperatorsInQuery && statements.length < 2) {
    return {
      valid: false,
      error: "Operators require at least two statements",
      suggestions: [
        "Use format: {IS clause 1} AND {IS clause 2}",
        "Or: {IS clause 1} OR {IS clause 2}",
      ],
    };
  }

  // Collect warnings for non-blocking guidance
  const warnings: string[] = [];

  // For standalone queries (no operators), brackets are optional per IQL spec
  // But we should warn if no brackets and no IS keyword (custom statement without brackets)
  if (!hasOperatorsInQuery && statements.length === 0) {
    // This is a standalone query without brackets - valid per IQL spec
    // Add a warning suggesting templates for better results
    if (!trimmed.toLowerCase().startsWith("is ")) {
      warnings.push(
        'Consider using a template for better accuracy: {IS clause that "' +
          trimmed +
          '"}',
      );
    }
  }

  // Validate template format if using IS keyword (within brackets)
  const isStatements = statements.filter((s) => /\bIS\s+/i.test(s));
  for (const stmt of isStatements) {
    // Template format: {IS template} or {IS template "arg"}
    const templatePattern = /\{\s*IS\s+([^}"]+)(?:\s+"([^"]*)")?\s*\}/i;
    if (!templatePattern.test(stmt)) {
      return {
        valid: false,
        error: `Invalid template format: ${stmt}`,
        suggestions: [
          "Template format: {IS template name}",
          'With parameter: {IS template name "parameter value"}',
        ],
      };
    }
  }

  // Warn if using custom statements instead of templates (within brackets)
  const customStatements = statements.filter((s) => !/\bIS\s+/i.test(s));
  if (customStatements.length > 0) {
    warnings.push(
      "Custom statements work but templates are optimized for better accuracy. " +
        'Try: {IS clause that "your description"}',
    );
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validates IQL query with operator precedence checking.
 *
 * This is a more advanced validation that checks operator precedence
 * according to IQL spec: () → + → >, < → NOT → AND → OR
 *
 * Also validates operator chaining behavior where A > B > C is interpreted
 * as (A > B) AND (B > C).
 *
 * @param query - IQL query string to validate
 * @returns Validation result with error message if invalid
 */
export function validateIQLQueryWithOperators(
  query: string,
): IQLValidationResult {
  const basicValidation = validateIQLQuery(query);
  if (!basicValidation.valid) {
    return basicValidation;
  }

  // For complex operator validation, we rely on API validation
  // This function provides basic structure checking
  const trimmed = query.trim();
  const warnings = basicValidation.warnings || [];

  // Check for invalid operator combinations
  // NOT should be followed by a statement, not another operator
  if (/\bNOT\s+(AND|OR|>|<|\+)/i.test(trimmed)) {
    return {
      valid: false,
      error:
        "NOT operator must be followed by a statement, not another operator",
      suggestions: [
        "Use format: NOT {IS clause} instead of NOT AND {IS clause}",
      ],
    };
  }

  // Check for operators at start (NOT is allowed at start)
  if (/^(AND|OR|>|<|\+)/i.test(trimmed)) {
    return {
      valid: false,
      error: "Query cannot start with a binary operator",
      suggestions: ["Start with a statement: {IS clause} AND ..."],
    };
  }

  if (/(AND|OR|>|<|\+)$/i.test(trimmed)) {
    return {
      valid: false,
      error: "Query cannot end with an operator",
      suggestions: ["End with a statement: ... AND {IS clause}"],
    };
  }

  // Check for comparison operators (>, <) - should be between two statements
  if (/[><]/.test(trimmed)) {
    const statements = extractIQLStatements(trimmed);
    if (statements.length < 2) {
      return {
        valid: false,
        error: "Comparison operators (>, <) require at least two statements",
        suggestions: [
          "Use format: {IS clause 1} > {IS clause 2}",
          "Or: {IS clause 1} < {IS clause 2}",
        ],
      };
    }

    // Warn about chained comparison behavior
    const comparisonCount = (trimmed.match(/[><]/g) || []).length;
    if (comparisonCount > 1) {
      warnings.push(
        "Chained comparisons (A > B > C) are interpreted as (A > B) AND (B > C)",
      );
    }
  }

  // Check for averaging operator (+) - should be between statements
  if (/\+\s*\{/.test(trimmed) || /\}\s*\+/.test(trimmed)) {
    const statements = extractIQLStatements(trimmed);
    if (statements.length < 2) {
      return {
        valid: false,
        error: "Averaging operator (+) requires at least two statements",
        suggestions: [
          "Use format: {IS clause 1} + {IS clause 2}",
          "The + operator averages the scores of all statements",
        ],
      };
    }
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Extracts all statements from an IQL query.
 *
 * @param query - IQL query string
 * @returns Array of statement strings (with curly brackets)
 */
export function extractIQLStatements(query: string): string[] {
  const statementPattern = /\{[^}]*\}/g;
  return query.match(statementPattern) || [];
}

/**
 * Checks if a query uses IQL templates (IS keyword).
 *
 * @param query - IQL query string
 * @returns True if query uses templates
 */
export function usesIQLTemplates(query: string): boolean {
  return /\{\s*IS\s+/i.test(query);
}

/**
 * Checks if a query is a standalone query (no operators, can be without brackets).
 *
 * @param query - IQL query string
 * @returns True if query is standalone
 */
export function isStandaloneQuery(query: string): boolean {
  return !hasIQLOperators(query);
}
