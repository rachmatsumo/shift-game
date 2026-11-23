(() => {
// Gravity differs per world: DAY is normal, NIGHT is low gravity (higher, floatier jumps).
const GRAV = [1800, 990], FALL = [900, 520];
const TILE = 32, COLS = 20, ROWS = 11, W = 640, H = 360, OFFY = 4;
const cv = document.getElementById("c"), ctx = cv.getContext("2d");
const A = Audio8;

// ---- Palettes: world 0 = DAY, world 1 = NIGHT
const PAL = [
  { sky: ["#74c0f0", "#dff4ff"], solid: "#3b2f4a", solidHi: "#5b4a72", mine: "#f4b942", mineDk: "#c98a1b", ghost: "rgba(0,0,0,.16)", ink: "#1b1530", player: "#d7263d", accent: "#f4b942", name: "DAY" },
  { sky: ["#0b0a2a", "#2a1f66"], solid: "#8e98f5", solidHi: "#c0c6ff", mine: "#4fe0c8", mineDk: "#1fa890", ghost: "rgba(255,255,255,.16)", ink: "#eef", player: "#ffd166", accent: "#4fe0c8", name: "NIGHT" },
];

// ---- Input
const keys = {}, pressed = {};
addEventListener("keydown", e => {
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
  if (!keys[e.code] && !e.repeat) pressed[e.code] = true;
  keys[e.code] = true; A.init();
});
addEventListener("keyup", e => { keys[e.code] = false; });
addEventListener("pointerdown", () => A.init());
addEventListener("blur", () => { for (const k in keys) keys[k] = false; if (state === "play") setState("pause"); });
const hit = (...c) => c.some(k => pressed[k]);
const down = (...c) => c.some(k => keys[k]);

// ---- Save
let save = { unlocked: 0, best: {} };
try { Object.assign(save, JSON.parse(localStorage.getItem("shift_save") || "{}")); } catch {}
save.unlocked = Math.max(0, Math.min(save.unlocked | 0, LEVELS.length - 1)); // guard against stale saves
const persist = () => { try { localStorage.setItem("shift_save", JSON.stringify(save)); } catch {} };

// ---- State
let state = "title"; // title | select | play | pause | win | end
let li = 0, world = 0, level, player, deaths = 0, levelDeaths = 0, time = 0, levelTime = 0, T = 0;
let flash = 0, shake = 0, msg = "", msgT = 0, banner = 0, fade = 0, cursor = 0, winStars = 0, winT = 0, newBest = false;
let movers = [], plats = [], moverT = 0, accT = 0, gateClosed = true, runs = [], budget = Infinity, slideAnim = {}, pOff = 0;
let shiftT = 0, prevWorld = 0, shiftX = 0, shiftY = 0, stepT = 0, titleT = 0, particles = [];
const showPlayer = () => state !== "title" && state !== "select";

function setState(s) { state = s; if (s === "pause") A.pause(true), A.duck(true); else A.duck(false); }
function setWorld(w) { world = w; A.setWorld(w); }

function load(i, intro = true) {
  li = i; level = LEVELS[i].map.map(r => r.split(""));
  runs = []; slideAnim = {}; pOff = 0; gateClosed = true; budget = LEVELS[i].budget ?? Infinity;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS;) {
    if (level[r][c] === "M" || level[r][c] === "m") { const c0 = c; while (c < COLS && (level[r][c] === "M" || level[r][c] === "m")) c++; runs.push({ r, c0, c1: c - 1, dir: 1 }); }
    else c++;
  }
  parseMovers();
  player = { x: 0, y: 0, w: 22, h: 28, vx: 0, vy: 0, ground: false, coyote: 0, buf: 0, face: 1, ride: -1 };
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++)
    if (level[r][c] === "P") { player.x = c * TILE + 5; player.y = r * TILE + TILE - player.h; }
  setWorld(0); shiftT = 0;
  if (intro) { banner = 2.6; levelDeaths = 0; levelTime = 0; fade = .5; }
}
// ---- Real-time movers (deterministic: positions are a pure function of moverT, which runs at
// half speed at NIGHT). k/K = saw on a horizontal track, v/V = saw on a vertical track,
// h/H = moving platform (horizontal), u/U = moving platform (vertical). A run of same-letter
// cells is the track; uppercase starts half a cycle later.
const MOVER_CH = "kKvVhHuU", MCYCLE = 4;
function parseMovers() {
  movers = []; moverT = 0;
  const seen = new Set();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const ch = level[r][c];
    if (!MOVER_CH.includes(ch) || seen.has(r * COLS + c)) continue;
    const horiz = "kKhH".includes(ch); let a = horiz ? c : r, b = a;
    while ((horiz ? b + 1 < COLS : b + 1 < ROWS) && level[horiz ? r : b + 1][horiz ? b + 1 : c] === ch) b++;
    for (let i = a; i <= b; i++) seen.add(horiz ? r * COLS + i : i * COLS + c);
    const kind = "kKvV".includes(ch) ? "saw" : "plat", n = b - a + 1;
    movers.push({ kind, horiz, a, b, fixed: horiz ? r : c, phase: ch === ch.toUpperCase() ? .5 : 0, period: (kind === "plat" ? n - (horiz ? 2 : 1) : n - 1) >= 3 ? 4 : 2 });
  }
}
function mpos(m, t) {
  const ph = ((t / m.period) + m.phase) % 1;
  const s = m.kind === "saw" ? (ph < .5 ? 2 * ph : 2 - 2 * ph) : .5 - .5 * Math.cos(2 * Math.PI * ph);
  const L = (x, y) => x + (y - x) * s;
  if (m.kind === "saw") return m.horiz ? { x: L(m.a * TILE + 16, m.b * TILE + 16), y: m.fixed * TILE + 16 } : { x: m.fixed * TILE + 16, y: L(m.a * TILE + 16, m.b * TILE + 16) };
  return m.horiz ? { x: L(m.a * TILE, (m.b - 1) * TILE), y: m.fixed * TILE } : { x: m.fixed * TILE - 16, y: L(m.a * TILE, m.b * TILE) };
}
function platRects(t) { return movers.filter(m => m.kind === "plat").map(m => { const q = mpos(m, t); return { x: q.x, y: q.y, w: 64, h: 12 }; }); }
function stepMovers(dt) {
  const before = platRects(moverT);
  moverT = (moverT + dt * (world ? .5 : 1)) % MCYCLE;
  plats = platRects(moverT); plats.forEach((q, i) => { q.px = before[i].x; q.py = before[i].y; });
}
function sawHit() {
  const p = player, x0 = p.x + 3, y0 = p.y + 3, x1 = p.x + p.w - 3, y1 = p.y + p.h - 3;
  for (const m of movers) if (m.kind === "saw") {
    const q = mpos(m, moverT), nx = Math.max(x0, Math.min(q.x, x1)), ny = Math.max(y0, Math.min(q.y, y1));
    if ((q.x - nx) ** 2 + (q.y - ny) ** 2 < 144) return true;
  }
  return false;
}
const tile = (c, r) => (r < 0 || r >= ROWS) ? "." : (c < 0 || c >= COLS) ? "#" : level[r][c];
const solidTile = (t, w) => t === "#" || t === "M" || (t === "Z" && gateClosed) || (t === "z" && !gateClosed) || (t === "D" && w === 0) || (t === "N" && w === 1);
function overlapsSolid(x, y, w, h, wd) {
  for (let r = Math.floor(y / TILE); r <= Math.floor((y + h - .01) / TILE); r++)
    for (let c = Math.floor(x / TILE); c <= Math.floor((x + w - .01) / TILE); c++)
      if (solidTile(tile(c, r), wd)) return true;
  return false;
}
// Hazards: S (floor spikes) and T (ceiling spikes) always; a = spikes in DAY only; b = spikes in NIGHT only.
function hurts(w, inset = 5) {
  const p = player;
  for (let r = Math.floor((p.y + inset) / TILE); r <= Math.floor((p.y + p.h - inset - .01) / TILE); r++)
    for (let c = Math.floor((p.x + inset) / TILE); c <= Math.floor((p.x + p.w - inset - .01) / TILE); c++) {
      const t = tile(c, r);
      if (t === "S" || t === "T" || (t === "a" && w === 0) || (t === "b" && w === 1)) return true;
    }
  return false;
}
function toggleGate() {
  gateClosed = !gateClosed;
  if (gateClosed && overlapsSolid(player.x, player.y, player.w, player.h, world)) { gateClosed = false; say("Something is in the way"); return; }
  A.lever(); flash = .08; say(gateClosed ? "Gate closed" : "Gate open!");
}
function touches(ch, inset = 0) {
  const p = player;
  for (let r = Math.floor((p.y + inset) / TILE); r <= Math.floor((p.y + p.h - inset - .01) / TILE); r++)
    for (let c = Math.floor((p.x + inset) / TILE); c <= Math.floor((p.x + p.w - inset - .01) / TILE); c++)
      if (tile(c, r) === ch) return true;
  return false;
}
const say = t => { msg = t; msgT = 1.6; };
function burst(x, y, col, n = 14, spread = 260) {
  for (let i = 0; i < n; i++) particles.push({ x, y, vx: (Math.random() - .5) * spread, vy: (Math.random() - .8) * spread, life: .6 + Math.random() * .4, col });
}
// R / pause-restart: retry the level without counting a death.
function restart() { A.back(); burst(player.x + 11, player.y + 14, PAL[world].mine, 10); load(li, false); fade = .2; }
function die() {
  A.die(); deaths++; levelDeaths++; shake = .3;
  burst(player.x + 11, player.y + 14, PAL[world].player, 26);
  load(li, false); fade = .25;
}
// Shift also SLIDES every rail of purple blocks one tile; blocks bounce at the rail ends.
// A player standing on a sliding block is carried along.
function slideRuns() {
  const p = player, footRow = Math.floor((p.y + p.h + 1) / TILE);
  const fc0 = Math.floor(p.x / TILE), fc1 = Math.floor((p.x + p.w - .01) / TILE);
  let carry = 0;
  for (const run of runs) {
    const cols = []; for (let c = run.c0; c <= run.c1; c++) if (level[run.r][c] === "M") cols.push(c);
    if (!cols.length) continue;
    const mn = cols[0], mx = cols[cols.length - 1];
    if (run.dir > 0 && mx >= run.c1) run.dir = -1; else if (run.dir < 0 && mn <= run.c0) run.dir = 1;
    if ((run.dir > 0 && mx >= run.c1) || (run.dir < 0 && mn <= run.c0)) continue;
    if (run.r === footRow && p.ground && cols.some(c => c >= fc0 && c <= fc1)) carry = run.dir * TILE;
    for (const c of run.dir > 0 ? cols.slice().reverse() : cols) {
      level[run.r][c + run.dir] = "M"; level[run.r][c] = "m"; slideAnim[run.r * COLS + c + run.dir] = -run.dir * TILE;
    }
  }
  return carry;
}
function doShift() {
  const p = player, nw = 1 - world;
  if (budget <= 0) { A.deny(); say("No shifts left! Press R to retry"); shake = .12; return; }
  const snap = level.map(r => r.slice()), dirs = runs.map(r => r.dir), px = p.x;
  const carry = slideRuns(); p.x += carry;
  const stuck = overlapsSolid(p.x, p.y, p.w, p.h, nw), spikes = !stuck && hurts(nw);
  if (stuck || spikes) {
    level = snap; runs.forEach((r, i) => r.dir = dirs[i]); p.x = px; slideAnim = {};
    A.deny(); say(stuck ? "Blocked! You'd be stuck inside a wall" : "Blocked! Spikes would appear on you"); shake = .12; return;
  }
  if (carry) { pOff = -carry; p.vx = 0; }
  budget--;
  prevWorld = world; shiftT = 1; shiftX = p.x + 11; shiftY = p.y + 14 + OFFY;
  setWorld(nw); flash = .12; A.shift(nw); burst(shiftX, shiftY - OFFY, PAL[nw].mine, 14);
}
function startLevel(i) { load(i); time = i === 0 ? 0 : time; setState("play"); }
function win() {
  A.win(); burst(player.x + 11, player.y + 14, "#ffd166", 36);
  winStars = levelDeaths === 0 ? 3 : levelDeaths <= 3 ? 2 : 1; winT = 0;
  const b = save.best[li]; newBest = !b || levelTime < b.time;
  if (!b || winStars > b.stars || levelTime < b.time) save.best[li] = { time: Math.min(levelTime, b ? b.time : 1e9), stars: Math.max(winStars, b ? b.stars : 0) };
  save.unlocked = Math.max(save.unlocked, Math.min(li + 1, LEVELS.length - 1)); persist();
  setState(li === LEVELS.length - 1 ? "end" : "win");
}

