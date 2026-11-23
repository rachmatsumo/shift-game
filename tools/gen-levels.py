#!/usr/bin/env python3
"""Candidate level generator. Builds levels from 7-column 'segments' and writes chunked
JS files for tools/verify-levels.js (LEVELS_FILE=...). Selection happens in tools/pick-levels.py.
Usage: gen-levels.py OUTDIR [seed] [pairs]"""
import sys, random, json, os
sys.path.insert(0, os.path.dirname(__file__))

def solid(r0,r1,c0,c1,ch="#"): return [(ch,r,c0,c1) for r in range(r0,r1+1)]
def pit(c0,c1): return [('.',9,c0,c1),('S',10,c0,c1)]

# each segment: (name, tier, hint, fn(x)->ops). x = first column; x and x+6 stay solid floor.
SEG = {}
def seg(name, tier, hint):
    def deco(f): SEG[name]=(tier,hint,f); return f
    return deco

@seg("gapD",1,"Mind the gap")
def _(x): return pit(x+2,x+4)
@seg("gapN",2,"Night gravity jumps farther")
def _(x): return pit(x+1,x+5)
@seg("ferry",2,"Ride the moving platform")
def _(x): return pit(x+1,x+5)+[('h',9,x+1,x+5)]
@seg("ferryH",2,"Ride the moving platform")
def _(x): return pit(x+1,x+5)+[('H',9,x+1,x+5)]
@seg("sawFloor",2,"Saws are deadly. Time your jump")
def _(x): return [('k',8,x+1,x+5)]
@seg("sawFloorK",2,"Saws are deadly. Time your jump")
def _(x): return [('K',8,x+1,x+5)]
@seg("sawV",2,"Slip past when the saw is high")
def _(x): return [('v',r,x+3,x+3) for r in range(3,9)]
@seg("sawV2",3,"Two saws, opposite rhythm")
def _(x): return [('v',r,x+2,x+2) for r in range(4,9)]+[('V',r,x+4,x+4) for r in range(4,9)]
@seg("sawGap",3,"Saw over the gap")
def _(x): return pit(x+2,x+4)+[('k',7,x+1,x+5)]
@seg("spikesA",2,"Orange spikes: night is safe")
def _(x): return solid(1,7,x+1,x+5)+[('a',8,x+2,x+4)]
@seg("spikesB",2,"Orange spikes: day is safe")
def _(x): return solid(1,7,x+1,x+5)+[('b',8,x+2,x+4)]
@seg("wallD",1,"Gold walls vanish at night")
def _(x): return solid(3,8,x+3,x+3,'D')
@seg("wallN",1,"Teal walls vanish by day")
def _(x): return solid(3,8,x+3,x+3,'N')
@seg("rail",3,"Shift slides the purple block")
def _(x): return pit(x+1,x+5)+[('M',9,x+1,x+1),('m',9,x+2,x+5)]
@seg("stones",2,"Shift in mid-air")
def _(x): return pit(x+1,x+5)+[('D',9,x+1,x+1),('N',9,x+3,x+3),('D',9,x+5,x+5)]
@seg("sawWall",3,"Wait for the world, then the saw")
def _(x): return solid(3,8,x+2,x+2,'D')+[('k',8,x+3,x+5)]
@seg("ferryWall",3,"Platform, then a wall")
def _(x): return pit(x+1,x+5)+[('h',9,x+1,x+5)]+solid(3,8,x+6,x+6,'N')

def build(name,hint,budget,ops):
    g=[list("#"+"."*18+"#") for _ in range(11)]
    g[0]=list("#"*20); g[10]=list("#"*20)
    for c in range(1,19): g[9][c]='#'
    for ch,r,c0,c1 in ops:
        for c in range(c0,c1+1): g[r][c]=ch
    g[8][1]='P'; g[8][18]='G'
    rows=["".join(r) for r in g]; assert all(len(r)==20 for r in rows), rows
    b="" if budget is None else f"    budget: {budget},\n"
    return '  {\n    name: "%s",\n    hint: "%s",\n%s    map: [\n%s\n    ],\n  },\n'%(name,hint,b,"\n".join('      "%s",'%r for r in rows)), rows

def make(kinds):
    ops=[]; hints=[]; tier=0
    xs=[6] if len(kinds)==1 else [3,10]
    for k,x in zip(kinds,xs):
        t,h,f=SEG[k]; ops+=f(x); hints.append(h); tier+=t
    best=max(range(len(kinds)), key=lambda i:(SEG[kinds[i]][0], i))
    return ops, hints[best], tier

if __name__=="__main__":
    out=sys.argv[1]; seed=int(sys.argv[2]) if len(sys.argv)>2 else 1; npairs=int(sys.argv[3]) if len(sys.argv)>3 else 120
    random.seed(seed); os.makedirs(out,exist_ok=True)
    names=list(SEG); combos=[(n,) for n in names]
    pairs=[(a,b) for a in names for b in names if a!=b]; random.shuffle(pairs); combos+=pairs[:npairs]
    meta=[]; chunks=[[] for _ in range(8)]
    for i,kinds in enumerate(combos):
        ops,hint,tier=make(kinds)
        text,rows=build("+".join(kinds),hint,12,ops)
        chunks[i%8].append(text); meta.append({"id":"+".join(kinds),"kinds":kinds,"tier":tier,"hint":hint,"rows":rows,"chunk":i%8,"idx":len(chunks[i%8])})
    for i,c in enumerate(chunks): open(f"{out}/c{i}.js","w").write("const LEVELS = [\n"+"".join(c)+"];\n")
    json.dump(meta,open(f"{out}/meta.json","w"))
    print(len(combos),"candidates")
