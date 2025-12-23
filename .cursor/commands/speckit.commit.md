---
description: Verify all quality gates pass (linting, formatting, builds, tests) and create well-structured commits following conventional commit standards.
handoffs:
  - label: Open Pull Request
    agent: speckit.pr
    prompt: Create a pull request for this feature branch
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

This command ensures all code quality gates pass before committing changes. It should be run after `/speckit.implement` to verify the implementation is ready for commit and follows best git practices.

## Workflow Position

```
/speckit.implement → /speckit.commit → Open PR → Merge
```

## Execution Steps

### 1. Initialize Context

Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse JSON for FEATURE_DIR and task completion status.

For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

### 2. Verify Task Completion

Check `tasks.md` in FEATURE_DIR:

- Count total tasks (lines matching `- [ ]` or `- [x]` or `- [X]`)
- Count completed tasks (lines matching `- [x]` or `- [X]`)
- Count incomplete tasks (lines matching `- [ ]`)

**If incomplete tasks exist:**

```markdown
⚠️ **Incomplete Tasks Detected**

| Status        | Count |
| ------------- | ----- |
| ✅ Completed  | X     |
| ⬜ Incomplete | Y     |
| **Total**     | Z     |

Incomplete tasks:

- [ ] T005 [US1] Create user model in src/models/user.py
- [ ] T006 [US1] Implement user service in src/services/user.py

Do you want to proceed with commit anyway? (yes/no)
```

Wait for user confirmation before proceeding.

### 3. Run Quality Gates

Execute quality checks in parallel where possible. Report results as a status table.

#### 3.1 Detect Changed Files

```bash
# Get list of changed files (staged and unstaged)
git diff --name-only HEAD
git diff --cached --name-only
```

Categorize changes:

- **Frontend files**: `apps/frontend/**/*.{ts,tsx,js,jsx,json,css}`
- **Agent files**: `apps/agent/**/*.py`
- **Database files**: `supabase/**/*.sql`
- **Documentation**: `**/*.md`
- **Configuration**: Root config files

#### 3.2 Run Checks Based on Changed Files

**If frontend files changed:**

```bash
# From repository root
pnpm lint                    # ESLint
pnpm --filter frontend format:check  # Prettier check
pnpm build                   # Next.js build verification
```

**If agent files changed:**

```bash
# From repository root
pnpm lint:agent              # Ruff check + format check
cd apps/agent && mypy src/   # Type checking (if mypy installed)
```

**If SQL migration files changed:**

```bash
# Validate SQL syntax (basic check)
# Check for RLS policies on new tables
# Reference: .cursor/rules/create-rls-policies.mdc
```

#### 3.3 Run Tests (if available)

```bash
# Frontend tests (if configured)
pnpm --filter frontend test --passWithNoTests 2>/dev/null || true

# Agent tests
cd apps/agent && pytest -v 2>/dev/null || true
```

### 4. Report Quality Gate Results

Display a comprehensive status table:

```markdown
## Quality Gate Results

| Check               | Status  | Details             |
| ------------------- | ------- | ------------------- |
| ESLint (Frontend)   | ✅ PASS | No errors           |
| Prettier (Frontend) | ✅ PASS | All files formatted |
| TypeScript Build    | ✅ PASS | Build successful    |
| Ruff (Agent)        | ✅ PASS | No linting errors   |
| Ruff Format (Agent) | ✅ PASS | All files formatted |
| Mypy (Agent)        | ⚠️ SKIP | Not installed       |
| SQL Validation      | ✅ PASS | Valid syntax        |
| Tests (Frontend)    | ⚠️ SKIP | No tests found      |
| Tests (Agent)       | ✅ PASS | 12 tests passed     |

**Overall Status:** ✅ READY TO COMMIT
```

**Status Legend:**

- ✅ PASS - Check passed
- ❌ FAIL - Check failed (blocks commit)
- ⚠️ SKIP - Check skipped (optional or not configured)
- 🔄 FIX - Auto-fixable issues detected

### 5. Handle Failures

**If any critical check fails:**

1. Display the error output clearly
2. Offer to auto-fix if possible:

```markdown
❌ **Quality Gate Failed**

### ESLint Errors (3 issues)

\`\`\`
apps/frontend/src/components/Button.tsx:15:5 - 'unused' is defined but never used
apps/frontend/src/lib/utils.ts:8:1 - Missing return type
\`\`\`

### Prettier Formatting Issues (2 files)

- apps/frontend/src/app/page.tsx
- apps/frontend/src/components/Header.tsx

**Auto-fix available:**

| Issue Type | Command             | Files Affected |
| ---------- | ------------------- | -------------- |
| ESLint     | `pnpm lint --fix`   | 2 files        |
| Prettier   | `pnpm format`       | 2 files        |
| Ruff       | `pnpm format:agent` | 0 files        |

Would you like me to auto-fix these issues? (yes/no)
```

If user says yes:

```bash
pnpm lint --fix
pnpm format
pnpm format:agent
```

Then re-run quality gates and report updated status.

### 6. Prepare Commit

Once all gates pass:

#### 6.1 Show Git Status Summary

```bash
git status --short
git diff --stat HEAD
```