// ---- Update
function update(dt) {
  const p = player;
  time += dt; levelTime += dt;
  stepMovers(dt);
  if (hit("Escape", "KeyP")) { setState("pause"); return; }
  if (hit("ShiftLeft", "ShiftRight", "KeyE", "KeyK")) doShift();
  if (hit("KeyR")) { restart(); return; }

  const dir = (down("ArrowRight", "KeyD") ? 1 : 0) - (down("ArrowLeft", "KeyA") ? 1 : 0);
  if (dir) p.face = dir;
  const target = dir * 190, acc = p.ground ? 2200 : 1400;
  p.vx += Math.sign(target - p.vx) * Math.min(Math.abs(target - p.vx), acc * dt);
  p.coyote = p.ground ? .1 : p.coyote - dt;
  p.buf = hit("Space", "ArrowUp", "KeyW") ? .12 : p.buf - dt;
  if (p.buf > 0 && p.coyote > 0) { p.vy = -620; p.coyote = 0; p.buf = 0; p.pad = false; A.jump(); burst(p.x + 11, p.y + p.h, PAL[world].solidHi, 5, 120); }
  if (p.vy >= 0) p.pad = false;
  if (!p.pad && !down("Space", "ArrowUp", "KeyW") && p.vy < -200) p.vy += GRAV[world] * 1.8 * dt;
  p.vy = Math.min(p.vy + GRAV[world] * dt, FALL[world]);

  if (p.ride >= 0 && plats[p.ride]) { // carried by a moving platform
    const m = plats[p.ride], nx = p.x + (m.x - m.px);
    if (!overlapsSolid(nx, p.y, p.w, p.h, world)) p.x = nx;
    p.y = m.y - p.h;
  }
  p.ride = -1;
  const wasGround = p.ground, fallV = p.vy;
  p.x += p.vx * dt;
  if (overlapsSolid(p.x, p.y, p.w, p.h, world)) {
    p.x = p.vx > 0 ? Math.floor((p.x + p.w) / TILE) * TILE - p.w : (Math.floor(p.x / TILE) + 1) * TILE; p.vx = 0;
  }
  const oldBottom = p.y + p.h;
  p.y += p.vy * dt; p.ground = false;
  if (overlapsSolid(p.x, p.y, p.w, p.h, world)) {
    if (p.vy > 0) { p.y = Math.floor((p.y + p.h) / TILE) * TILE - p.h; p.ground = true; }
    else p.y = (Math.floor(p.y / TILE) + 1) * TILE;
    p.vy = 0;
  } else if (p.vy > 0) { // one-way platforms ('o'): solid only when landing from above
    const r = Math.floor((p.y + p.h) / TILE), top = r * TILE;
    if (oldBottom <= top + .5 && p.y + p.h > top)
      for (let c = Math.floor(p.x / TILE); c <= Math.floor((p.x + p.w - .01) / TILE); c++)
        if (tile(c, r) === "o") { p.y = top - p.h; p.vy = 0; p.ground = true; break; }
  }
  if (!p.ground && p.vy >= 0) for (let i = 0; i < plats.length; i++) { // moving platforms: land from above only
    const m = plats[i];
    if (p.x + p.w > m.x + 2 && p.x < m.x + m.w - 2 && oldBottom <= m.y + 2 && p.y + p.h >= m.y) { p.y = m.y - p.h; p.vy = 0; p.ground = true; p.ride = i; break; }
  }
  if (p.ground && !wasGround && fallV > 220) { A.land(fallV); burst(p.x + 11, p.y + p.h, PAL[world].solidHi, 6, 160); }
  stepT -= dt;
  if (p.ground && Math.abs(p.vx) > 120 && stepT <= 0) { A.step(); stepT = .23; }

  if (touches("J", 2) && p.vy >= 0) { p.vy = -760; p.pad = true; p.ground = false; A.pad(); burst(p.x + 11, p.y + p.h, "#7CFC9A", 8, 140); }
  const onLever = touches("y", 2); if (onLever && !p.onLever) toggleGate(); p.onLever = onLever;
  if (hurts(world) || sawHit() || p.y > H) { die(); return; }
  if (touches("G", 4) && p.ground) win(); // must be standing: no flying through the goal
}

