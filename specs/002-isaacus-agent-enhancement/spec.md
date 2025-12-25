# Feature Specification: Isaacus Agent Enhancement

**Feature Branch**: `002-isaacus-agent-enhancement`  
**Created**: 2024-12-24  
**Status**: Draft  
**Input**: User description: "Enhance Isaacus integration by wiring up the IQL tool to the agent, adding document context to chat messages when viewing specific documents, and implementing a template-first UI approach for legal document analysis"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Conversational IQL Analysis (Priority: P1)

As a legal professional using the chat interface, I want to ask natural language questions about legal clauses in my documents (e.g., "Find all clauses that obligate the Customer"), and have the AI agent automatically translate my request into IQL queries and return accurate, probability-scored results.

**Why this priority**: This is the core value proposition - the IQL tool exists but is not connected to the agent. Without this, users cannot leverage Isaacus's most powerful legal analysis capability through conversation.

**Independent Test**: Can be fully tested by uploading a contract document, then asking in chat "Find all confidentiality clauses" and verifying the agent uses the IQL tool to return scored results.

**Acceptance Scenarios**:

1. **Given** a user has documents in a matter, **When** they ask "Find all termination clauses", **Then** the agent uses the IQL tool with `{IS termination clause}` and returns results with confidence scores
2. **Given** a user asks a complex query like "Find unilateral clauses that obligate the Customer", **When** the agent processes the request, **Then** it constructs a compound IQL query `{IS unilateral clause} AND {IS clause obligating "Customer"}` and returns combined results
3. **Given** a user asks about clauses without specifying IQL, **When** the agent has context about the matter, **Then** it intelligently chooses between `isaacus_classify` (simple categorization) and `isaacus_iql` (complex clause analysis) based on query complexity

---

### User Story 2 - Document-Aware Context (Priority: P1)

As a user viewing a specific document in the UI, I want my chat questions to automatically target that document, so that I don't have to specify which document I'm asking about.

**Why this priority**: This eliminates friction in the most common workflow - viewing a document and asking questions about it. Without document context, users must repeatedly specify which document they mean.

**Independent Test**: Can be fully tested by opening a document in the viewer, asking "What are the payment terms?", and verifying the agent queries only that specific document rather than all documents in the matter.

**Acceptance Scenarios**:

1. **Given** a user is viewing "Service Agreement.pdf" in the document viewer, **When** they ask "Find the confidentiality clause", **Then** the agent context includes the document_id and queries only that document
2. **Given** a user is on the matter overview (no specific document), **When** they ask "Find all indemnity clauses", **Then** the agent searches across all documents in the matter
3. **Given** a user switches from viewing Document A to Document B, **When** they ask a question, **Then** the context updates to reference Document B

---

### User Story 3 - Template-First Legal Analysis (Priority: P2)

As a user who is not familiar with IQL syntax, I want to quickly select from pre-built analysis templates (e.g., "Find Confidentiality Clauses", "Find Termination Clauses") to analyze my documents without learning query syntax.

**Why this priority**: Templates lower the barrier to entry for most users. While P1 provides conversational access, templates provide one-click analysis for common legal tasks.

**Independent Test**: Can be fully tested by viewing a document, clicking a template button like "Confidentiality Clause", and verifying matching clauses are highlighted with confidence scores.

**Acceptance Scenarios**:

1. **Given** a user is viewing a legal document, **When** they click on a template like "Indemnity Clause", **Then** the system immediately runs the IQL query and displays scored results
2. **Given** a user selects a parameterized template like "Clause Obligating [Party]", **When** they enter "Customer" as the party name, **Then** the system constructs and runs `{IS clause obligating "Customer"}`
3. **Given** results are displayed, **When** a clause has a score above 70%, **Then** it is visually distinguished as high-confidence; below 50% as low-confidence

---

### User Story 4 - Combine Templates with Operators (Priority: P3)

As a power user, I want to combine multiple templates using logical operators (AND, OR, NOT) through an advanced query builder, so that I can perform sophisticated multi-criteria analysis.

**Why this priority**: This is for advanced users who need complex analysis. Most users will use templates or chat, but power users need the full capability.

