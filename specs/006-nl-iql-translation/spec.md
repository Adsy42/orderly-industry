# Feature Specification: Natural Language to IQL Translation

**Feature Branch**: `006-nl-iql-translation`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "Add natural language to IQL translation for the IQL Query page. Leverage full IQL specification capabilities (templates, operators, etc.). Chat page/agent is not in use at the moment."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Natural Language Clause Search (Priority: P1)

As a legal professional, I want to describe what I'm looking for in plain English when searching for clauses, so that I don't need to learn IQL syntax to find contract provisions.

**Why this priority**: This is the core value proposition - removing the technical barrier to using advanced IQL capabilities. Users who aren't familiar with IQL syntax can still access the full power of boolean operators, comparisons, and templates.

**Independent Test**: Can be fully tested by typing "one-sided confidentiality clauses" in the natural language mode and verifying the system translates to `{IS confidentiality clause} AND {IS unilateral clause}` and returns matching results.

**Acceptance Scenarios**:

1. **Given** a user is on the IQL Query page for a document, **When** they type "find termination clauses" in natural language mode, **Then** the system translates to `{IS termination clause}` and displays matching clauses with citations
2. **Given** a user enters "one-sided indemnity provisions", **When** they execute the search, **Then** the system translates to `{IS indemnity clause} AND {IS unilateral clause}` and returns clauses matching both criteria
3. **Given** a user types "indemnity without liability caps", **When** they search, **Then** the system translates to `{IS indemnity clause} AND NOT {IS liability cap clause}` and shows indemnity clauses that lack caps
4. **Given** a user searches "clauses where Customer has more obligations than Supplier", **When** the query executes, **Then** the system translates to `{IS clause obligating "Customer"} > {IS clause obligating "Supplier"}` and returns comparative results

---

### User Story 2 - Mode Toggle Between Natural Language and IQL (Priority: P1)

As an advanced user familiar with IQL, I want to toggle between natural language mode and direct IQL input mode, so that I can use whichever method is most efficient for my current task.

**Why this priority**: Advanced users who already know IQL should not be forced to use natural language. The toggle ensures the feature enhances rather than replaces existing functionality.

**Independent Test**: Can be fully tested by toggling between "Natural Language" and "IQL" modes in the Clause Finder interface and verifying that each mode works independently.

**Acceptance Scenarios**:

1. **Given** a user is in natural language mode, **When** they toggle to IQL mode, **Then** the input field clears validation errors related to natural language and accepts direct IQL syntax
2. **Given** a user types `{IS confidentiality clause} AND {IS unilateral clause}` in IQL mode, **When** they execute, **Then** the system uses the query directly without translation
3. **Given** a user toggles from IQL mode to natural language mode, **When** their existing IQL query is in the field, **Then** the query remains visible but is treated as natural language input (may be re-translated)
4. **Given** a user switches modes, **When** they have unsaved changes, **Then** the system preserves their input text in the field

---

### User Story 3 - Template Preference and Fallback (Priority: P2)

As a user searching for clauses, I want the system to prefer pre-optimized IQL templates when translating my natural language, and only use custom descriptions when no template fits, so that I get the most accurate search results possible.

**Why this priority**: Templates are optimized by Isaacus for accuracy. Users should benefit from these optimizations automatically without needing to know which templates exist.

**Independent Test**: Can be fully tested by searching for "termination clauses" (should use template) versus "clauses about GDPR compliance" (should use custom description fallback) and verifying the translation uses templates when appropriate.

**Acceptance Scenarios**:

1. **Given** a user searches "termination clauses", **When** the system translates, **Then** it uses the `{IS termination clause}` template rather than a custom description
2. **Given** a user searches "confidentiality or non-compete provisions", **When** the system translates, **Then** it uses `{IS confidentiality clause} OR {IS non-compete clause}` combining two templates
3. **Given** a user searches "clauses about data retention policies", **When** no exact template exists, **Then** the system translates to `{IS clause that "data retention policies"}` as a fallback
4. **Given** a user searches "IP assignment", **When** the system translates, **Then** it recognizes and uses the `{IS ip assignment or license}` template if available

---

### User Story 4 - Translation Visibility and Transparency (Priority: P2)

As a user, I want to see what IQL query was generated from my natural language input, so that I can learn IQL syntax and verify the translation accuracy.

**Why this priority**: Transparency builds trust and helps users understand the system. Users can also learn IQL by seeing how their natural language maps to queries.

