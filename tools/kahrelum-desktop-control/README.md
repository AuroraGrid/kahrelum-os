# KAHRELUM Desktop Control (feature branch)

This branch holds a reusable Codex skill for GUI control of **the currently authorized Windows host**. It does not add any remote agent, administrator-level access or new connections.

## Quick install from an Android Codex session
Select the Toshiba or Dell host. In that host's Codex chat, ask the built-in $skill-installer to install the repository skill from this branch:

Repository: AuroraGrid/kahrelum-os
Branch: feature/kahrelum-desktop-control-v1
Path: .agents/skills/kahrelum-desktop-control

Or manually copy the skill directory to %USERPROFILE%\.agents\skills\kahrelum-desktop-control on each host, then open a new Codex session.

## Use
Say: "Use $kahrelum-desktop-control to open Notepad, type a harmless test message in a new unsaved tab, and verify a screenshot."

The paired host must already support trusted node_repl and @oai/sky. A skill does NOT create Windows desktop-control tools where they are unavailable.

## Existing files
Do not overwrite .codex/AGENTS.md or AGENTS.override.md; add routing guidance only after reviewing existing policies.
