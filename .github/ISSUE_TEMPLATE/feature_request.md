---
name: Feature Request
about: Propose a new feature (will be converted to SDD spec)
title: "[FEATURE] "
labels: enhancement
assignees: ""
---

## Feature Summary

<!-- One-paragraph description of the feature -->

## Problem Statement

<!-- What problem does this solve? Why is it needed? -->

**As a** [type of user]
**I want** [goal/desire]
**So that** [benefit/value]

## Proposed Solution

<!-- High-level description of the solution (avoid implementation details) -->

## User Scenarios

<!-- Describe how users would interact with this feature -->

### Primary Flow

1. User does X
2. System responds with Y
3. User sees Z

### Edge Cases

- What if...
- What if...

## Success Criteria

<!-- How do we know this feature is successful? -->

- [ ] Users can...
- [ ] Performance metric: ...
- [ ] Adoption metric: ...

## Alternatives Considered

<!-- What other approaches were considered? Why were they rejected? -->

## Priority

<!-- How urgent is this feature? -->

- [ ] **P1 - Critical** - Blocking users or core functionality
- [ ] **P2 - High** - Important for upcoming release
- [ ] **P3 - Medium** - Nice to have, can wait
- [ ] **P4 - Low** - Future consideration

## Additional Context

<!-- Any other context, mockups, or references -->

---

**SDD Workflow:**

Once approved, this feature request will be converted to a specification:

1. Run `/speckit.specify [feature description]`
2. Create feature branch and spec file
3. Follow the SDD workflow (plan → tasks → implement)

**For Maintainers:**

- [ ] Reviewed and approved
- [ ] Converted to spec via `/speckit.specify`
- [ ] Linked to spec branch: `###-feature-name`
