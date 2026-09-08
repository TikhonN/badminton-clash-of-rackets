# Task Brief

**Requested by:** tikhonravova78@gmail.com
**Date:** 2026-09-08 (updated same day — see "Update" below)

## Ask (verbatim intent)
Build "Badminton: Clash of Rackets" — a **dashboard with statistics**.

## Update (2026-09-08): starting point changed — a working v1 already exists
A complete static site (built by the user elsewhere, delivered as a
`court-standings` folder from "Claude outputs") was dropped into this repo and
adopted as the project's actual dashboard — moved to repo root and rebranded
from its original name ("Court Standings") to "Clash of Rackets" /
"Badminton: Clash of Rackets". **This is not a placeholder or a prototype to
throw away — treat it as the real v1 baseline for any future flow round.**

What it already has:
- `index.html` — standings homepage: per-tournament leaderboards (ranked by wins
  and by points), a scoreboard of recent champions, curated "storylines" cards,
  and a "pairs who played more than once" cross-tournament movement table.
- `players.html` — individual player stats aggregated across tournaments
  (appearances, total wins, win rate, best finish, partners), computed
  automatically by splitting pair names.
- `case-study.html` — a written case study of how the data was assembled and
  the site designed.
- `css/style.css`, `js/app.js` — shared design system (light/dark mode,
  condensed poster headline face, monospace stat digits) and all standings/
  player-stats computation + rendering logic. No build step, no dependencies.
- `data/manifest.json` + `data/tournaments/*.json` — one JSON file per
  tournament day (currently **2026-08-22, 2026-08-29, 2026-09-05** — club
  badminton doubles round robin, games to 18, 10-14 pairs per day), plus a
  `TEMPLATE.json` documenting how to add a new day, and `data/storylines.json`
  for hand-curated highlight cards.
- Data provenance/honesty is already documented in the site's own README:
  some days only have totals (not per-round scores) because handwritten
  scoresheets weren't reliably legible; totals were cross-checked against
  expected match counts.

Audience: a club, not a single private user — repo is **public** because the
user intends to publish the dashboard.

## Known constraints / context
- Static site, no build step, no backend — keep it that way unless a future
  task explicitly justifies otherwise.
- Data lives in versioned JSON files per tournament day, not a database.
- Not yet deployed anywhere live (repo is public; GitHub Pages / Vercel /
  Netlify instructions already exist in `README.md` but haven't been run).

## Open, not yet decided
- Whether/when to actually deploy (GitHub Pages vs. Vercel vs. Netlify).
- Any further feature work (real per-round match logs — the `rounds` field in
  each tournament JSON is ready but unused; individual player history pages;
  more tournament days as they happen).

This file is the seed input for the **researcher** agent, for any *future*
feature/change round. It should NOT be used to re-plan or rebuild what already
exists above — a re-entered architect/coder round should read the live files as
ground truth (per this repo's own convention, see PetLaundryProject's
`docs/flow/STATE.md` history for why: live files, not old docs, are truth once
something has shipped).
