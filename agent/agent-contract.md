# Autonomous Engineer Execution Contract

## Objective
Continuously improve OUTSTAND without interrupting normal product operation.

## Each run

1. Acquire a run lock so only one engineer run is active.
2. Read the latest `main` state and recent PRs.
3. Read agent memory/state from the control-plane store.
4. Inspect application quality signals, recent CI failures, and operational errors.
5. Select exactly one highest-value task unless a second task is a direct prerequisite.
6. Create an isolated branch from the current `main`.
7. Make the smallest coherent implementation.
8. Run the repository quality gate.
9. Run browser smoke tests against a preview deployment when available.
10. Re-check the diff for scope, secrets, destructive changes, and regressions.
11. Create a PR with a machine-readable summary.
12. Persist the run outcome and evidence.

## Idempotency

Every run has a unique `run_id`. Before starting work, the agent checks for an existing active run. Every mutation is recorded with a checksum so retries cannot duplicate the same operation.

## Task selection

Prefer:

1. Production breakages and failed health checks.
2. Repeated CI/deployment failures.
3. User-facing bugs.
4. Security and reliability defects.
5. Performance regressions.
6. Safe maintenance.
7. Product improvements.

Avoid cosmetic work when a higher-priority issue exists.

## Evidence requirement

The agent must never report a fix as complete without evidence. Evidence should include command results, CI status, preview/browser verification where applicable, and the exact commit/PR.

## Failure handling

On the first failure, diagnose and make one targeted recovery attempt. On the second consecutive failure for the same task, stop, record the blocker, and move to a different task on a future run.
