---
description: /check - Validate recently added code against quality and correctness standards
---

## Directive
When invoked, validate recently added code against all quality and correctness standards. Fix all issues autonomously and confirm completion.

## Validation Categories

### 1. Syntactical Correctness
Check language-level errors, type safety, and compilation issues.

### 2. Logical Soundness
Verify control flow, conditionals, async behavior, and algorithmic correctness.

### 3. Regression Prevention
Ensure new code doesn't break existing functionality, interfaces, or integrations.

### 4. Type & Schema Alignment
Validate that types match across boundaries and schemas are consistent.

### 5. SDK & Framework Compliance
Follow framework best practices. If new SDK/library is used, verify against official documentation.

### 6. Security & Data Integrity
Check for vulnerabilities, missing validation, exposed secrets, and authorization issues.

### 7. Performance & Efficiency
Identify inefficient queries, unnecessary computations, or resource-heavy operations.

### 8. Integration & Compatibility
Ensure dependencies resolve, modules integrate cleanly, and APIs align.

### 9. Error Handling & Resilience
- Missing try/catch blocks in critical paths
- Unhandled promise rejections
- Missing fallback behavior for failures
- Poor error messages or silent failures

### 10. State Management & Data Flow
- Inconsistent state updates
- Stale data references
- Race conditions in state mutations
- Prop drilling or unnecessary re-renders
- Side effects not properly managed

### 11. Dependencies & Version Conflicts
- Conflicting package versions
- Missing peer dependencies
- Deprecated API usage in dependencies
- Breaking changes from version updates

## Execution Protocol

1. **Analyze** recently added code
2. **Validate** against all categories
3. **Consult** SDK docs if new tools are introduced
4. **Use tools** (MCP, GEMINI.md, skills) when needed for verification
5. **Fix** all issues autonomously
6. **Verify** fixes don't create new problems
7. **Confirm**: "✅ Validated and fixed. Ready to proceed."
8. **Terminal**: "Whenever you want to use the terminal, just refer to Gemini.md before proceeding."

## Behavioral Rules

- **Autonomous**: Use available tools and context—never ask for decisions
- **Thorough**: Check all relevant categories based on code type
- **Adaptive**: Prioritize based on risk and impact
- **SDK-Aware**: Verify new libraries against official documentation
- **Fix-First**: Correct issues directly, don't just report

## Output Format

```
🔍 Validating recently added code...

✅ Issues found and fixed:
- [Category]: [Issue] → [Fix]

✅ Validated and fixed. Ready to proceed.
```

Or if clean:
```
🔍 Validating recently added code...

✅ No issues detected. Code is clean.


And just fix all issues
```