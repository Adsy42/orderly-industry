# Quickstart: LangSmith Preview Deployments

**Date**: 2025-12-23  
**Feature**: 001-langsmith-preview-deploys

## Prerequisites

Before using preview deployments, ensure you have:

- [ ] LangSmith account with deployment permissions
- [ ] Valid `langgraph.json` in `apps/agent/`
- [ ] Agent runs locally with `langgraph dev`
- [ ] GitHub repository with Actions enabled

## Setup (One-Time)

### 1. Configure GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value | How to Get |
|--------|-------|------------|
| `LANGSMITH_API_KEY` | `lsv2_...` | [LangSmith Settings → API Keys](https://smith.langchain.com/settings) |
| `LANGSMITH_WORKSPACE_ID` | `xxxxxxxx-xxxx-...` | From LangSmith URL after `/o/` |

### 2. Verify Workflows Are in Place

The following files should exist:

```
.github/workflows/
├── preview-agent.yml    # Preview deployments
└── deploy-agent.yml     # Production deployments
```

### 3. Verify langgraph.json

Your `apps/agent/langgraph.json` should look like:

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

## Usage

### Creating a Preview Deployment

1. **Make agent changes** in `apps/agent/`

2. **Commit and push** to your feature branch:
   ```bash
   git add .
   git commit -m "feat(agent): add new research capability"
   git push origin 001-my-feature
   ```

3. **Open a Pull Request** against `main`

4. **Wait for deployment** (~3-5 minutes):
   - GitHub Actions will trigger automatically
   - A comment will appear on your PR with the preview URL

5. **Test the preview**:
   - Direct URL: Use the URL from the PR comment
   - With frontend: Add URL params to your Vercel preview:
     ```
     https://your-vercel-preview.vercel.app/?apiUrl=PREVIEW_URL&assistantId=deep_research
     ```

### Viewing Deployment Status

- **GitHub Actions**: Check the "Actions" tab for workflow status
- **LangSmith Dashboard**: View all deployments at https://smith.langchain.com/o/{workspace_id}/deployments

### Deploying to Production

1. **Get PR approved** and ensure all checks pass

2. **Merge to main**:
   ```bash
   git checkout main
   git merge 001-my-feature
   git push origin main
   ```

3. **Automatic deployment**: The `deploy-agent.yml` workflow triggers automatically

4. **Verify**: Check the GitHub Actions summary for deployment confirmation

## Troubleshooting

### Deployment Fails Immediately

**Check**: Is `LANGSMITH_API_KEY` set correctly?

```bash
# Test locally
export LANGSMITH_API_KEY="your-key"
cd apps/agent
langgraph dev  # Should start without auth errors
```

### "Pool Timeout" Error

**Cause**: The agent is trying to connect to a database that doesn't exist in LangSmith.

**Check**: Your agent code for hardcoded database connections:
```python
# Bad - hardcoded connection
pool = psycopg_pool.AsyncConnectionPool("postgresql://...")

# Good - let LangSmith manage the database
# Don't include external database dependencies for the managed runtime
```

### Preview URL Returns 404

**Wait**: Deployment might still be initializing (can take up to 5 minutes)

**Check**: Deployment status in LangSmith dashboard

### PR Comment Not Posted

**Check**: 
- Workflow has `write` permissions for issues
- No errors in the "Comment on PR" step

## Tips

### Testing Locally Before PR

Always test your agent locally before pushing:

```bash
cd apps/agent
langgraph dev
```

Open the LangGraph Studio UI and verify your agent works correctly.

### Updating a Preview

Simply push more commits to your PR branch:

```bash
git add .
git commit -m "fix(agent): correct prompt formatting"
git push
```

The preview will automatically update with the new code.

### Cleaning Up Old Previews

Revisions are lightweight and don't consume resources when inactive. If needed, manually delete old revisions from the LangSmith dashboard.

## Next Steps

After merging:

1. **Verify production**: Test the production deployment
2. **Update frontend env**: Ensure `NEXT_PUBLIC_API_URL` points to production
3. **Monitor**: Check LangSmith for traces and performance

