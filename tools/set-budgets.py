#!/usr/bin/env python3
"""Sets tight shift budgets from verifier output lines ('PASS  23. Name ... | min=K noshift=OK').
budget = min + 2 for min <= 2 (forgiving early game), else min + 1. Levels with min=0 get no budget.
Usage: set-budgets.py verify_output.txt [levels.js]"""
import sys, re
out = open(sys.argv[1]).read(); path = sys.argv[2] if len(sys.argv) > 2 else "src/levels.js"
mins = {int(m.group(1)): int(m.group(2)) for m in re.finditer(r"^PASS\s+(\d+)\..*?\| min=(\d+)", out, re.M)}
s = open(path).read(); n = 0
def fix(m):
    global n
    num = int(m.group(1))
    if num not in mins or "boss: true" in m.group(0): return m.group(0)
    k = mins[num]; txt = re.sub(r"    budget: \d+,\n", "", m.group(0))
    if k >= 1:
        txt = txt.replace("    map: [", "    budget: %d,\n    map: [" % (k + (2 if k <= 2 else 1)), 1); n += 1
    return txt
s = re.sub(r'  \{\n    name: "(\d+)\..*?\n  \},\n', fix, s, flags=re.S)
open(path, "w").write(s); print("budgets set on", n, "levels")
