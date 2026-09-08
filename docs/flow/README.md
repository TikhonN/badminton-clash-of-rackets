# Dev Flow: Badminton: Clash of Rackets

7 agents, each scoped to one job, chaining themselves via the Agent tool. You only
ever start the **researcher**; the rest happens automatically, including looping
back when tests fail or review requests changes.

```
researcher → planner → architect → coder → tester ─┬─(pass)→ reviewer ─(approved)→ done
                            ^                        │                  │
                            │                        (fail)             (changes requested)
                            │                        ▼                  ▼
                            └──────────────────── debugger          coder / architect
                                                                          │
                                                              (loops back into tester)
```

## Before you start
`docs/flow/00-task.md` is a placeholder — fill in the "To fill in before running
the researcher" section (what stats, whose data, data source, audience, hosting)
before starting the flow. The researcher will have nothing usable to work from
otherwise.

## How to run it
Once the task brief is filled in, just ask for the researcher agent, e.g.:
> "Use the researcher agent to start on `docs/flow/00-task.md`."

Everything after that is automatic — each agent reads the shared docs below, does
only its own job, writes its output, and calls the next agent itself.

## Shared state (how cold-started agents pass context to each other)
Each subagent invocation starts with no memory of prior turns, so state lives in
files, not conversation:

| File | Owner | Purpose |
|---|---|---|
| `00-task.md` | (seed) | The original ask |
| `STATE.md` | everyone | Loop counters + activity log — read first, append before handing off |
| `01-research.md` | researcher | Findings |
| `02-plan.md` | planner | Scope + success metrics |
| `03-architecture.md` | architect | Tech choices, file layout, data/stats/chart spec |
| `04-implementation.md` | coder | What was built/changed |
| `05-test-report.md` | tester | Pass/fail per check (rounds appended) |
| `06-debug-log.md` | debugger | Root cause + fix spec (rounds appended) |
| `07-review.md` | reviewer | Approved / changes requested (rounds appended) |

## Loop safety
`STATE.md` caps the tester⇄debugger loop and the reviewer⇄coder/architect loop at
3 rounds each. If a loop hits the cap, the agent stops and writes a "stuck" note
instead of calling another agent — at that point it's back to you.
