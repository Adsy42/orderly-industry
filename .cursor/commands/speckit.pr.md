---
description: Create a pull request with spec references, preview deployment verification, and auto-generated description from the feature specification.
handoffs:
  - label: Debug PR Issues
    agent: speckit.debug
    prompt: Diagnose and fix issues with this pull request
  - label: Continue Implementation
    agent: speckit.implement
    prompt: Continue implementing remaining tasks
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

This command automates pull request creation after `/speckit.commit`. It generates a comprehensive PR description from the feature specification, verifies preview deployments, and ensures the PR follows project conventions.

## Workflow Position

```
/speckit.implement → /speckit.commit → /speckit.pr → Review → Merge
                                            ↓
                                    /speckit.debug (if issues)
```

## Execution Steps

### 1. Initialize Context

Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse JSON for:

- `FEATURE_DIR` - Path to spec directory
- `BRANCH_NAME` - Current feature branch
- `FEATURE_NUMBER` - Feature number (e.g., "004")
- `FEATURE_NAME` - Feature short name (e.g., "matters-documents")

For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

### 2. Verify Branch State

```bash
# Check we're on a feature branch, not main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  echo "ERROR: Cannot create PR from main/master branch"
  exit 1
fi

# Check commits ahead of main
COMMITS_AHEAD=$(git rev-list --count main..HEAD 2>/dev/null || echo "0")
if [ "$COMMITS_AHEAD" = "0" ]; then
  echo "ERROR: No commits ahead of main. Run /speckit.commit first."
  exit 1
fi

# Check if branch is pushed to remote
git fetch origin
if ! git rev-parse --verify "origin/$CURRENT_BRANCH" >/dev/null 2>&1; then
  echo "Branch not pushed to remote. Pushing now..."
  git push -u origin "$CURRENT_BRANCH"
fi
```

Display branch status:

```markdown
## Branch Status

| Check              | Status | Details                  |
| ------------------ | ------ | ------------------------ |
| Feature Branch     | ✅     | `004-matters-documents`  |
| Commits Ahead      | ✅     | 12 commits ahead of main |
| Pushed to Remote   | ✅     | Up to date with origin   |
| Clean Working Tree | ✅     | No uncommitted changes   |
```

### 3. Check for Existing PR

```bash
# Check if PR already exists for this branch
gh pr list --head "$CURRENT_BRANCH" --state open --json number,url,title
```

**If PR exists:**

```markdown
## Existing Pull Request Found

| Field     | Value                                     |
| --------- | ----------------------------------------- |
| PR Number | #42                                       |
| Title     | feat: Add matters and document management |
| URL       | https://github.com/owner/repo/pull/42     |
| State     | Open                                      |

Would you like to:

- **A**: Update the existing PR description
- **B**: View the existing PR
- **C**: Continue to check preview deployments
```

Wait for user choice before proceeding.

### 4. Load Spec Context

Read the following files from FEATURE_DIR:

- `spec.md` - Feature specification (REQUIRED)
- `tasks.md` - Task breakdown (REQUIRED)
- `plan.md` - Technical plan (if exists)
- `checklists/requirements.md` - Quality checklist (if exists)

Extract from spec.md:

- Feature title and description
- User stories with priorities
- Success criteria
- Key entities

Extract from tasks.md:

- Total tasks and completion status
- User story breakdown

### 5. Verify Preview Deployments

Check for preview deployments based on changed files:

#### 5.1 Detect Changed Components

```bash
# Get all changed files compared to main
CHANGED_FILES=$(git diff --name-only main...HEAD)

# Categorize changes
HAS_FRONTEND=$(echo "$CHANGED_FILES" | grep -q "apps/frontend/" && echo "true" || echo "false")
HAS_AGENT=$(echo "$CHANGED_FILES" | grep -q "apps/agent/" && echo "true" || echo "false")
HAS_SUPABASE=$(echo "$CHANGED_FILES" | grep -q "supabase/" && echo "true" || echo "false")
```

#### 5.2 Check Preview Status

**If frontend changes detected (Vercel):**

Use the Vercel MCP tools:

```markdown
Checking Vercel preview deployment...
```

- Use `mcp_vercel_list_deployments` to find the preview deployment for this branch
- Use `mcp_vercel_get_deployment` to check deployment status
- Extract preview URL

**If agent changes detected (LangSmith):**

Check GitHub Actions workflow status:

