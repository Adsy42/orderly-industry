# Feature Specification: Supabase Data Persistence Layer

**Feature Branch**: `002-supabase-persistence`  
**Created**: 2025-01-12  
**Status**: Draft  
**Input**: User description: "# Feature: Supabase Data Persistence Layer

## Description

Implement a data persistence layer that stores user conversations, research artifacts, and preferences in Supabase PostgreSQL, bridging the gap between LangGraph's ephemeral execution and long-term user data needs.

## Context

Currently, the Deep Research Agent uses LangGraph for agent execution with a virtual file system that is ephemeral—research reports written to /final_report.md and conversation context are lost after a thread ends. Users cannot browse past research, search their history, or access completed reports outside of active sessions.

## Goals

1. **Conversation Persistence**: Store conversation metadata in Supabase, linked to LangGraph thread IDs, enabling users to browse and manage their research history
2. **Research Artifact Storage**: Persist final research reports to Supabase so users can access, search, and export past research
3. **User Preferences**: Store user settings (preferred model, theme, notification preferences) in Supabase
4. **Integration Pattern**: Define how the agent saves artifacts to Supabase during execution while maintaining the existing LangGraph workflow

## User Scenarios

### Primary Users

- Researchers who conduct multiple research sessions and need to reference past findings
- Users who want to organize, search, and manage their research history
- Users who switch devices and expect their preferences to persist

### Key Workflows

1. User starts a new conversation → conversation record created in Supabase with LangGraph thread_id
2. Agent completes research → final report saved to Supabase research_artifacts table
3. User opens app on new device → sees full conversation history from Supabase
4. User searches \"AI safety\" → finds all past research containing that topic
5. User deletes a conversation → cascades to delete associated artifacts

## Scope Boundaries

### In Scope

- Conversations table with thread linking
- Research artifacts table with full-text search capability
- User preferences table
- Custom agent tool to persist reports to Supabase
- Frontend queries to Supabase for history sidebar
- RLS policies for all new tables

### Out of Scope

- Real-time collaboration/sharing (future feature)
- File attachments in Supabase Storage (use later)
- Cross-user analytics or aggregation
- Long-term agent memory across sessions (optional future enhancement)

## Technical Constraints

- Must integrate with existing Supabase Auth (user_id from profiles)
- Must not break existing LangGraph streaming flow
- Agent must be able to call Supabase from Python (via supabase-py or raw HTTP)
- Frontend already has Supabase client configured

## Success Metrics

- Users can view all past conversations after re-login
- Users can access any completed research report indefinitely
- Search returns relevant past research within 2 seconds
- Zero data loss when LangGraph threads are garbage collected"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browse Past Research Conversations (Priority: P1)

As a researcher, I want to view my past research conversations in a list, so that I can quickly find and revisit previous research sessions.

**Why this priority**: This is the foundational capability that enables all other persistence features. Without conversation history, users cannot discover or access past research.

**Independent Test**: Can be fully tested by querying stored conversation records for the authenticated user and displaying them in a list. This delivers immediate value by making past conversations discoverable.

**Acceptance Scenarios**:

1. **Given** a user has completed multiple research sessions, **When** they open the application, **Then** they see a list of all their past conversations with titles (auto-extracted from first message or user-edited) and timestamps
2. **Given** a user has no previous conversations, **When** they open the application, **Then** they see an empty state indicating no conversations yet
3. **Given** a user views their conversation list, **When** they see conversations sorted by most recent first, **Then** the list shows up to 100 conversations with pagination if needed
4. **Given** a user creates a new conversation, **When** the first message is sent, **Then** a conversation title is auto-extracted from the first 50-100 characters of that message
5. **Given** a user views a conversation with an auto-generated title, **When** they edit the title, **Then** the updated title is saved and persists across sessions

---

### User Story 2 - Access Completed Research Reports (Priority: P1)

As a researcher, I want to access the full research report from any past conversation, so that I can reference findings without re-running research.

**Why this priority**: Research reports are the primary output of the agent. Users must be able to retrieve completed reports indefinitely to realize value from past research sessions.

**Independent Test**: Can be fully tested by saving a completed research report and then retrieving it by conversation ID. This delivers immediate value by preserving research outputs beyond session boundaries.

**Acceptance Scenarios**:

1. **Given** an agent has completed research and generated a final report, **When** the report is saved, **Then** it is stored in structured JSON format (preserving section headings, citations, formatting) with a link to its conversation
2. **Given** a user views a past conversation, **When** they request the research report, **Then** the full report content is retrieved and displayed with preserved formatting and structure
3. **Given** a user has multiple artifacts in a conversation, **When** they view the conversation, **Then** they can see all artifacts with their types and titles

---

### User Story 3 - Search Past Research (Priority: P2)

As a researcher, I want to search across my past research reports, so that I can quickly find information on topics I've researched before.

**Why this priority**: As users accumulate research, search becomes essential for discovery. This enhances the value of persistence by enabling efficient information retrieval.

**Independent Test**: Can be fully tested by executing a text search query against stored research artifacts and returning relevant results. This delivers value by making accumulated research discoverable.

**Acceptance Scenarios**:

1. **Given** a user has multiple research reports stored, **When** they search for a keyword, **Then** relevant reports containing that keyword are returned
2. **Given** a user searches for a term, **When** no matching reports exist, **Then** they see a message indicating no results found
3. **Given** a user performs a search, **When** results are returned, **Then** they are ranked by relevance and returned within 2 seconds

---

### User Story 4 - Manage Conversation History (Priority: P2)

As a researcher, I want to delete conversations I no longer need, so that I can keep my history organized and focused.

