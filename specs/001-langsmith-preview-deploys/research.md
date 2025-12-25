# Research: LangSmith Preview Deployments

**Date**: 2025-12-23  
**Feature**: 001-langsmith-preview-deploys

## Research Topics

### 1. LangSmith Control Plane API for Deployments

**Decision**: Use `langgraph deploy` CLI command with `--revision` flag for preview deployments

**Rationale**:

- The [LangSmith CI/CD documentation](https://docs.langchain.com/langsmith/cicd-pipeline-example#github-actions-workflow) recommends using the LangGraph CLI for deployments
- Cloud LangSmith supports direct GitHub integration via Control Plane API
- The CLI handles image building, pushing, and deployment orchestration

**Alternatives Considered**:

- Direct Control Plane API calls via Python script - More complex, requires maintaining custom code
- Manual deployments - Defeats the purpose of CI/CD automation

**Key Findings**:

- Deployment URL format: `https://{deployment-name}-{id}.{region}.langgraph.app`
- Preview deployments use revisions (not separate deployments) to share configuration
- The `--wait` flag blocks until deployment is healthy
- Health checks use the `/ok` endpoint

---

### 2. Preview Deployment Naming Strategy

**Decision**: Use revision naming pattern `pr-{number}` for previews

**Rationale**:

- Simple and predictable naming
- Maps directly to GitHub PR number
- Easy to identify and clean up
- Avoids conflicts between concurrent PRs

**Alternatives Considered**:

- Branch name-based: Could exceed length limits, special characters
- SHA-based: Not human readable
- Timestamp-based: Doesn't tie to PR lifecycle

---

### 3. Deployment Lifecycle Management

**Decision**: Revisions for previews, with manual cleanup note (LangSmith CLI limitation)

**Rationale**:

- LangSmith CLI doesn't currently support programmatic revision deletion
- Revisions are lightweight and don't consume significant resources when inactive
- Can be cleaned up manually via LangSmith dashboard if needed

**Alternatives Considered**:

- Control Plane API for deletion: Would require custom Python script, adds complexity
- Separate deployments per PR: More resource-intensive, harder to manage

**Note**: Future enhancement could add Control Plane API script for cleanup

---

### 4. GitHub Actions Workflow Triggers

**Decision**: Use `pull_request` event with path filter for preview, `push` event for production

**Rationale**:

- `pull_request` triggers on open, sync, and reopen by default
- Path filter `apps/agent/**` prevents unnecessary deployments
- `push` to main is the standard production trigger

**Workflow Events**:
| Trigger | Workflow | Action |
|---------|----------|--------|
| PR opened/updated | `preview-agent.yml` | Create/update preview |
| PR closed/merged | `preview-agent.yml` | Log cleanup note |
| Push to main | `deploy-agent.yml` | Update production |

---

### 5. Secret Management

**Decision**: Use GitHub repository secrets for LangSmith credentials

**Rationale**:

- Standard practice for GitHub Actions
- Secrets are masked in logs
- Can be scoped to environments if needed

**Required Secrets**:
| Secret | Purpose |
|--------|---------|
| `LANGSMITH_API_KEY` | Authentication for Control Plane API |
| `LANGSMITH_WORKSPACE_ID` | Workspace identifier for dashboard links |

---

### 6. PR Comment Integration

**Decision**: Use `actions/github-script` to post deployment URLs

**Rationale**:

- Native GitHub Actions approach
- No external dependencies
- Can update existing comments (future enhancement)

**Comment Format**:

- Deployment URL (clickable)
- LangSmith dashboard link
- Testing instructions with frontend URL params

---

### 7. Error Handling Strategy

**Decision**: Fail fast with clear error messages, no automatic retries (initially)

**Rationale**:

- LangGraph CLI provides clear error output
- Deployment failures are typically code issues, not transient
- Simpler initial implementation

**Future Enhancements**:

- Add retry logic for transient failures
- Parse deployment logs for common issues
- Notify via Slack/Discord for failures

---

## Technical Dependencies

| Dependency                 | Version | Purpose            |
| -------------------------- | ------- | ------------------ |
| `langgraph-cli`            | latest  | Deployment CLI     |
| `actions/checkout@v4`      | v4      | Code checkout      |
| `actions/setup-python@v5`  | v5      | Python setup       |
| `astral-sh/setup-uv@v4`    | v4      | uv package manager |
| `actions/github-script@v7` | v7      | PR commenting      |

## API Endpoints

| Endpoint                | Method | Purpose                        |
| ----------------------- | ------ | ------------------------------ |
| LangSmith Control Plane | POST   | Create/update deployment       |
| `/ok`                   | GET    | Health check (post-deployment) |
| GitHub Issues API       | POST   | Comment on PR                  |

## Resolved Unknowns

All NEEDS CLARIFICATION items from Technical Context have been resolved through this research.
