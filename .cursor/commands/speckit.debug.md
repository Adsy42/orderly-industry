---
description: Diagnose and fix issues with pull requests, CI failures, or review feedback using MCP tools for LangSmith, Supabase, and Vercel debugging.
handoffs:
  - label: Commit Fixes
    agent: speckit.commit
    prompt: Run quality gates and commit the fixes
    send: true
  - label: Update PR
    agent: speckit.pr
    prompt: Update the pull request with fixes
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

This command diagnoses and fixes issues discovered during pull request review or CI failures. It leverages MCP tools for:

- **LangSmith**: Debug agent traces, runs, and experiment failures
- **Supabase**: Check migrations, RLS policies, database logs, and security advisors
- **Vercel**: Analyze build logs and deployment failures

## Workflow Position

```
/speckit.pr → CI Runs → Review
       ↓           ↓        ↓
    Issues?    Failures? Feedback?
       └──────────┴──────────┘
                  ↓
          /speckit.debug
                  ↓
    Fix → /speckit.commit → Push → Re-review
```

## Issue Types

| Type                | Description                       | MCP Tools Used                  |
| ------------------- | --------------------------------- | ------------------------------- |
| **CI Failure**      | Build, lint, or test failures     | Vercel, GitHub Actions logs     |
| **Agent Error**     | LangGraph agent runtime issues    | LangSmith runs, traces, logs    |
| **Database Issue**  | Migration failures, RLS problems  | Supabase logs, advisors, SQL    |
| **Review Feedback** | Requested changes from reviewers  | Parse PR comments               |
| **Runtime Error**   | Production/preview runtime issues | LangSmith traces, Supabase logs |

## Execution Steps

### 1. Initialize Context

Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse JSON for FEATURE_DIR, BRANCH_NAME, and task status.

For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

### 2. Detect Issue Type

#### 2.1 Check for Open PR

```bash
# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Check for open PR
PR_DATA=$(gh pr view --json number,state,statusCheckRollup,reviews,comments 2>/dev/null)
```

#### 2.2 Analyze PR Status

Parse PR data to detect:

```markdown
## PR Analysis

| Check           | Status               | Details         |
| --------------- | -------------------- | --------------- |
| PR Number       | #42                  | Open            |
| CI Status       | ❌ FAILED            | 2 checks failed |
| Review Status   | 🔄 Changes Requested | 3 comments      |
| Merge Conflicts | ✅ None              | Clean           |
```

#### 2.3 Categorize Issues

Based on analysis, determine the primary issue type:

```markdown
## Issues Detected

| Priority | Type            | Source         | Description                     |
| -------- | --------------- | -------------- | ------------------------------- |
| 1        | CI Failure      | GitHub Actions | `ci-agent` workflow failed      |
| 2        | CI Failure      | Vercel         | Build failed with type errors   |
| 3        | Review Feedback | @reviewer      | "Add error handling to upload"  |
| 4        | Review Feedback | @reviewer      | "Missing RLS policy for delete" |
```

Present to user:

```markdown
**Which issue would you like to debug first?**

1. CI: Agent workflow failure (recommended - blocks merge)
2. CI: Vercel build failure
3. Review: Add error handling to upload
4. Review: Missing RLS policy for delete
5. All issues sequentially

Your choice: _[Wait for input]_
```

### 3. Debug CI Failures

#### 3.1 GitHub Actions Failures

```bash
# Get failed workflow runs
gh run list --branch "$CURRENT_BRANCH" --status failure --limit 5 --json databaseId,name,conclusion,url

# Get logs for specific run
gh run view <run-id> --log-failed
```

Parse the logs and identify:

- Which job failed
- Error message and stack trace
- File and line number if available

```markdown
## CI Failure Analysis: `ci-agent`

**Workflow:** `.github/workflows/ci-agent.yml`
**Job:** `lint-and-test`
**Step:** `Run Ruff Linter`

### Error Output

\`\`\`
apps/agent/src/tools/isaacus_search.py:45:1: E501 Line too long (142 > 120)
apps/agent/src/tools/isaacus_extract.py:23:5: F401 'typing.Dict' imported but unused
\`\`\`

### Suggested Fixes

| File                 | Line | Issue         | Fix                         |
| -------------------- | ---- | ------------- | --------------------------- |
| `isaacus_search.py`  | 45   | Line too long | Break line at logical point |
| `isaacus_extract.py` | 23   | Unused import | Remove `Dict` from imports  |

Would you like me to apply these fixes? (yes/no)
```

#### 3.2 Vercel Build Failures

Use Vercel MCP tools to get deployment logs:

**Step 1: Find the failed deployment**

Use `mcp_vercel_list_deployments` with the project ID and team ID:

