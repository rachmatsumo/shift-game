#!/usr/bin/env python3
"""Candidate generator v2: longer levels (20 or 40 columns) with MANDATORY shifts.
A lunar shard ('2', collectable at NIGHT only) and/or a solar shard ('1', DAY only) is placed mid-air
in the segments, and the portal stays sealed until all shards are taken, so every level needs >= 1 shift.
tools/verify-levels.js (noshift=OK) double-checks that. Writes c0..c7.js + meta.json.
Usage: gen-levels2.py OUTDIR [seed] [count]"""
import sys, random, json, os
from importlib.machinery import SourceFileLoader
G = SourceFileLoader("gen", os.path.join(os.path.dirname(os.path.abspath(__file__)), "gen-levels.py")).load_module()
SEG = G.SEG

def paint(W, ops):
    g = [list("#" + "." * (W - 2) + "#") for _ in range(11)]
    g[0] = list("#" * W); g[10] = list("#" * W)
    for c in range(1, W - 1): g[9][c] = '#'
    for ch, r, c0, c1 in ops:
        for c in range(c0, c1 + 1): g[r][c] = ch
    return g

def make(kinds, W, rnd):
    xs = [3, 10] if W == 20 else [3, 10, 17, 24, 31]
    ops = []; tier = 0
    for k, x in zip(kinds, xs):
        t, h, f = SEG[k]; ops += f(x); tier += t
    g = paint(W, ops)
    g[8][1] = 'P'; g[8][W - 2] = 'G'
    # shard hosts: lunar shard first, solar shard in a later segment (long levels only, usually)
    n = len(kinds); order = list(range(n))
    want = ['2'] if W == 20 else (['2', '1'] if rnd.random() < .75 else ['2', '2'] if rnd.random() < .3 else ['2'])
    hosts = sorted(rnd.sample(order, len(want)))
    placed = []
    for kind, hi in zip(want, hosts):
        x = xs[hi]
        cells = [(r, c) for r in range(3, 8) for c in range(x + 1, x + 6) if g[r][c] == '.']
        if not cells: return None
        r, c = rnd.choice(cells); g[r][c] = kind; placed.append((kind, r, c))
    best = max(range(n), key=lambda i: (SEG[kinds[i]][0], i))
    rows = ["".join(r) for r in g]
    return rows, SEG[kinds[best]][1], tier

def text(name, hint, rows):
    return '  {\n    name: "%s",\n    hint: "%s",\n    map: [\n%s\n    ],\n  },\n' % (name, hint, "\n".join('      "%s",' % r for r in rows))

if __name__ == "__main__":
    out = sys.argv[1]; seed = int(sys.argv[2]) if len(sys.argv) > 2 else 1; count = int(sys.argv[3]) if len(sys.argv) > 3 else 400
    rnd = random.Random(seed); os.makedirs(out, exist_ok=True)
    names = list(SEG); meta = []; chunks = [[] for _ in range(8)]; seen = set()
    while len(meta) < count:
        W = 20 if rnd.random() < .3 else 40
        n = 2 if W == 20 else 5
        kinds = [rnd.choice(names)]
        while len(kinds) < n:
            k = rnd.choice(names)
            if k != kinds[-1]: kinds.append(k)
        m = make(kinds, W, rnd)
        if not m: continue
        rows, hint, tier = m
        key = "".join(rows)
        if key in seen: continue
        seen.add(key)
        i = len(meta); cid = "g%d" % i
        chunks[i % 8].append(text(cid, hint, rows))
        meta.append({"id": cid, "kinds": kinds, "tier": tier, "hint": hint, "rows": rows, "W": W})
    for i, c in enumerate(chunks): open(f"{out}/c{i}.js", "w").write("const LEVELS = [\n" + "".join(c) + "];\n")
    json.dump(meta, open(f"{out}/meta.json", "w"))
    print(len(meta), "candidates")
