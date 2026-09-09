# Aliris badminton club — game results

An anonymised export of every finished tournament of the club, 2026-05-02 … 2026-09-05.
Shared so that others can experiment with tournament software on real data.

* tournaments: **19**
* matches: **1485**
* pairs: **270**
* players: **108**

## No names

Player identifiers are `P001`, `P002`, … and pair identifiers are
`T01-05` (tournament + seed number). They are **stable inside this export**, so
ratings, pairings and per-player history can be reconstructed in full. They carry
no personal data, and no name-to-number table is included: the names belong to
the people, not to the club's database.

## Files

**`matches.csv`** — one row per match. Columns:

| column | meaning |
|---|---|
| `tournament` | `T01` … `T19`, ordered by date |
| `date`, `venue`, `club` | when and where |
| `group` | `A` / `B` when the club played in two groups, empty otherwise |
| `round` | round number inside the tournament, 1-based |
| `cycle` | 1 for the first full circle, 2 for the second (see below) |
| `court` | court name, `C1` … `C10` |
| `point_cap` | points the winner normally reaches in this tournament |
| `pair_a`, `pair_b` | the two pairs |
| `pair_a_p1` … `pair_b_p2` | the four players |
| `score_a`, `score_b` | the result |

**`tournaments.json`** — the same data in linked form: each tournament with its
settings, its pairs and its matches. Use this if you want to reproduce the
schedule generator or a rating.

## Three things that will surprise you

1. **Rounds are 11, not N−1.** A full round-robin of 12 pairs is 11 rounds, but
   the club plays 11 rounds whatever the field size — so with 8 pairs some pairs
   meet **twice**. That is deliberate, not a data error; the `cycle` column says
   which circle a match belongs to.
2. **The winner does not always reach the point cap.** Every tournament here is played to 18, but **5
   of 1485 matches** end below it — 6:17 and 11:12 are real results. Games were
   sometimes stopped early. So read `point_cap` from the data and normalise by it;
   do not infer the winner from "whoever has 18".
3. **4 tournaments were played in two groups at once** — twelve pairs on courts
   C1–C6 and eight on C7–C10, simultaneously. Groups never play each other, and
   each has its own standings table. Filter by `group` before computing anything
   per tournament.

## Standings, as the club computes them

Two tables, and their orders differ — that is a feature the club has used for
years:

* **by wins**: wins → total points → head-to-head → shared place;
* **by points**: points → wins → head-to-head → shared place.

Point difference is not used at all.

Read the last two steps carefully, because they are easy to get wrong. When two
pairs are level on the first two keys, their **head-to-head** decides: first by
wins between them, then by points between them. If that separates them, they
take **different places** — 3rd and 4th, not 3rd and 3rd. Only when the
head-to-head is level as well do they **share** a place. With two circles a pair
can meet twice, and 1–1 does not separate.

This file was checked against exactly that rule: all **23 standings tables**
(19 tournaments, four of which have two groups) were rebuilt from `matches.csv`
alone and matched the club's own tables in all 270 rows — place, wins, points
and shared places.

## Licence

Do what you like with it. There is no personal data here, and there are no
guarantees either: the scores were transcribed from handwritten sheets, and a
handful of cells were restored arithmetically where the paper was unreadable.
