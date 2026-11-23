#!/usr/bin/env python3
"""Level builder helper: paint rects on a 20x11 grid and emit JS level entries."""
def build(name, hint, budget, ops, frame=True):
    g=[list("#"+"."*18+"#") for _ in range(11)]
    g[0]=list("#"*20); g[10]=list("#"*20)
    for ch,r,c0,c1 in ops:
        for c in range(c0,c1+1): g[r][c]=ch
    rows=["".join(r) for r in g]
    assert all(len(r)==20 for r in rows)
    b="" if budget is None else f"    budget: {budget},\n"
    return '  {\n    name: "%s",\n    hint: "%s",\n%s    map: [\n%s\n    ],\n  },\n'%(name,hint,b,"\n".join('      "%s",'%r for r in rows))
