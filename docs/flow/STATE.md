# Flow State

Counters below track back-and-forth loops so agents don't ping-pong forever.
Every agent MUST read this file first, and append one entry to the Activity Log
before calling the next agent.

- fix_loop_round: 0      (tester ⇄ debugger ⇄ coder)
- review_loop_round: 0   (reviewer ⇄ coder/architect)
- max_rounds: 3

Rule: before incrementing a counter to start another loop iteration, check it
against `max_rounds`. If incrementing would exceed it, STOP the flow instead —
do not call another agent. Write a clear "stuck, needs human input" summary at
the bottom of this file explaining what's failing and what's been tried, and end
your turn there so the user (not another agent) decides what happens next.

## Activity Log
(append only, most recent last — one entry per agent turn)

<!-- example entry:
### 2026-09-08 14:02 — researcher
- action: completed research
- output: docs/flow/01-research.md
- next: planner
-->
