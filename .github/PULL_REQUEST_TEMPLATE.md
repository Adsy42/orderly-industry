## Description

<!-- Briefly describe what this PR does and why -->

## Linked Specification

<!-- Link to the spec file for this feature (required for feature PRs) -->
- **Spec**: `specs/###-feature-name/spec.md`
- **Plan**: `specs/###-feature-name/plan.md`
- **Tasks**: `specs/###-feature-name/tasks.md`

## Type of Change

<!-- Mark the relevant option with an [x] -->

- [ ] **Feature** - New functionality (requires spec)
- [ ] **Bug Fix** - Fixes an issue
- [ ] **Refactor** - Code improvement without behavior change
- [ ] **Docs** - Documentation only
- [ ] **Chore** - Build, CI, dependencies

## SDD Workflow Checklist

<!-- For feature PRs, ensure the SDD workflow was followed -->

- [ ] Spec created and reviewed (`/speckit.specify`)
- [ ] Technical plan completed (`/speckit.plan`)
- [ ] Tasks broken down (`/speckit.tasks`)
- [ ] All tasks in `tasks.md` are marked complete `[x]`
- [ ] Checklists in `specs/###/checklists/` are passing

## Implementation Checklist

### Code Quality
- [ ] Code follows project constitution (`.specify/memory/constitution.md`)
- [ ] No unnecessary complexity added
- [ ] Self-reviewed the diff before requesting review

### Database (if applicable)
- [ ] Migration file follows naming convention (`YYYYMMDDHHmmss_description.sql`)
- [ ] RLS policies added for new tables
- [ ] Indexes added for columns used in RLS
- [ ] Table comments added

### Security
- [ ] No secrets committed
- [ ] New endpoints are authenticated
- [ ] RLS policies tested

### Testing
- [ ] Tested locally
- [ ] Edge cases considered
- [ ] No regressions in existing functionality

## Screenshots/Demo

<!-- If UI changes, add screenshots or video -->

## How to Test

<!-- Step-by-step instructions for reviewers -->

1. Checkout this branch
2. Run `pnpm install` and `pnpm dev`
3. Navigate to...
4. Verify that...

## Related Issues

<!-- Link any related issues: Fixes #123, Relates to #456 -->

---

**Reviewer Notes:**
- Review against the linked spec for completeness
- Check constitution compliance
- Verify all tasks are marked complete

