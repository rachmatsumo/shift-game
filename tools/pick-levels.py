#!/usr/bin/env python3
"""Reads solver results (r0..r7.txt) + meta.json from a gen dir, keeps verified candidates,
orders them by difficulty and prints JS level entries with budgets (= shifts found + slack).
Usage: pick-levels.py GENDIR START_NUMBER COUNT [NAMES_FILE] > levels_block.js"""
import sys, json, re, os
sys.path.insert(0, os.path.dirname(__file__))
from importlib.machinery import SourceFileLoader
G = SourceFileLoader("gen", os.path.join(os.path.dirname(__file__), "gen-levels.py")).load_module()

d, start, count = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
names = open(sys.argv[4]).read().split("\n") if len(sys.argv) > 4 else []
meta = json.load(open(f"{d}/meta.json"))
res = {}
for c in range(8):
    p = f"{d}/r{c}.txt"
    if not os.path.exists(p): continue
    for line in open(p):
        m = re.match(r"PASS\s+(\S+)\s+~([\d.]+)s, (\d+) shifts .*?, (\d+) nodes", line)
        if m: res[m.group(1)] = (float(m.group(2)), int(m.group(3)), int(m.group(4)))
good = [m for m in meta if m["id"] in res]
def score(m):
    secs, shifts, nodes = res[m["id"]]
    return m["tier"] * 10 + shifts * 2 + min(nodes, 5000) / 500 + len(m["kinds"]) * 6
good.sort(key=score)
# Moving obstacles are introduced first, one at a time, then pairs ramp up by score.
INTRO = ["ferry", "sawFloor", "sawV", "gapN", "sawGap", "sawV2", "spikesA", "stones"]
by = {m["kinds"][0]: m for m in good if len(m["kinds"]) == 1}
intro = [by[k] for k in INTRO if k in by][:max(4, count // 3)]
pairs = [m for m in good if len(m["kinds"]) == 2 and any(k.startswith(("saw", "ferry")) for k in m["kinds"])]
rest = count - len(intro)
step = max(1, len(pairs) / max(1, rest))
pick = intro + sorted([pairs[int(i * step)] for i in range(min(rest, len(pairs)))], key=score)
sys.stderr.write(f"{len(good)} verified of {len(meta)}; picking {len(pick)}\n")
out = ""
for i, m in enumerate(pick):
    secs, shifts, nodes = res[m["id"]]
    ops, hint, tier = G.make(m["kinds"])
    nm = names[i] if i < len(names) and names[i] else " + ".join(m["kinds"])
    text, rows = G.build(f"{start+i}. " + nm, hint, (shifts + 3 if shifts else None), ops)
    out += text
print(out, end="")
