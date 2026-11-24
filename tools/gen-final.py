#!/usr/bin/env python3
"""Candidates for level 50 (the final boss): a 150-column gauntlet of 20 mixed obstacle segments, 4 mandatory
shards (lunar/solar alternating) and a raging, accelerating boss. Solve with:
  for j in 0..7: FAST=1 LEVELS_FILE=OUT/c$j.js TIME_LIMIT_MS=40000 node tools/verify-levels.js > OUT/r$j.txt
Then: gen-final.py OUT --pick   -> prints the hardest verified candidate as a JS level entry.
Usage: gen-final.py OUT [seed] [count] | gen-final.py OUT --pick"""
import sys, os, re, json, random
from importlib.machinery import SourceFileLoader
D = os.path.dirname(os.path.abspath(__file__))
G2 = SourceFileLoader("gen2", os.path.join(D, "gen-levels2.py")).load_module()
SEG = G2.SEG
W = 150; XS = [3 + 7 * k for k in range(20)]
POOL = [k for k, v in SEG.items() if v[0] >= 2]

def make(rnd):
    kinds = [rnd.choice(POOL)]
    while len(kinds) < 20:
        k = rnd.choice(POOL)
        if k != kinds[-1] and kinds.count(k) < 3: kinds.append(k)
    ops = []
    for k, x in zip(kinds, XS): ops += SEG[k][2](x)
    g = G2.paint(W, ops); g[8][1] = 'P'; g[8][W - 2] = 'G'
    for kind, hi in zip("2121", (3, 8, 13, 18)):  # one shard per act, alternating world
        x = XS[hi]; cells = [(r, c) for r in range(3, 8) for c in range(x + 1, x + 6) if g[r][c] == '.']
        if not cells: return None
        r, c = rnd.choice(cells); g[r][c] = kind
    return kinds, ["".join(r) for r in g]

def entry(name, rows):
    return ('  {\n    name: "%s",\n    hint: "THE FINAL GAUNTLET! The Primordial Shadow rages and accelerates. Gather all 4 Shards and reach the Portal!",\n'
            '    boss: true,\n    bossName: "THE PRIMORDIAL SHADOW",\n    bossSpeed: 46,\n    bossRage: 1,\n    bossRamp: 0.55,\n    map: [\n%s\n    ],\n  },\n'
            % (name, "\n".join('      "%s",' % r for r in rows)))

if __name__ == "__main__":
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    if "--pick" in sys.argv:
        meta = json.load(open(f"{out}/meta.json")); best = None
        for j in range(8):
            p = f"{out}/r{j}.txt"
            if not os.path.exists(p): continue
            for line in open(p):
                m = re.match(r"PASS\s+(\S+)\s+~([\d.]+)s, (\d+) shifts", line)
                if m:
                    sc = float(m.group(2)) + 1.5 * int(m.group(3))
                    if best is None or sc > best[0]: best = (sc, m.group(1))
        if not best: sys.exit("no verified candidate")
        sys.stderr.write("picked %s (score %.1f)\n" % (best[1], best[0]))
        print(entry("50. BOSS: The Primordial Shadow", meta[best[1]]), end="")
    else:
        seed = int(sys.argv[2]) if len(sys.argv) > 2 else 1; count = int(sys.argv[3]) if len(sys.argv) > 3 else 64
        rnd = random.Random(seed); meta = {}; chunks = [[] for _ in range(8)]; i = 0
        while len(meta) < count:
            m = make(rnd)
            if not m: continue
            cid = "f%d" % i; i += 1; meta[cid] = m[1]; chunks[len(meta) % 8].append(entry(cid, m[1]))
        for j, c in enumerate(chunks): open(f"{out}/c{j}.js", "w").write("const LEVELS = [\n" + "".join(c) + "];\n")
        json.dump(meta, open(f"{out}/meta.json", "w")); print(len(meta), "candidates")
