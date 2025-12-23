# Feature Specification: Matters & Document Management Foundation

**Feature Branch**: `004-matters-documents`  
**Created**: 2025-12-23  
**Status**: Draft  
**Target Market**: Australian Legal  
**Input**: User description: "Implement the core data foundation for a legal AI platform inspired by Harvey AI, enabling counsel (legal professionals) to organize work into matters (cases/projects) and manage documents with AI-powered analysis. This establishes the primary entities that all other features will build upon."

## Overview

This feature establishes the foundation for Orderly as an AI-powered legal platform for Australian counsel. It leverages two key technologies:

1. **[Deep Agents](https://docs.langchain.com/oss/python/deepagents/overview)** - LangGraph-based agent framework for complex multi-step tasks with planning, subagents, and context management (already in use)
2. **[Isaacus API](https://docs.isaacus.com/capabilities/introduction)** — the world's first legal AI API — for domain-specific document intelligence

### Deep Agents + Isaacus Architecture

The existing deep agent orchestrator is extended with Isaacus-powered tools and a specialized document analysis subagent:

| Component                     | Role                                | Tools                                             |
| ----------------------------- | ----------------------------------- | ------------------------------------------------- |
| **Orchestrator**              | Plans tasks, delegates to subagents | write_todos, task, read_file, write_file          |
| **Research Agent** (existing) | Web research                        | tavily_search, think_tool                         |
| **Document Agent** (new)      | Matter document analysis            | isaacus_search, isaacus_extract, isaacus_classify |

### Isaacus Integration Points

Isaacus capabilities are exposed as agent tools within the deep agents framework:

| Isaacus Capability           | Agent Tool         | Use in Orderly                                    |
| ---------------------------- | ------------------ | ------------------------------------------------- |
| **Embedding**                | `isaacus_search`   | Semantic document search by meaning               |
| **Reranking**                | `isaacus_search`   | Optimal result ordering (combined with embedding) |
| **Extractive QA**            | `isaacus_extract`  | Precise answer extraction with citations          |
| **Universal Classification** | `isaacus_classify` | Contract clause identification                    |

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create and Manage Matters (Priority: P1)

As Australian counsel, I want to create matters (legal cases/projects) to organize my work, so that I can keep documents, conversations, and research grouped by client case.

**Why this priority**: Matters are the foundational organizational unit. Without matters, documents and conversations have no context. This is the prerequisite for all other features.

**Independent Test**: Can be fully tested by creating a matter with title and description, viewing the matter list, and editing matter details. Delivers immediate value by providing organizational structure.

**Acceptance Scenarios**:

1. **Given** counsel is authenticated, **When** they click "New Matter", **Then** they see a form to enter matter title, description, and optional matter number
2. **Given** counsel has filled out matter details, **When** they submit the form, **Then** the matter is created and they are redirected to the matter detail view
3. **Given** counsel has multiple matters, **When** they view their matters list, **Then** they see all their matters sorted by most recent activity with title, status, and document count
4. **Given** counsel views a matter, **When** they click "Edit", **Then** they can update the title, description, and status (active, closed, archived)
5. **Given** counsel has created matters, **When** they log in from a different device, **Then** they see all their matters preserved

---

### User Story 2 - Upload Documents to Matters (Priority: P1)

As counsel, I want to upload Australian legal documents to a matter using drag-and-drop, so that I can store and organize case-related files securely.

**Why this priority**: Document storage is core to the legal workflow. This enables all document-related AI features including Isaacus-powered analysis.

**Independent Test**: Can be fully tested by uploading PDF, DOCX, and TXT files to a matter and seeing them listed. Delivers value by providing secure document storage.

**Acceptance Scenarios**:

1. **Given** counsel is viewing a matter, **When** they drag files onto the upload area, **Then** the files are uploaded with progress indication
2. **Given** counsel is uploading files, **When** upload completes, **Then** files appear in the document list with filename, size, upload date, and processing status
3. **Given** counsel tries to upload unsupported file types, **When** they drop the files, **Then** they see a clear error message indicating supported formats (PDF, DOCX, TXT)
4. **Given** counsel uploads a file exceeding size limit, **When** they attempt upload, **Then** they see a clear error message with the maximum allowed size (50MB)
5. **Given** counsel has uploaded documents, **When** they view the matter later, **Then** all uploaded documents are listed and accessible

---

### User Story 3 - Document Processing & Embedding (Priority: P1)

As counsel, I want uploaded documents to be automatically processed for text extraction and AI-ready embedding, so that the system can perform intelligent search and analysis.

**Why this priority**: Document processing (text extraction + Isaacus embedding) enables all AI features. Without embeddings, semantic search and legal AI analysis are not possible.

**Independent Test**: Can be fully tested by uploading a document and verifying extracted text and embedding generation complete. Delivers value by making document content AI-accessible.

**Acceptance Scenarios**:

1. **Given** counsel has uploaded a document, **When** upload completes, **Then** the document status shows "Processing"
2. **Given** a document is being processed, **When** text extraction completes, **Then** the system generates legal-optimized embeddings via Isaacus
3. **Given** embedding generation completes, **When** processing finishes, **Then** the document status changes to "Ready" and is searchable
4. **Given** processing fails at any step, **When** an error occurs, **Then** the document status shows "Error" with a message indicating the issue
5. **Given** multiple documents are uploaded simultaneously, **When** processing occurs, **Then** each document is processed independently with individual status updates

---

### User Story 4 - Semantic Search Within a Matter (Priority: P2)

As counsel, I want to search across all documents in a matter using natural language queries, so that I can find relevant information by meaning rather than exact keyword matches.

**Why this priority**: Semantic search (powered by Isaacus Embedding + Reranking) transforms document storage into a powerful research tool. This is a key differentiator for legal AI.

**Independent Test**: Can be fully tested by uploading documents and searching with natural language queries that don't match exact document text.

**Acceptance Scenarios**:

1. **Given** counsel is viewing a matter with documents, **When** they enter a search query, **Then** semantically relevant documents are returned ranked by relevance
2. **Given** counsel searches with legal terminology, **When** results are returned, **Then** documents containing related legal concepts are found (even without exact keyword match)
3. **Given** counsel searches for a concept, **When** results are returned, **Then** they see the document name and a relevant excerpt with the most pertinent section highlighted
4. **Given** counsel searches for a term not covered in any document, **When** results are returned, **Then** they see a "No results found" message
5. **Given** counsel clicks on a search result, **When** the document opens, **Then** they can view or download the original file

---

### User Story 5 - Matter Participants and Access Control (Priority: P2)

As counsel, I want to invite team members and clients to collaborate on a matter with specific roles, so that I can control who can view and modify matter contents.

**Why this priority**: Collaboration is essential for legal teams. However, solo use is viable without this, making it P2.

**Independent Test**: Can be fully tested by inviting another user to a matter, verifying they can access it with appropriate permissions.

**Acceptance Scenarios**:

1. **Given** counsel owns a matter, **When** they click "Manage Participants", **Then** they see a list of current participants with their roles
2. **Given** counsel is adding a participant, **When** they enter an email and select a role (counsel, client, observer), **Then** that user gains access to the matter
3. **Given** a user has been added as "observer", **When** they view the matter, **Then** they can view documents but cannot upload, edit, or delete
4. **Given** a user has been added as "client", **When** they view the matter, **Then** they can view and upload documents but cannot manage participants
5. **Given** counsel removes a participant, **When** that user tries to access the matter, **Then** they receive an access denied message

---

### User Story 6 - AI Document Analysis with Extractive QA (Priority: P2)

As counsel, I want the AI to extract precise answers from documents with citations, so that I can quickly find specific information without reading entire documents.

**Why this priority**: Isaacus Extractive QA provides high-precision answer extraction that differentiates Orderly from basic document storage. Depends on documents and embeddings being in place.

**Independent Test**: Can be fully tested by asking the AI a question about document contents and receiving a precise extracted answer with page/section citation.

**Acceptance Scenarios**:

1. **Given** counsel asks "What is the limitation period in this contract?", **When** the AI responds, **Then** it extracts the exact clause with citation (document name, page/section)
2. **Given** counsel asks about a party's obligations, **When** the AI responds, **Then** it pulls the relevant provisions with precise references
3. **Given** counsel asks a question spanning multiple documents, **When** the AI responds, **Then** it synthesizes answers from each document with proper attribution
4. **Given** counsel asks about information not in any document, **When** the AI responds, **Then** it clearly indicates the information was not found

---

### User Story 7 - Clause Classification and Extraction (Priority: P2)

As counsel, I want the AI to automatically identify and classify contract clauses, so that I can quickly navigate to specific provisions in legal documents.

**Why this priority**: Isaacus Universal Classification enables clause extraction without prior examples, ideal for diverse Australian contract types. Enhances document analysis significantly.

**Independent Test**: Can be fully tested by uploading a contract and requesting clause classification, receiving structured output of identified clauses.

**Acceptance Scenarios**:

1. **Given** counsel uploads a contract, **When** they request clause analysis, **Then** the system identifies and categorizes clauses (termination, indemnity, liability, confidentiality, etc.)
2. **Given** counsel views clause analysis results, **When** they click a clause type, **Then** they are navigated to that section in the document
3. **Given** counsel specifies a custom clause type to find, **When** analysis runs, **Then** the system finds matching clauses based on the description (no training required)
4. **Given** a document has no identifiable clauses of a type, **When** analysis completes, **Then** the system indicates that clause type was not found

---

### User Story 8 - Natural Language Document Queries (Priority: P3)

As counsel, I want to ask the AI conversational questions about my matter documents, so that I can research my case naturally without constructing specific searches.

**Why this priority**: Natural language queries enhance the experience but semantic search (P2) and extractive QA (P2) provide core functionality. This is an enhancement combining both.

**Independent Test**: Can be fully tested by asking complex questions and receiving comprehensive answers sourced from matter documents.

**Acceptance Scenarios**:

1. **Given** counsel asks "Summarize the key risks in the lease agreement", **When** the AI responds, **Then** it provides a structured summary with citations to relevant clauses
2. **Given** counsel asks a comparative question like "Which contract has the longer notice period?", **When** the AI responds, **Then** it compares across documents with specific citations
3. **Given** counsel asks a vague question, **When** the AI responds, **Then** it asks clarifying questions or provides its best interpretation with sources

---

### Edge Cases

- What happens when a document upload is interrupted mid-upload? (Resume or restart, clear error handling)
- How does the system handle duplicate filenames in the same matter? (Append timestamp or version number)
- What happens when Isaacus API is unavailable during document processing? (Queue for retry, show partial status)
- What happens when text extraction succeeds but embedding generation fails? (Document searchable by text, not semantically)
- How does the system handle corrupted or password-protected files? (Clear error message, document marked as unprocessable)
- What happens when a matter owner deletes their account? (Transfer ownership or archive matter)
- How does the system handle concurrent edits to matter details? (Last-write-wins or conflict notification)
- What happens when storage quota is exceeded? (Clear message, prevent upload until space is freed)
- How does the system handle non-English documents? (Process as-is, note Isaacus is optimized for legal English)

## Requirements _(mandatory)_

### Functional Requirements

#### Matter Management

- **FR-001**: System MUST allow authenticated users to create matters with a title (required) and description (optional)
- **FR-002**: System MUST generate a unique matter number for each matter in format "M-YYYY-NNN" where NNN is sequential
- **FR-003**: System MUST display a list of all matters owned by or shared with the authenticated user
- **FR-004**: System MUST sort matters by most recent activity by default
- **FR-005**: System MUST allow matter owners to update matter title, description, and status
- **FR-006**: System MUST support matter statuses: active, closed, archived
- **FR-007**: System MUST allow matter owners to delete matters (with confirmation)
- **FR-008**: System MUST cascade delete all documents and embeddings when a matter is deleted

#### Document Management

- **FR-009**: System MUST allow users with appropriate permissions to upload documents to matters
- **FR-010**: System MUST accept PDF, DOCX, and TXT file formats
- **FR-011**: System MUST reject files exceeding 50MB with a clear error message
- **FR-012**: System MUST reject files with unsupported formats with a clear error message listing accepted formats
- **FR-013**: System MUST store uploaded documents securely with access restricted to matter participants
- **FR-014**: System MUST display upload progress during document upload
- **FR-015**: System MUST record document metadata: filename, file type, size, upload date, uploaded by
- **FR-016**: System MUST display documents in a list showing filename, type icon, size, date, and status

#### Document Processing

- **FR-017**: System MUST automatically extract text from uploaded documents after upload completes
- **FR-018**: System MUST generate legal-optimized embeddings for extracted text using Isaacus Embedding API
- **FR-019**: System MUST update document status during processing: uploading → extracting → embedding → ready (or error)
- **FR-020**: System MUST store extracted text for display and fallback search
- **FR-021**: System MUST store document embeddings for semantic search
- **FR-022**: System MUST handle processing failures gracefully with status "error" and error message
- **FR-023**: System MUST retry failed Isaacus API calls up to 3 times before marking as error

#### Search

- **FR-024**: System MUST provide semantic search across all documents within a matter using Isaacus Embedding
- **FR-025**: System MUST rerank search results using Isaacus Reranking for optimal relevance ordering
- **FR-026**: System MUST display matching excerpts with the most relevant section highlighted
- **FR-027**: System MUST display "No results found" when search yields no matches
- **FR-028**: System MUST support fallback to full-text search when semantic search is unavailable

#### Access Control

- **FR-029**: System MUST restrict matter access to owner and explicitly added participants only
- **FR-030**: System MUST support participant roles: counsel (full access), client (view/upload), observer (view only)
- **FR-031**: System MUST allow matter owners to add participants by email
- **FR-032**: System MUST allow matter owners to remove participants
- **FR-033**: System MUST allow matter owners to change participant roles
- **FR-034**: System MUST prevent unauthorized users from accessing matter contents

#### AI Integration (Deep Agents + Isaacus)

- **FR-035**: System MUST extend the existing deep agent with new Isaacus-powered tools
- **FR-036**: System MUST provide `isaacus_search` tool for semantic document search within matters (Embedding + Reranking)
- **FR-037**: System MUST provide `isaacus_extract` tool for precise answer extraction with citations (Extractive QA)
- **FR-038**: System MUST provide `isaacus_classify` tool for clause classification and extraction (Universal Classification)
- **FR-039**: System MUST create a Document Agent subagent specialized for matter document analysis
- **FR-040**: System MUST include document citations (name, page/section) in all AI responses
- **FR-041**: System MUST allow the orchestrator to delegate document tasks to the Document Agent subagent
- **FR-042**: System MUST use deep agents file system tools to manage large document context

### Key Entities

- **Matter**: Represents a legal case or project that organizes work. Contains title, description, matter number, status, owner, jurisdiction (defaults to Australia), creation date, and last activity date. Has many documents and many participants. Belongs to one owner (user).

- **Document**: Represents an uploaded file within a matter. Contains filename, file type, file size, storage reference, extracted text, embedding reference, processing status, upload date, and metadata. Belongs to one matter. Uploaded by one user.

- **Document Embedding**: Represents the vector embedding of a document or document chunk for semantic search. Contains embedding vector, chunk text, chunk position, and document reference. Generated via Isaacus Embedding API. Enables semantic search and AI retrieval.

- **Matter Participant**: Represents a user's access to a matter. Contains the user reference, matter reference, role (counsel/client/observer), and date added. Links users to matters they can access beyond ownership.

### Agent Tools (Deep Agents Extensions)

- **isaacus_search**: Searches documents within a specified matter using semantic similarity. Accepts matter_id and query string. Returns ranked document excerpts with relevance scores. Uses Isaacus Embedding for query vectorization and Reranking for result ordering.

- **isaacus_extract**: Extracts precise answers from documents. Accepts document_id and question. Returns extracted answer with exact citation (document, page, section). Uses Isaacus Extractive QA.

- **isaacus_classify**: Classifies and extracts clauses from legal documents. Accepts document_id and optional clause_types array. Returns identified clauses with positions. Uses Isaacus Universal Classification.

### Subagents (Deep Agents Extensions)

- **Document Agent**: Specialized subagent for matter document analysis. Has access to isaacus_search, isaacus_extract, isaacus_classify, and think_tool. Spawned by orchestrator for document-heavy tasks. Keeps main agent context clean while going deep on document analysis.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Counsel can create a new matter and see it in their list within 2 seconds
- **SC-002**: Document upload completes within 10 seconds for files under 10MB on standard connection
- **SC-003**: Document processing (extraction + embedding) completes within 60 seconds for documents under 50 pages
- **SC-004**: 95% of uploaded documents are successfully processed with text extraction and embeddings
- **SC-005**: Semantic search returns relevant results within 3 seconds for matters with up to 100 documents
- **SC-006**: Isaacus Extractive QA returns precise answers with citations for 85% of answerable questions
- **SC-007**: 100% of unauthorized access attempts are blocked by access control
- **SC-008**: Counsel can find specific information across 10+ documents in under 30 seconds using search
- **SC-009**: Clause classification correctly identifies 80% of standard contract clause types
- **SC-010**: New users can successfully upload their first document within 1 minute of creating a matter

## Assumptions

- User authentication is already implemented via Supabase Auth and user profiles exist
- Existing deep agents architecture (LangGraph + deepagents library) is in place and working
- Deep agents orchestrator can be extended with new tools and subagents
- Counsel have stable internet connections for document uploads
- Documents are primarily in English (Isaacus is optimized for legal English)
- Documents are primarily text-based (not scanned images requiring OCR)
- Isaacus API is available and accessible from the application backend
- Isaacus API account is provisioned with appropriate rate limits
- Initial storage quota of 1GB per user is sufficient for MVP
- Embedding storage quota is sufficient for MVP document volume
- PDF documents are not password-protected (password-protected files will be marked as unprocessable)
- DOCX files follow standard Open XML format
- Users will access the system via modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
- Maximum 10 simultaneous file uploads per user session
- Matter titles are limited to 200 characters, descriptions to 2000 characters
- Target jurisdiction is Australia; Australian legal terminology and conventions apply
- Isaacus API costs are acceptable for the expected document volume
- Deep agents file system tools can be used for managing large document excerpts in context
