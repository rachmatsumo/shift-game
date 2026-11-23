#!/usr/bin/env node
// Headless solvability check: runs the REAL game code (src/*.js) in a vm with a stubbed
// canvas/audio, and searches for an input sequence that reaches the goal in every level.
// Usage: node tools/verify-levels.js [levelNumber ...]   (exit code 1 if any level fails)
const fs = require("fs"), path = require("path"), vm = require("vm");
const SRC = path.join(__dirname, "..", "src");
const TIME_LIMIT_MS = +process.env.TIME_LIMIT_MS || 45000, MAX_NODES = 1500000;

function boot() {
  const stub = () => new Proxy(function () {}, {
    get: (t, k) => k === "measureText" ? () => ({ width: 10 }) : k === "createLinearGradient" ? () => ({ addColorStop() {} }) : stub(),
    apply: () => stub(), set: () => true,
  });
  const T = {}, ctx = stub();
  const win = {
    __SHIFT_TEST__: T, document: { getElementById: () => ({ getContext: () => ctx }) },
    addEventListener() {}, requestAnimationFrame() {}, performance: { now: () => 0 },
    localStorage: { getItem: () => null, setItem() {} }, setInterval() {},
  };
  win.window = win; vm.createContext(win);
  for (const f of ["levels", "audio", "game"]) vm.runInContext(fs.readFileSync(f === "levels" && process.env.LEVELS_FILE ? process.env.LEVELS_FILE : path.join(SRC, f + ".js"), "utf8") + (f === "levels" ? "\nthis.LEVELS = LEVELS;" : ""), win);
  return { T, LEVELS: win.LEVELS };
}

// binary min-heap
class Heap {
  constructor() { this.a = []; }
  push(n) { const a = this.a; a.push(n); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p].f <= a[i].f) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
  pop() { const a = this.a, top = a[0], last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < a.length && a[l].f < a[m].f) m = l; if (r < a.length && a[r].f < a[m].f) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top; }
  get size() { return this.a.length; }
}

const ACTIONS = [];
for (const dir of [1, -1, 0]) for (const jump of [false, true]) for (const shift of [false, true]) ACTIONS.push({ dir, jump, shift, frames: 6 });

// Best-first search from snapshot s0. done(info, stepResult) decides success; target is the point to head for.
function search(T, s0, target, done, limitMs) {
  const [gx, gy] = target;
  const h = n => (Math.abs(n.x + 11 - gx) + 0.8 * Math.abs(n.y + 14 - gy)) / 32;
  const key = n => `${n.x / 8 | 0},${n.y / 8 | 0},${n.vy / 220 | 0},${n.ground ? 0 : (n.vx / 120 | 0)},${+n.ground},${n.world},${n.budget},${n.grid},${n.ride},${n.movers ? Math.round(n.mt * 2) : 0}`;
  T.restore(s0);
  const i0 = T.info(), heap = new Heap(), seen = new Set([key(i0)]);
  heap.push({ snap: s0, info: i0, f: h(i0), g: 0, sh: 0, parent: null, act: null });
  const t0 = Date.now(); let nodes = 0;
  while (heap.size && nodes < MAX_NODES && Date.now() - t0 < limitMs) {
    const n = heap.pop(); nodes++;
    for (const a of ACTIONS) {
      if (a.shift && n.info.budget <= 0) continue;
      T.restore(n.snap);
      const r = T.step(a);
      if (r.dead) continue;
      const inf = T.info();
      if (done(inf, r)) { const path = [a]; for (let p = n; p && p.act; p = p.parent) path.push(p.act); path.reverse(); return { ok: true, nodes, path, snap: T.snap() }; }
      const k = key(inf);
      if (seen.has(k)) continue; seen.add(k);
      const sh = n.sh + (a.shift ? 1 : 0);
      heap.push({ snap: T.snap(), info: inf, f: h(inf) + 0.01 * (n.g + 1) + 0.35 * sh, g: n.g + 1, sh, parent: n, act: a });
    }
  }
  return { ok: false, nodes, exhausted: heap.size === 0 };
}

