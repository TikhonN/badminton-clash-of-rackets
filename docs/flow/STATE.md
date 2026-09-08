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

### 2026-09-08 — adopted existing build (not an agent-flow turn)
- action: user delivered a complete, already-working static dashboard
  (`court-standings/` folder, originally named "Court Standings") built
  elsewhere, based on real club badminton data pulled from a local
  "Claude outputs" folder. Moved its contents to repo root and rebranded to
  "Clash of Rackets" / "Badminton: Clash of Rackets" throughout (nav, page
  titles, meta description, README, js/app.js header comment) — verified via
  grep, zero leftover "Court Standings" mentions.
- files now at repo root: `index.html`, `players.html`, `case-study.html`,
  `css/style.css`, `js/app.js`, `README.md`, `data/manifest.json`,
  `data/tournaments/{2026-08-22,2026-08-29,2026-09-05,TEMPLATE}.json`,
  `data/storylines.json`.
- `docs/flow/00-task.md` updated to describe this as the real v1 baseline, not
  a placeholder — no researcher/planner/architect/coder round has run yet
  against this baseline.
- next: none yet — no agent called. This is the starting point for whatever
  feature/deploy work is requested next; when that happens, start at
  **researcher** per normal process, or drop straight into **architect** if
  the next ask is a small, fully-specified change (per PetLaundryProject's
  established precedent for direct-to-architect/coder mini-tasks).