**Why this priority**: Users need control over their data. Deletion capability provides essential data management functionality while maintaining referential integrity.

**Independent Test**: Can be fully tested by deleting a conversation record and verifying that associated artifacts are also removed. This delivers value by giving users control over their stored data.

**Acceptance Scenarios**:

1. **Given** a user has conversations stored, **When** they delete a conversation, **Then** the conversation and all its associated artifacts are removed
2. **Given** a user attempts to delete a conversation, **When** they confirm the deletion, **Then** the conversation is permanently deleted and cannot be recovered
3. **Given** a user deletes a conversation, **When** the deletion completes, **Then** the conversation list updates immediately to reflect the change

---

### User Story 5 - Persist User Preferences (Priority: P3)

As a user, I want my application preferences to be saved across devices and sessions, so that I don't need to reconfigure settings repeatedly.

**Why this priority**: While valuable for user experience, preferences are less critical than core persistence features. This can be implemented after the primary research persistence is working.

**Independent Test**: Can be fully tested by saving a user preference and retrieving it in a subsequent session. This delivers value by maintaining personalized settings.

**Acceptance Scenarios**:

1. **Given** a user updates their preferred settings, **When** they save the changes, **Then** the preferences are stored and persist across sessions
2. **Given** a user logs in on a different device, **When** they open the application, **Then** their saved preferences are applied
3. **Given** a user has not set preferences, **When** they use the application, **Then** default preferences are applied

---

### Edge Cases

- What happens when a conversation is created but the agent fails to generate a report? (Conversation exists but has no artifacts)
- How does the system handle orphaned artifacts if a conversation is deleted outside the normal flow?
- What happens when a user searches with special characters or very long search terms?
- How does the system handle concurrent updates to the same conversation from multiple sessions?
- What happens when storage limits are reached for a user's research artifacts?
- How does the system handle invalid or malformed thread IDs when linking conversations?
- What happens when a user's authentication token expires during an artifact save operation?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST store conversation metadata including title (auto-extracted from first user message initially, user-editable later), thread identifier, user identifier, and timestamps
- **FR-002**: System MUST link each conversation to exactly one user account via user identifier
- **FR-003**: System MUST store research artifacts including content in structured JSON format (preserving section headings, citations, formatting), type, title, and metadata linked to conversations
- **FR-004**: System MUST enable retrieval of research artifacts by conversation identifier
- **FR-005**: System MUST support full-text search across research artifact content
- **FR-006**: System MUST enforce that users can only access their own conversations and artifacts
- **FR-007**: System MUST delete all associated artifacts when a conversation is deleted
- **FR-008**: System MUST store user preferences including preferred settings and configuration options
- **FR-009**: System MUST retrieve user preferences on application load
- **FR-010**: System MUST allow users to update their preferences
- **FR-011**: System MUST create a conversation record when a new research session begins
- **FR-012**: System MUST update conversation timestamps when activity occurs
- **FR-013**: System MUST persist research reports generated by the agent to long-term storage
- **FR-014**: System MUST allow retrieval of conversations sorted by most recent activity first
- **FR-015**: System MUST support querying conversations with pagination for users with many conversations
- **FR-016**: System MUST allow users to edit conversation titles after creation
- **FR-017**: System MUST auto-extract conversation titles from the first user message (first 50-100 characters) when a new conversation is created

### Key Entities _(include if feature involves data)_

- **Conversation**: Represents a research session with a user. Contains title (auto-extracted from first user message, user-editable), thread identifier linking to LangGraph thread, user identifier, creation timestamp, and last update timestamp. Linked to multiple research artifacts and belongs to one user.

- **Research Artifact**: Represents a research output such as a final report, source list, or note. Contains content stored as structured JSON format (preserving section headings, citations, formatting, and other metadata), artifact type, title, metadata in structured format, creation timestamp, and links to one conversation. Artifacts are searchable by content.

- **User Preferences**: Represents user-specific application settings and configuration. Contains preferred model selection, theme preferences, notification settings, and other user-configurable options. Belongs to exactly one user and has a one-to-one relationship with user profiles.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can view all past conversations within 1 second of application load
- **SC-002**: Users can retrieve any completed research report within 1 second of request
- **SC-003**: Full-text search returns relevant results within 2 seconds for queries across up to 10,000 stored artifacts
- **SC-004**: 100% of research reports generated by the agent are successfully persisted to long-term storage
- **SC-005**: Users can access their complete conversation history across devices and sessions without data loss
- **SC-006**: Conversation deletion completes within 3 seconds including cascade deletion of all associated artifacts
- **SC-007**: User preferences persist and are applied correctly in 100% of subsequent sessions
- **SC-008**: System maintains referential integrity such that no orphaned artifacts exist after conversation deletion

## Assumptions

- User authentication is already implemented via Supabase Auth and user profiles exist
- LangGraph thread identifiers are stable and can be used as foreign key references
- Research reports are text-based content suitable for PostgreSQL text storage
- Users will not exceed reasonable storage limits (assumed to be handled by database constraints)
- Agent execution context has access to user identifier for associating data with correct user
- Frontend has existing Supabase client library configured for database queries
- Agent can make HTTP requests or use database client library to persist data
- Conversation titles are auto-extracted from the first user message (first 50-100 characters) but can be edited by users later
- Research artifacts are stored in structured JSON format that preserves section headings, citations, formatting, and other metadata
- All conversation and artifact data is retained indefinitely with no automatic archival or deletion policies
- Default user preferences exist and are applied when user has not set preferences
- Search functionality uses standard full-text search capabilities available in the database

## Open Questions (max 3)

_All questions resolved - no open questions remain._
