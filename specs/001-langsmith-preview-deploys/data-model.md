# Data Model: LangSmith Preview Deployments

**Date**: 2025-12-23  
**Feature**: 001-langsmith-preview-deploys

## Overview

This feature is CI/CD infrastructure and doesn't introduce new application data models. Instead, it defines workflow state and LangSmith deployment concepts.

## Workflow Entities

### 1. Preview Deployment

A temporary LangSmith deployment revision associated with a specific PR.

| Attribute | Type | Description |
|-----------|------|-------------|
| `revision_name` | string | Unique identifier: `pr-{pr_number}` |
| `pr_number` | integer | GitHub PR number |
| `deployment_url` | string | LangSmith deployment URL |
| `status` | enum | `pending`, `deploying`, `healthy`, `failed` |
| `created_at` | timestamp | When deployment was triggered |

**Lifecycle**:
```
PR Opened → Deployment Created → Health Check → URL Posted → PR Closed → (Manual Cleanup)
```

### 2. Production Deployment

The main LangSmith deployment serving production traffic.

| Attribute | Type | Description |
|-----------|------|-------------|
| `deployment_name` | string | Configured in LangSmith dashboard |
| `revision` | string | Latest deployed revision (git SHA or tag) |
| `url` | string | Production deployment URL |
| `status` | enum | `healthy`, `deploying`, `failed` |

**Lifecycle**:
```
PR Merged → Deployment Updated → Health Check → Summary Posted
```

### 3. Workflow Run

GitHub Actions workflow execution tracking.

| Attribute | Type | Description |
|-----------|------|-------------|
| `run_id` | integer | GitHub Actions run ID |
| `workflow_name` | string | `preview-agent` or `deploy-agent` |
| `trigger` | string | `pull_request` or `push` |
| `status` | enum | `queued`, `in_progress`, `completed`, `failed` |
| `pr_number` | integer | Associated PR (if applicable) |
| `commit_sha` | string | Git commit being deployed |

## State Transitions

### Preview Deployment State Machine

```
                    ┌─────────────┐
                    │   Pending   │
                    └──────┬──────┘
                           │ PR opened/updated with agent changes
                           ▼
                    ┌─────────────┐
              ┌─────│  Deploying  │─────┐
              │     └─────────────┘     │
              │ (success)               │ (failure)
              ▼                         ▼
       ┌─────────────┐           ┌─────────────┐
       │   Healthy   │           │   Failed    │
       └──────┬──────┘           └─────────────┘
              │
              │ PR closed/merged
              ▼
       ┌─────────────┐
       │  Orphaned   │ (cleanup candidate)
       └─────────────┘
```

### Production Deployment State Machine

```
       ┌─────────────┐
       │   Healthy   │ ◄──────────┐
       └──────┬──────┘            │
              │ PR merged to main │ (success)
              ▼                   │
       ┌─────────────┐            │
       │  Deploying  │────────────┘
       └──────┬──────┘
              │ (failure)
              ▼
       ┌─────────────┐
       │   Failed    │ (rollback available)
       └─────────────┘
```

## Configuration Files

### langgraph.json (existing)

```json
{
  "dependencies": ["."],
  "graphs": {
    "deep_research": "./src/agent/graph.py:agent"
  },
  "env": ".env",
  "auth": {
    "path": "./src/security/auth.py:auth"
  }
}
```

### GitHub Secrets (new)

| Secret | Purpose | Required |
|--------|---------|----------|
| `LANGSMITH_API_KEY` | LangSmith API authentication | Yes |
| `LANGSMITH_WORKSPACE_ID` | Dashboard link generation | Yes |

## Relationships

```
┌─────────────────┐     triggers      ┌─────────────────┐
│  Pull Request   │──────────────────▶│  Workflow Run   │
└─────────────────┘                   └────────┬────────┘
         │                                     │
         │ references                          │ creates
         ▼                                     ▼
┌─────────────────┐     identifies    ┌─────────────────┐
│   Git Commit    │◀──────────────────│   Deployment    │
└─────────────────┘                   └─────────────────┘
```


