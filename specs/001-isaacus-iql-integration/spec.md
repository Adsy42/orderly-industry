# Feature Specification: Isaacus IQL Legal Document Analysis

**Feature Branch**: `001-isaacus-iql-integration`  
**Created**: 2024-12-24  
**Status**: Draft  
**Input**: User description: "Leverage Isaacus functionalities for legal document analysis using IQL (Isaacus Query Language)"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Analyze Legal Document with IQL Query (Priority: P1)

As a user, I want to upload a legal document and run IQL queries against it to identify specific clauses, obligations, and rights, so that I can quickly understand the key legal provisions without reading the entire document.

**Why this priority**: This is the core value proposition of the feature - enabling users to extract specific legal information from documents using Isaacus's AI-powered query language. Without this, no other Isaacus functionality can be demonstrated.

**Independent Test**: Can be fully tested by uploading a sample contract and running a simple IQL template query (e.g., `{IS confidentiality clause}`) and verifying that matching clauses are identified with confidence scores.

**Acceptance Scenarios**:

1. **Given** a user has uploaded a legal document, **When** they enter an IQL query like `{IS confidentiality clause}`, **Then** the system returns matching document sections with confidence scores (0-1) indicating likelihood of match
2. **Given** a user has uploaded a legal document, **When** they run a query that finds no matches, **Then** the system clearly indicates no matching clauses were found with a score below 50%
3. **Given** a user has uploaded a legal document, **When** the Isaacus service is unavailable, **Then** the system displays a user-friendly error message with retry option

---

### User Story 2 - Use Pre-built IQL Templates (Priority: P1)

As a user, I want to select from pre-built IQL templates for common legal analysis tasks, so that I can analyze documents without learning IQL syntax.

**Why this priority**: Templates lower the barrier to entry significantly, making the feature accessible to users who are not familiar with IQL syntax. This directly enables the P1 functionality.

**Independent Test**: Can be fully tested by selecting a template from a list (e.g., "confidentiality clause", "termination clause"), applying it to a document, and verifying results are returned.

**Acceptance Scenarios**:

1. **Given** a user is viewing their uploaded document, **When** they access the template selector, **Then** they see a categorized list of available IQL templates with descriptions
2. **Given** a user selects a template with parameters (e.g., `clause obligating "<party name>"`), **When** they fill in the parameter value, **Then** the system constructs and executes the complete IQL query
3. **Given** a user selects a simple template (e.g., `confidentiality clause`), **When** they apply it, **Then** the query executes immediately without requiring additional input

---

### User Story 3 - Build Complex IQL Queries with Operators (Priority: P2)

As an advanced user, I want to combine multiple IQL statements using logical operators (AND, OR, NOT) and comparison operators, so that I can perform sophisticated legal document analysis.

**Why this priority**: This extends the core functionality for power users but requires the basic query functionality to work first. Not essential for MVP.

**Independent Test**: Can be fully tested by constructing a compound query like `{IS confidentiality clause} AND {IS unilateral clause}` and verifying the system returns the minimum score of both conditions.

**Acceptance Scenarios**:

1. **Given** a user wants to find confidentiality clauses that are unilateral, **When** they enter `{IS confidentiality clause} AND {IS unilateral clause}`, **Then** the system returns sections matching both criteria with the minimum score
2. **Given** a user wants to find clauses that are either confidentiality OR non-compete, **When** they enter `{IS confidentiality clause} OR {IS non-compete clause}`, **Then** the system returns sections matching either criteria with the maximum score
3. **Given** a user wants to exclude certain clause types, **When** they use the NOT operator, **Then** the system inverts the score (1 - original score) appropriately

---

### User Story 4 - View and Export Analysis Results (Priority: P2)

As a user, I want to view IQL query results in a clear, organized format and export them, so that I can share findings with colleagues or include them in reports.

**Why this priority**: Result presentation is important for usability but the core analysis must work first. Export functionality enhances but doesn't block primary use.

**Independent Test**: Can be fully tested by running any IQL query and verifying results display with document excerpts, scores, and export functionality.

**Acceptance Scenarios**:

1. **Given** an IQL query has returned results, **When** the user views the results, **Then** they see each matching section with its text excerpt, confidence score, and location in the document
2. **Given** results are displayed, **When** the user clicks on a result, **Then** they are navigated to that section in the document viewer
3. **Given** results are displayed, **When** the user exports results, **Then** they receive a structured format containing all matches with metadata

---

