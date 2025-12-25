# Feature Specification: LangSmith Preview Deployments

**Feature Branch**: `001-langsmith-preview-deploys`  
**Created**: 2025-12-23  
**Status**: Draft  
**Input**: User description: "Enhance CI/CD with staging environment for LangSmith similar to Vercel and Supabase preview deployments"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Preview Agent Deployment on Pull Request (Priority: P1)

As a developer, when I open a pull request with agent changes, I want a preview deployment of my LangGraph agent to be automatically created in LangSmith so that I can test my changes in an isolated environment before merging to production.

**Why this priority**: This is the core value proposition - enabling developers to test agent changes in isolation without affecting production. It mirrors the existing Vercel and Supabase preview deployment patterns already established in the project.

**Independent Test**: Can be fully tested by opening a PR with an agent code change and verifying a preview deployment URL is generated and functional.

**Acceptance Scenarios**:

1. **Given** a developer has local agent changes, **When** they open a pull request that modifies files in `apps/agent/`, **Then** a new LangSmith preview deployment is automatically created within 5 minutes.

2. **Given** a PR with agent changes exists, **When** the preview deployment completes, **Then** a comment is posted on the PR with the deployment URL and status.

3. **Given** a preview deployment is running, **When** the developer accesses the deployment URL, **Then** they can interact with the preview agent independently of production.

---

### User Story 2 - Automatic Preview Cleanup on PR Merge/Close (Priority: P2)

As a developer, when my pull request is merged or closed, I want the preview deployment to be automatically deleted so that resources are not wasted on stale deployments.

**Why this priority**: Resource management is essential for cost control but secondary to the core preview functionality. Without cleanup, preview deployments would accumulate indefinitely.

**Independent Test**: Can be tested by merging or closing a PR and verifying the associated preview deployment is removed from LangSmith.

**Acceptance Scenarios**:

1. **Given** a PR with an active preview deployment, **When** the PR is merged to main, **Then** the preview deployment is automatically deleted within 10 minutes.

2. **Given** a PR with an active preview deployment, **When** the PR is closed without merging, **Then** the preview deployment is automatically deleted within 10 minutes.

---

### User Story 3 - Production Deployment on Merge to Main (Priority: P2)

As a developer, when my pull request is merged to main, I want the production LangSmith deployment to be automatically updated so that the latest agent code is deployed without manual intervention.

**Why this priority**: Continuous deployment to production completes the CI/CD loop and is equally important as cleanup for maintaining consistency between code and deployed state.

**Independent Test**: Can be tested by merging a PR to main and verifying the production deployment is updated with the new code.

**Acceptance Scenarios**:

1. **Given** a PR with agent changes is approved, **When** the PR is merged to main, **Then** the production LangSmith deployment is updated with the new code within 10 minutes.

2. **Given** a production deployment update is in progress, **When** the deployment completes, **Then** a notification is posted to the relevant GitHub commit or workflow.

---

### User Story 4 - Preview URL Integration with Frontend (Priority: P3)

As a developer testing a preview deployment, I want to easily connect my Vercel preview frontend to the LangSmith preview agent so that I can test the full stack in isolation.

**Why this priority**: Full-stack preview testing is valuable but requires the core preview deployment (P1) to exist first. It enhances developer experience but is not essential for initial functionality.

**Independent Test**: Can be tested by configuring the Vercel preview environment to use the LangSmith preview URL and verifying end-to-end functionality.

**Acceptance Scenarios**:

1. **Given** both a Vercel preview and LangSmith preview exist for the same PR, **When** a developer views the PR comments, **Then** they see both preview URLs clearly linked together.

2. **Given** a LangSmith preview deployment URL, **When** it is used as the `NEXT_PUBLIC_API_URL` in the Vercel preview, **Then** the frontend successfully communicates with the preview agent.

---

### Edge Cases

- What happens when the LangSmith deployment fails due to code errors? The PR should show a failed status with error logs accessible.
- What happens when multiple PRs modify agent code simultaneously? Each PR should have an independent preview deployment.
- What happens when deployment times out? The workflow should retry once, then fail with a clear error message.
- What happens when LangSmith API rate limits are hit? The workflow should implement exponential backoff and notify the developer.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST automatically trigger a preview deployment when a PR is opened or updated with changes to `apps/agent/` directory.
- **FR-002**: System MUST use the LangSmith Control Plane API to create and manage deployments.
- **FR-003**: System MUST generate a unique deployment name per PR to avoid conflicts (e.g., `orderly-agent-pr-{number}`).
- **FR-004**: System MUST post a comment on the PR with the preview deployment URL and status.
- **FR-005**: System MUST delete preview deployments when PRs are merged or closed.
- **FR-006**: System MUST update the production deployment when changes are merged to main.
- **FR-007**: System MUST handle deployment failures gracefully with clear error messages.
- **FR-008**: System MUST use GitHub repository secrets for LangSmith API credentials.
- **FR-009**: System MUST wait for deployment health check before reporting success.
- **FR-010**: System MUST support the existing custom authentication configured in the agent.

### Key Entities

- **Preview Deployment**: A temporary LangSmith deployment associated with a specific PR, containing the agent code from that PR branch.
- **Production Deployment**: The main LangSmith deployment that serves production traffic, updated on merges to main.
- **Deployment Revision**: An update to an existing deployment with new code, used for production updates.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Preview deployments are created and accessible within 5 minutes of PR creation.
- **SC-002**: Preview deployments are deleted within 10 minutes of PR merge or close.
- **SC-003**: Production deployments are updated within 10 minutes of merge to main.
- **SC-004**: 95% of preview deployments succeed without manual intervention.
- **SC-005**: Developers can test preview agents from the posted URL without additional configuration.
- **SC-006**: Resource costs from orphaned preview deployments are eliminated (all previews cleaned up).

## Assumptions

- LangSmith Cloud is being used (not self-hosted), enabling direct GitHub integration via Control Plane API.
- The developer has a valid LangSmith API key with permissions to create/delete deployments.
- The existing `langgraph.json` configuration is valid and deployable.
- GitHub Actions has access to the required secrets (`LANGSMITH_API_KEY`).
- Preview deployments do not require persistent data between deployments.

## Dependencies

- Existing GitHub Actions CI workflows for the agent (`ci-agent.yml`)
- LangSmith Control Plane API access
- Valid `langgraph.json` configuration in `apps/agent/`
- GitHub repository secrets configured with LangSmith credentials

## Out of Scope

- Automated agent testing/evaluation in preview environments (future enhancement)
- Preview branch databases in LangSmith (uses LangSmith's managed database)
- Multi-region preview deployments
- Custom domain names for preview deployments
