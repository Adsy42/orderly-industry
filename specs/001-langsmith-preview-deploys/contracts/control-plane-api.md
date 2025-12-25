# LangSmith Control Plane API Contract

**Date**: 2025-12-23  
**Feature**: 001-langsmith-preview-deploys

## Overview

This document defines the external API interactions used by the preview deployment workflows.

## LangGraph CLI Commands

### Deploy Command

Used to create or update deployments.

```bash
langgraph deploy \
  --config langgraph.json \
  --revision "$REVISION_NAME" \
  --wait
```

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `--config` | string | Path to langgraph.json configuration |
| `--revision` | string | Revision name (e.g., `pr-123`) |
| `--wait` | flag | Block until deployment is healthy |

**Environment Variables**:
| Variable | Required | Description |
|----------|----------|-------------|
| `LANGSMITH_API_KEY` | Yes | API key for authentication |

**Expected Output**:

```
Deploying to LangSmith...
Building image...
Pushing image...
Creating deployment revision: pr-123
Waiting for health check...
Deployment healthy: https://orderly-agent-xxxx.us.langgraph.app
```

**Exit Codes**:
| Code | Meaning |
|------|---------|
| 0 | Deployment successful |
| 1 | Deployment failed (check stderr) |

---

## GitHub Actions API

### Create Issue Comment

Used to post deployment URLs on PRs.

**Endpoint**: `POST /repos/{owner}/{repo}/issues/{issue_number}/comments`

**Request Body**:

```json
{
  "body": "## 🤖 Agent Preview Deployed\n\n| Resource | URL |\n|----------|-----|\n| **Agent Preview** | https://... |"
}
```

**Response**: `201 Created`

**Implementation**: Via `actions/github-script@v7`

```javascript
github.rest.issues.createComment({
  issue_number: context.issue.number,
  owner: context.repo.owner,
  repo: context.repo.repo,
  body: `## 🤖 Agent Preview Deployed\n...`,
});
```

---

## Health Check Endpoint

### LangSmith Deployment Health

**Endpoint**: `GET https://{deployment-url}/ok`

**Expected Response**:
| Status | Meaning |
|--------|---------|
| 200 | Deployment healthy |
| 503 | Deployment starting up |
| 500+ | Deployment unhealthy |

**Note**: The `--wait` flag in `langgraph deploy` handles health checking automatically.

---

## Workflow Triggers

### Pull Request Events

**Event**: `pull_request`

**Payload Fields Used**:
| Field | Type | Description |
|-------|------|-------------|
| `action` | string | `opened`, `synchronize`, `reopened`, `closed` |
| `number` | integer | PR number |
| `pull_request.head.sha` | string | Commit SHA |
| `pull_request.head.ref` | string | Branch name |

### Push Events

**Event**: `push`

**Payload Fields Used**:
| Field | Type | Description |
|-------|------|-------------|
| `ref` | string | Branch ref (e.g., `refs/heads/main`) |
| `after` | string | Commit SHA |

---

## Error Responses

### Common Deployment Errors

| Error                  | Cause                     | Resolution                                   |
| ---------------------- | ------------------------- | -------------------------------------------- |
| `401 Unauthorized`     | Invalid API key           | Check `LANGSMITH_API_KEY` secret             |
| `403 Forbidden`        | Insufficient permissions  | Verify API key has deployment access         |
| `422 Validation Error` | Invalid langgraph.json    | Validate config locally with `langgraph dev` |
| `500 Internal Error`   | LangSmith platform issue  | Retry or contact support                     |
| `Pool Timeout`         | Database connection issue | Check agent code for DB configs              |

### Build Errors

| Error                 | Cause                             | Resolution              |
| --------------------- | --------------------------------- | ----------------------- |
| `ModuleNotFoundError` | Missing dependency                | Add to pyproject.toml   |
| `SyntaxError`         | Invalid Python code               | Fix code and push again |
| `ImportError`         | Circular import or missing module | Check import structure  |