// ---- Drawing helpers
function rr(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function panel(x, y, w, h, fill = "rgba(10,8,30,.62)", stroke = "rgba(255,255,255,.18)") {
  rr(x, y, w, h, 8); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke();
}
function text(s, x, y, size = 14, col = "#fff", align = "center", shadow = true) {
  ctx.font = `bold ${size}px "Trebuchet MS", system-ui, sans-serif`; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
  if (shadow) { ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillText(s, x + 1.5, y + 1.5); }
  ctx.fillStyle = col; ctx.fillText(s, x, y);
}
function star(cx, cy, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * .45 : r; ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
  ctx.closePath(); ctx.fillStyle = fill ? "#ffd166" : "rgba(255,255,255,.15)"; ctx.fill();
  ctx.strokeStyle = fill ? "#b8860b" : "rgba(255,255,255,.3)"; ctx.lineWidth = 1.5; ctx.stroke();
}
function keycap(label, x, y, w = 0) {
  ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
  const tw = w || ctx.measureText(label).width + 12;
  rr(x, y - 13, tw, 18, 4); ctx.fillStyle = "#eee"; ctx.fill(); ctx.strokeStyle = "#888"; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = "#222"; ctx.textAlign = "center"; ctx.fillText(label, x + tw / 2, y); return tw;
}
function worldIcon(w, x, y, r) {
  if (w === 0) {
    ctx.fillStyle = "#ffcf33"; ctx.beginPath(); ctx.arc(x, y, r * .6, 0, 7); ctx.fill();
    ctx.strokeStyle = "#ffcf33"; ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke(); }
  } else {
    ctx.fillStyle = "#e8e8ff"; ctx.beginPath(); ctx.arc(x, y, r * .85, 0, 7); ctx.fill();
    ctx.fillStyle = "#2a1f66"; ctx.beginPath(); ctx.arc(x + r * .45, y - r * .25, r * .75, 0, 7); ctx.fill();
  }
}

