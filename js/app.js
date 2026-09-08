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

/** Ranked standings for a tournament: sorted by wins desc, points desc as tiebreak. */
function standingsByWins(t) {
  return [...t.pairs].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return (b.points ?? -1) - (a.points ?? -1);
  });
}

/** Ranked standings by points, only meaningful when the tournament recorded points. */
function standingsByPoints(t) {
  return [...t.pairs]
    .filter(p => p.points != null)
    .sort((a, b) => b.points - a.points);
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

/** For every pair name that appears in 2+ tournaments, its rank history across events. */
function returningPairs(tournaments) {
  const byName = new Map();
  tournaments.forEach(t => {
    const ranked = standingsByWins(t);
    ranked.forEach((p, i) => {
      const rank = i + 1;
      if (!byName.has(p.name)) byName.set(p.name, []);
      byName.get(p.name).push({
        tournamentId: t.id, label: t.label, rank, of: t.pairs.length
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

/** Aggregate individual player stats across every tournament. */
function playerStats(tournaments) {
  const players = new Map();
  tournaments.forEach(t => {
    const ranked = standingsByWins(t);
    ranked.forEach((p, i) => {
      const rank = i + 1;
      splitPairName(p.name).forEach(person => {
        if (!players.has(person)) {
          players.set(person, { name: person, entries: [] });
        }
        players.get(person).entries.push({
          tournamentId: t.id,
          tournamentLabel: t.label,
          partner: splitPairName(p.name).filter(n => n !== person).join(', ') || null,
          wins: p.wins,
          gamesPerPair: t.gamesPerPair,
          rank,
          of: t.pairs.length
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
