# Quickstart: Natural Language to IQL Translation

**Feature**: 006-nl-iql-translation  
**Date**: 2025-01-27

## Overview

The Clause Finder now supports natural language input, automatically translating your plain English descriptions into IQL syntax. You can still use direct IQL syntax if you prefer - both modes are available with a simple toggle.

## Prerequisites

- Document uploaded and processed (status = 'ready')
- Access to the IQL Query page for a document

## User Flow

### 1. Access IQL Query Interface

Navigate to a document's IQL analysis page:

```
/protected/matters/[matterId]/documents/[documentId]/iql
```

### 2. Choose Your Input Mode

At the top of the Clause Finder input area, you'll see a toggle:
- **Natural Language** (default) - Describe what you're looking for in plain English
- **IQL** - Write IQL syntax directly

### 3. Natural Language Mode (Recommended for New Users)

**Option A: Simple Clause Searches**

1. Select "Natural Language" mode (default)
2. Type a description: `termination clauses`
3. Click "Find Clauses"
4. The system automatically translates to `{IS termination clause}` and searches

**Option B: Complex Searches with Boolean Logic**

1. Select "Natural Language" mode
2. Type: `one-sided confidentiality clauses`
3. Click "Find Clauses"
4. System translates to: `{IS confidentiality clause} AND {IS unilateral clause}`

**Option C: Party-Specific Comparisons**

1. Type: `clauses where Customer has more obligations than Supplier`
2. System translates to: `{IS clause obligating "Customer"} > {IS clause obligating "Supplier"}`

### 4. View Translation Results

After executing a search in natural language mode:

1. **Results Display**: Matching clauses appear with citations
2. **Translated IQL Visible**: The generated IQL query is shown above results
   - Example: "Translated to: {IS confidentiality clause} AND {IS unilateral clause}"
3. **Learn IQL**: Click on the translated query to copy it or switch to IQL mode with it pre-filled

### 5. Switch to IQL Mode (Advanced Users)

If you know IQL syntax or want to use it directly:

1. Toggle to "IQL" mode
2. Enter IQL syntax directly: `{IS termination clause} AND {IS unilateral clause}`
3. Query executes immediately without translation
4. Your input is preserved if you switch back to Natural Language mode

## Natural Language Examples

### Simple Searches

| Natural Language | Translated IQL |
|-----------------|----------------|
| `termination clauses` | `{IS termination clause}` |
| `confidentiality provisions` | `{IS confidentiality clause}` |
| `indemnity clauses` | `{IS indemnity clause}` |

### Boolean Combinations

| Natural Language | Translated IQL |
|-----------------|----------------|
| `one-sided termination clauses` | `{IS termination clause} AND {IS unilateral clause}` |
| `confidentiality or non-compete` | `{IS confidentiality clause} OR {IS non-compete clause}` |
| `indemnity without liability caps` | `{IS indemnity clause} AND NOT {IS liability cap clause}` |

### Party-Specific Queries

| Natural Language | Translated IQL |
|-----------------|----------------|
| `clauses obligating the Customer` | `{IS clause obligating "Customer"}` |
| `where Customer has more duties than Supplier` | `{IS clause obligating "Customer"} > {IS clause obligating "Supplier"}` |

### Custom Descriptions

| Natural Language | Translated IQL |
|-----------------|----------------|
| `clauses about data retention` | `{IS clause that "data retention"}` |
| `provisions related to GDPR compliance` | `{IS clause that "GDPR compliance"}` |

## Tips for Best Results

1. **Use Specific Legal Terms**: Terms like "termination", "indemnity", "confidentiality" map directly to templates
2. **Combine Concepts Clearly**: Use "and", "or", "without" to express boolean logic
3. **Check the Translation**: Always review the translated IQL query to ensure it matches your intent
4. **Learn IQL Gradually**: Use the translated queries to learn IQL syntax over time
5. **Switch Modes as Needed**: Advanced users can toggle to IQL mode for precise control

## Error Handling

If translation fails or produces invalid results:

- **Translation Error**: System shows user-friendly error message
- **Invalid IQL**: Validation errors are displayed with suggestions
- **Fallback Option**: Always available to switch to IQL mode and enter syntax manually

## Keyboard Shortcuts

- **Cmd/Ctrl + Enter**: Execute search (works in both modes)

## Next Steps

- **Save Queries**: After finding useful queries, save them for reuse
- **Use Templates**: Browse available clause templates via "Show Clause Types" button
- **View Examples**: Check "Show Example Queries" for common search patterns
- **Learn Operators**: Review "Show Operators Guide" to understand IQL boolean logic

