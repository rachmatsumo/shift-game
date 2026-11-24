#!/usr/bin/env python3
"""Replaces whole level entries in src/levels.js by number. Usage: install-levels.py picked.json [levels.js]"""
import sys, re, json
entries = {int(k): v for k, v in json.load(open(sys.argv[1])).items()}
path = sys.argv[2] if len(sys.argv) > 2 else "src/levels.js"
s = open(path).read()
head = s[:s.index("const LEVELS = [") + len("const LEVELS = [\n")]
body = s[len(head):s.rindex("];")]
blocks = re.findall(r"  \{\n.*?\n  \},\n", body, re.S)
assert len(blocks) == 50, len(blocks)
for n, text in entries.items(): blocks[n - 1] = text
open(path, "w").write(head + "".join(blocks) + "];\n")
print("replaced", sorted(entries))
