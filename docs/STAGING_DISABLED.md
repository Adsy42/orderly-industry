# Staging/Preview Environments Disabled

**Date**: Current  
**Reason**: Cost reduction - staging environments were costing too much

## What Changed

All preview/staging environment workflows have been **disabled**:

1. ✅ **Supabase Preview Branches** - Workflow removed (`.github/workflows/preview-supabase.yml`)
2. ✅ **LangSmith Preview Deployments** - Workflow removed (`.github/workflows/preview-agent.yml`)
3. ⚠️ **Vercel Preview Deployments** - Must be disabled manually in Vercel dashboard

---

## Disable Vercel Preview Deployments

**Action Required**: Disable preview deployments in Vercel to prevent automatic staging environments on PRs.

### Steps:

1. Go to **Vercel Dashboard** → Your Project → Settings
2. Navigate to **Git** section
3. Under **Deployments**, find **Preview Deployments**
4. **Disable** preview deployments for pull requests
5. Save changes

**Alternative**: You can also disable via Vercel CLI:
```bash
vercel env rm PREVIEW_DEPLOYMENTS_ENABLED
```

---

## Testing Strategy

Since preview environments are disabled, all testing must happen:

1. **Locally** - Run full test suite before committing
2. **In CI** - All tests run on every PR (required to pass)
3. **Pre-commit hooks** - Quality gates run automatically before commit

### Pre-commit Checks

The pre-commit hook (`.husky/pre-commit`) ensures:
- ✅ Linting passes (ESLint, Ruff)
- ✅ Formatting passes (Prettier, Ruff format)
- ✅ Type checking passes (TypeScript, mypy)
- ✅ Build succeeds (Next.js production build)
- ✅ Tests pass (required)

### CI Checks

GitHub Actions workflows:
- ✅ Frontend CI: Lint, typecheck, build, **tests (required)**
- ✅ Agent CI: Lint, typecheck, **tests (required)**
- ✅ Database CI: Migration validation, RLS checks

**Tests are now required** - CI will fail if tests are missing or failing.

---

## Cost Savings

By disabling staging environments:
- **Supabase**: No longer creating branch databases per PR
- **LangSmith**: No longer creating preview revisions per PR
- **Vercel**: No longer creating preview deployments per PR (after manual disable)

All testing happens in local development and CI, which is free.

---

## Migration Notes

If you were relying on preview deployments:

1. **Use local development** - Set up environment variables per [ENV_SETUP.md](../ENV_SETUP.md)
2. **Run tests locally** - Use `pnpm test` or `pytest` before committing
3. **CI validation** - Let GitHub Actions validate before merging

---

## Re-enabling (If Needed)

If you want to re-enable staging environments later:

1. Restore the preview workflow files (if removed from git history)
2. Re-enable in Vercel dashboard
3. Ensure sufficient budget/resources for staging environments

**Note**: This change prioritizes cost reduction over convenience. All functionality is preserved, but testing must be done locally and in CI rather than in isolated preview environments.

