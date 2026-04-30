## ⚠️ CRITICAL: Terminal Command Fix (Windows)

**Known Bug**: On Windows, the `run_command` tool types commands into the terminal but does NOT press Enter.

### Workaround (MUST FOLLOW)

When running terminal commands:

1. **First**, use `run_command` to open a terminal session
2. **Then**, use `send_command_input` with the actual command + newline to execute it

**Example Pattern:**
```
1. run_command with any simple command → opens terminal, gets CommandId
2. send_command_input with CommandId, Input="actual command\n" → executes the command
```

**DO NOT** expect `run_command` alone to execute commands. Always follow up with `send_command_input` including a newline character at the end of the Input.

