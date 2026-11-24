#!/usr/bin/env python3
"""Makes shifting mandatory in a level: turns one '*' shard into a lunar shard '2' (night only) and tries nearby cells.
  shardify.py gen OUTDIR N [N ...]     writes candidate chunk files (c0..c7.js) + meta.json
  (run verify-levels.js on each chunk with FAST=1 into OUTDIR/r$j.txt)
  shardify.py apply OUTDIR             installs the hardest verified candidate for each level into src/levels.js"""
import sys, re, json, os
mode, out = sys.argv[1], sys.argv[2]
src = open("src/levels.js").read()
blocks = re.findall(r"  \{\n.*?\n  \},\n", src[src.index("const LEVELS = [") :], re.S)
def rows_of(b): return re.findall(r'^      "(.*)",$', b, re.M)
if mode == "gen":
    os.makedirs(out, exist_ok=True); meta = {}; chunks = [[] for _ in range(8)]
    for n in map(int, sys.argv[3:]):
        b = blocks[n - 1]; rows = rows_of(b)
        cells = [(r, c) for r, row in enumerate(rows) for c, ch in enumerate(row) if ch == '*']
        r0, c0 = cells[0]
        for dr in range(-3, 4):
            for dc in range(-3, 4):
                r, c = r0 + dr, c0 + dc
                if not (1 <= r < len(rows) - 2 and 1 <= c < len(rows[0]) - 1): continue
                if rows[r][c] not in ".*": continue
                if (dr or dc) and rows[r][c] != '.': continue
                g = [list(x) for x in rows]; g[r0][c0] = '.'; g[r][c] = '2'
                nr = ["".join(x) for x in g]; cid = "n%d_%d_%d" % (n, dr, dc)
                meta[cid] = {"n": n, "rows": nr}
                nb = re.sub(r'name: ".*?"', 'name: "%s"' % cid, b, 1)
                nb = re.sub(r'(    map: \[\n)(?:      ".*",\n)+', lambda m: m.group(1) + "".join('      "%s",\n' % x for x in nr), nb, 1, flags=re.S)
                nb = re.sub(r"    budget: \d+,\n", "", nb)
                chunks[len(meta) % 8].append(nb)
    for j, ch in enumerate(chunks): open(f"{out}/c{j}.js", "w").write("const LEVELS = [\n" + "".join(ch) + "];\n")
    json.dump(meta, open(f"{out}/meta.json", "w")); print(len(meta), "candidates")
else:
    meta = json.load(open(f"{out}/meta.json")); best = {}
    for j in range(8):
        p = f"{out}/r{j}.txt"
        if not os.path.exists(p): continue
        for line in open(p):
            m = re.match(r"PASS\s+(\S+)\s+~([\d.]+)s, (\d+) shifts", line)
            if m:
                n = meta[m.group(1)]["n"]; sc = float(m.group(2)) + 2 * int(m.group(3))
                if n not in best or sc > best[n][0]: best[n] = (sc, m.group(1))
    for n, (sc, cid) in sorted(best.items()):
        b = blocks[n - 1]; rows = meta[cid]["rows"]
        nb = re.sub(r'(    map: \[\n)(?:      ".*",\n)+', lambda m: m.group(1) + "".join('      "%s",\n' % x for x in rows), b, 1, flags=re.S)
        src = src.replace(b, nb); print("level", n, "->", cid, "score %.1f" % sc)
    open("src/levels.js", "w").write(src)