**Independent Test**: Can be fully tested by building a query like "Termination Clause AND Unilateral Clause" and verifying the combined results meet both criteria.

**Acceptance Scenarios**:

1. **Given** a user accesses the advanced query builder, **When** they combine "Termination Clause" AND "Unilateral Clause", **Then** the system executes `{IS termination clause} AND {IS unilateral clause}` and returns results matching both
2. **Given** a user uses the comparison operator (>), **When** they query "Confidentiality > Termination", **Then** the system returns sections where confidentiality relevance exceeds termination relevance
3. **Given** a user builds an invalid query, **When** they attempt to run it, **Then** the system provides clear syntax error feedback with suggestions

---

### Edge Cases

- What happens when the agent receives a document-specific query but the document is still processing?
  - Agent should inform user the document is not yet ready and offer to search ready documents
- What happens when a user asks about a document that doesn't exist in the matter?
  - Agent should list available documents and ask for clarification
- How does the system handle queries that could be interpreted as either search (embeddings) or classification (IQL)?
  - Agent uses heuristics: questions about existence/finding use IQL; questions about content/meaning use search
- What happens when IQL returns no matches (score < 0.5 for all clauses)?
  - System clearly indicates no matching clauses found and suggests alternative queries or templates

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Agent MUST have access to the `isaacus_iql` tool for IQL-based legal document analysis
- **FR-002**: Agent MUST be able to translate natural language clause queries into valid IQL syntax
- **FR-003**: Chat context MUST include `document_id` when user is viewing a specific document
- **FR-004**: Agent MUST use `document_ids` filter when document context is provided
- **FR-005**: Agent MUST search all documents in matter when no specific document context exists
- **FR-006**: System MUST display IQL results with confidence scores interpreted as probabilities
- **FR-007**: System MUST visually distinguish high-confidence (>70%), medium (50-70%), and low-confidence (<50%) results
- **FR-008**: Template selector MUST provide access to all pre-built IQL templates (15+ templates)
- **FR-009**: Template selector MUST support parameterized templates with input fields
- **FR-010**: Advanced query builder MUST validate IQL syntax before execution
- **FR-011**: Agent instructions MUST document when to use `isaacus_iql` vs `isaacus_classify` vs `isaacus_search`

### Key Entities

- **Document Context**: Metadata passed to agent including matter_id (always) and document_id (when viewing specific document)
- **IQL Query**: A query string in Isaacus Query Language; may use templates, parameters, or operators
- **IQL Result**: Analysis output containing matched text, character positions, and calibrated probability scores (0-1)
- **IQL Template**: Pre-built, optimized query pattern with name, description, optional parameter, and category

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can ask natural language questions about clauses in chat and receive IQL-based analysis results within 10 seconds for documents under 50 pages
- **SC-002**: 90% of users can successfully analyze a document using templates without any training or documentation
- **SC-003**: When viewing a specific document, 100% of user queries target that document by default (no manual document selection required)
- **SC-004**: Query results clearly distinguish confidence levels: users can identify high-confidence matches at a glance
- **SC-005**: Agent correctly chooses between IQL (clause analysis), search (finding content), and extract (answering questions) tools based on user intent 85% of the time
- **SC-006**: Template-based analysis can be initiated with a single click for non-parameterized templates
- **SC-007**: Users report document analysis is faster and more accurate compared to manual review (qualitative user feedback)

## Clarifications

### Session 2024-12-24

- Q: Should embeddings continue to use the existing custom IsaacusClient or switch to langchain-isaacus? → A: Keep custom client for IQL/classify/extract. langchain-isaacus is optional for embeddings integration if cleaner LangChain patterns are desired.
- Q: How should document context be passed when user switches between documents? → A: Context updates in real-time when user navigates to a different document; cleared when returning to matter overview.

## Assumptions

- The existing `isaacus_iql.py` tool is functional and just needs to be exposed in `ISAACUS_TOOLS`
- IQL template definitions are already available in the frontend (`iql-templates.ts`)
- Supabase Edge Function for document processing continues to handle embedding generation
- Agent runs on LangSmith with access to environment variables for Isaacus API
- Users access the system through authenticated sessions (Supabase Auth)
- Document viewer page has access to the current document_id for context injection
