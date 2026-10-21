# QuantumRoute — AI Agent Task & Handoff Protocol

`PLAN.md` and `AGENTS.md` remain authoritative.

## Before work
The task owner provides the task ID, allowed files, dependencies, expected interfaces, acceptance criteria, and tests. The agent must read `PLAN.md`, `AGENTS.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `TASKS.md`, `TESTING.md`, and relevant code before editing.

## Prompt template
> Implement QuantumRoute task **[TASK ID]** for **[OWNER NAME]**.
>
> Read the project planning and governance files before editing.
>
> **Objective:** [one objective]  
> **Allowed files:** [exact files]  
> **Dependencies:** [completed task IDs and API contracts]  
> **Acceptance criteria:** [copy from TASKS.md]
>
> Do not silently change equations, noise conventions, qubit ordering, output-state definitions, or assumptions. If anything conflicts or is ambiguous, stop and report it for human review.
>
> Inspect existing code first. Make the smallest coherent change. Do not edit files outside the allowed list without asking. Do not add dependencies without justification. Add/update tests. Do not claim tests passed unless actually run and inspected. Never fabricate results, plots, benchmarks, citations, or hardware runs. Do not start the next task.
>
> **Handoff required:** list changed files, API/scientific choices, exact commands and actual test output, limitations, and decisions needing approval.

## Required handoff report
- **Task ID/title:**
- **Files changed and purpose:**
- **Public API changes:**
- **Scientific conventions and assumptions:**
- **Commands executed and actual results:**
- **Tests passed/failed/not run:**
- **Known limitations:**
- **Questions/decisions needed:**
- **Suggested next task (do not implement it):**

## Stop-and-ask conditions
Stop if a change conflicts with project decisions, mathematical expectations conflict with circuit output, test conventions differ from the existing module, a new dependency or architecture layer appears necessary, another contributor's work may be overwritten, or a task requires GitHub permissions/secrets/push/merge actions.