// ---- Scene
const stars = Array.from({ length: 46 }, (_, i) => ({ x: (i * 97.3) % W, y: (i * 53.7) % 200, s: .6 + (i % 4) * .5, p: i }));
function drawBg(w) {
  const P = PAL[w], g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, P.sky[0]); g.addColorStop(1, P.sky[1]); ctx.fillStyle = g; ctx.fillRect(-10, -10, W + 20, H + 20);
  if (w === 0) {
    ctx.save(); ctx.translate(540, 64); ctx.rotate(T * .1); ctx.fillStyle = "rgba(255,230,120,.35)";
    for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.fillRect(34, -3, 26, 6); } ctx.restore();
    ctx.fillStyle = "#ffe066"; ctx.beginPath(); ctx.arc(540, 64, 28, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.8)";
    for (let i = 0; i < 4; i++) { const x = ((T * 12 + i * 190) % (W + 140)) - 70, y = 60 + i * 38 + (i % 2) * 20; ctx.beginPath(); ctx.arc(x, y, 18, 0, 7); ctx.arc(x + 20, y + 4, 14, 0, 7); ctx.arc(x - 20, y + 5, 12, 0, 7); ctx.fill(); }
  } else {
    for (const s of stars) { ctx.globalAlpha = .45 + .55 * Math.abs(Math.sin(T * 1.5 + s.p)); ctx.fillStyle = "#fff"; ctx.fillRect(s.x, s.y, s.s, s.s); }
    ctx.globalAlpha = 1; ctx.fillStyle = "#f3f0ff"; ctx.beginPath(); ctx.arc(540, 64, 26, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(160,160,200,.5)"; ctx.beginPath(); ctx.arc(532, 58, 6, 0, 7); ctx.arc(550, 74, 4, 0, 7); ctx.fill();
  }
}
function drawTiles(w) {
  const P = PAL[w];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const t = level[r][c], x = c * TILE, y = r * TILE + OFFY;
    if (MOVER_CH.includes(t)) {
      ctx.fillStyle = P.ghost; if ("kKhH".includes(t)) ctx.fillRect(x, y + 14, TILE, 4); else ctx.fillRect(x + 14, y, 4, TILE);
    }
    if (t === "m" || t === "M") {
      ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(x, y + 14, TILE, 4); ctx.fillRect(x + 14, y + 6, 4, 20);
    }
    if (t === "M") {
      const bx = x + (slideAnim[r * COLS + c] || 0), pc = w ? ["#f15bb5", "#a02170"] : ["#9b5de5", "#6a35b0"];
      ctx.fillStyle = pc[1]; ctx.fillRect(bx, y, TILE, TILE); ctx.fillStyle = pc[0]; ctx.fillRect(bx + 2, y + 2, TILE - 4, TILE - 6);
      ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.fillRect(bx + 4, y + 4, TILE - 8, 3);
      ctx.fillStyle = "rgba(255,255,255,.8)";
      ctx.beginPath(); ctx.moveTo(bx + 6, y + 16); ctx.lineTo(bx + 12, y + 11); ctx.lineTo(bx + 12, y + 21); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx + 26, y + 16); ctx.lineTo(bx + 20, y + 11); ctx.lineTo(bx + 20, y + 21); ctx.fill();
    } else if (t === "#") {
      ctx.fillStyle = P.solid; ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = P.solidHi; ctx.fillRect(x, y, TILE, 3);
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(x, y + TILE - 3, TILE, 3);
      ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fillRect(x + 6, y + 10, 8, 4); ctx.fillRect(x + 18, y + 20, 8, 4);
    } else if (t === "D" || t === "N") {
      if ((t === "D") === (w === 0)) {
        ctx.fillStyle = P.mineDk; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = P.mine; ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 6);
        ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(x + 4, y + 4, TILE - 8, 3);
      } else {
        ctx.strokeStyle = P.ghost; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6); ctx.setLineDash([]);
      }
    } else if (t === "a" || t === "b") {
      const on = (t === "a") === (w === 0);
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(x + i * 8, y + TILE); ctx.lineTo(x + i * 8 + 4, y + TILE - 17); ctx.lineTo(x + i * 8 + 8, y + TILE);
        if (on) { ctx.fillStyle = "#ff7b1c"; ctx.fill(); ctx.fillStyle = "#ffd29a"; ctx.fillRect(x + i * 8 + 3, y + TILE - 12, 2, 8); }
        else { ctx.strokeStyle = P.ghost; ctx.lineWidth = 1.5; ctx.stroke(); }
      }
    } else if (t === "T") {
      for (let i = 0; i < 4; i++) { ctx.fillStyle = "#e63946"; ctx.beginPath(); ctx.moveTo(x + i * 8, y); ctx.lineTo(x + i * 8 + 4, y + 17); ctx.lineTo(x + i * 8 + 8, y); ctx.fill(); ctx.fillStyle = "#ff9aa2"; ctx.fillRect(x + i * 8 + 3, y + 4, 2, 8); }
    } else if (t === "J") {
      const sq = Math.abs(Math.sin(T * 6)) * 2;
      ctx.fillStyle = "#1f9d55"; ctx.fillRect(x + 4, y + TILE - 6, TILE - 8, 6);
      ctx.strokeStyle = "#7CFC9A"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 9, y + TILE - 6); ctx.lineTo(x + 23, y + TILE - 12); ctx.lineTo(x + 9, y + TILE - 16 + sq); ctx.lineTo(x + 23, y + TILE - 20 + sq); ctx.stroke();
      ctx.fillStyle = "#7CFC9A"; ctx.fillRect(x + 5, y + TILE - 24 + sq, TILE - 10, 4);
    } else if (t === "o") {
      ctx.fillStyle = P.solidHi; ctx.fillRect(x, y, TILE, 8); ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(x, y + 8, TILE, 2);
      ctx.fillStyle = "rgba(255,255,255,.5)"; for (let i = 3; i < TILE; i += 8) ctx.fillRect(x + i, y + 2, 4, 2);
    } else if (t === "Z" || t === "z") {
      if (gateClosed === (t === "Z")) { ctx.fillStyle = "#b8860b"; ctx.fillRect(x + 2, y, 4, TILE); ctx.fillRect(x + 14, y, 4, TILE); ctx.fillRect(x + 26, y, 4, TILE); ctx.fillStyle = "#ffd166"; ctx.fillRect(x, y + 6, TILE, 4); ctx.fillRect(x, y + 22, TILE, 4); }
      else { ctx.strokeStyle = P.ghost; ctx.lineWidth = 1.5; ctx.setLineDash([3, 5]); ctx.strokeRect(x + 6, y + 1, TILE - 12, TILE - 2); ctx.setLineDash([]); }
    } else if (t === "y") {
      ctx.fillStyle = "#555"; ctx.fillRect(x + 6, y + TILE - 8, TILE - 12, 8);
      ctx.strokeStyle = gateClosed ? "#ff6b6b" : "#6bff95"; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x + 16, y + TILE - 8); ctx.lineTo(x + (gateClosed ? 8 : 24), y + 10); ctx.stroke(); ctx.lineCap = "butt";
      ctx.fillStyle = gateClosed ? "#ff6b6b" : "#6bff95"; ctx.beginPath(); ctx.arc(x + (gateClosed ? 8 : 24), y + 10, 4, 0, 7); ctx.fill();
    } else if (t === "S") {
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = "#e63946"; ctx.beginPath(); ctx.moveTo(x + i * 8, y + TILE); ctx.lineTo(x + i * 8 + 4, y + TILE - 17); ctx.lineTo(x + i * 8 + 8, y + TILE); ctx.fill();
        ctx.fillStyle = "#ff9aa2"; ctx.fillRect(x + i * 8 + 3, y + TILE - 12, 2, 8);
      }
    } else if (t === "G") {
      const pulse = Math.sin(T * 4) * 2;
      ctx.fillStyle = "rgba(255,209,102,.25)"; ctx.beginPath(); ctx.arc(x + 16, y + 16, 18 + pulse, 0, 7); ctx.fill();
      ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(x + 16, y + 16, 11 + pulse / 2, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff6d6"; ctx.beginPath(); ctx.arc(x + 16, y + 16, 5, 0, 7); ctx.fill();
    }
  }
}
function drawPlayer(w) {
  const p = player, P = PAL[w];
  const sq = p.ground ? 1 : 1 + Math.min(.15, Math.abs(p.vy) / 4000), cx = p.x + p.w / 2, by = p.y + p.h + OFFY;
  ctx.save(); ctx.translate(cx + pOff, by); ctx.scale(1 / sq, sq);
  ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(-p.w / 2 + 2, -4, p.w - 4, 4);
  rr(-p.w / 2, -p.h, p.w, p.h, 5); ctx.fillStyle = P.player; ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.3)"; ctx.fillRect(-p.w / 2 + 3, -p.h + 3, p.w - 6, 4);
  const ex = p.face > 0 ? 3 : -9; ctx.fillStyle = "#fff"; ctx.fillRect(ex, -p.h + 7, 7, 7);
  ctx.fillStyle = "#111"; ctx.fillRect(ex + (p.face > 0 ? 3 : 0), -p.h + 9, 4, 4);
  ctx.restore();
}
function drawMovers(w) {
  const P = PAL[w];
  for (const m of movers) {
    const q = mpos(m, moverT);
    if (m.kind === "saw") {
      ctx.save(); ctx.translate(q.x, q.y + OFFY); ctx.rotate(T * 9 * (w ? .5 : 1));
      ctx.fillStyle = "#c9ccd6"; ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, rr2 = i % 2 ? 9 : 14; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
      ctx.closePath(); ctx.fill(); ctx.fillStyle = "#e63946"; ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill();
      ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(0, 0, 2, 0, 7); ctx.fill(); ctx.restore();
    } else {
      rr(q.x, q.y + OFFY, 64, 12, 4); ctx.fillStyle = P.mineDk; ctx.fill(); rr(q.x + 2, q.y + OFFY, 60, 8, 3); ctx.fillStyle = P.mine; ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.fillRect(q.x + 6, q.y + OFFY + 2, 52, 2);
    }
  }
}
function drawScene(w) { drawBg(w); drawTiles(w); drawMovers(w); if (showPlayer()) drawPlayer(w); }

