# Badminton: Clash of Rackets

A small static site for club badminton doubles results — leaderboards, points rankings, and cross-tournament storylines, computed from JSON data files. No build step, no dependencies.

Live pages: `index.html` (standings), `players.html` (aggregated player stats), `case-study.html` (the write-up).

## Running it locally

Because the pages `fetch()` JSON files, opening `index.html` directly (`file://…`) won't work — browsers block that. Serve the folder instead:

```bash
npx serve .
# or: python3 -m http.server 8000
```

Then open the printed local URL.

## Adding a new tournament day

1. Copy `data/tournaments/TEMPLATE.json` to a new file named after the tournament, e.g. `data/tournaments/2026-10-03.json`.
2. Fill in `label`, `date`, `gamesPerPair`, `pointsCap`, and the `pairs` array (one entry per pair, with `wins` and, if you have it, `points`). If the tournament ran as two simultaneous groups that never played each other, set each pair's `group` to `"A"` or `"B"` (and the tournament's own `groups` field to `["A","B"]`) — the site ranks each group independently rather than mixing them into one table.
3. If you have real per-round match scores this time, fill in the `rounds` array too (see the template's example) — most tournaments now on the site do have this.
4. Delete the file's `_comment`, `_rounds_comment`, and `_rounds_example` fields — those are just instructions.
5. Add the new file's id to the `tournaments` array in `data/manifest.json`.
6. Refresh the page. Standings, the points board, the players page, and the "pairs who played more than once" table all update automatically — nothing else to edit.

To add or edit a "plot twist" card on the homepage, edit `data/storylines.json` — these are curated by hand (spotting a good story isn't something the site does automatically), each entry is `{ kicker, title, body, chip }`.

## Project structure

```
index.html          standings — one section per tournament, newest first
players.html         individual player stats, aggregated across all tournaments
case-study.html       the project write-up
css/style.css         shared design tokens + components (light & dark mode)
js/app.js              data loading, standings math, rendering
data/manifest.json      list of tournament ids to load, in order
data/tournaments/*.json  one file per tournament day
data/tournaments/TEMPLATE.json   copy this to add a new day
data/storylines.json      curated "plot twist" cards shown on the homepage
```

## Deploying

This is plain static HTML/CSS/JS — any static host works.

**GitHub Pages**
1. Push this folder to a GitHub repo.
2. Repo Settings → Pages → Source: Deploy from a branch → pick `main` and `/ (root)`.
3. Your site is live at `https://<username>.github.io/<repo>/` within a few minutes.
4. For a custom domain: add a `CNAME` file with your domain, and point your domain's DNS at GitHub Pages (an `A` record to GitHub's IPs, or a `CNAME` record to `<username>.github.io` for a subdomain) — GitHub's Pages docs have the exact records.

**Vercel**
1. `npx vercel` from this folder, or import the GitHub repo at vercel.com — no framework preset needed, it's static.
2. Add a custom domain from the project's Domains tab; Vercel gives you the DNS records to add.

**Netlify**
1. Drag-and-drop this folder onto app.netlify.com, or connect the GitHub repo (build command: none, publish directory: `.`).
2. Add a custom domain from Site settings → Domain management.

## Data honesty note

The results are real — 19 tournaments, 1,485 matches, played by a real club between May and September 2026 — but the **names are not**. This is a portfolio project, so every player name on the site is a fictional placeholder assigned to an anonymized player id from the club's own export; no name-to-id mapping exists linking these fictional names back to real people. See the case study for the full provenance.

Every tournament currently on the site has full per-round match scores (the `rounds` field is populated, not `null`) — a tournament without real round-by-round data would still work, with `rounds: null` and a `source` note explaining why, same as the template documents. The totals were cross-checked against the club's own records: each tournament's win counts sum exactly to the number of matches actually played.