Display:

```markdown
## Changes to Commit

**Modified files (5):**

- M apps/frontend/src/app/page.tsx
- M apps/frontend/src/components/chat/ChatMessage.tsx
- A apps/frontend/src/components/ui/Button.tsx
- M apps/agent/src/tools/search.py
- A supabase/migrations/20241223_add_users.sql

**Summary:** 3 modified, 2 added, 0 deleted | +245 -32 lines
```

#### 6.2 Generate Commit Message Suggestions

Based on the changes and the feature context from spec.md:

```markdown
## Suggested Commit Messages

Based on your changes and the feature specification, here are suggested commits:

### Option A: Single Feature Commit (Recommended for small features)

\`\`\`
feat(frontend): add user profile management

- Add profile page with avatar upload
- Implement user settings form
- Add profile API route handlers

Spec: 005-user-profiles
\`\`\`

### Option B: Split Commits (Recommended for larger changes)

\`\`\`

1. feat(db): add user profiles table with RLS policies
2. feat(agent): add profile update tool
3. feat(frontend): add user profile page and settings
   \`\`\`

### Option C: Custom

Type your own commit message following conventional commits format:
`<type>(<scope>): <subject>`

Which option would you like? (A/B/C/custom message)
```

### 7. Execute Commit

Based on user selection:

#### Single Commit (Option A)

```bash
git add -A
git commit -m "feat(frontend): add user profile management

- Add profile page with avatar upload
- Implement user settings form
- Add profile API route handlers

Spec: XXX-feature-name"
```

#### Split Commits (Option B)

For each commit:

1. Stage only related files
2. Create commit with appropriate message
3. Repeat for remaining changes

```bash
# First commit - database
git add supabase/
git commit -m "feat(db): add user profiles table with RLS policies"

# Second commit - agent
git add apps/agent/
git commit -m "feat(agent): add profile update tool"

# Third commit - frontend
git add apps/frontend/
git commit -m "feat(frontend): add user profile page and settings"
```

### 8. Post-Commit Actions

After successful commit(s):

```markdown
## ✅ Commit Successful

**Commits created:**

| Hash    | Message                                             |
| ------- | --------------------------------------------------- |
| a1b2c3d | feat(db): add user profiles table with RLS policies |
| e4f5g6h | feat(agent): add profile update tool                |
| i7j8k9l | feat(frontend): add user profile page and settings  |

**Current branch:** `005-user-profiles`
**Commits ahead of main:** 3

### Next Steps

1. **Push to remote:**
   \`\`\`bash
   git push origin 005-user-profiles
   \`\`\`

2. **Open Pull Request:**
   - Use `/speckit.pr` command, or
   - Open PR manually on GitHub

3. **Request review:**
   - Ensure spec file is linked in PR description
   - Tag appropriate reviewers

Would you like me to push the changes now? (yes/no)
```

If user says yes:

```bash
git push origin $(git branch --show-current)
```

## Quality Gate Configuration

### Required Checks (Must Pass)

These checks MUST pass before commit:

- ESLint (no errors - warnings allowed)
- Prettier formatting
- Ruff linting (Python)
- TypeScript/Next.js build (no errors)

### Optional Checks (Informational)

These checks are reported but don't block commit:

- Mypy type checking (if installed)
- Test suite (if configured)
- Bundle size analysis

### Skip Conditions

Checks are automatically skipped when:

- No files of that type were changed
- Tool is not installed
- Configuration file doesn't exist

## Error Recovery

If the commit process fails or is interrupted:

1. All quality gate results are cached
2. User can resume from last successful step
3. Staged changes are preserved

## Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

### Types

| Type       | Description                 |
| ---------- | --------------------------- |
| `feat`     | New feature                 |
| `fix`      | Bug fix                     |
| `docs`     | Documentation only          |
| `style`    | Formatting (no code change) |
| `refactor` | Code restructuring          |
| `perf`     | Performance improvement     |
| `test`     | Adding tests                |
| `chore`    | Build, CI, dependencies     |

### Scopes

| Scope      | Description          |
| ---------- | -------------------- |
| `frontend` | Next.js app changes  |
| `agent`    | Python agent changes |
| `db`       | Database/migrations  |
| `auth`     | Authentication       |
| `api`      | API routes           |
| `ui`       | UI components        |
| `deps`     | Dependencies         |

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Subject rules:**

- Use imperative mood ("add" not "added")
- No period at end
- Max 72 characters
- Lowercase first letter

**Body rules:**

- Wrap at 72 characters
- Explain what and why (not how)
- Include bullet points for multiple changes

**Footer rules:**

- Reference spec: `Spec: XXX-feature-name`
- Close issues: `Closes #123`
- Breaking changes: `BREAKING CHANGE: description`

## Arguments

The command accepts optional arguments:

- `--skip-tests`: Skip test execution
- `--skip-build`: Skip build verification
- `--auto-fix`: Automatically fix all auto-fixable issues
- `--push`: Push after successful commit
- `--amend`: Amend the previous commit instead of creating new

Examples:

```bash
/speckit.commit --auto-fix --push
/speckit.commit --skip-tests
/speckit.commit --amend
```