// opts.budget overrides the level's shift budget; opts.limit scales the per-stage time limit.
function solve(T, LEVELS, i, opts = {}) {
  const TL = opts.limit || TIME_LIMIT_MS;
  T.start(i); if (opts.budget != null) T.setBudget(opts.budget);
  const lv = LEVELS[i].map; let goal = [0, 0]; const levers = [], shards = [];
  lv.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === "G") goal = [c * 32 + 16, r * 32 + 16];
    if (ch === "y") levers.push([c * 32 + 16, r * 32 + 16]);
    if (ch === "*" || ch === "1" || ch === "2") shards.push([c * 32 + 16, r * 32 + 16]);
  }));
  const staged = lv.some(row => row.includes("Z")) && levers.length > 0; // closed gate (Z): reach the lever first
  const t0 = Date.now(); let nodes = 0, path = [], s = T.snap();
  if (staged) {
    const r1 = search(T, s, levers[0], inf => inf.gate === false, TL / 2);
    nodes += r1.nodes; if (!r1.ok) return { ok: false, nodes, ms: Date.now() - t0, exhausted: r1.exhausted };
    path = r1.path; s = r1.snap;
  }
  for (let si = 0; si < shards.length; si++) {
    const rShard = search(T, s, shards[si], inf => inf.sc > si, TL / (shards.length + 1));
    nodes += rShard.nodes; if (!rShard.ok) return { ok: false, nodes, ms: Date.now() - t0, exhausted: rShard.exhausted };
    path = path.concat(rShard.path); s = rShard.snap;
  }
  const r = search(T, s, goal, (inf, st) => st.won, TL);
  nodes += r.nodes;
  if (!r.ok) return { ok: false, nodes, ms: Date.now() - t0, exhausted: r.exhausted };
  path = path.concat(r.path);
  if (process.env.TRACE) { T.start(i); if (opts.budget != null) T.setBudget(opts.budget); const tr = []; for (const x of path) { T.step(x); const f = T.info(); tr.push(`${x.dir > 0 ? ">" : x.dir < 0 ? "<" : "."}${x.jump ? "J" : ""}${x.shift ? "S" : ""}@${Math.round(f.x)},${Math.round(f.y)}${f.world ? "n" : "d"}`); } console.log("   " + tr.join(" ")); }
  return { ok: true, nodes, ms: Date.now() - t0, frames: path.reduce((a, x) => a + x.frames, 0), shifts: path.filter(x => x.shift).length };
}

// Anti-cheat / design checks (skip with FAST=1):
//  - noshift: the level must NOT be solvable with 0 shifts (otherwise the SHIFT mechanic is optional = bland/cheatable).
//    "OK" = proven unsolvable (search space exhausted), "?" = not found but search timed out, "CHEAT" = solvable w/o shifting.
//  - min: smallest shift budget under which the solver still finds a solution (used to set tight budgets).
const { T, LEVELS } = boot();
const want = process.argv.slice(2).map(Number), total = T.count(), FAST = !!process.env.FAST;
let failed = 0, cheat = 0;
for (let i = 0; i < total; i++) {
  if (want.length && !want.includes(i + 1)) continue;
  const r = solve(T, LEVELS, i), name = LEVELS[i].name;
  if (!r.ok) { failed++; console.log(`FAIL  ${name.padEnd(24)} no solution found (${r.nodes} nodes, ${r.ms}ms)`); continue; }
  let extra = "";
  if (!FAST) {
    const ns = solve(T, LEVELS, i, { budget: 0, limit: TIME_LIMIT_MS / 3 });
    const nsTxt = ns.ok ? "CHEAT" : ns.exhausted ? "OK" : "?";
    if (ns.ok) cheat++;
    let min = r.shifts;
    for (let b = r.shifts - 1; b >= 1; b--) { const m = solve(T, LEVELS, i, { budget: b, limit: TIME_LIMIT_MS / 3 }); if (!m.ok) break; min = b; }
    extra = ` | min=${min} noshift=${nsTxt}`;
  }
  console.log(`PASS  ${name.padEnd(24)} ~${(r.frames / 60).toFixed(1)}s, ${r.shifts} shifts (budget ${LEVELS[i].budget ?? "inf"}), ${r.nodes} nodes, ${r.ms}ms${extra}`);
}
console.log(failed ? `\n${failed} level(s) NOT verified` : `\nAll ${want.length || total} level(s) solvable`);
if (cheat) console.log(`${cheat} level(s) solvable WITHOUT shifting (shift is optional there)`);
process.exit(failed || cheat ? 1 : 0);