### User Story 5 - Save and Reuse IQL Queries (Priority: P3)

As a frequent user, I want to save custom IQL queries for reuse, so that I can efficiently analyze multiple documents with the same criteria.

**Why this priority**: This is a convenience feature that improves efficiency for repeat users but is not essential for initial release.

**Independent Test**: Can be fully tested by saving a custom query, refreshing the page, and verifying the saved query is available for reuse.

**Acceptance Scenarios**:

1. **Given** a user has created a custom IQL query, **When** they save it with a name and optional description, **Then** the query appears in their saved queries list
2. **Given** a user has saved queries, **When** they select one to apply to a new document, **Then** the query executes against the current document
3. **Given** a user has saved queries, **When** they edit or delete a saved query, **Then** the changes persist across sessions

---

### Edge Cases

- What happens when a document is too large for the Isaacus model's context window?
  - System should chunk the document appropriately and aggregate results
- How does system handle non-legal documents (e.g., images, spreadsheets)?
  - System should validate document type and inform user of supported formats
- What happens when IQL syntax is malformed?
  - System should display a clear syntax error with guidance on correct format
- How does system handle documents in languages other than English?
  - System should indicate supported languages and warn if document language may not be supported
- What happens when confidence score is exactly 50% (borderline)?
  - System should clearly indicate borderline results and allow user to review

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST accept legal documents in common formats for analysis (PDF, DOCX, TXT)
- **FR-002**: System MUST parse and validate IQL query syntax before execution
- **FR-003**: System MUST execute IQL queries against uploaded documents via Isaacus API using existing `extracted_text` field (on-demand, no preprocessing)
- **FR-004**: System MUST display query results with confidence scores ranging from 0 to 1
- **FR-005**: System MUST support all IQL logical operators: AND, OR, NOT, >, <, +
- **FR-006**: System MUST provide access to pre-built IQL templates as defined by Isaacus
- **FR-007**: System MUST support parameterized templates (e.g., `clause obligating "<party name>"`)
- **FR-008**: System MUST highlight matching document sections in results
- **FR-009**: System MUST persist user's saved queries across sessions
- **FR-010**: System MUST handle Isaacus API errors gracefully with user-friendly messages
- **FR-011**: System MUST indicate when a confidence score is above 50% (affirmative) or below (negative)
- **FR-012**: System MUST respect operator precedence as defined by IQL specification: (), +, >, <, NOT, AND, OR

### Key Entities

- **Legal Document**: An uploaded file containing legal text to be analyzed; attributes include file name, format, upload date, content, and owner
- **IQL Query**: A query string written in Isaacus Query Language; may be ad-hoc or saved; contains statements, operators, and optional template references
- **Query Result**: The response from Isaacus analysis; includes matched text sections, confidence scores, and document locations
- **Saved Query**: A user-created query stored for reuse; includes name, description, query string, and creation date
- **IQL Template**: A pre-built, optimized query pattern provided by Isaacus; includes template name, description, and parameter requirements

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can upload a legal document and receive IQL query results within 30 seconds for documents under 50 pages
- **SC-002**: 90% of users can successfully run their first IQL query using templates without documentation
- **SC-003**: Query results display with clear visual distinction between high-confidence (>70%) and low-confidence (<50%) matches
- **SC-004**: Users can access and use at least 15 pre-built IQL templates covering common legal clause types
- **SC-005**: Saved queries persist and can be retrieved in subsequent sessions with 100% reliability
- **SC-006**: System gracefully handles API errors, displaying meaningful messages within 5 seconds of failure detection
- **SC-007**: Users can export analysis results in at least one structured format within 3 clicks from results view

## Clarifications

### Session 2024-12-24

- Q: Should IQL queries use existing extracted text on-demand, or require additional preprocessing at upload time? → A: On-demand query execution using existing `extracted_text` field. No changes to upload flow. IQL queries execute at query time via Isaacus API, separate from embedding generation.

## Assumptions

- Isaacus API access and credentials will be available for integration
- The Isaacus models (kanon-universal-classifier or kanon-universal-classifier-mini) will be used for query execution
- Document text extraction from PDF/DOCX will be handled prior to Isaacus analysis (existing process)
- IQL queries execute on-demand using existing `extracted_text` field (no preprocessing required)
- Users have basic understanding of legal document structure (clauses, provisions, etc.)
- The system will integrate with the existing authentication mechanism (Supabase Auth)
- Query history and saved queries will be scoped to authenticated users