function drawHud() {
  const P = PAL[world];
  panel(6, 6, W - 12, 26);
  text(LEVELS[li].name, 16, 24, 13, "#fff", "left");
  worldIcon(world, W / 2 - 34, 19, 8); text(world ? "NIGHT: LOW G" : "DAY", W / 2 - 20, 24, 13, P.accent, "left");
  if (isFinite(budget)) text(`Shifts ${budget}`, W / 2 + 96, 24, 13, budget <= 2 ? "#ff9aa2" : "#fff", "left");
  text(`Deaths ${deaths}`, W - 80, 24, 12, "#fff", "right"); text(levelTime.toFixed(1) + "s", W - 16, 24, 13, "#fff", "right");
  if (world && state !== "title") { text("LOW GRAVITY  -  SLOW TIME", W / 2, 46, 11, "#bfe8ff"); }
  if (A.muted) text("MUTED", W - 16, 50, 10, "#ff9aa2", "right");
}
function drawBanner() {
  if (banner <= 0) return;
  const t = banner, a = Math.min(1, t * 3, (2.6 - t) * 4), y = 50 + (1 - a) * -30;
  ctx.font = "12px sans-serif"; const bw = Math.max(300, ctx.measureText(LEVELS[li].hint).width + 50);
  ctx.globalAlpha = Math.max(0, a); panel(W / 2 - bw / 2, y, bw, 56, "rgba(10,8,30,.75)");
  text(LEVELS[li].name, W / 2, y + 24, 20, "#fff"); text(LEVELS[li].hint, W / 2, y + 44, 12, "#cde", "center", false);
  ctx.globalAlpha = 1;
}
function drawToast() {
  if (msgT <= 0) return;
  ctx.globalAlpha = Math.min(1, msgT * 3); ctx.font = "bold 13px sans-serif";
  const w = ctx.measureText(msg).width + 30; panel(W / 2 - w / 2, H - 38, w, 26, "rgba(120,10,20,.85)", "rgba(255,150,160,.6)");
  text(msg, W / 2, H - 20, 13, "#fff"); ctx.globalAlpha = 1;
}
function drawTitle() {
  const P = PAL[world], bob = Math.sin(T * 2) * 4;
  ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.shadowColor = P.accent; ctx.shadowBlur = 24;
  text("SHIFT", W / 2, 128 + bob, 84, "#fff"); ctx.restore();
  text("SHIFT", W / 2, 128 + bob, 84, "#fff", "center", false);
  worldIcon(0, W / 2 - 96, 160, 11); worldIcon(1, W / 2 + 96, 160, 11);
  text("swap the world. slide the floor.", W / 2, 164, 15, "#fff");
  const items = [["SPACE", "Play"], ["L", "Level select"], ["M", A.muted ? "Sound: off" : "Sound: on"]];
  items.forEach(([k, l], i) => {
    const y = 218 + i * 32, pulse = i === 0 ? .5 + .5 * Math.sin(T * 5) : 0;
    panel(W / 2 - 110, y - 20, 220, 28, i === 0 ? `rgba(255,255,255,${.12 + pulse * .12})` : "rgba(10,8,30,.5)");
    keycap(k, W / 2 - 100, y, 54); text(l, W / 2 + 22, y, 14, "#fff", "center");
  });
  { let x = 78, y = 322; const f = 'bold 12px "Trebuchet MS", sans-serif';
    for (const [k, l] of [["SHIFT / E", "swap world"], ["SPACE", "jump"], ["A D / ARROWS", "move"]]) {
      x += keycap(k, x, y) + 6; ctx.font = f; text(l, x, y, 12, "#fff", "left", false); x += ctx.measureText(l).width + 22;
    } }
  text("Game Off 2026  -  theme: SHIFT", W / 2, H - 10, 11, "rgba(255,255,255,.75)", "center", false);
}
const SELCOLS = 7, SELPER = 21;
function drawSelect() {
  ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, W, H);
  text("SELECT LEVEL", W / 2, 46, 30, "#fff");
  const n = LEVELS.length, cols = SELCOLS, cw = 76, ch = 66, gap = 10, x0 = (W - (cols * cw + (cols - 1) * gap)) / 2;
  const page = Math.floor(cursor / SELPER), pages = Math.ceil(n / SELPER), first = page * SELPER;
  for (let j = 0; j < SELPER && first + j < n; j++) {
    const i = first + j, x = x0 + (j % cols) * (cw + gap), y = 66 + Math.floor(j / cols) * (ch + gap), locked = i > save.unlocked, sel = i === cursor, b = save.best[i];
    const off = sel ? Math.sin(T * 8) * 1.5 - 3 : 0;
    panel(x, y + off, cw, ch, locked ? "rgba(10,8,30,.55)" : "rgba(30,25,80,.7)", sel ? "#ffd166" : "rgba(255,255,255,.2)");
    text(String(i + 1), x + cw / 2, y + off + 30, 26, locked ? "#888" : "#fff");
    if (locked) text("LOCKED", x + cw / 2, y + off + 54, 10, "#999", "center", false);
    else for (let s = 0; s < 3; s++) star(x + cw / 2 - 16 + s * 16, y + off + 50, 6, b && b.stars > s);
  }
  if (pages > 1) text(`Page ${page + 1} / ${pages}`, W - 16, 46, 12, "#cde", "right", false);
  const sl = LEVELS[Math.min(cursor, n - 1)];
  text(cursor > save.unlocked ? "Locked: clear the previous level" : sl.name, W / 2, H - 50, 15, "#ffd166");
  text("Arrows: choose    Enter: play    U: unlock all    Esc: back", W / 2, H - 24, 12, "#fff", "center", false);
}
function drawPause() {
  ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(0, 0, W, H);
  panel(W / 2 - 130, 90, 260, 170); text("PAUSED", W / 2, 130, 28, "#fff");
  [["P", "Resume"], ["R", "Restart level"], ["Q", "Level select"], ["M", A.muted ? "Sound: off" : "Sound: on"]].forEach(([k, l], i) => {
    keycap(k, W / 2 - 100, 164 + i * 24, 24); text(l, W / 2 - 62, 164 + i * 24, 14, "#fff", "left");
  });
}
function drawWin(final) {
  ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, 0, W, H);
  const pop = Math.min(1, winT * 4), h = final ? 200 : 180; ctx.save(); ctx.translate(W / 2, 180); ctx.scale(.8 + .2 * pop, .8 + .2 * pop); ctx.translate(-W / 2, -180);
  panel(W / 2 - 160, 180 - h / 2, 320, h, "rgba(15,10,50,.88)", "#ffd166");
  text(final ? "ALL LEVELS CLEARED!" : "LEVEL CLEAR!", W / 2, 180 - h / 2 + 38, final ? 24 : 28, "#ffd166");
  for (let s = 0; s < 3; s++) { const shown = winT > .35 + s * .3; const sc = shown ? 1 + Math.max(0, .5 - (winT - .35 - s * .3) * 2) : 0; star(W / 2 - 44 + s * 44, 180 - h / 2 + 76, 17 * sc, s < winStars); }
  text(`Time ${levelTime.toFixed(1)}s${newBest ? "  - NEW BEST!" : ""}`, W / 2, 180 - h / 2 + 118, 14, "#fff");
  text(`Deaths ${levelDeaths}`, W / 2, 180 - h / 2 + 138, 14, "#fff");
  if (final) text(`Total ${time.toFixed(1)}s, ${deaths} deaths`, W / 2, 180 - h / 2 + 158, 13, "#cde");
  if (Math.sin(T * 6) > -.3) text(final ? "SPACE: title screen" : "SPACE: next level", W / 2, 180 + h / 2 - 12, 14, "#fff");
  ctx.restore();
}

