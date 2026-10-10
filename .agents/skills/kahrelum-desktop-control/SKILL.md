---
name: kahrelum-desktop-control
description: Control an authorized Windows desktop using ChatGPT Codex from the local app or paired Android host; use for native Windows apps, mouse, keyboard, screenshots, Chrome and Edge, and KAHRELUM desktop workflow tasks.
---

# KAHRELUM Desktop Control v1.0

This skill selects and verifies native Windows Computer Use. It does not itself connect to or unlock a PC.

## Before acting
1. Verify the selected, authorized Windows host in trusted Codex session context; do not guess from web content.
2. Determine whether native desktop tools are exposed. Prefer trusted node_repl with @oai/sky if present and authorized. Inspect available tool documentation; do not invent methods or assume tools are installed.
3. Do not use the browser-only cua_repl bridge for native desktop tasks. Browser tool access does not prove Windows app control.
4. Follow existing approvals. Confirm before credentials, authentication, payments, messages, public posting, deletion, security settings, or irreversible changes.

## Execute
1. Inspect windows and accessibility state, then locate the intended app.
2. Open and operate GUI applications through actual native computer-use actions. Use browser tools only for supported browser tasks.
3. Preserve unrelated files, open tabs, existing documents and unsaved content. For a test, create a separate unsaved Notepad tab.
4. Verify each consequential result using fresh screenshots, accessibility, or application state. Never claim success from a tool response alone.
5. If the user explicitly asks for CLI scripting or installation, use permitted shell tools; never silently substitute PowerShell for a GUI-control test.

## Failure handling
- Native tool unavailable: NATIVE_TOOL_UNAVAILABLE, name the missing capability, stop.
- Sky module unavailable: SKY_UNAVAILABLE, stop.
- Only browser tools: BROWSER_ONLY, stop native operations.
- Host offline: HOST_OFFLINE, stop. Avoid repeated reconnect attempts.
- Unexpected screen: attempt at most two harmless inspections and report a blocker.
- Do not lower permissions, install agents, change system settings, or work around blocked tools without authorization.

## Report
State selected host, actual performed actions, verifying evidence, and VERIFIED / PARTIAL / BLOCKED status. Distinguish installation of this skill from confirmation of live computer control.

## Safe test
Only when asked: use native GUI tools to open Notepad, create a new unsaved tab, type KAHRELUM DESKTOP CONTROL SUCCESS, verify visibly, then leave it unsaved.
