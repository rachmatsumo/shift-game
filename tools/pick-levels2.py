#!/usr/bin/env python3
"""Picks verified gen-levels2 candidates, orders them by difficulty and installs them into src/levels.js in the
non-boss slots (every level that is not a multiple of 5, and >= FIRST). Budgets are filled in later from the
solver's `min=` output (see tools/set-budgets.py).
Usage: pick-levels2.py GENDIR [FIRST=21] [LAST=44]"""
import sys, re, json, os
d = sys.argv[1]; first = int(sys.argv[2]) if len(sys.argv) > 2 else 21; last = int(sys.argv[3]) if len(sys.argv) > 3 else 44
slots = [n for n in range(first, last + 1) if n % 5]
NAMES = ["Borrowed Time", "Gold Rush", "Sawmill", "Lights Out", "Pendulum", "Dusk Gate", "Cross Current", "Night Shift", "Sunburn",
         "Edge Walk", "Quick Hands", "Slow Burn", "Blade Runner", "Twin Blades", "Deep Night", "Daybreak", "Clockwork",
         "Whirlwind", "Moon Phase", "Ferry Tale", "Steel Rain", "Shadow Step", "Rail Rider", "Last Light", "Eclipse Run"]
meta = {m["id"]: m for m in json.load(open(f"{d}/meta.json"))}
res = {}
for j in range(8):
    p = f"{d}/r{j}.txt"
    if not os.path.exists(p): continue
    for line in open(p):
        m = re.match(r"PASS\s+(\S+)\s+~([\d.]+)s, (\d+) shifts .*?, (\d+) nodes", line)
        if m: res[m.group(1)] = (float(m.group(2)), int(m.group(3)), int(m.group(4)))
good = [meta[i] for i in res]
def score(m):
    secs, sh, nodes = res[m["id"]]
    return m["tier"] * 8 + sh * 3 + min(nodes, 4000) / 400 + secs * 1.2 + (14 if m["W"] == 40 else 0)
good.sort(key=score)
# spread picks across the whole difficulty range; avoid reusing identical segment sequences
pick, seen = [], set()
step = max(1.0, len(good) / len(slots))
for i in range(len(slots)):
    for k in range(int(i * step), len(good)):
        m = good[k]; key = tuple(m["kinds"])
        if key not in seen: seen.add(key); pick.append(m); break
sys.stderr.write("%d verified; picked %d for %d slots\n" % (len(good), len(pick), len(slots)))
pick.sort(key=score)
entries = {}
for n, m in zip(slots, pick):
    nm = "%d. %s" % (n, NAMES[(n - first) % len(NAMES)])
    entries[n] = '  {\n    name: "%s",\n    hint: "%s",\n    map: [\n%s\n    ],\n  },\n' % (nm, m["hint"], "\n".join('      "%s",' % r for r in m["rows"]))
json.dump(entries, open(f"{d}/picked.json", "w"))
print(json.dumps({"slots": slots, "picked": [m["id"] for m in pick]}))
