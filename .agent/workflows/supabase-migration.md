---
description: Strict workflow for handling database schema changes safely via MCP and Manual Push
---

# Database Migration Workflow (Strict)

This workflow defines how the AI agent interacts with the Supabase database to ensure safety, consistency, and sync.

**CORE PHILOSOPHY**: The AI agent creates the *plan* (migration file), but the *execution* (db push) is always manual or user-triggered.

## 1. READ ANYTIME (Safe)
You have full permission to inspect the database state at any time to understand the current schema and data.
- **Tools**:
  - `mcp_supabase-mcp-server_list_tables`: To see table schemas.
  - `mcp_supabase-mcp-server_execute_sql`: To query data or check constraints.
  - `mcp_supabase-mcp-server_get_advisors`: To check for performance/security issues.
- **Constraint**: *Read-only operations only. Do not execute INSERT/UPDATE/DELETE/ALTER via raw SQL unless specifically debugging data issues.*

## 2. FOR SCHEMA CHANGES (Migration Creation)
 व्हेn a schema change is required (new table, column, trigger, generic function):

1. **Analyze Current State**: Use MCP tools to confirm the current schema (e.g., check if a column already exists).
2. **Create Migration File**:
   - Create a new file in `supabase/migrations/` using `write_to_file`.
   - **Naming Convention**: `YYYYMMDDHHMMSS_description.sql` (Use current 14-digit timestamp).
   - **Content**: Valid SQL wrapped in a transaction (`BEGIN; ... COMMIT;`) if multiple statements.
   - **Idempotency**: Use `IF NOT EXISTS` keys ensuring the migration is safe to run multiple times.
3. **Notify User**:
   - Inform the user that the migration file has been created.
   - **STOP**. Do not try to apply it.
   - Ask the user to run: `npx supabase db push`.

## 3. AFTER USER PUSHES (Verification)
Once the user confirms they have pushed the migration:

1. **Verify Schema**: Use `mcp_supabase-mcp-server_execute_sql` or `list_tables` to confirm the new columns/tables exist.
2. **Verify functionality**: If the migration fixed a bug (e.g., missing column), verify the related task or logic now works.
3. **Report**: Confirm to the user that the database is now in the desired state.

## 4. STRICT PROHIBITIONS (NEVER DO)
- ❌ **NEVER** use `mcp_supabase-mcp-server_apply_migration`. This creates a remote-only migration that breaks local sync.
- ❌ **NEVER** run `npx supabase db push` yourself unless explicitly debugging a sync issue requested by the user.
- ❌ **NEVER** modify the database schema via `execute_sql` (DDL). Always use a migration file.

## Example Scenario: Adding a column
1. **Agent**: Checks table `users` via MCP. Sees `phone` column missing.
2. **Agent**: Creates `supabase/migrations/20260120120000_add_phone_to_users.sql`.
3. **Agent**: "I created the migration. Please run `npx supabase db push`."
4. **User**: Runs command. "Done."
5. **Agent**: Checks `users` table via MCP. Confirms `phone` column exists. Marks task complete.
