/* Badminton: Clash of Rackets — data loading, standings math, and rendering.
   No build step, no dependencies: fetch() the JSON, compute, render to the DOM. */

async function loadTournaments() {
  const manifest = await fetch('data/manifest.json').then(r => r.json());
  const tournaments = await Promise.all(
    manifest.tournaments.map(id =>
      fetch(`data/tournaments/${id}.json`).then(r => r.json())
    )
  );
  // Keep manifest order (oldest -> newest) unless a caller wants otherwise.
  return tournaments;
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function ordinal(n) {
  return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
}

function medal(rank) {
  if (rank === 1) return { cls: 'p1', label: '1st' };
  if (rank === 2) return { cls: 'p2', label: '2nd' };
  if (rank === 3) return { cls: 'p3', label: '3rd' };
  return { cls: '', label: null };
}

/** Ranked standings for a list of pairs: sorted by wins desc, points desc as tiebreak.
    Takes a plain pairs array (not a tournament) so a grouped tournament's two
    groups — which never play each other and must never share one ranked list —
    can be ranked independently. Use groupSlices(t) to get the right array(s). */
function standingsByWins(pairs) {
  return [...pairs].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return (b.points ?? -1) - (a.points ?? -1);
  });
}

/** Ranked standings by points, only meaningful when the pairs recorded points. */
function standingsByPoints(pairs) {
  return [...pairs]
    .filter(p => p.points != null)
    .sort((a, b) => b.points - a.points);
}

/** Split a tournament's pairs into independent groups for ranking.
    Most tournaments have one group (t.groups is null) — one slice with all
    pairs. A handful of tournaments run two simultaneous groups (t.groups is
    e.g. ["A","B"]) that never played each other and each have their own
    standings table — one slice per group letter, filtered accordingly. */
function groupSlices(t) {
  if (!t.groups || !t.groups.length) {
    return [{ group: null, label: t.label, pairs: t.pairs }];
  }
  return t.groups.map(g => ({
    group: g,
    label: `${t.label} — Group ${g}`,
    pairs: t.pairs.filter(p => p.group === g),
  }));
}

function renderWinsBoard(el, pairs, outOf) {
  let html = `<div class="board-head"><span>#</span><span>Pair</span><span style="text-align:right;">Wins</span></div>`;
  pairs.forEach((d, i) => {
    const rank = i + 1, m = medal(rank);
    const pct = Math.round((d.wins / outOf) * 100);
    html += `<div class="row ${m.cls}">
      <div class="rank">${rank}</div>
      <div class="name-bar">
        <div class="name">${esc(d.name)}${m.label ? `<span class="medal">${m.label}</span>` : ''}</div>
        <div class="track"><div class="fill" style="width:${pct}%"></div></div>
      </div>
      <div class="val"><span class="num">${d.wins}</span> <span class="of">/ ${outOf}</span></div>
    </div>`;
  });
  el.innerHTML = html;
}

function renderPointsBoard(el, pairs) {
  const max = pairs[0]?.points || 1;
  let html = `<div class="board-head"><span>#</span><span>Pair</span><span style="text-align:right;">Points</span></div>`;
  pairs.forEach((d, i) => {
    const rank = i + 1, m = medal(rank);
    const pct = Math.round((d.points / max) * 100);
    html += `<div class="row ${m.cls}">
      <div class="rank">${rank}</div>
      <div class="name-bar">
        <div class="name">${esc(d.name)}${m.label ? `<span class="medal">${m.label}</span>` : ''}</div>
        <div class="track"><div class="fill" style="width:${pct}%"></div></div>
      </div>
      <div class="val"><span class="num">${d.points}</span> <span class="of">pts</span></div>
    </div>`;
  });
  el.innerHTML = html;
}

/** For every pair name that appears in 2+ tournaments, its rank history across events.
    Ranked within each tournament's own group slice, so a group-stage pair's rank
    is "3rd of 10 in its group", never "3rd of 20" against pairs it never played. */
function returningPairs(tournaments) {
  const byName = new Map();
  tournaments.forEach(t => {
    groupSlices(t).forEach(slice => {
      const ranked = standingsByWins(slice.pairs);
      ranked.forEach((p, i) => {
        const rank = i + 1;
        if (!byName.has(p.name)) byName.set(p.name, []);
        byName.get(p.name).push({
          tournamentId: t.id, label: slice.label, rank, of: slice.pairs.length
        });
      });
    });
  });
  return [...byName.entries()]
    .filter(([, apps]) => apps.length >= 2)
    .map(([name, apps]) => ({ name, apps }));
}

/** Best-effort split of a pair name into two individual player names.
    Handles "A & B"; leaves anything without " & " as one atomic entry (e.g. a single nickname). */
function splitPairName(name) {
  if (name.includes(' & ')) return name.split(' & ').map(s => s.trim());
  return [name];
}

/** Aggregate individual player stats across every tournament. Ranked within each
    tournament's own group slice (see groupSlices) so group-stage results aren't
    compared against pairs that never played each other. */
function playerStats(tournaments) {
  const players = new Map();
  tournaments.forEach(t => {
    groupSlices(t).forEach(slice => {
      const ranked = standingsByWins(slice.pairs);
      ranked.forEach((p, i) => {
        const rank = i + 1;
        splitPairName(p.name).forEach(person => {
          if (!players.has(person)) {
            players.set(person, { name: person, entries: [] });
          }
          players.get(person).entries.push({
            tournamentId: t.id,
            tournamentLabel: slice.label,
            partner: splitPairName(p.name).filter(n => n !== person).join(', ') || null,
            wins: p.wins,
            gamesPerPair: t.gamesPerPair,
            rank,
            of: slice.pairs.length
          });
        });
      });
    });
  });
  return [...players.values()]
    .map(pl => {
      const totalWins = pl.entries.reduce((s, e) => s + e.wins, 0);
      const totalGames = pl.entries.reduce((s, e) => s + e.gamesPerPair, 0);
      const bestRank = Math.min(...pl.entries.map(e => e.rank));
      return { ...pl, totalWins, totalGames, winRate: totalGames ? totalWins / totalGames : 0, bestRank, appearances: pl.entries.length };
    })
    .sort((a, b) => b.appearances - a.appearances || b.winRate - a.winRate);
}

/** Aggregate stats per pair (not split into individuals) — how many tournaments
    a given partnership has played together, and their combined win rate. Used
    for "most stable partnership" style leaderboards. */
function pairStats(tournaments) {
  const pairs = new Map();
  tournaments.forEach(t => {
    t.pairs.forEach(p => {
      if (!pairs.has(p.name)) {
        pairs.set(p.name, { name: p.name, appearances: 0, wins: 0, games: 0 });
      }
      const d = pairs.get(p.name);
      d.appearances += 1;
      d.wins += p.wins;
      d.games += t.gamesPerPair;
    });
  });
  return [...pairs.values()]
    .map(d => ({ ...d, winRate: d.games ? d.wins / d.games : 0 }))
    .sort((a, b) => b.appearances - a.appearances || b.winRate - a.winRate);
}
