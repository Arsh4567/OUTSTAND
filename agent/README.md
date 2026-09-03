# OUTSTAND Autonomous Engineer

This directory defines the control-plane contract for a future 24/7 engineering agent.

## Goals

- Inspect the OUTSTAND codebase and its operational state.
- Prioritize high-value engineering work.
- Make changes only on isolated branches.
- Run repository quality checks before proposing changes.
- Record every run and decision for durable memory.
- Keep production deployment behind explicit safety gates until the system is proven reliable.

## Current mode

`observe-and-pr`: the agent may inspect, plan, edit a branch, and create a pull request. It must not directly modify `main`, perform destructive database actions, or deploy production autonomously.

## Required integrations

- GitHub repository: `Arsh4567/OUTSTAND`
- Supabase project: `zgihqwuzsxpzefhxdxtr`
- Existing CI quality gate: `.github/workflows/quality.yml`
- Browser verification: Playwright/agent-browser-compatible workflow

## Repository contract

The project is Lovable-connected. Do not rewrite published Git history. Changes to `main` must remain fast-forward/normal commits and should preserve a working state.

## Quality gate

The minimum repository checks are:

```bash
bun install --frozen-lockfile
bunx tsc --noEmit
bun run lint
bun run build
```

The canonical workflow already runs these checks for pushes and pull requests.

## Agent run states

`queued` → `running` → `testing` → `pr_opened` → `verified` or `blocked`.

## Safety boundaries

The agent must stop and request human approval for:

- destructive or irreversible database operations;
- authentication/authorization policy changes;
- secrets or environment-variable changes;
- changes that can delete or corrupt user data;
- production migrations;
- direct production deployment when verification is incomplete.