```bash
# Check if preview-agent workflow has run
gh run list --workflow=preview-agent.yml --branch="$CURRENT_BRANCH" --limit=1 --json status,conclusion,url
```

Or check for PR comments with preview URL:

```bash
# If PR exists, check for LangSmith preview comment
gh pr view --json comments | jq '.comments[] | select(.body | contains("LangSmith Preview"))'
```

**If Supabase changes detected:**

Use Supabase MCP tools:

- Use `mcp_supabase_list_branches` to check for preview branch
- Verify migrations applied successfully

#### 5.3 Display Preview Status

```markdown
## Preview Deployments

| Service             | Status      | URL                                          |
| ------------------- | ----------- | -------------------------------------------- |
| Vercel (Frontend)   | ✅ Ready    | [Preview](https://project-abc123.vercel.app) |
| LangSmith (Agent)   | 🔄 Building | Waiting...                                   |
| Supabase (Database) | ⚠️ N/A      | No database changes                          |

**Full-Stack Testing URL:**
```

https://project-abc123.vercel.app?apiUrl=https://langsmith-preview-pr-42.api.langsmith.com&assistantId=deep_research

```

```

**If any preview is still building:**

```markdown
⏳ **Preview deployments still in progress**

Would you like to:

- **A**: Wait for deployments to complete (polls every 30 seconds)
- **B**: Create PR now and add preview URLs later
- **C**: Skip preview verification
```

### 6. Generate PR Description

Create a comprehensive PR description from spec files:

```markdown
## Pull Request Description

### Title Suggestion

Based on the spec, suggest a PR title:
```

feat(frontend,agent,db): add matters and document management foundation

```

### Generated Description

---

## Summary

[Auto-extracted from spec.md Overview section]

Implements the core data foundation for Orderly, enabling Australian counsel to organize work into matters (legal cases/projects) and manage documents with AI-powered analysis.

## Changes

### Database
- [ ] `matters` table with RLS policies
- [ ] `documents` table with file metadata
- [ ] `matter_participants` for access control
- [ ] `document_embeddings` for semantic search

### Frontend
- [ ] Matters list and detail pages
- [ ] Document upload with Supabase Dropzone
- [ ] Semantic search UI

### Agent
- [ ] `isaacus_search` tool for semantic document search
- [ ] `isaacus_extract` tool for extractive QA
- [ ] `isaacus_classify` tool for clause classification
- [ ] Document Agent subagent

## User Stories Implemented

| Priority | Story | Status |
|----------|-------|--------|
| P1 | Create and Manage Matters | ✅ Complete |
| P1 | Upload Documents to Matters | ✅ Complete |
| P1 | Document Processing & Embedding | ✅ Complete |
| P2 | Semantic Search Within a Matter | ✅ Complete |
| P2 | Matter Participants and Access Control | ✅ Complete |
| P2 | AI Document Analysis with Extractive QA | ✅ Complete |
| P2 | Clause Classification and Extraction | ✅ Complete |
| P3 | Natural Language Document Queries | ✅ Complete |

## Testing

### Preview Deployments
- **Vercel**: [Preview URL]
- **LangSmith**: [Preview URL with params]
- **Supabase**: Branch database active

### Manual Testing Checklist
- [ ] Create a new matter
- [ ] Upload PDF, DOCX, TXT documents
- [ ] Verify document processing completes
- [ ] Test semantic search
- [ ] Verify RLS blocks unauthorized access

## Spec Reference

- **Specification**: [`specs/004-matters-documents/spec.md`](../specs/004-matters-documents/spec.md)
- **Technical Plan**: [`specs/004-matters-documents/plan.md`](../specs/004-matters-documents/plan.md)
- **Tasks**: [`specs/004-matters-documents/tasks.md`](../specs/004-matters-documents/tasks.md)

## Review Checklist

For reviewers - based on project constitution:

- [ ] Implementation matches spec requirements
- [ ] All tables have RLS policies enabled
- [ ] No secrets committed
- [ ] Conventional commit messages used
- [ ] TypeScript types are correct
- [ ] Python has type hints and docstrings

---
```

### 7. Create Pull Request

Present the generated description and ask for confirmation:

```markdown
## Create Pull Request

**Title:** `feat(frontend,agent,db): add matters and document management foundation`

**Base Branch:** `main`
**Head Branch:** `004-matters-documents`

**Labels:** (select applicable)

- [ ] `enhancement`
- [ ] `documentation`
- [ ] `database`
- [ ] `frontend`
- [ ] `agent`

**Reviewers:** (optional)

- [ ] @teammate1
- [ ] @teammate2

Would you like to:

- **A**: Create PR with this description
- **B**: Edit the description first
- **C**: Create as draft PR
```

#### 7.1 Execute PR Creation

Based on user choice:

```bash
# Option A: Create PR
gh pr create \
  --title "feat(frontend,agent,db): add matters and document management foundation" \
  --body-file /tmp/pr-description.md \
  --base main \
  --head "$CURRENT_BRANCH"

# Option C: Create as draft
gh pr create \
  --title "feat(frontend,agent,db): add matters and document management foundation" \
  --body-file /tmp/pr-description.md \
  --base main \
  --head "$CURRENT_BRANCH" \
  --draft
```

### 8. Post-Creation Actions

After PR is created:

````markdown
## ✅ Pull Request Created

| Field     | Value                                 |
| --------- | ------------------------------------- |
| PR Number | #42                                   |
| URL       | https://github.com/owner/repo/pull/42 |
| Status    | Open                                  |
| CI Status | 🔄 Running                            |

### Next Steps

1. **Monitor CI**: Watch for GitHub Actions to complete
   ```bash
   gh pr checks 42 --watch
   ```
````

2. **Add Preview URLs**: Once deployments complete, comment with preview URLs

   ```bash
   gh pr comment 42 --body "Preview deployments ready: ..."
   ```

3. **Request Review**: Tag reviewers when ready

   ```bash
   gh pr edit 42 --add-reviewer teammate1
   ```

4. **If issues arise**: Run `/speckit.debug` to diagnose and fix

### Monitor PR Status

| Check               | Status      | Details          |
| ------------------- | ----------- | ---------------- |
| CI - Lint           | 🔄 Running  | ESLint, Ruff     |
| CI - Build          | 🔄 Running  | Next.js build    |
| CI - Tests          | 🔄 Running  | Frontend + Agent |
| Preview - Vercel    | 🔄 Building | ~2 min remaining |
| Preview - LangSmith | 🔄 Building | ~5 min remaining |

Would you like me to watch for CI completion? (yes/no)

````

If user says yes, poll for status:

```bash
gh pr checks --watch
````

## Arguments

The command accepts optional arguments:

- `--draft`: Create as draft PR
- `--no-preview`: Skip preview deployment verification
- `--title "Custom title"`: Override generated title
- `--reviewer @username`: Add reviewer
- `--label name`: Add label

Examples:

```bash
/speckit.pr --draft
/speckit.pr --reviewer @teammate1 --label enhancement
/speckit.pr --title "feat: custom PR title"
```

## Error Handling

### No GitHub CLI

````markdown
❌ **GitHub CLI not installed**

Install GitHub CLI to use this command:

```bash
# macOS
brew install gh

# Linux
sudo apt install gh

# Then authenticate
gh auth login
```
````

Alternatively, create the PR manually:

1. Go to: https://github.com/owner/repo/compare/main...004-matters-documents
2. Copy the generated description above
3. Create the pull request

````

### Not Authenticated

```bash
gh auth status
# If not authenticated:
gh auth login
````

### PR Creation Failed

Capture the error and provide guidance:

````markdown
❌ **PR Creation Failed**

**Error:** `GraphQL: No commits between main and 004-matters-documents`

**Possible causes:**

1. Branch is not ahead of main
2. Branch not pushed to remote
3. Incorrect base branch

**Resolution:**

```bash
# Ensure branch is pushed
git push -u origin 004-matters-documents

# Verify commits exist
git log main..HEAD --oneline
```
````

````

## PR Description Template

The generated description follows this structure:

```markdown
## Summary
[Brief description from spec overview]

## Changes
[Categorized list of changes by component]

## User Stories
[Table of implemented user stories with status]

## Testing
[Preview URLs and manual testing checklist]

## Spec Reference
[Links to specification documents]

## Review Checklist
[Items for reviewers based on constitution]
````

## Integration with Spec-Driven Development

This command bridges the gap between implementation and review by:

1. **Traceability**: Links PR to original specification
2. **Completeness**: Shows which user stories are implemented
3. **Testability**: Provides preview URLs for verification
4. **Quality**: Includes review checklist from constitution
5. **Context**: Gives reviewers all information needed for effective review