**Independent Test**: Can be fully tested by entering natural language, executing a search, and verifying the generated IQL query is displayed somewhere in the results or query interface.

**Acceptance Scenarios**:

1. **Given** a user enters "one-sided termination clauses" in natural language mode, **When** they execute the search, **Then** the generated IQL query `{IS termination clause} AND {IS unilateral clause}` is displayed (e.g., in results header or expanded view)
2. **Given** a user sees the translated IQL query, **When** they click on it, **Then** they can copy it or switch to IQL mode with that query pre-filled
3. **Given** translation occurs, **When** the results are displayed, **Then** the IQL query is visible but not intrusive (doesn't dominate the UI)

---

### Edge Cases

- What happens when natural language input is ambiguous (e.g., "clauses")? System should ask for clarification or use the most general template
- How does system handle malformed natural language (typos, fragments)? System should attempt translation and show validation errors if IQL is invalid
- What happens when translation fails (LLM error, timeout)? System should show user-friendly error and allow manual IQL entry as fallback
- How does system handle natural language that describes IQL syntax (e.g., "AND confidentiality")? System should recognize intent and translate appropriately
- What happens when user enters valid IQL syntax in natural language mode? System should detect and use it directly or translate appropriately
- How does system handle very long natural language queries? System should process them but may need length limits or chunking

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST accept natural language descriptions of clause searches in the IQL Query Builder interface
- **FR-002**: System MUST translate natural language input to valid IQL syntax using an LLM-based translation service
- **FR-003**: System MUST prefer pre-optimized IQL templates (e.g., `{IS confidentiality clause}`) over custom descriptions when templates match the user's intent
- **FR-004**: System MUST support translation to complex IQL queries with boolean operators (AND, OR, NOT), comparison operators (>, <), and averaging operator (+)
- **FR-005**: System MUST provide a mode toggle allowing users to switch between natural language input and direct IQL syntax input
- **FR-006**: System MUST preserve user input text when switching between natural language and IQL modes
- **FR-007**: System MUST display the generated IQL query to the user after translation so they can see what query was executed
- **FR-008**: System MUST handle translation errors gracefully with user-friendly error messages and fallback to manual IQL entry
- **FR-009**: System MUST validate translated IQL queries before execution to catch translation errors early
- **FR-010**: System MUST support all IQL template types including parameterized templates (e.g., `{IS clause obligating "Customer"}`) in translations
- **FR-011**: System MUST maintain existing IQL direct input functionality - natural language mode is additive, not replacement
- **FR-012**: System MUST respect IQL operator precedence rules (parentheses → + → >, < → NOT → AND → OR) in translations

### Key Entities

- **Natural Language Query**: User's plain English description of what clauses to find (e.g., "one-sided confidentiality clauses")
- **Translated IQL Query**: The IQL syntax query generated from natural language (e.g., `{IS confidentiality clause} AND {IS unilateral clause}`)
- **Translation Result**: Output from translation service containing the IQL query and optional metadata (confidence, templates used, explanation)
- **Query Mode**: Current input mode state (natural language or IQL syntax)

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can successfully translate 90% of common clause search queries from natural language to valid IQL syntax on first attempt
- **SC-002**: Translated queries execute successfully (pass IQL validation) 95% of the time
- **SC-003**: Translation completes within 2 seconds for 95% of queries, allowing responsive user experience
- **SC-004**: Users who previously couldn't use boolean operators can now perform complex searches (AND/OR/NOT) through natural language
- **SC-005**: System correctly identifies and uses IQL templates for 85% of template-matching natural language queries
- **SC-006**: Mode toggle between natural language and IQL works without data loss (user input preserved) 100% of the time
- **SC-007**: Users can see the generated IQL query for every natural language translation, enabling transparency and learning

## Assumptions

- Translation service uses GPT-4o-mini or similar LLM with access to IQL template documentation
- Translation API endpoint will be created at `/api/iql/translate` (or similar)
- Existing IQL validation logic can be reused for validating translated queries
- Natural language mode is optional - users can continue using direct IQL syntax
- Translation errors are acceptable as long as they're handled gracefully with user-friendly messages
- Full list of available IQL templates is available to the translation service (from Isaacus documentation)
- User's natural language input may contain legal terminology and should be handled appropriately
- Translation service has access to IQL specification and operator precedence rules
