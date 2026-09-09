#!/usr/bin/env python3
"""Transform badminton db/tournaments.json (anonymized, real club export) into
this site's per-tournament JSON schema, with fictional Estonian names assigned
to each anonymized player id (P001..P108) — portfolio-display placeholders,
not real people. Also computes wins/points totals and preserves real per-round
match data. Grouped tournaments (two simultaneous groups) keep a "group" tag
per pair so the site can rank each group separately, per the source data's own
warning that groups must never be mixed into one standings table.
"""
import json, calendar
from pathlib import Path
from collections import defaultdict

SRC = Path("/Users/natasha/Documents/Badminton Clash of Rackets/badminton db/tournaments.json")
OUT_DIR = Path("/Users/natasha/Documents/Badminton Clash of Rackets/data/tournaments")

# --- Fictional Estonian name pool: unique (first, last) per player id. ---
FIRST = [
    "Kadri","Toomas","Liis","Andres","Marta","Priit","Anu","Rein","Piret","Margus",
    "Kersti","Indrek","Merike","Tarmo","Kaja","Urmas","Reet","Peeter","Anneli","Ants",
    "Katrin","Aivar","Merle","Erki","Signe","Kristjan","Triin","Madis","Karin","Taavi",
    "Maarja","Karl","Eva","Meelis","Liina","Raivo","Helena","Jaanus","Kristi","Marko",
    "Ave","Rasmus","Ene","Sander","Inga","Siim","Kaisa","Villem","Terje","Henn",
    "Age","Lembit","Elle","Vello","Malle","Arvo","Astrid","Hans","Helle","Oskar",
    "Ingrid","Rain","Kai","Rauno","Made","Risto","Silvi","Tanel","Ülle","Uku",
    "Viivi","Valter","Aime","Jaan","Külli","Mart","Reili","Kalev","Airi","Meelike",
    "Hannes","Marju","Toivo","Kadi","Ivar","Laine","Kaido","Riina","Mihkel","Ester",
    "Enno","Külliki","Rando","Krista","Toivi","Anni","Argo","Tiiu","Aare","Marika",
    "Väino","Sirje","Enn","Reelika","Meelis","Aire","Georg","Külvi",
]
LAST = [
    "Tamm","Saar","Sepp","Mägi","Kask","Kuusk","Rebane","Pärn","Ilves","Lepik",
    "Koppel","Vaher","Metsalu","Oja","Talvik","Raudsepp","Kivi","Karu","Laur","Mets",
    "Aas","Kallas","Nurm","Org","Pärnoja","Roos","Sild","Toom","Uibo","Vares",
    "Allik","Kotkas","Lind","Mänd","Nõmm","Pikk","Randmaa","Soo","Tuisk","Väli",
    "Kütt","Post","Kruus","Laine","Meri","Ots","Paju","Raid","Sepik","Türk",
    "Uus","Ader","Erm","Haav","Jõe","Kadak","Loik","Mumm","Niit","Pill",
    "Ranne","Tera","Udu","Veski","Ait","Kera","Loo","Naaris","Piir","Raud",
    "Suvi","Toht","Uni","Vaike","Küla","Loot","Naar","Poder","Raske","Suur",
    "Tõru","Vall","Loog","Marss","Pold","Rand","Süld","Toomik","Väär","Lume",
    "Merd","Piht","Rauk","Solg","Tuum","Ust","Haan","Ilm","Jaak","Kald",
]

def build_name_map(players):
    ids = [p["id"] for p in players]
    assert len(ids) == len(set(ids))
    used = set()
    mapping = {}
    fi = li = 0
    for pid in ids:
        # advance deterministically through both pools so pairs don't repeat
        while True:
            first = FIRST[fi % len(FIRST)]
            last = LAST[li % len(LAST)]
            fi += 1
            if fi % len(FIRST) == 0:
                li += 1
            li += 1
            name = f"{first} {last}"
            if name not in used:
                used.add(name)
                break
        mapping[pid] = name
    assert len(set(mapping.values())) == len(mapping), "duplicate fictional name generated"
    return mapping

def label_for(date_str):
    y, m, d = date_str.split("-")
    return f"{calendar.month_name[int(m)]} {int(d)}"

def main():
    data = json.loads(SRC.read_text())
    name_of = build_name_map(data["players"])

    manifest_ids = []
    all_pair_name_check = defaultdict(int)

    for t in data["tournaments"]:
        # assign sequential int ids to pairs, in the order tournaments.json lists them
        pair_int_id = {}
        pairs_out = []
        for i, p in enumerate(t["pairs"], start=1):
            pair_int_id[p["id"]] = i
            p1, p2 = p["players"]
            display_name = f"{name_of[p1]} & {name_of[p2]}"
            all_pair_name_check[display_name] += 1
            pairs_out.append({
                "id": i,
                "name": display_name,
                "wins": 0,
                "points": 0,
                "group": p["group"],  # "A" / "B" / null
            })

        by_id = {p["id"]: p for p in pairs_out}
        rounds_map = defaultdict(list)
        for m in t["matches"]:
            a, b = pair_int_id[m["pair_a"]], pair_int_id[m["pair_b"]]
            sa, sb = m["score_a"], m["score_b"]
            by_id[a]["points"] += sa
            by_id[b]["points"] += sb
            if sa > sb:
                by_id[a]["wins"] += 1
            elif sb > sa:
                by_id[b]["wins"] += 1
            rounds_map[m["round"]].append({
                "court": m["court"], "teamA": a, "teamB": b,
                "scoreA": sa, "scoreB": sb,
            })

        rounds_out = [
            {"round": r, "matches": rounds_map[r]}
            for r in sorted(rounds_map)
        ]

        has_groups = any(p["group"] for p in pairs_out)

        out = {
            "id": t["date"],
            "label": label_for(t["date"]),
            "date": t["date"],
            "venue": t["venue"],
            "gamesPerPair": t["rounds"],
            "pointsCap": t["point_cap"],
            "groups": sorted({p["group"] for p in pairs_out if p["group"]}) or None,
            "pairs": pairs_out,
            "rounds": rounds_out,
            "source": (
                "Adapted from an anonymized export of the Aliris badminton club "
                "(Tallinn); player names are fictional placeholders assigned for "
                "portfolio display, not real people — see the case study for how "
                "this dataset was built."
            ),
        }

        out_path = OUT_DIR / f"{t['date']}.json"
        out_path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
        manifest_ids.append(t["date"])
        print("wrote", out_path, "pairs:", len(pairs_out), "matches:", len(t["matches"]), "groups:", out["groups"])

    manifest_ids.sort()
    manifest_path = Path("/Users/natasha/Documents/Badminton Clash of Rackets/data/manifest.json")
    manifest_path.write_text(json.dumps({"tournaments": manifest_ids}, indent=2) + "\n")
    print("wrote manifest with", len(manifest_ids), "ids")

    dupe_pairs = {k: v for k, v in all_pair_name_check.items() if v > 1}
    print("duplicate pair display names across the whole dataset:", len(dupe_pairs))
    if dupe_pairs:
        for k, v in list(dupe_pairs.items())[:10]:
            print("  ", k, v)

    # save the mapping for reference / potential reuse, not published on the site
    Path("/private/tmp/claude-501/-Users-natasha-Documents-PetLaundryProject/4abe7581-6b59-4e57-9f51-71655599ad49/scratchpad/name_map.json").write_text(
        json.dumps(name_of, indent=2, ensure_ascii=False)
    )

if __name__ == "__main__":
    main()
