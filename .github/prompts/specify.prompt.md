# Feature Specification Prompt

Use this prompt to create a feature specification for the Deep Research Agent.

## Context

You are creating a specification for a feature in the Deep Research Agent - an AI-powered research assistant with:

- Next.js frontend with Supabase Auth
- LangGraph Python backend for research orchestration
- Supabase PostgreSQL database

## Instructions

Given a feature description, create a specification following this structure:

### 1. Overview

- Brief description of the feature
- Why this feature matters
- Who benefits from it

### 2. User Scenarios

Define the primary use cases:

- **As a [user type]**, I want to [action], so that [benefit]
- Include happy paths and edge cases
- Prioritize scenarios (P1, P2, P3)

### 3. Functional Requirements

List specific, testable requirements:

- FR-001: The system shall...
- FR-002: Users shall be able to...
- Each requirement must be verifiable

### 4. Success Criteria

Define measurable outcomes:

- Quantitative metrics (time, performance)
- Qualitative measures (user satisfaction)
- Technology-agnostic (no implementation details)

### 5. Key Entities (if data involved)

- Entity name and purpose
- Key attributes
- Relationships to other entities

### 6. Assumptions

- Document reasonable defaults chosen
- Industry-standard practices applied
- Scope boundaries

### 7. Open Questions (max 3)

Only include questions for:

- Decisions significantly impacting scope
- Multiple interpretations with different implications
- No reasonable default exists

## Guidelines

**DO:**

- Focus on WHAT users need and WHY
- Write for business stakeholders
- Make requirements testable
- Use reasonable defaults

**DON'T:**

- Include implementation details (languages, frameworks, APIs)
- Mention specific technologies
- Leave more than 3 open questions
- Include technical architecture

## Reference Documents

- Constitution: `.specify/memory/constitution.md`
- Spec Template: `.specify/templates/spec-template.md`
- Existing Specs: `.specify/specs/`