function draw() {
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - .5) * 8 * shake / .3, (Math.random() - .5) * 8 * shake / .3);
  if (shiftT > 0) {
    drawScene(prevWorld); ctx.save();
    const prog = 1 - shiftT, R = (1 - Math.pow(1 - prog, 3)) * 760;
    ctx.beginPath(); ctx.arc(shiftX, shiftY, R, 0, 7); ctx.clip(); drawScene(world); ctx.restore();
    ctx.strokeStyle = `rgba(255,255,255,${shiftT})`; ctx.lineWidth = 4 * shiftT + 1; ctx.beginPath(); ctx.arc(shiftX, shiftY, R, 0, 7); ctx.stroke();
  } else drawScene(world);
  for (const q of particles) { ctx.globalAlpha = Math.max(0, q.life); ctx.fillStyle = q.col; ctx.fillRect(q.x, q.y + OFFY, 4, 4); }
  ctx.globalAlpha = 1;
  if (state === "title") drawTitle();
  else if (state === "select") drawSelect();
  else { drawHud(); drawBanner(); drawToast(); }
  if (state === "pause") drawPause();
  if (state === "win") drawWin(false);
  if (state === "end") drawWin(true);
  if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 2})`; ctx.fillRect(0, 0, W, H); }
  if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, fade * 2.5)})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}

// ---- Loop
function menuInput() {
  if (hit("KeyM")) { A.toggleMute(); }
  if (state === "title") {
    if (hit("Space", "Enter")) { A.click(); deaths = 0; time = 0; startLevel(0); }
    else if (hit("KeyL")) { A.click(); cursor = save.unlocked; setState("select"); load(0, false); }
  } else if (state === "select") {
    const n = LEVELS.length, cols = SELCOLS;
    if (hit("ArrowRight", "KeyD")) { cursor = Math.min(n - 1, cursor + 1); A.move(); }
    if (hit("ArrowLeft", "KeyA")) { cursor = Math.max(0, cursor - 1); A.move(); }
    if (hit("ArrowDown", "KeyS")) { cursor = Math.min(n - 1, cursor + cols); A.move(); }
    if (hit("ArrowUp", "KeyW")) { cursor = Math.max(0, cursor - cols); A.move(); }
    if (hit("KeyU")) { save.unlocked = n - 1; persist(); A.click(); }
    if (hit("Escape")) { A.back(); setState("title"); }
    if (hit("Space", "Enter")) { if (cursor > save.unlocked) A.locked(); else { A.click(); deaths = 0; time = 0; startLevel(cursor); } }
  } else if (state === "pause") {
    if (hit("Escape", "KeyP", "Space")) { A.pause(false); setState("play"); }
    if (hit("KeyR")) { setState("play"); restart(); }
    if (hit("KeyQ")) { A.back(); cursor = li; setState("select"); }
  } else if (state === "win") {
    if (winT > .3 && hit("Space", "Enter")) { A.click(); startLevel(li + 1); }
  } else if (state === "end") {
    if (winT > .3 && hit("Space", "Enter")) { A.click(); setState("title"); load(0, false); }
  }
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(.033, (now - last) / 1000); last = now; T += dt;
  let consumed = true;
  if (state === "play") { // fixed 60Hz simulation so the game matches the headless verifier exactly
    accT += dt; consumed = false;
    for (let n = 0; accT >= 1 / 60 && n < 5 && state === "play"; n++) { update(1 / 60); accT -= 1 / 60; if (!consumed) { for (const k in pressed) delete pressed[k]; consumed = true; } }
    if (accT > .1) accT = 0;
  } else { accT = 0; menuInput(); }
  if (state === "play" && hit("KeyM")) A.toggleMute();
  if (state === "win" || state === "end") { const o = winT; winT += dt; for (let s = 0; s < winStars; s++) if (o < .35 + s * .3 && winT >= .35 + s * .3) A.star(s); }
  if (state === "title") { titleT += dt; if (titleT > 3.2) { titleT = 0; prevWorld = world; shiftT = 1; shiftX = 100 + Math.random() * 440; shiftY = 120 + Math.random() * 120; setWorld(1 - world); } }
  for (const k in slideAnim) { const v = slideAnim[k], nv = v - Math.sign(v) * Math.min(Math.abs(v), 300 * dt); if (!nv) delete slideAnim[k]; else slideAnim[k] = nv; }
  pOff -= Math.sign(pOff) * Math.min(Math.abs(pOff), 300 * dt);
  for (const q of particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 700 * dt; q.life -= dt; }
  particles = particles.filter(q => q.life > 0);
  flash = Math.max(0, flash - dt); shake = Math.max(0, shake - dt); msgT -= dt; banner = Math.max(0, banner - dt); fade = Math.max(0, fade - dt); shiftT = Math.max(0, shiftT - dt * 2.2);
  draw();
  if (consumed) for (const k in pressed) delete pressed[k];
  requestAnimationFrame(frame);
}
// Headless test hook (used by tools/verify-levels.js). Inert in the browser.
if (typeof window !== "undefined" && window.__SHIFT_TEST__) Object.assign(window.__SHIFT_TEST__, {
  count: () => LEVELS.length,
  start(i) { deaths = 0; levelDeaths = 0; load(i, true); state = "play"; banner = 0; fade = 0; particles.length = 0; },
  snap: () => ({ p: { ...player }, lv: level.map(r => r.slice()), dirs: runs.map(r => r.dir), world, budget, deaths, stepT, gate: gateClosed, mt: moverT }),
  restore(s) { player = { ...s.p }; level = s.lv.map(r => r.slice()); runs.forEach((r, i) => r.dir = s.dirs[i]); world = s.world; gateClosed = s.gate; moverT = s.mt; stepMovers(0); budget = s.budget; deaths = s.deaths; stepT = s.stepT; state = "play"; },
  info: () => ({ ride: player.ride, mt: moverT, movers: movers.length > 0, gate: gateClosed, x: player.x, y: player.y, vx: player.vx, vy: player.vy, ground: player.ground, world, budget, state, deaths, grid: runs.map(r => level[r.r].join("")).join("|") + runs.map(r => r.dir).join("") + +gateClosed + +!!player.pad + +!!player.onLever }),
  step({ dir = 0, jump = false, shift = false, frames = 6 }) {
    const d0 = deaths; keys.ArrowLeft = dir < 0; keys.ArrowRight = dir > 0; keys.Space = jump;
    for (let f = 0; f < frames; f++) {
      pressed.Space = jump && f === 0; pressed.ShiftLeft = shift && f === 0;
      update(1 / 60); delete pressed.Space; delete pressed.ShiftLeft; particles.length = 0;
      if (state !== "play" || deaths !== d0) break;
    }
    return { dead: deaths !== d0, won: state === "win" || state === "end" };
  },
});
load(0, false);
requestAnimationFrame(frame);
})();