- Filter by branch name
- Look for `state: "ERROR"` or `state: "FAILED"`

**Step 2: Get build logs**

Use `mcp_vercel_get_deployment_build_logs` with the deployment ID:

- Parse for TypeScript errors
- Look for Next.js build errors
- Identify missing dependencies

```markdown
## Vercel Build Failure Analysis

**Deployment:** `dpl_abc123xyz`
**Status:** ERROR
**Duration:** 45 seconds (failed at build step)

### Build Logs (Last 50 lines)

\`\`\`
Type error: Property 'matterId' does not exist on type 'Params'.

> 12 | export default async function MatterPage({ params }: { params: { matterId: string } }) {

       |                                                                   ^

Build failed because of Next.js type errors.
\`\`\`

### Root Cause

Next.js 15 changed dynamic route params to be async. The `params` prop needs to be awaited.

### Suggested Fix

**File:** `apps/frontend/src/app/protected/matters/[matterId]/page.tsx`

\`\`\`typescript
// Before
export default async function MatterPage({ params }: { params: { matterId: string } }) {
const matterId = params.matterId;

// After  
export default async function MatterPage({ params }: { params: Promise<{ matterId: string }> }) {
const { matterId } = await params;
\`\`\`

Would you like me to apply this fix? (yes/no)
```

### 4. Debug Agent Issues (LangSmith)

For agent-related failures, use LangSmith MCP tools extensively.

#### 4.1 Get Project and Run Information

**Find the project:**

Use `mcp_langsmith_list_projects` to find the relevant project:

- Filter by project name containing the feature name
- Get the project ID for further queries

**Fetch recent runs:**

Use `mcp_langsmith_fetch_runs` with:

- `project_name`: The identified project
- `error`: `"true"` to filter for errored runs
- `limit`: 10 to get recent failures
- `is_root`: `"true"` for top-level traces

```markdown
## LangSmith Error Analysis

**Project:** `orderly-agent-preview-pr-42`

### Recent Failed Runs

| Run ID   | Name             | Error                 | Latency |
| -------- | ---------------- | --------------------- | ------- |
| `abc123` | `deep_research`  | Tool execution failed | 12.5s   |
| `def456` | `deep_research`  | Rate limit exceeded   | 45.2s   |
| `ghi789` | `isaacus_search` | Connection timeout    | 30.0s   |
```

#### 4.2 Analyze Specific Run

For the most recent failure, use `mcp_langsmith_fetch_runs` with `trace_id` to get the full trace:

```markdown
### Trace Analysis: `abc123`

**Root Run:** `deep_research`
**Status:** Error
**Duration:** 12.5 seconds

#### Execution Flow

\`\`\`
orchestrator (success, 2.1s)
└─ planning (success, 1.5s)
└─ document_agent (error, 8.9s)
└─ isaacus_search (success, 3.2s)
└─ isaacus_extract (error, 5.7s) ← FAILED HERE
Error: KeyError: 'document_id'
\`\`\`

#### Error Details

**Tool:** `isaacus_extract`
**Error Type:** `KeyError`
**Message:** `'document_id' - Required parameter missing from tool input`

#### Inputs Received

\`\`\`json
{
"question": "What is the limitation period?",
"matter_id": "uuid-123"
}
\`\`\`

**Missing:** `document_id` parameter

#### Root Cause

The agent called `isaacus_extract` with `matter_id` instead of `document_id`. The tool docstring may be unclear about required parameters.

### Suggested Fixes

1. **Update tool docstring** to clarify required parameters:

\`\`\`python

# apps/agent/src/tools/isaacus_extract.py

@tool(parse_docstring=True)
def isaacus_extract(document_id: str, question: str) -> dict:
"""Extract precise answers from a document with citations.

    Args:
        document_id: The UUID of the document to search (required, from documents table)
        question: The question to answer from the document content

    Returns:
        Answer with document citation including page and section
    """

\`\`\`

2. **Add validation** to provide better error messages:

\`\`\`python
if not document_id:
return {"error": "document_id is required. Get document IDs from isaacus_search first."}
\`\`\`

Would you like me to apply these fixes? (yes/no)
```

#### 4.3 Check Agent Logs

Use `mcp_supabase_get_logs` with `service: "edge-function"` if using Supabase Edge Functions, or check LangSmith logs directly.

### 5. Debug Database Issues (Supabase)

For database-related issues, use Supabase MCP tools.

#### 5.1 Check Migration Status

Use `mcp_supabase_list_migrations` to verify migrations are applied:

```markdown
## Migration Status

| Version        | Name                       | Status        |
| -------------- | -------------------------- | ------------- |
| 20251223110000 | create_profiles            | ✅ Applied    |
| 20251223120000 | create_matters             | ✅ Applied    |
| 20251223120100 | create_documents           | ❌ **FAILED** |
| 20251223120200 | create_matter_participants | ⏳ Pending    |
```

#### 5.2 Check Database Logs

Use `mcp_supabase_get_logs` with `service: "postgres"`:

```markdown
## Database Error Logs

### Recent Errors (Last 24h)

\`\`\`
ERROR: relation "matters" already exists
HINT: Drop the existing table or use IF NOT EXISTS
CONTEXT: SQL statement "CREATE TABLE matters (...)"
\`\`\`

### Root Cause

Migration `20251223120100_create_documents` failed because it references a table that either:

1. Already exists from a previous run
2. Has a naming conflict

### Suggested Fix

Update migration to use `IF NOT EXISTS`:

\`\`\`sql
create table if not exists public.documents (
...
);
\`\`\`

Or reset the migration:

\`\`\`bash
supabase migration repair 20251223120100 --status reverted
supabase migration up
\`\`\`
```

#### 5.3 Security Advisor Check

Use `mcp_supabase_get_advisors` with `type: "security"`:

```markdown
## Security Advisors

| Severity  | Issue            | Table                 | Remediation                              |
| --------- | ---------------- | --------------------- | ---------------------------------------- |
| 🔴 High   | No RLS policy    | `documents`           | [Add RLS](https://supabase.com/docs/...) |
| 🟡 Medium | Missing index    | `matters.created_by`  | Add index for RLS performance            |
| 🟢 Low    | No table comment | `matter_participants` | Add descriptive comment                  |

### Critical: Missing RLS on `documents`

The `documents` table has RLS enabled but no policies defined. This means **no one can access the table**.

**Required policies:**

1. `documents_select_policy` - Users can view documents in their matters
2. `documents_insert_policy` - Users can upload to matters they participate in
3. `documents_delete_policy` - Only matter owners/counsel can delete

### Suggested Migration

\`\`\`sql
-- Add RLS policies for documents table
create policy "Users can view documents in their matters"
on public.documents for select
using (
exists (
select 1 from public.matter_participants mp
where mp.matter_id = documents.matter_id
and mp.user_id = (select auth.uid())
)
or exists (
select 1 from public.matters m
where m.id = documents.matter_id
and m.created_by = (select auth.uid())
)
);
\`\`\`

Would you like me to create this migration? (yes/no)
```

#### 5.4 Test SQL Queries

Use `mcp_supabase_execute_sql` to test queries:

```sql
-- Verify RLS is working
set role authenticated;
set request.jwt.claims to '{"sub": "user-uuid-123"}';

select * from documents where matter_id = 'matter-uuid';
```

### 6. Process Review Feedback

Parse PR review comments and create fix tasks.

#### 6.1 Fetch Review Comments

```bash
gh pr view --json reviews,comments --jq '.reviews[].body, .comments[].body'
```

#### 6.2 Categorize Feedback

```markdown
## Review Feedback Analysis

### Changes Requested

| Reviewer | Comment                                 | Category     | Priority |
| -------- | --------------------------------------- | ------------ | -------- |
| @alice   | "Add error handling for failed uploads" | Code Quality | High     |
| @bob     | "Missing test for matter deletion"      | Testing      | Medium   |
| @alice   | "Typo in component prop name"           | Bug Fix      | Low      |

### Actionable Items

1. **[High]** Add try-catch in `document-upload.tsx` for upload failures
2. **[Medium]** Add test case for `useMutationDeleteMatter` in `use-matters.test.ts`
3. **[Low]** Rename `matterid` to `matterId` in `MatterCard` props

Would you like me to address these items? (yes/all/select numbers)
```

#### 6.3 Generate Fix Tasks

For each feedback item, create a fix task:

```markdown
## Fix Tasks Generated

### Task: Add error handling for failed uploads

**File:** `apps/frontend/src/components/documents/document-upload.tsx`

**Current code:**
\`\`\`typescript
const { upload } = useSupabaseUpload({
onComplete: (files) => {
refetchDocuments();
},
});
\`\`\`

**Fixed code:**
\`\`\`typescript
const { upload } = useSupabaseUpload({
onComplete: (files) => {
refetchDocuments();
toast.success(`${files.length} file(s) uploaded successfully`);
},
onError: (error) => {
console.error('Upload failed:', error);
toast.error(`Upload failed: ${error.message}`);
},
});
\`\`\`

Apply this fix? (yes/no/skip)
```

### 7. Apply Fixes

After user confirms fixes:

#### 7.1 Execute Code Changes

Apply all confirmed fixes using the edit tools:

- Update Python files for agent fixes
- Update TypeScript files for frontend fixes
- Create new migrations for database fixes

#### 7.2 Update Documentation

If fixes reveal spec gaps or incorrect assumptions:

```markdown
## Documentation Updates Needed

Based on the fixes applied, the following documentation should be updated:

1. **spec.md** - Add edge case for upload failure handling
2. **tasks.md** - Mark error handling tasks as complete
3. **IMPLEMENTATION_STATUS.md** - Update status of document upload feature

Would you like me to update these files? (yes/no)
```

#### 7.3 Verify Fixes Locally

```bash
# Run linting
pnpm lint
pnpm lint:agent

# Run build
pnpm build

# Run tests
pnpm test
cd apps/agent && pytest -v
```

### 8. Create Fix Commit

After fixes are verified:

```markdown
## Ready to Commit Fixes

**Files Changed:**

- M `apps/frontend/src/components/documents/document-upload.tsx`
- M `apps/agent/src/tools/isaacus_extract.py`
- A `supabase/migrations/20251224_add_documents_rls.sql`

**Suggested Commit Message:**
\`\`\`
fix(frontend,agent,db): address PR review feedback

- Add error handling for document upload failures
- Clarify isaacus_extract tool parameters
- Add missing RLS policies for documents table

Closes PR review comments from @alice and @bob
\`\`\`

Would you like to commit and push these fixes? (yes/no)
```

If yes, run:

```bash
git add -A
git commit -m "fix(frontend,agent,db): address PR review feedback

- Add error handling for document upload failures
- Clarify isaacus_extract tool parameters
- Add missing RLS policies for documents table

Closes PR review comments"

git push origin "$CURRENT_BRANCH"
```

### 9. Report Status

After fixes are pushed:

```markdown
## ✅ Fixes Applied and Pushed

| Item             | Status    |
| ---------------- | --------- |
| Fixes Applied    | 4 of 4    |
| Lint Check       | ✅ Pass   |
| Build Check      | ✅ Pass   |
| Commit Created   | `a1b2c3d` |
| Pushed to Remote | ✅        |

### CI Status

| Workflow      | Status     |
| ------------- | ---------- |
| ci-frontend   | 🔄 Running |
| ci-agent      | 🔄 Running |
| preview-agent | 🔄 Running |

### Next Steps

1. **Monitor CI**: `gh pr checks --watch`
2. **Request re-review**: `gh pr edit --add-reviewer alice,bob`
3. **If more issues**: Run `/speckit.debug` again

Would you like me to watch for CI completion? (yes/no)
```

## Arguments

The command accepts optional arguments:

- `--ci`: Focus on CI failures only
- `--reviews`: Focus on review feedback only
- `--agent`: Debug agent issues using LangSmith
- `--db`: Debug database issues using Supabase
- `--auto-fix`: Automatically apply all suggested fixes
- `--pr <number>`: Debug a specific PR (default: current branch's PR)

Examples:

```bash
/speckit.debug --ci
/speckit.debug --agent
/speckit.debug --reviews --auto-fix
/speckit.debug --pr 42
```

## MCP Tool Reference

### LangSmith Tools

| Tool                             | Use Case                  |
| -------------------------------- | ------------------------- |
| `mcp_langsmith_list_projects`    | Find agent projects       |
| `mcp_langsmith_fetch_runs`       | Get run traces and errors |
| `mcp_langsmith_get_logs`         | Access runtime logs       |
| `mcp_langsmith_list_experiments` | Check experiment results  |

### Supabase Tools

| Tool                           | Use Case                             |
| ------------------------------ | ------------------------------------ |
| `mcp_supabase_list_migrations` | Check migration status               |
| `mcp_supabase_get_logs`        | Get postgres/auth/edge-function logs |
| `mcp_supabase_get_advisors`    | Security and performance checks      |
| `mcp_supabase_execute_sql`     | Test queries and RLS                 |
| `mcp_supabase_list_tables`     | Verify schema                        |

### Vercel Tools

| Tool                                   | Use Case               |
| -------------------------------------- | ---------------------- |
| `mcp_vercel_list_deployments`          | Find deployments       |
| `mcp_vercel_get_deployment`            | Get deployment details |
| `mcp_vercel_get_deployment_build_logs` | Analyze build failures |

## Error Recovery

If debugging is interrupted:

1. Partial fixes are not committed
2. User can re-run `/speckit.debug` to continue
3. All analysis results are displayed again

## Integration with Workflow

This command integrates with the full SDD workflow:

```
Spec → Plan → Tasks → Implement → Commit → PR → Debug → Commit → Merge
                                            ↑          ↓
                                            └──────────┘
                                            (iterate until pass)
```

