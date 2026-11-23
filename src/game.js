(() => {
// Gravity differs per world: DAY is normal, NIGHT is low gravity (higher, floatier jumps).
const GRAV = [1800, 990], FALL = [900, 520];
const TILE = 32, COLS = 20, ROWS = 11, W = 640, H = 360, OFFY = 4;
const cv = document.getElementById("c"), ctx = cv ? cv.getContext("2d") : null;
if (cv) { cv.width = 1920; cv.height = 1080; }
const A = Audio8;

// ---- Palettes: world 0 = DAY (Warm Sunset/Autumn), world 1 = NIGHT (Mystical Twilight/Aurora)
const PAL = [
  { sky: ["#9e2a2b", "#d35400", "#f8c291"], solid: "#351e15", solidHi: "#4e2c1f", trim: "#e67e22", trimHi: "#f39c12", mine: "#f1c40f", mineDk: "#b78a02", ghost: "rgba(241,196,15,.22)", ink: "#261307", player: "#2c3e50", scarf: "#00cec9", accent: "#f39c12", name: "DAY" },
  { sky: ["#09051e", "#1b1145", "#3a1758"], solid: "#141228", solidHi: "#231f44", trim: "#6c5ce7", trimHi: "#a29bfe", mine: "#00cec9", mineDk: "#008b8b", ghost: "rgba(0,206,201,.22)", ink: "#ece9f7", player: "#dfe6e9", scarf: "#f39c12", accent: "#00cec9", name: "NIGHT" },
];

// ---- Input & Touch Controls
const keys = {}, pressed = {}, keysRaw = {};
let isTouchDevice = false;
if (typeof window !== "undefined" && typeof navigator !== "undefined") {
  // Reliable touch device detection (phones/tablets vs desktop mouse/keyboard)
  isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0 && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || ""));
}
let hasTouch = false;
const activeTouches = new Map();
function getCanvasPos(e) {
  if (!cv) return { x: 0, y: 0 };
  const rect = cv.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * W,
    y: ((e.clientY - rect.top) / rect.height) * H
  };
}

let prevTouchJump = false, prevTouchShift = false;
function updateTouchControls() {
  let tLeft = false, tRight = false, tJump = false, tShift = false;
  for (const pt of activeTouches.values()) {
    if (state === "play") {
      if (Math.hypot(pt.x - 44, pt.y - (H - 46)) < 36) tLeft = true;
      if (Math.hypot(pt.x - 108, pt.y - (H - 46)) < 36) tRight = true;
      if (Math.hypot(pt.x - (W - 46), pt.y - (H - 48)) < 38) tJump = true;
      if (Math.hypot(pt.x - (W - 116), pt.y - (H - 46)) < 36) tShift = true;
    }
  }
  keys.ArrowLeft = tLeft || !!keysRaw["ArrowLeft"] || !!keysRaw["KeyA"];
  keys.ArrowRight = tRight || !!keysRaw["ArrowRight"] || !!keysRaw["KeyD"];
  if (tJump && !prevTouchJump) { pressed["Space"] = true; keys["Space"] = true; }
  if (!tJump && prevTouchJump) { keys["Space"] = false; }
  if (tShift && !prevTouchShift) { pressed["ShiftLeft"] = true; }
  prevTouchJump = tJump;
  prevTouchShift = tShift;
}

addEventListener("keydown", e => {
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
  if (e.code === "KeyF") toggleFullscreen();
  keysRaw[e.code] = true;
  if (!keys[e.code] && !e.repeat) pressed[e.code] = true;
  keys[e.code] = true; A.init();
});
addEventListener("keyup", e => { keysRaw[e.code] = false; keys[e.code] = false; });
addEventListener("blur", () => { for (const k in keys) keys[k] = false; if (state === "play") setState("pause"); });

let gestureStartX = 0, gestureStartY = 0, gestureStartTime = 0;
if (typeof window !== "undefined") {
  addEventListener("pointerdown", e => {
    A.init();
    if (e.pointerType === "touch") hasTouch = true;
    const pt = getCanvasPos(e);
    if (e.pointerType === "touch" || isTouchDevice) {
      activeTouches.set(e.pointerId, pt);
    }
    gestureStartX = pt.x;
    gestureStartY = pt.y;
    gestureStartTime = Date.now();

    // Utility icons on touch or mouse click
    if (pt.y < 36) {
      if (Math.hypot(pt.x - (W - 28), pt.y - 18) < 16) A.toggleMute();
      else if (Math.hypot(pt.x - (W - 64), pt.y - 18) < 16) toggleFullscreen();
      else if (Math.hypot(pt.x - (W - 100), pt.y - 18) < 16 && state === "play") restart();
      else if (Math.hypot(pt.x - (W - 136), pt.y - 18) < 16 && state === "play") { A.click(); setState("title"); load(0, false); }
    }
    if (state === "title") {
      // Check top badges
      if (pt.y <= 36 && pt.x >= W - 140) { A.click(); openProfileModal(); return; }
      if (pt.y <= 36 && pt.x <= 130 && typeof I18N !== "undefined") { A.click(); I18N.toggleLang(); return; }

      // Check menu button clicks: only trigger when clicking INSIDE the menu panel horizontal bounds
      const inMenuX = pt.x >= (W / 2 - 145) && pt.x <= (W / 2 + 145);
      if (inMenuX) {
        if (pt.y >= 134 && pt.y <= 158) {
          A.click();
          if (typeof PlayerProfile !== "undefined" && !PlayerProfile.isConfigured) {
            openProfileModal(() => { deaths = 0; time = 0; startLevel(0); });
          } else {
            deaths = 0; time = 0; startLevel(0);
          }
        }
        else if (pt.y >= 161 && pt.y <= 185) { A.click(); cursor = save.unlocked; setState("select"); load(0, false); }
        else if (pt.y >= 188 && pt.y <= 212) { A.click(); comicPage = 0; setState("lore"); }
        else if (pt.y >= 215 && pt.y <= 239) { A.click(); showLeaderboard(); }
        else if (pt.y >= 242 && pt.y <= 266 && typeof I18N !== "undefined") { A.click(); I18N.toggleLang(); }
      }
    } else if (state === "select") {
      const n = LEVELS.length, pages = Math.ceil(n / SELPER), page = Math.floor(cursor / SELPER);

      // Top Back Button (generous tap target)
      if (pt.y <= 48 && pt.x <= 110) { A.back(); setState("title"); return; }
      // Page prev / next buttons
      if (pt.y <= 48 && pt.x >= W - 190 && pt.x <= W - 100 && page > 0) {
        A.move(); cursor = Math.max(0, (page - 1) * SELPER); return;
      }
      if (pt.y <= 48 && pt.x >= W - 98 && page < pages - 1) {
        A.move(); cursor = Math.min(n - 1, (page + 1) * SELPER); return;
      }
      // Level cards are handled on pointerup so horizontal sliding doesn't trigger level selection!
    } else if (state === "lore") {
      const pages = (typeof I18N !== "undefined") ? I18N.pages : [];
      if (pt.y >= 295) {
        if (pt.x <= W / 2 - 80 && comicPage > 0) { A.click(); comicPage--; }
        else if (pt.x >= W / 2 + 80) {
          if (comicPage < pages.length - 1) { A.click(); comicPage++; }
          else { A.click(); setState("title"); startLevel(0); }
        } else { A.back(); setState("title"); }
      }
    } else if (state === "leaderboard") {
      A.back(); setState("title");
    } else if (state === "win" || state === "end") {
      pressed["Space"] = true;
    }
    updateTouchControls();
  });
  addEventListener("pointermove", e => {
    if (activeTouches.has(e.pointerId)) {
      activeTouches.set(e.pointerId, getCanvasPos(e));
      updateTouchControls();
    }
  });
  const endTouch = e => {
    const pt = getCanvasPos(e);
    const dx = pt.x - gestureStartX;
    const dy = pt.y - gestureStartY;
    const dt = Date.now() - gestureStartTime;
    const dist = Math.hypot(dx, dy);

    // 1. Edge Swipe-Back (from left edge: gestureStartX < 80, dx > 45, |dy| < 80)
    if (gestureStartX < 80 && dx > 45 && Math.abs(dy) < 80 && dt < 800) {
      if (profileModalOpen) {
        closeProfileModal();
        return;
      }
      if (state === "select" || state === "lore" || state === "leaderboard") {
        A.back(); setState("title"); return;
      }
      if (state === "pause") {
        A.back(); setState("title"); load(0, false); return;
      }
      if (state === "play") {
        setState("pause"); return;
      }
    }

    // 2. Level Select horizontal swipe to change pages & tap to select
    if (state === "select") {
      const n = LEVELS.length, page = Math.floor(cursor / SELPER), pages = Math.ceil(n / SELPER);
      if (dt < 650 && Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.1) {
        if (dx < -35 && page < pages - 1) {
          A.move(); cursor = Math.min(n - 1, (page + 1) * SELPER); return;
        } else if (dx > 35 && page > 0) {
          A.move(); cursor = Math.max(0, (page - 1) * SELPER); return;
        }
      }

      // Tap card selection if finger didn't slide
      if (dist < 18 && dt < 500) {
        const cols = SELCOLS, cw = 76, ch = 66, gap = 10, x0 = (W - (cols * cw + (cols - 1) * gap)) / 2;
        const first = page * SELPER;
        for (let j = 0; j < SELPER && first + j < n; j++) {
          const i = first + j, x = x0 + (j % cols) * (cw + gap), y = 58 + Math.floor(j / cols) * (ch + gap);
          if (pt.x >= x && pt.x <= x + cw && pt.y >= y && pt.y <= y + ch) {
            cursor = i;
            if (cursor > save.unlocked) A.locked();
            else { A.click(); deaths = 0; time = 0; startLevel(cursor); }
            return;
          }
        }
      }
    }

    // 3. Comic / Lore horizontal swipe to turn panels
    if (state === "lore" && dt < 650 && Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.1) {
      const pages = (typeof I18N !== "undefined") ? I18N.pages : [];
      if (dx < -35 && comicPage < pages.length - 1) {
        A.click(); comicPage++; return;
      } else if (dx > 35 && comicPage > 0) {
        A.click(); comicPage--; return;
      }
    }

    activeTouches.delete(e.pointerId);
    updateTouchControls();
  };
  addEventListener("pointerup", endTouch);
  addEventListener("pointercancel", endTouch);
}

function toggleFullscreen() {
  if (typeof document === "undefined") return;
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen || function(){}).call(el);
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen || function(){}).call(document);
  }
}

const hit = (...c) => c.some(k => pressed[k]);
const down = (...c) => c.some(k => keys[k]);

// ---- Save
let save = { unlocked: 0, best: {} };
try { Object.assign(save, JSON.parse(localStorage.getItem("shift_save") || "{}")); } catch {}
save.unlocked = Math.max(0, Math.min(save.unlocked | 0, LEVELS.length - 1)); // guard against stale saves
// save.legit = highest level reached by actually winning; the U "unlock all" shortcut only raises save.unlocked,
// so levels past `legit` are practice runs that never reach the leaderboard.
save.legit = Math.max(0, Math.min(save.legit == null ? save.unlocked : save.legit | 0, save.unlocked));
const persist = () => { try { localStorage.setItem("shift_save", JSON.stringify(save)); } catch {} };

// ---- State
let state = "title"; // title | select | play | pause | win | end | lore | leaderboard
let li = 0, world = 0, level, player, deaths = 0, levelDeaths = 0, time = 0, levelTime = 0, T = 0;
let flash = 0, shake = 0, msg = "", msgT = 0, banner = 0, fade = 0, cursor = 0, winStars = 0, winT = 0, newBest = false;
let movers = [], plats = [], moverT = 0, accT = 0, gateClosed = true, runs = [], budget = Infinity, slideAnim = {}, pOff = 0;
let shiftT = 0, prevWorld = 0, shiftX = 0, shiftY = 0, stepT = 0, titleT = 0, particles = [];
let shards = [], shardsTotal = 0, shardsCollected = 0;
let levelCols = 20, camX = 0, camTargetX = 0, boss = null;
const showPlayer = () => state !== "title" && state !== "select" && state !== "lore" && state !== "leaderboard";

// Leaderboard integration helper
function showLeaderboard() {
  setState("leaderboard");
}

function setState(s, pushHistory = true) {
  const prev = state;
  state = s;
  if (s === "pause") A.pause(true), A.duck(true); else A.duck(false);
  if (pushHistory && typeof history !== "undefined" && history.pushState && s !== prev) {
    try {
      history.pushState({ screen: s }, "");
    } catch (e) {}
  }
}

if (typeof window !== "undefined") {
  try {
    if (typeof history !== "undefined" && history.replaceState) {
      history.replaceState({ screen: "title" }, "");
    }
  } catch (e) {}

  window.addEventListener("popstate", () => {
    if (profileModalOpen) {
      closeProfileModal(true);
      return;
    }
    if (state === "select" || state === "lore" || state === "leaderboard") {
      A.back();
      setState("title", false);
    } else if (state === "pause") {
      A.pause(false);
      setState("play", false);
    } else if (state === "play") {
      setState("pause", false);
    } else if (state === "win" || state === "end") {
      setState("title", false);
      load(0, false);
    } else if (state === "title") {
      try {
        history.pushState({ screen: "title" }, "");
      } catch (e) {}
    }
  });
}
function setWorld(w) { world = w; A.setWorld(w); }

function load(i, intro = true) {
  li = i; level = LEVELS[i].map.map(r => r.split(""));
  levelCols = level[0]?.length || 20;
  camX = 0; camTargetX = 0;
  runs = []; slideAnim = {}; pOff = 0; gateClosed = true; budget = LEVELS[i].budget ?? Infinity;
  shards = []; shardsTotal = 0; shardsCollected = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < levelCols; c++) {
    const ch = level[r][c];
    if (ch === "*" || ch === "1" || ch === "2") {
      shards.push({ r, c, kind: ch, collected: false });
      shardsTotal++;
    }
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < levelCols;) {
    if (level[r][c] === "M" || level[r][c] === "m") { const c0 = c; while (c < levelCols && (level[r][c] === "M" || level[r][c] === "m")) c++; runs.push({ r, c0, c1: c - 1, dir: 1 }); }
    else c++;
  }
  parseMovers();
  player = { x: 0, y: 0, w: 22, h: 28, vx: 0, vy: 0, ground: false, coyote: 0, buf: 0, face: 1, ride: -1, gateWarned: false };
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < levelCols; c++)
    if (level[r][c] === "P") { player.x = c * TILE + 5; player.y = r * TILE + TILE - player.h; }
  setWorld(0); shiftT = 0;
  boss = LEVELS[i].boss ? {
    name: LEVELS[i].bossName || "VOID COLOSSUS",
    x: -140,
    vx: LEVELS[i].bossSpeed || 42,
    active: true
  } : null;
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
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < levelCols; c++) {
    const ch = level[r][c];
    if (!MOVER_CH.includes(ch) || seen.has(r * levelCols + c)) continue;
    const horiz = "kKhH".includes(ch); let a = horiz ? c : r, b = a;
    while ((horiz ? b + 1 < levelCols : b + 1 < ROWS) && level[horiz ? r : b + 1][horiz ? b + 1 : c] === ch) b++;
    for (let i = a; i <= b; i++) seen.add(horiz ? r * levelCols + i : i * levelCols + c);
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
const tile = (c, r) => (r < 0 || r >= ROWS) ? "." : (c < 0 || c >= levelCols) ? "#" : level[r][c];
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
      level[run.r][c + run.dir] = "M"; level[run.r][c] = "m"; slideAnim[run.r + "_" + (c + run.dir)] = -run.dir * TILE;
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
  const ranked = li <= save.legit; // false when this level was opened with the U shortcut
  save.unlocked = Math.max(save.unlocked, Math.min(li + 1, LEVELS.length - 1));
  if (ranked) save.legit = Math.max(save.legit, Math.min(li + 1, LEVELS.length - 1));
  persist();

  // Record to local Leaderboard with player avatar & country (ranked runs only)
  if (ranked && typeof Leaderboard !== "undefined") {
    let totStars = 0;
    for (const k in save.best) totStars += (save.best[k].stars || 0);
    const pname = (typeof PlayerProfile !== "undefined") ? PlayerProfile.name : "Gamer";
    const pavatar = (typeof PlayerProfile !== "undefined") ? PlayerProfile.avatar : "weaver";
    const pcountry = (typeof PlayerProfile !== "undefined") ? PlayerProfile.country : "ID";
    Leaderboard.submitScore(pname, li + 1, time, deaths, totStars, pavatar, pcountry);
  }

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

  // Collect Shards (* celestial, 1 solar, 2 lunar)
  for (let i = 0; i < shards.length; i++) {
    const s = shards[i];
    if (s.collected) continue;
    const canTake = s.kind === "*" || (s.kind === "1" && world === 0) || (s.kind === "2" && world === 1);
    const sx = s.c * TILE, sy = s.r * TILE;
    if (p.x + p.w > sx + 2 && p.x < sx + TILE - 2 && p.y + p.h > sy + 2 && p.y < sy + TILE - 2) {
      if (canTake) {
        s.collected = true; shardsCollected++;
        level[s.r][s.c] = ".";
        A.star(shardsCollected);
        burst(sx + 16, sy + 16, s.kind === "1" ? "#f39c12" : s.kind === "2" ? "#00cec9" : "#ffd166", 20);
        flash = .06;
        say(shardsCollected === shardsTotal ? "Portal Awakened!" : `Shard ${shardsCollected}/${shardsTotal}`);
      }
    }
  }

  const atGoal = touches("G", 4);
  if (atGoal && p.ground) {
    if (shardsCollected < shardsTotal) {
      if (!p.gateWarned) {
        say(`Portal Sealed! Gather all ${shardsTotal} Shards (${shardsCollected}/${shardsTotal})`);
        A.deny();
        shake = .1;
        p.gateWarned = true;
      }
    } else {
      win();
    }
  } else if (!atGoal) {
    p.gateWarned = false;
  }

  // Camera tracking
  const maxCam = Math.max(0, levelCols * TILE - W);
  camTargetX = Math.max(0, Math.min(p.x + p.w / 2 - W / 2, maxCam));
  camX += (camTargetX - camX) * Math.min(1, 10 * dt);

  // Boss movement & collision
  if (boss && boss.active) {
    // Night world slows boss slightly by 15% (gives player an edge by shifting!)
    boss.x += boss.vx * dt * (world ? 0.85 : 1.0);
    const tension = Math.max(0, 1 - (player.x - boss.x) / (W * 0.8));
    A.setBossTension(tension);
    // If boss touches player
    if (p.x < boss.x + 36) {
      say(`Caught by ${boss.name}!`);
      shake = 0.4;
      die();
      return;
    }
  } else {
    A.setBossTension(0);
  }
}

// ---- Drawing helpers
function rr(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function panel(x, y, w, h, fill = "rgba(14, 9, 32, .82)", stroke = "rgba(255, 255, 255, .25)") {
  ctx.save();
  rr(x, y, w, h, 8);
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke();
  // Glass highlight on top edge
  ctx.strokeStyle = "rgba(255, 255, 255, .35)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + 8, y + 1.5); ctx.lineTo(x + w - 8, y + 1.5); ctx.stroke();
  ctx.restore();
}
const FONT_TITLE = '"Cinzel Decorative", "Cinzel", "Times New Roman", serif';
const FONT_HEADER = '"Cinzel", "Outfit", "Georgia", serif';
const FONT_BODY = '"Outfit", "Trebuchet MS", sans-serif';

function text(s, x, y, size = 14, col = "#fff", align = "center", shadow = true, fontFam = FONT_BODY) {
  ctx.font = `bold ${size}px ${fontFam}`; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
  if (shadow) { ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillText(s, x + 1.5, y + 1.5); }
  ctx.fillStyle = col; ctx.fillText(s, x, y);
}
function star(cx, cy, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * .45 : r; ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
  ctx.closePath(); ctx.fillStyle = fill ? "#ffd166" : "rgba(255,255,255,.15)"; ctx.fill();
  ctx.strokeStyle = fill ? "#b8860b" : "rgba(255,255,255,.3)"; ctx.lineWidth = 1.5; ctx.stroke();
}
function keycap(label, x, y, w = 0) {
  ctx.font = `bold 11px ${FONT_BODY}`;
  const tw = w || ctx.measureText(label).width + 12;
  rr(x, y - 13, tw, 18, 4); ctx.fillStyle = "#eee"; ctx.fill(); ctx.strokeStyle = "#888"; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = "#222"; ctx.textAlign = "center"; ctx.fillText(label, x + tw / 2, y); return tw;
}
function worldIcon(w, x, y, r) {
  if (w === 0) { // Radiant Sun Medallion
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "rgba(255,200,60,.25)"; ctx.beginPath(); ctx.arc(0, 0, r * 1.3, 0, 7); ctx.fill();
    ctx.fillStyle = "#ffcf33"; ctx.beginPath(); ctx.arc(0, 0, r * .65, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-r * .15, -r * .15, r * .22, 0, 7); ctx.fill();
    ctx.strokeStyle = "#ffb300"; ctx.lineWidth = 1.8;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + T * .8;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .85, Math.sin(a) * r * .85);
      ctx.lineTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25); ctx.stroke();
    }
    ctx.restore();
  } else { // Luminous Crescent Medallion
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "rgba(100,220,255,.2)"; ctx.beginPath(); ctx.arc(0, 0, r * 1.25, 0, 7); ctx.fill();
    ctx.fillStyle = "#e0f7fa"; ctx.beginPath(); ctx.arc(0, 0, r * .85, 0, 7); ctx.fill();
    ctx.fillStyle = "#1b1145"; ctx.beginPath(); ctx.arc(r * .4, -r * .2, r * .72, 0, 7); ctx.fill();
    ctx.fillStyle = "#80deea"; ctx.beginPath(); ctx.arc(-r * .3, r * .3, 1.5, 0, 7); ctx.fill();
    ctx.restore();
  }
}

// Comic & Profile asset preloading
const comicImages = [];
let comicPage = 0;
if (typeof Image !== "undefined") {
  [1, 2, 3, 4, 5].forEach(num => {
    const im = new Image(); im.src = `assets/comic_${num}.jpg`; comicImages.push(im);
  });
}

// Profile Modal controller
let profileModalOpen = false;
let modalFromHistory = false;

function closeProfileModal(fromPopState = false) {
  if (typeof document === "undefined") return;
  const modal = document.getElementById("profile-modal");
  if (!modal) return;
  const nameInput = document.getElementById("prof-name");
  if (nameInput) nameInput.blur();
  modal.style.display = "none";
  profileModalOpen = false;
  if (modalFromHistory && !fromPopState && typeof history !== "undefined" && history.back) {
    modalFromHistory = false;
    try { history.back(); } catch (e) {}
  } else {
    modalFromHistory = false;
  }
}

function openProfileModal(callback) {
  if (typeof document === "undefined") return;
  const modal = document.getElementById("profile-modal");
  if (!modal) return;
  profileModalOpen = true;
  modal.style.display = "flex";

  if (typeof history !== "undefined" && history.pushState) {
    try {
      history.pushState({ modal: "profile" }, "");
      modalFromHistory = true;
    } catch (e) {}
  }

  // Bind values
  const nameInput = document.getElementById("prof-name");
  const countrySelect = document.getElementById("prof-country");
  const avatarContainer = document.getElementById("avatar-container");
  const saveBtn = document.getElementById("btn-save-profile");
  const closeBtn = document.getElementById("btn-close-profile");
  const cancelBtn = document.getElementById("btn-cancel-profile");
  const topBackBtn = document.getElementById("btn-top-back-profile");
  const titleEl = document.getElementById("prof-title");
  const nameLbl = document.getElementById("lbl-name");
  const avLbl = document.getElementById("lbl-avatar");
  const countryLbl = document.getElementById("lbl-country");

  if (typeof I18N !== "undefined") {
    if (titleEl) titleEl.innerHTML = `<i class="bi bi-person-badge"></i> ` + (I18N.t("profileTitle") || "GAMER PROFILE");
    if (nameLbl) nameLbl.textContent = I18N.lang === "id" ? "Nama Gamer:" : "Gamer Name:";
    if (avLbl) avLbl.textContent = I18N.t("chooseAvatar") || "Choose Avatar:";
    if (countryLbl) countryLbl.textContent = I18N.t("countryLabel") || "Country / Region:";
    if (topBackBtn) topBackBtn.innerHTML = `<i class="bi bi-arrow-left"></i> ` + (I18N.lang === "id" ? "Kembali" : "Back");
    if (cancelBtn) cancelBtn.innerHTML = `<i class="bi bi-arrow-left"></i> ` + (I18N.lang === "id" ? "Kembali" : "Back");
    if (saveBtn) saveBtn.innerHTML = `<i class="bi bi-check-circle"></i> ` + (I18N.t("saveAndPlay") || "Save & Play");
  }

  if (nameInput) {
    nameInput.value = PlayerProfile.name || "Gamer";
    nameInput.onkeydown = (e) => {
      if (e.key === "Enter") saveBtn?.click();
    };
  }
  if (countrySelect) countrySelect.value = PlayerProfile.country || "ID";

  if (avatarContainer && typeof PlayerProfile !== "undefined" && PlayerProfile.avatars) {
    avatarContainer.innerHTML = "";
    PlayerProfile.avatars.forEach(av => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "av-btn" + (av.id === PlayerProfile.avatar ? " selected" : "");
      b.innerHTML = `<i class="bi ${av.icon}" style="color:${av.color};font-size:20px;"></i>`;
      b.title = av.name;
      b.onclick = () => {
        PlayerProfile.avatar = av.id;
        avatarContainer.querySelectorAll(".av-btn").forEach(el => el.classList.remove("selected"));
        b.classList.add("selected");
      };
      avatarContainer.appendChild(b);
    });
  }

  modal.onclick = (e) => {
    if (e.target === modal) closeProfileModal();
  };

  const onDismiss = (e) => {
    if (e) e.stopPropagation();
    closeProfileModal();
  };

  if (closeBtn) closeBtn.onclick = onDismiss;
  if (cancelBtn) cancelBtn.onclick = onDismiss;
  if (topBackBtn) topBackBtn.onclick = onDismiss;

  saveBtn.onclick = (e) => {
    if (e) e.stopPropagation();
    if (nameInput && nameInput.value.trim()) PlayerProfile.name = nameInput.value.trim();
    if (countrySelect) PlayerProfile.setCountry(countrySelect.value, countrySelect.options[countrySelect.selectedIndex]?.text, true);
    closeProfileModal();
    if (callback) callback();
  };
}

// ---- Scene & Environment
const stars = Array.from({ length: 48 }, (_, i) => ({ x: (i * 97.3) % W, y: (i * 53.7) % 210, s: .8 + (i % 3) * .6, p: i }));
const ambientMotes = Array.from({ length: 24 }, (_, i) => ({ x: (i * 137.5) % W, y: (i * 79.1) % H, speed: .3 + (i % 4) * .2, p: i * .7 }));

// Illustrative Painterly Tree (Degrees of Separation style: organic twisted limbs & layered foliage puffs)
function drawPainterlyTree(tx, ty, scale, isNight) {
  ctx.save();
  ctx.translate(tx, ty);
  ctx.scale(scale, scale);

  // Gnarled organic trunk and sweeping branches
  ctx.fillStyle = isNight ? "#120a26" : "#2a140d";
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.bezierCurveTo(-5, -28, -16, -58, -22, -82);
  ctx.bezierCurveTo(-14, -66, -3, -48, 1, -40);
  ctx.bezierCurveTo(9, -50, 20, -66, 26, -76);
  ctx.bezierCurveTo(22, -60, 10, -44, 5, -34);
  ctx.bezierCurveTo(7, -18, 6, -8, 7, 0);
  ctx.closePath();
  ctx.fill();

  // Multi-layered volumetric foliage clouds with light depth
  const puff = (fx, fy, rx, ry, c0, c1) => {
    ctx.save();
    const gr = ctx.createRadialGradient(fx - rx * .3, fy - ry * .35, rx * .1, fx, fy, rx);
    gr.addColorStop(0, c1); gr.addColorStop(1, c0);
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.ellipse(fx, fy, rx, ry, 0, 0, 7); ctx.fill();
    ctx.restore();
  };

  if (!isNight) {
    // Autumn Sunset Foliage (Deep Burgundy, Burnt Sienna, Warm Golden Amber)
    puff(-24, -90, 32, 26, "#781e14", "#c0392b");
    puff(22, -84, 28, 24, "#942d12", "#d35400");
    puff(-2, -106, 36, 30, "#b8420e", "#e67e22");
    puff(2, -86, 34, 28, "#d35400", "#f39c12");
    puff(-10, -114, 26, 22, "#e67e22", "#f1c40f");
  } else {
    // Enchanted Night Foliage (Obsidian Violet, Cosmic Purple, Bioluminescent Cyan)
    puff(-24, -90, 32, 26, "#16092e", "#3a1163");
    puff(22, -84, 28, 24, "#240d42", "#61238a");
    puff(-2, -106, 36, 30, "#35125e", "#7d3ca0");
    puff(2, -86, 34, 28, "#421470", "#9b59b6");
    puff(-10, -114, 26, 22, "#501784", "#00cec9");
  }

  ctx.restore();
}

// Background Asset Preloader (Theme variation per level)
const BG_THEMES = ["forest", "ruins"];
const bgImages = { day: {}, night: {} };
if (typeof Image !== "undefined") {
  BG_THEMES.forEach(th => {
    const id = new Image(); id.src = `assets/bg_day_${th}.jpg`; bgImages.day[th] = id;
    const inight = new Image(); inight.src = `assets/bg_night_${th}.jpg`; bgImages.night[th] = inight;
  });
}

function drawBg(w) {
  const theme = LEVELS[li]?.theme || (li < 20 ? "forest" : "ruins");
  const img = w === 0 ? bgImages.day[theme] : bgImages.night[theme];
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, 0, 0, W, H);
    // Draw atmospheric ambient particles over image
    if (w === 0) {
      for (const m of ambientMotes) {
        const mx = (m.x + T * 18 * m.speed) % (W + 20) - 10;
        const my = (m.y + Math.sin(T * 1.5 + m.p) * 20) % H;
        ctx.fillStyle = "rgba(255, 235, 160, .65)";
        ctx.beginPath(); ctx.arc(mx, my, 1.8, 0, 7); ctx.fill();
      }
    } else {
      for (const m of ambientMotes) {
        const mx = (m.x + Math.sin(T * 1.2 + m.p) * 16) % W;
        const my = (m.y - T * 16 * m.speed + H) % H;
        const pulse = .4 + .6 * Math.abs(Math.sin(T * 2 + m.p));
        ctx.fillStyle = m.p % 2 === 0 ? `rgba(0, 242, 254, ${pulse * .8})` : `rgba(186, 104, 200, ${pulse * .8})`;
        ctx.beginPath(); ctx.arc(mx, my, 2.0, 0, 7); ctx.fill();
      }
    }
    return;
  }

  const P = PAL[w], g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, P.sky[0]); g.addColorStop(.55, P.sky[1]); g.addColorStop(1, P.sky[2]);
  ctx.fillStyle = g; ctx.fillRect(-10, -10, W + 20, H + 20);

  if (w === 0) { // Warm Sunset / Autumn Horizon
    // Soft atmospheric sun near horizon with radial bloom
    const sunX = 490, sunY = 90;
    const sgrad = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 175);
    sgrad.addColorStop(0, "rgba(255,250,230,.98)");
    sgrad.addColorStop(.22, "rgba(255,195,75,.45)");
    sgrad.addColorStop(.55, "rgba(243,156,18,.18)");
    sgrad.addColorStop(1, "rgba(211,84,0,0)");
    ctx.fillStyle = sgrad; ctx.beginPath(); ctx.arc(sunX, sunY, 175, 0, 7); ctx.fill();
    ctx.fillStyle = "#fffdf2"; ctx.beginPath(); ctx.arc(sunX, sunY, 28, 0, 7); ctx.fill();

    // Soft volumetric sunbeams
    ctx.save();
    ctx.fillStyle = "rgba(255, 235, 170, .06)";
    for (let r = 0; r < 5; r++) {
      const a = (r * .36) + .58;
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(sunX + Math.cos(a - .11) * 480, sunY + Math.sin(a - .11) * 480);
      ctx.lineTo(sunX + Math.cos(a + .11) * 480, sunY + Math.sin(a + .11) * 480);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // Far distant mountains (smooth misty organic ridges)
    const mgrad1 = ctx.createLinearGradient(0, 110, 0, H);
    mgrad1.addColorStop(0, "rgba(125, 38, 25, .5)");
    mgrad1.addColorStop(1, "rgba(240, 165, 90, .75)");
    ctx.fillStyle = mgrad1;
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 170);
    ctx.bezierCurveTo(80, 115, 150, 155, 220, 125);
    ctx.bezierCurveTo(290, 95, 360, 145, 440, 110);
    ctx.bezierCurveTo(520, 75, 580, 135, W, 115);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

    // Mid-ground rolling autumn hills
    const mgrad2 = ctx.createLinearGradient(0, 150, 0, H);
    mgrad2.addColorStop(0, "rgba(75, 24, 18, .88)");
    mgrad2.addColorStop(1, "rgba(38, 12, 10, .98)");
    ctx.fillStyle = mgrad2;
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 210);
    ctx.bezierCurveTo(110, 175, 230, 230, 350, 195);
    ctx.bezierCurveTo(460, 165, 540, 220, W, 210);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

    // Whimsical sweeping autumn trees
    drawPainterlyTree(110, 225, .95, false);
    drawPainterlyTree(390, 240, 1.15, false);
    drawPainterlyTree(580, 255, 1.0, false);

    // Floating golden embers / drifting leaves
    for (const m of ambientMotes) {
      const mx = (m.x + T * 18 * m.speed) % (W + 20) - 10;
      const my = (m.y + Math.sin(T * 1.5 + m.p) * 20) % H;
      ctx.fillStyle = "rgba(255, 225, 140, .65)";
      ctx.beginPath(); ctx.arc(mx, my, 1.8, 0, 7); ctx.fill();
    }
  } else { // Mystical Aurora / Twilight Realm
    // Twinkling stars
    for (const s of stars) {
      ctx.globalAlpha = .4 + .6 * Math.abs(Math.sin(T * 1.8 + s.p));
      ctx.fillStyle = s.p % 3 === 0 ? "#80deea" : "#fff";
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;

    // Glowing full moon with atmospheric haze
    const moonX = 500, moonY = 85;
    const mgrad = ctx.createRadialGradient(moonX, moonY, 12, moonX, moonY, 110);
    mgrad.addColorStop(0, "rgba(230, 248, 255, .95)");
    mgrad.addColorStop(.35, "rgba(128, 222, 234, .35)");
    mgrad.addColorStop(1, "rgba(79, 195, 247, 0)");
    ctx.fillStyle = mgrad; ctx.beginPath(); ctx.arc(moonX, moonY, 110, 0, 7); ctx.fill();
    ctx.fillStyle = "#f5fcff"; ctx.beginPath(); ctx.arc(moonX, moonY, 26, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(130, 150, 205, .35)";
    ctx.beginPath(); ctx.arc(moonX - 7, moonY - 5, 5, 0, 7); ctx.arc(moonX + 9, moonY + 7, 4, 0, 7); ctx.fill();

    // Enchanted Aurora Ribbons
    ctx.save();
    for (let a = 0; a < 2; a++) {
      const aGrad = ctx.createLinearGradient(0, 60, W, 140);
      aGrad.addColorStop(0, "rgba(0, 242, 254, 0)");
      aGrad.addColorStop(.4, a === 0 ? "rgba(0, 206, 201, .16)" : "rgba(162, 155, 254, .18)");
      aGrad.addColorStop(.7, a === 0 ? "rgba(108, 92, 231, .18)" : "rgba(253, 121, 168, .14)");
      aGrad.addColorStop(1, "rgba(0, 206, 201, 0)");
      ctx.fillStyle = aGrad;
      ctx.beginPath();
      const wave = Math.sin(T * .8 + a) * 22;
      ctx.moveTo(0, 70 + wave);
      ctx.bezierCurveTo(180, 35 - wave, 360, 125 + wave, W, 65 - wave);
      ctx.lineTo(W, 145 - wave);
      ctx.bezierCurveTo(360, 185 + wave, 180, 95 - wave, 0, 135 + wave);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // Distant Mystical Mountains
    const ngrad1 = ctx.createLinearGradient(0, 100, 0, H);
    ngrad1.addColorStop(0, "rgba(36, 18, 68, .6)");
    ngrad1.addColorStop(1, "rgba(14, 7, 34, .9)");
    ctx.fillStyle = ngrad1;
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 175);
    ctx.bezierCurveTo(90, 125, 160, 165, 240, 135);
    ctx.bezierCurveTo(320, 105, 400, 155, 480, 120);
    ctx.bezierCurveTo(540, 90, 600, 140, W, 125);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

    // Midground Night Hills
    const ngrad2 = ctx.createLinearGradient(0, 160, 0, H);
    ngrad2.addColorStop(0, "rgba(17, 10, 38, .92)");
    ngrad2.addColorStop(1, "rgba(9, 5, 20, .98)");
    ctx.fillStyle = ngrad2;
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 215);
    ctx.bezierCurveTo(120, 180, 220, 235, 340, 200);
    ctx.bezierCurveTo(450, 170, 550, 225, W, 215);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

    // Enchanted crystalline sweeping trees
    drawPainterlyTree(115, 228, .95, true);
    drawPainterlyTree(375, 240, 1.15, true);
    drawPainterlyTree(575, 255, 1.0, true);

    // Bioluminescent floating spores / fireflies
    for (const m of ambientMotes) {
      const mx = (m.x + Math.sin(T * 1.2 + m.p) * 16) % W;
      const my = (m.y - T * 16 * m.speed + H) % H;
      const pulse = .4 + .6 * Math.abs(Math.sin(T * 2 + m.p));
      ctx.fillStyle = m.p % 2 === 0 ? `rgba(0, 242, 254, ${pulse * .8})` : `rgba(186, 104, 200, ${pulse * .8})`;
      ctx.beginPath(); ctx.arc(mx, my, 2.0, 0, 7); ctx.fill();
    }
  }
}

// Find lever and gate positions to draw connection beams
function getLeverAndGates() {
  let leverPos = null; const gates = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < levelCols; c++) {
    const t = level[r][c];
    if (t === "y") leverPos = { x: c * TILE + 16, y: r * TILE + OFFY + 14 };
    if (t === "Z" || t === "z") gates.push({ x: c * TILE + 16, y: r * TILE + OFFY + 16 });
  }
  return { leverPos, gates };
}

function drawTiles(w) {
  const P = PAL[w];

  // Draw ethereal energy beam connecting lever to gates (Reference Image 3 style!)
  const { leverPos, gates } = getLeverAndGates();
  if (leverPos && gates.length > 0) {
    ctx.save();
    for (const g of gates) {
      const wave = Math.sin(T * 5) * 4;
      ctx.strokeStyle = gateClosed ? "rgba(255, 107, 107, .35)" : "rgba(0, 206, 201, .45)";
      ctx.lineWidth = 2.5; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -T * 30;
      ctx.beginPath();
      ctx.moveTo(leverPos.x, leverPos.y);
      ctx.quadraticCurveTo((leverPos.x + g.x) / 2, Math.min(leverPos.y, g.y) - 20 + wave, g.x, g.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  const c0 = Math.max(0, Math.floor((camX - 32) / TILE));
  const c1 = Math.min(levelCols - 1, Math.ceil((camX + W + 32) / TILE));

  for (let r = 0; r < ROWS; r++) for (let c = c0; c <= c1; c++) {
    const t = level[r][c], x = c * TILE, y = r * TILE + OFFY;

    // Ghost tracks for saws / platforms
    if (MOVER_CH.includes(t)) {
      ctx.fillStyle = P.ghost;
      if ("kKhH".includes(t)) ctx.fillRect(x, y + 14, TILE, 4);
      else ctx.fillRect(x + 14, y, 4, TILE);
    }

    // Rail track for sliding purple blocks
    if (t === "m" || t === "M") {
      ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.fillRect(x, y + 13, TILE, 6);
      ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(x, y + 15, TILE, 2);
      ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(x + 14, y + 5, 4, 22);
    }

    // Sliding Purple Blocks
    if (t === "M") {
      const bx = x + (slideAnim[r + "_" + c] || 0);
      const mcol = w ? ["#e056fd", "#68139a"] : ["#9b5de5", "#4a1985"];
      // Base shadow & block
      ctx.fillStyle = mcol[1]; ctx.fillRect(bx, y, TILE, TILE);
      ctx.fillStyle = mcol[0]; ctx.fillRect(bx + 2, y + 2, TILE - 4, TILE - 6);
      // Highlight & rune arrows
      ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.fillRect(bx + 4, y + 4, TILE - 8, 3);
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.moveTo(bx + 6, y + 16); ctx.lineTo(bx + 12, y + 11); ctx.lineTo(bx + 12, y + 21); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx + 26, y + 16); ctx.lineTo(bx + 20, y + 11); ctx.lineTo(bx + 20, y + 21); ctx.fill();
    } else if (t === "#") { // Solid Terrain
      // Stone body
      ctx.fillStyle = P.solid; ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = P.solidHi; ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.fillRect(x, y + TILE - 3, TILE, 3);

      // Top fringe: organic grass / moss overhang if block above is open air
      const topOpen = r === 0 || tile(c, r - 1) !== "#";
      if (topOpen) {
        ctx.fillStyle = P.trim; ctx.fillRect(x, y, TILE, 5);
        ctx.fillStyle = P.trimHi; ctx.fillRect(x, y, TILE, 2);
        // Little grass tufts / crystal spikes on top
        for (let i = 2; i < TILE - 3; i += 7) {
          ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i + 2, y - 3); ctx.lineTo(x + i + 4, y); ctx.fill();
        }
      }
    } else if (t === "D" || t === "N") { // Day / Night Shift Blocks
      const active = (t === "D") === (w === 0);
      if (active) {
        ctx.fillStyle = P.mineDk; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = P.mine; ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fillRect(x + 4, y + 4, TILE - 8, 3);
        // Glowing celestial rune in center
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.moveTo(x + 16, y + 9); ctx.lineTo(x + 23, y + 16); ctx.lineTo(x + 16, y + 23); ctx.lineTo(x + 9, y + 16); ctx.closePath(); ctx.fill();
      } else { // Ethereal Ghost Outline
        ctx.strokeStyle = P.ghost; ctx.lineWidth = 1.6; ctx.setLineDash([4, 4]);
        ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6); ctx.setLineDash([]);
        ctx.fillStyle = P.ghost; ctx.beginPath(); ctx.arc(x + 16, y + 16, 2.5, 0, 7); ctx.fill();
      }
    } else if (t === "a" || t === "b") { // World-specific Crystalline Brambles
      const on = (t === "a") === (w === 0);
      for (let i = 0; i < 4; i++) {
        const bx = x + i * 8, by = y + TILE;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 4, by - 18); ctx.lineTo(bx + 8, by); ctx.closePath();
        if (on) {
          const spkGrad = ctx.createLinearGradient(bx, by, bx, by - 18);
          spkGrad.addColorStop(0, "#80150a"); spkGrad.addColorStop(1, w === 0 ? "#ff9f43" : "#ff7675");
          ctx.fillStyle = spkGrad; ctx.fill();
          ctx.fillStyle = "#fff"; ctx.fillRect(bx + 3, by - 14, 2, 8);
        } else {
          ctx.strokeStyle = P.ghost; ctx.lineWidth = 1.5; ctx.stroke();
        }
      }
    } else if (t === "T") { // Ceiling Spikes (Crimson Crystals)
      for (let i = 0; i < 4; i++) {
        const bx = x + i * 8, by = y;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 4, by + 18); ctx.lineTo(bx + 8, by); ctx.closePath();
        const spkGrad = ctx.createLinearGradient(bx, by, bx, by + 18);
        spkGrad.addColorStop(0, "#74111d"); spkGrad.addColorStop(1, "#ff6b6b");
        ctx.fillStyle = spkGrad; ctx.fill();
        ctx.fillStyle = "#fff"; ctx.fillRect(bx + 3, by + 4, 2, 7);
      }
    } else if (t === "S") { // Floor Spikes (Crimson Crystals)
      for (let i = 0; i < 4; i++) {
        const bx = x + i * 8, by = y + TILE;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 4, by - 18); ctx.lineTo(bx + 8, by); ctx.closePath();
        const spkGrad = ctx.createLinearGradient(bx, by, bx, by - 18);
        spkGrad.addColorStop(0, "#74111d"); spkGrad.addColorStop(1, "#ff6b6b");
        ctx.fillStyle = spkGrad; ctx.fill();
        ctx.fillStyle = "#fff"; ctx.fillRect(bx + 3, by - 13, 2, 7);
      }
    } else if (t === "J") { // Spring Pad (Launch Pedestal)
      const sq = Math.abs(Math.sin(T * 6)) * 2;
      ctx.fillStyle = "#1e3799"; ctx.fillRect(x + 3, y + TILE - 6, TILE - 6, 6);
      ctx.strokeStyle = "#00cec9"; ctx.lineWidth = 2.5; ctx.beginPath();
      ctx.moveTo(x + 8, y + TILE - 6); ctx.lineTo(x + 24, y + TILE - 12);
      ctx.lineTo(x + 8, y + TILE - 17 + sq); ctx.lineTo(x + 24, y + TILE - 21 + sq); ctx.stroke();
      ctx.fillStyle = "#55efc4"; ctx.fillRect(x + 5, y + TILE - 25 + sq, TILE - 10, 5);
      ctx.fillStyle = "#fff"; ctx.fillRect(x + 10, y + TILE - 24 + sq, TILE - 20, 2);
    } else if (t === "o") { // Thin / One-way Platform
      ctx.fillStyle = P.solidHi; ctx.fillRect(x, y, TILE, 8);
      ctx.fillStyle = P.trim; ctx.fillRect(x, y, TILE, 2);
      ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(x, y + 8, TILE, 2);
      ctx.fillStyle = "#fff"; for (let i = 4; i < TILE; i += 8) ctx.fillRect(x + i, y + 2, 3, 2);
    } else if (t === "Z" || t === "z") { // Gate (Runic Barrier)
      const isSolid = gateClosed === (t === "Z");
      if (isSolid) {
        ctx.fillStyle = "#2c2c54"; ctx.fillRect(x + 2, y, 5, TILE); ctx.fillRect(x + TILE - 7, y, 5, TILE);
        ctx.fillStyle = gateClosed ? "#ff6b6b" : "#4bcffa";
        ctx.fillRect(x + 7, y + 2, TILE - 14, TILE - 4);
        ctx.fillStyle = "#fff"; ctx.fillRect(x + 13, y + 6, 6, TILE - 12);
      } else {
        ctx.strokeStyle = P.ghost; ctx.lineWidth = 1.5; ctx.setLineDash([3, 5]);
        ctx.strokeRect(x + 6, y + 1, TILE - 12, TILE - 2); ctx.setLineDash([]);
      }
    } else if (t === "y") { // Lever (Antique Pedestal)
      ctx.fillStyle = "#333"; ctx.fillRect(x + 6, y + TILE - 8, TILE - 12, 8);
      const levCol = gateClosed ? "#ff6b6b" : "#00cec9";
      ctx.strokeStyle = levCol; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x + 16, y + TILE - 8); ctx.lineTo(x + (gateClosed ? 8 : 24), y + 10); ctx.stroke();
      ctx.lineCap = "butt";
      // Glowing orb handle
      ctx.fillStyle = levCol; ctx.beginPath(); ctx.arc(x + (gateClosed ? 8 : 24), y + 10, 5, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x + (gateClosed ? 7 : 23), y + 8, 2, 0, 7); ctx.fill();
    } else if (t === "*" || t === "1" || t === "2") { // Celestial, Solar, and Lunar Shards
      const active = t === "*" || (t === "1" && w === 0) || (t === "2" && w === 1);
      const bob = Math.sin(T * 4 + c * .5) * 3;
      const sx = x + 16, sy = y + 16 + bob;
      if (active) {
        const col = t === "1" ? "#f39c12" : t === "2" ? "#00cec9" : "#ffd166";
        const halo = t === "1" ? "rgba(243,156,18,.35)" : t === "2" ? "rgba(0,206,201,.35)" : "rgba(255,209,102,.35)";
        // Glowing halo
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(sx, sy, 14 + Math.sin(T * 6) * 2, 0, 7); ctx.fill();
        // Crystal diamond
        ctx.fillStyle = col; ctx.beginPath();
        ctx.moveTo(sx, sy - 9); ctx.lineTo(sx + 7, sy); ctx.lineTo(sx, sy + 9); ctx.lineTo(sx - 7, sy); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.beginPath();
        ctx.moveTo(sx, sy - 5); ctx.lineTo(sx + 3.5, sy); ctx.lineTo(sx, sy + 5); ctx.lineTo(sx - 3.5, sy); ctx.closePath(); ctx.fill();
        // Orbiting sparkle motes
        const sa = T * 3;
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(sx + Math.cos(sa) * 11, sy + Math.sin(sa) * 11, 1.5, 0, 7); ctx.fill();
      } else { // Inactive / ghost crystal in other world
        const gcol = t === "1" ? "rgba(243,156,18,.25)" : "rgba(0,206,201,.25)";
        ctx.strokeStyle = gcol; ctx.lineWidth = 1.5; ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(sx, sy - 8); ctx.lineTo(sx + 6, sy); ctx.lineTo(sx, sy + 8); ctx.lineTo(sx - 6, sy); ctx.closePath(); ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (t === "G") { // Sacred Celestial Archway Portal (Goal)
      const isSealed = shardsTotal > 0 && shardsCollected < shardsTotal;
      const pulse = Math.sin(T * 4) * 3;
      if (isSealed) { // Dormant / Sealed portal until all shards are gathered
        ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(x + 16, y + 14, 14, Math.PI, 0); ctx.lineTo(x + 30, y + 30); ctx.lineTo(x + 2, y + 30); ctx.closePath(); ctx.stroke();
        // Sealed core
        ctx.fillStyle = "rgba(255,107,107,.25)"; ctx.beginPath(); ctx.arc(x + 16, y + 16, 10, 0, 7); ctx.fill();
        ctx.fillStyle = "#ff7675"; ctx.beginPath(); ctx.arc(x + 16, y + 16, 4, 0, 7); ctx.fill();
        // Counter indicator over portal
        ctx.font = 'bold 9px "Trebuchet MS", sans-serif'; ctx.fillStyle = "#ff7675"; ctx.textAlign = "center";
        ctx.fillText(`${shardsCollected}/${shardsTotal}`, x + 16, y + 6);
      } else { // Awakened Portal
        // Outer portal aura
        ctx.fillStyle = "rgba(255, 230, 100, .2)"; ctx.beginPath(); ctx.arc(x + 16, y + 16, 22 + pulse, 0, 7); ctx.fill();
        // White celestial arch frame
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x + 16, y + 14, 14, Math.PI, 0); ctx.lineTo(x + 30, y + 30); ctx.lineTo(x + 2, y + 30); ctx.closePath(); ctx.stroke();
        // Inner glowing core
        ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(x + 16, y + 16, 8 + pulse * .5, 0, 7); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x + 16, y + 16, 4, 0, 7); ctx.fill();
        // Orbiting stardust motes
        for (let i = 0; i < 3; i++) {
          const oa = T * 3 + (i * Math.PI * 2 / 3), orad = 16 + pulse * .5;
          ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x + 16 + Math.cos(oa) * orad, y + 16 + Math.sin(oa) * orad, 1.8, 0, 7); ctx.fill();
        }
      }
    }
  }
}

// Hooded Traveler with Flowing Silk Scarf (Inspired by Degrees of Separation / Reference 2 & 3)
function drawPlayer(w) {
  const p = player, P = PAL[w];
  const sq = p.ground ? 1 : 1 + Math.min(.15, Math.abs(p.vy) / 4000);
  const cx = p.x + p.w / 2, by = p.y + p.h + OFFY;

  ctx.save(); ctx.translate(cx + pOff, by); ctx.scale(1 / sq, sq);

  // Soft drop shadow
  ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(0, -2, p.w * .45, 3.5, 0, 0, 7); ctx.fill();

  // Animated running legs
  const isMoving = p.ground && Math.abs(p.vx) > 30;
  const legCycle = isMoving ? Math.sin(T * 18) * 5 : 0;
  ctx.fillStyle = P.solid;
  ctx.fillRect(-6 + legCycle, -7, 4, 7);
  ctx.fillRect(2 - legCycle, -7, 4, 7);

  // Traveler's hooded cloak body
  ctx.fillStyle = P.player;
  rr(-p.w / 2 + 1, -p.h, p.w - 2, p.h - 6, 6); ctx.fill();

  // Flowing silk scarf with wind physics & trailing motion
  const scarfCol = P.scarf;
  const sdir = -p.face;
  const flutter1 = Math.sin(T * 12) * 3, flutter2 = Math.cos(T * 10) * 4;
  const trailX = sdir * (12 + Math.min(10, Math.abs(p.vx) / 25));

  ctx.save();
  ctx.strokeStyle = scarfCol; ctx.lineWidth = 4.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(0, -p.h + 12);
  ctx.quadraticCurveTo(trailX * .5, -p.h + 14 + flutter1, trailX, -p.h + 18 + flutter2);
  ctx.stroke();
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.beginPath();
  ctx.moveTo(0, -p.h + 12); ctx.quadraticCurveTo(trailX * .5, -p.h + 14 + flutter1, trailX, -p.h + 18 + flutter2); ctx.stroke();
  ctx.restore();

  // Scarf collar around neck
  ctx.fillStyle = scarfCol; rr(-p.w / 2 + 2, -p.h + 9, p.w - 4, 5, 2.5); ctx.fill();

  // Hood & Glowing Eyes
  const ex = p.face > 0 ? 2 : -7;
  ctx.fillStyle = "rgba(0,0,0,.35)"; rr(ex - 1, -p.h + 3, 9, 6, 2); ctx.fill();
  ctx.fillStyle = w === 0 ? "#00f2fe" : "#ffd166"; // Radiant glowing mystic eyes
  ctx.fillRect(ex + (p.face > 0 ? 3 : 0), -p.h + 5, 4, 3);
  ctx.fillStyle = "#fff"; ctx.fillRect(ex + (p.face > 0 ? 4 : 1), -p.h + 5, 2, 2);

  ctx.restore();
}

function drawMovers(w) {
  const P = PAL[w];
  for (const m of movers) {
    const q = mpos(m, moverT);
    if (m.kind === "saw") {
      ctx.save(); ctx.translate(q.x, q.y + OFFY); ctx.rotate(T * 10 * (w ? .5 : 1));
      // Outer saw blade teeth
      ctx.fillStyle = "#dfe6e9"; ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = i * Math.PI / 8, rr2 = i % 2 ? 9 : 15;
        ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
      }
      ctx.closePath(); ctx.fill();
      // Glowing core hub
      ctx.fillStyle = "#ff4757"; ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, 2, 0, 7); ctx.fill();
      ctx.restore();
    } else { // Floating Celestial Moving Platform
      rr(q.x, q.y + OFFY, 64, 12, 4); ctx.fillStyle = P.mineDk; ctx.fill();
      rr(q.x + 2, q.y + OFFY, 60, 8, 3); ctx.fillStyle = P.mine; ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillRect(q.x + 6, q.y + OFFY + 2, 52, 2);
    }
  }
}

// Boss: Menacing Void Shadow Colossus that sweeps across screen chasing traveler
function drawBoss(w) {
  if (!boss || !boss.active) return;
  const bx = boss.x;
  ctx.save();

  // 1. Swirling dark void fog wall
  const bgGrad = ctx.createLinearGradient(bx - 140, 0, bx + 55, 0);
  bgGrad.addColorStop(0, "rgba(5, 2, 12, 0.98)");
  bgGrad.addColorStop(0.65, "rgba(22, 6, 36, 0.92)");
  bgGrad.addColorStop(0.9, w === 0 ? "rgba(180, 20, 40, 0.35)" : "rgba(120, 30, 200, 0.35)");
  bgGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(bx - 360, 0, 420, H);

  // 2. Towering Colossus Silhouette & Spire Horns
  ctx.fillStyle = "rgba(10, 4, 18, 0.95)";
  ctx.beginPath();
  ctx.moveTo(bx - 60, H);
  ctx.lineTo(bx - 10, 80);
  ctx.lineTo(bx + 15, 40); // Main Horn
  ctx.lineTo(bx + 25, 95);
  ctx.lineTo(bx + 38, 140);
  ctx.lineTo(bx + 20, 220);
  ctx.lineTo(bx + 35, 280);
  ctx.lineTo(bx - 20, H);
  ctx.closePath();
  ctx.fill();

  // 3. Waving Segmented Void Tendrils with Ethereal Glowing Tips
  const tendrilCol = w === 0 ? "rgba(255, 71, 87, 0.85)" : "rgba(168, 85, 247, 0.85)";
  const glowCol = w === 0 ? "#ff4757" : "#c084fc";
  ctx.lineWidth = 4;
  for (let i = 0; i < 7; i++) {
    const ty = i * 50 + 15;
    const wave = Math.sin(T * 4.5 + i * 1.2) * 26;
    const wave2 = Math.cos(T * 3.2 + i * 0.9) * 18;
    ctx.strokeStyle = tendrilCol;
    ctx.beginPath();
    ctx.moveTo(bx - 30, ty);
    ctx.bezierCurveTo(bx + 18, ty - 20 + wave, bx + 36, ty + 20 + wave2, bx + 58 + Math.cos(T * 3 + i) * 14, ty + wave * 0.6);
    ctx.stroke();

    // Glowing tip spark
    ctx.fillStyle = glowCol;
    ctx.beginPath();
    ctx.arc(bx + 58 + Math.cos(T * 3 + i) * 14, ty + wave * 0.6, 3.5, 0, 7);
    ctx.fill();
  }

  // 4. Arcane Crackling Lightning Sparks
  if (Math.sin(T * 12) > 0.4) {
    ctx.strokeStyle = w === 0 ? "#ff6b81" : "#e056fd";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const sy = 100 + Math.sin(T * 7) * 80;
    ctx.moveTo(bx + 20, sy);
    ctx.lineTo(bx + 40, sy - 15);
    ctx.lineTo(bx + 35, sy - 5);
    ctx.lineTo(bx + 60, sy - 20);
    ctx.stroke();
  }

  // 5. Giant Menacing Predatory Eyes with Slit Pupils & Glowing Iris Rings
  const eyeBaseY = 135 + Math.sin(T * 2.5) * 8;
  const eyeCol = w === 0 ? "#ff0055" : "#a855f7";
  const eyeCore = w === 0 ? "#ffdd59" : "#ffffff";

  // Outer demonic aura glow
  ctx.save();
  ctx.shadowColor = eyeCol;
  ctx.shadowBlur = 18;

  // Eye 1 (Primary large eye)
  ctx.fillStyle = eyeCol;
  ctx.beginPath();
  ctx.arc(bx + 22, eyeBaseY, 11, 0, 7);
  ctx.fill();

  // Eye 2 (Upper secondary eye)
  ctx.beginPath();
  ctx.arc(bx + 16, eyeBaseY - 22, 7.5, 0, 7);
  ctx.fill();

  // Eye 3 (Lower tertiary eye)
  ctx.beginPath();
  ctx.arc(bx + 12, eyeBaseY + 24, 6, 0, 7);
  ctx.fill();
  ctx.restore();

  // Inner bright iris & pupils
  ctx.fillStyle = eyeCore;
  ctx.beginPath();
  ctx.arc(bx + 24, eyeBaseY, 4.5, 0, 7);
  ctx.arc(bx + 18, eyeBaseY - 22, 3, 0, 7);
  ctx.arc(bx + 14, eyeBaseY + 24, 2.2, 0, 7);
  ctx.fill();

  // Vertical slit pupil
  ctx.fillStyle = "#110418";
  ctx.fillRect(bx + 23.5, eyeBaseY - 6, 2, 12);
  ctx.fillRect(bx + 17.5, eyeBaseY - 25, 1.6, 6);

  ctx.restore();
}

function drawTouchControls() {
  // Only render on-screen touch buttons if this is an actual touch mobile device or touch event was used
  if (!isTouchDevice && !hasTouch) return;
  ctx.save();
  // D-Pad Left / Right
  panel(12, H - 76, 128, 62, "rgba(20, 15, 38, 0.65)", "rgba(255, 255, 255, 0.3)");
  text("◀", 44, H - 38, 26, keys["ArrowLeft"] ? "#ffd166" : "#fff");
  text("▶", 108, H - 38, 26, keys["ArrowRight"] ? "#ffd166" : "#fff");

  // Action Buttons: SHIFT and JUMP
  panel(W - 152, H - 76, 62, 62, "rgba(20, 15, 38, 0.65)", "rgba(0, 206, 201, 0.5)");
  text("SHIFT", W - 121, H - 38, 12, pressed["ShiftLeft"] ? "#00cec9" : "#fff");

  panel(W - 78, H - 76, 66, 62, "rgba(20, 15, 38, 0.65)", "rgba(255, 209, 102, 0.5)");
  text("JUMP", W - 45, H - 38, 14, keys["Space"] ? "#ffd166" : "#fff");

  // Top Utility Bar Quick Touch Icons (Using geometric vector symbols instead of emojis)
  panel(W - 152, 4, 32, 26, "rgba(20, 15, 38, 0.65)"); text("⌂", W - 136, 22, 16, "#fff"); // Home
  panel(W - 116, 4, 32, 26, "rgba(20, 15, 38, 0.65)"); text("↻", W - 100, 22, 16, "#fff"); // Restart
  panel(W - 80, 4, 32, 26, "rgba(20, 15, 38, 0.65)"); text("⛶", W - 64, 22, 14, "#fff"); // Fullscreen
  panel(W - 44, 4, 32, 26, "rgba(20, 15, 38, 0.65)"); text(A.muted ? "✕" : "♪", W - 28, 22, 14, "#fff"); // Audio
  ctx.restore();
}

function drawScene(w) {
  drawBg(w);
  ctx.save();
  ctx.translate(-Math.round(camX), 0);
  drawTiles(w);
  drawMovers(w);
  drawBoss(w);
  if (showPlayer()) drawPlayer(w);
  ctx.restore();
}

function drawHud() {
  const P = PAL[world];
  panel(6, 6, W - 12, 28, "rgba(12, 8, 28, .85)", P.accent);

  // Left: Level Number / Name
  text(LEVELS[li].name, 16, 25, 12, "#fff", "left", true, FONT_HEADER);

  // Center: World Name & Celestial Icon
  worldIcon(world, W / 2 - 40, 20, 7);
  text(world ? "NIGHT" : "DAY", W / 2 - 28, 25, 12, P.accent, "left", true, FONT_HEADER);

  // Mid-Right items: Shifts budget & Shards
  let infoX = W / 2 + 30;
  if (isFinite(budget)) {
    const shiftCol = budget <= 2 ? "#ff7675" : "#c0c6ff";
    text(`Shifts: ${budget}`, infoX, 25, 11, shiftCol, "left");
    infoX += 65;
  }

  if (shardsTotal > 0) {
    const shCol = shardsCollected >= shardsTotal ? "#55efc4" : "#ffd166";
    text(`★ ${shardsCollected}/${shardsTotal}`, infoX, 25, 11, shCol, "left");
  }

  // Epic Boss Encounter HUD & Distance Meter Bar
  if (boss && boss.active) {
    const dist = Math.max(0, Math.round((player.x - boss.x) / TILE));
    const isCritical = dist < 7;
    const isWarning = dist < 14;
    const bCol = isCritical ? "#ff4757" : isWarning ? "#ffa502" : "#ffd166";
    const pulse = isCritical ? Math.sin(T * 10) * 0.4 + 0.6 : 1;

    // Boss Threat Bar (Obsidian Glass with glowing frame)
    const bw = 270, bh = 28, bx0 = W / 2 - bw / 2, by0 = 36;
    panel(bx0, by0, bw, bh, "rgba(14, 6, 24, 0.94)", isCritical ? `rgba(255, 71, 87, ${pulse})` : "rgba(255, 165, 2, 0.8)");

    // Header: Boss Name in Cinzel with Skull/Rune Crest
    const bName = boss.name.toUpperCase();
    text(`☠  ${bName}`, bx0 + 10, by0 + 12, 10, bCol, "left", true, FONT_HEADER);

    // Escape Distance Readout
    const distText = dist <= 3 ? "CRITICAL!" : `${dist}m`;
    text(distText, bx0 + bw - 10, by0 + 12, 10, bCol, "right", true, FONT_BODY);

    // Mini Progress Meter Gauge (tracks the closing gap)
    const gw = bw - 20, gh = 5, gx0 = bx0 + 10, gy0 = by0 + 17;
    rr(gx0, gy0, gw, gh, 2.5);
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)"; ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)"; ctx.lineWidth = 1; ctx.stroke();

    // Fill gauge based on relative safety (clamp 0..22m)
    const fillRatio = Math.max(0.04, Math.min(1, dist / 22));
    const fillW = gw * fillRatio;
    rr(gx0, gy0, fillW, gh, 2.5);
    const gGrad = ctx.createLinearGradient(gx0, gy0, gx0 + fillW, gy0);
    if (isCritical) {
      gGrad.addColorStop(0, "#800020"); gGrad.addColorStop(1, "#ff4757");
    } else if (isWarning) {
      gGrad.addColorStop(0, "#ff4757"); gGrad.addColorStop(1, "#ffa502");
    } else {
      gGrad.addColorStop(0, "#ffa502"); gGrad.addColorStop(1, "#2ed573");
    }
    ctx.fillStyle = gGrad; ctx.fill();

    // Mini markers on gauge: Boss Skull on left, Player Gem on right
    text("☠", gx0 - 2, gy0 + 5, 8, "#ff4757", "right", false);
    text("✦", gx0 + fillW, gy0 + 5, 8, "#fff", "center", false);

    // If critical threat (< 7m), draw pulsing screen-edge danger vignette
    if (isCritical) {
      ctx.save();
      const vGrad = ctx.createRadialGradient(W / 2, H / 2, H / 3, W / 2, H / 2, W * 0.7);
      vGrad.addColorStop(0, "rgba(255, 0, 50, 0)");
      vGrad.addColorStop(1, `rgba(255, 0, 50, ${0.28 * pulse})`);
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // Right: Deaths & Level Timer
  const statOff = (isTouchDevice || hasTouch) ? 160 : 16;
  text(`Deaths: ${deaths}`, W - statOff - 65, 25, 11, "#cbd5e1", "right");
  text(levelTime.toFixed(1) + "s", W - statOff, 25, 12, "#fff", "right");

  if (!isTouchDevice && !hasTouch && A.muted) text("MUTED", W - 16, 48, 10, "#ff7675", "right");
}
function drawBanner() {
  if (banner <= 0) return;
  const isBoss = LEVELS[li].boss;
  const t = banner, a = Math.min(1, t * 3, (2.6 - t) * 4), y = 50 + (1 - a) * -30;
  ctx.save();
  ctx.globalAlpha = Math.max(0, a);

  if (isBoss) {
    const bw = 460, bh = 64;
    panel(W / 2 - bw / 2, y, bw, bh, "rgba(24, 6, 32, 0.94)", "#ff4757");
    text(`☠  BOSS PURSUIT: ${LEVELS[li].bossName || LEVELS[li].name}  ☠`, W / 2, y + 26, 17, "#ff4757", "center", true, FONT_TITLE);
    text("RUN! Shift worlds, leap across chasms, and reach the Runic Gate!", W / 2, y + 48, 11, "#ffd166", "center", true, FONT_HEADER);
  } else {
    ctx.font = `12px ${FONT_BODY}`;
    const bw = Math.max(300, ctx.measureText(LEVELS[li].hint).width + 50);
    panel(W / 2 - bw / 2, y, bw, 56, "rgba(10,8,30,.8)", "#ffd166");
    text(LEVELS[li].name, W / 2, y + 24, 20, "#fff", "center", true, FONT_HEADER);
    text(LEVELS[li].hint, W / 2, y + 44, 12, "#cde", "center", false, FONT_BODY);
  }
  ctx.restore();
}
function drawToast() {
  if (msgT <= 0) return;
  ctx.globalAlpha = Math.min(1, msgT * 3); ctx.font = "bold 13px sans-serif";
  const w = ctx.measureText(msg).width + 30; panel(W / 2 - w / 2, H - 38, w, 26, "rgba(120,10,20,.85)", "rgba(255,150,160,.6)");
  text(msg, W / 2, H - 20, 13, "#fff"); ctx.globalAlpha = 1;
}
function drawFlag(lang, x, y, w = 18, h = 12) {
  ctx.save();
  ctx.translate(x, y);
  // border & base
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  if (lang === "id") {
    // Indonesian Flag: Red top half, White bottom half
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(-w / 2, -h / 2, w, h / 2);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-w / 2, 0, w, h / 2);
  } else {
    // UK / English Flag: Navy base with red and white cross
    ctx.fillStyle = "#09255c";
    ctx.fillRect(-w / 2, -h / 2, w, h);
    // White diagonals and cross
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-w / 2, -1.5, w, 3);
    ctx.fillRect(-1.5, -h / 2, 3, h);
    // Red cross
    ctx.fillStyle = "#c0392b";
    ctx.fillRect(-w / 2, -0.8, w, 1.6);
    ctx.fillRect(-0.8, -h / 2, 1.6, h);
  }
  ctx.restore();
}

function drawTitle() {
  const P = PAL[world], bob = Math.sin(T * 2) * 3;
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.shadowColor = P.accent; ctx.shadowBlur = 32;
  text("SHIFT", W / 2, 94 + bob, 72, "#fff", "center", true, FONT_TITLE); ctx.restore();
  text("SHIFT", W / 2, 94 + bob, 72, "#fff", "center", false, FONT_TITLE);
  worldIcon(0, W / 2 - 96, 122, 9); worldIcon(1, W / 2 + 96, 122, 9);
  text("swap the world. slide the floor.", W / 2, 126, 12, "#ffd166", "center", true, FONT_HEADER);

  // Language & Country Badge in top-left with real flag icon
  const curLang = (typeof I18N !== "undefined") ? I18N.lang : "id";
  const flagLabel = curLang === "id" ? "INDONESIA" : "ENGLISH";
  panel(14, 8, 108, 22, "rgba(10,8,30,.88)", "#ffd166");
  drawFlag(curLang, 28, 19, 18, 11);
  text(flagLabel, 72, 23, 10, "#fff", "center", true, FONT_HEADER);

  // Player Profile Pill in top-right
  const pname = (typeof PlayerProfile !== "undefined") ? PlayerProfile.name : "Gamer";
  const pav = (typeof PlayerProfile !== "undefined" && PlayerProfile.avatarObj) ? PlayerProfile.avatarObj.symbol : "✦";
  panel(W - 132, 8, 118, 22, "rgba(10,8,30,.88)", P.accent);
  text(`${pav} ${pname}`, W - 73, 23, 11, "#ffd166", "center", true, FONT_HEADER);

  // Main menu items
  const items = [
    ["SPACE", (typeof I18N !== "undefined") ? I18N.t("play") : "Play Game"],
    ["L", (typeof I18N !== "undefined") ? I18N.t("levelSelect") : "Level Select"],
    ["H", (typeof I18N !== "undefined") ? I18N.t("comicStory") : "Tentang Game"],
    ["B", (typeof I18N !== "undefined") ? I18N.t("leaderboard") : "Papan Skor"],
    ["T", curLang === "id" ? "Ganti Bahasa (English)" : "Switch Language (Indonesia)"]
  ];
  items.forEach(([k, l], i) => {
    const y = 152 + i * 27, pulse = i === 0 ? .5 + .5 * Math.sin(T * 5) : 0;
    panel(W / 2 - 145, y - 18, 290, 24, i === 0 ? `rgba(255,255,255,${.14 + pulse * .14})` : "rgba(10,8,30,.55)", i === 0 ? "#ffd166" : "rgba(255,255,255,.2)");
    keycap(k, W / 2 - 135, y, 42); text(l, W / 2 + 16, y, 12, "#fff", "center", true, FONT_HEADER);
  });

  // Controls hint panel
  panel(W / 2 - 215, 294, 430, 20, "rgba(8,5,20,.65)", "rgba(255,255,255,.15)");
  text("SHIFT / E: Swap World    SPACE: Jump    A / D / ◀ ▶: Move    F: Fullscreen", W / 2, 308, 10, "#c0c6ff", "center", false);

  // Clean Footer with full credits
  panel(W / 2 - 240, 320, 480, 24, "rgba(14,9,32,.85)", P.accent);
  text("GitHub Game Off 2026 Entry  •  Crafted by github.com/rachmatsumo", W / 2, 336, 11, "#fff", "center", false);
}

function drawComic() {
  ctx.fillStyle = "rgba(4, 2, 12, 0.96)"; ctx.fillRect(0, 0, W, H);
  panel(W / 2 - 270, 15, 540, 330, "rgba(15, 9, 32, 0.98)", "#ffd166");

  const title = (typeof I18N !== "undefined") ? I18N.t("comicTitle") : "CHRONICLES OF THE TWILIGHT WEAVER";
  text(title, W / 2, 38, 16, "#ffd166", "center", true, FONT_HEADER);

  const pages = (typeof I18N !== "undefined") ? I18N.pages : [];
  const curPage = pages[comicPage] || { title: "", text: "" };
  const curImg = comicImages[comicPage];

  // Draw 16:9 Comic Panel Artwork
  const imgW = 280, imgH = 158, imgX = W / 2 - imgW / 2, imgY = 52;
  panel(imgX - 3, imgY - 3, imgW + 6, imgH + 6, "rgba(0,0,0,0.8)", "#ffd166");
  if (curImg && curImg.complete && curImg.naturalWidth > 0) {
    ctx.drawImage(curImg, imgX, imgY, imgW, imgH);
  } else {
    // Fallback scenic gradient
    const g = ctx.createLinearGradient(imgX, imgY, imgX + imgW, imgY + imgH);
    g.addColorStop(0, "#f39c12"); g.addColorStop(1, "#3a1758");
    ctx.fillStyle = g; ctx.fillRect(imgX, imgY, imgW, imgH);
    text("Loading Comic Art...", W / 2, imgY + imgH / 2, 13, "#fff");
  }

  // Comic caption box
  panel(W / 2 - 240, 222, 480, 68, "rgba(8, 5, 20, 0.85)", "rgba(255,255,255,0.2)");
  text(curPage.title, W / 2, 238, 13, "#ffd166", "center", true, FONT_HEADER);

  // Word-wrap caption
  const maxWidth = 450;
  const words = curPage.text.split(" ");
  let line = "", ly = 256;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    ctx.font = `11px ${FONT_BODY}`;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      text(line, W / 2, ly, 11, "#cbd5e1", "center", false);
      line = words[n] + " ";
      ly += 15;
    } else {
      line = testLine;
    }
  }
  text(line, W / 2, ly, 11, "#cbd5e1", "center", false);

  // Navigation Buttons
  if (comicPage > 0) {
    panel(W / 2 - 200, 302, 90, 24, "rgba(255,255,255,0.12)", "#ffd166");
    text("◀ Prev", W / 2 - 155, 318, 11, "#fff", "center", true, FONT_HEADER);
  }
  if (comicPage < pages.length - 1) {
    panel(W / 2 + 110, 302, 90, 24, "rgba(255,255,255,0.12)", "#ffd166");
    text("Next ▶", W / 2 + 155, 318, 11, "#ffd166", "center", true, FONT_HEADER);
  } else {
    panel(W / 2 + 90, 302, 110, 24, "rgba(46, 204, 113, 0.3)", "#2ecc71");
    text("Start Playing ▶", W / 2 + 145, 318, 11, "#2ecc71", "center", true, FONT_HEADER);
  }

  panel(W / 2 - 50, 302, 100, 24, "rgba(255,255,255,0.08)", "rgba(255,255,255,0.2)");
  text("Close (ESC)", W / 2, 318, 11, "#fff");
}

function drawLore() {
  drawComic();
}

function drawLeaderboard() {
  ctx.fillStyle = "rgba(6, 4, 15, 0.94)"; ctx.fillRect(0, 0, W, H);
  panel(W / 2 - 250, 25, 500, 310, "rgba(18, 12, 38, 0.96)", "#ffd166");
  text("HALL OF FAME: LEADERBOARD", W / 2, 54, 18, "#ffd166", "center", true, FONT_HEADER);

  const scores = (typeof Leaderboard !== "undefined") ? Leaderboard.getScores() : [];

  // Table Header
  panel(W / 2 - 230, 68, 460, 22, "rgba(255,255,255,0.08)", "rgba(255,255,255,0.15)");
  text("RANK", W / 2 - 200, 83, 11, "#ffd166", "center", false);
  text("PLAYER", W / 2 - 120, 83, 11, "#ffd166", "left", false);
  text("LEVEL", W / 2 + 10, 83, 11, "#ffd166", "center", false);
  text("STARS", W / 2 + 70, 83, 11, "#ffd166", "center", false);
  text("TIME", W / 2 + 140, 83, 11, "#ffd166", "center", false);
  text("DEATHS", W / 2 + 200, 83, 11, "#ffd166", "center", false);

  // Table Rows (Top 7)
  const displayRows = scores.slice(0, 7);
  displayRows.forEach((s, idx) => {
    const y = 100 + idx * 25;
    const isTop3 = idx < 3;
    const rankCol = idx === 0 ? "#ffd166" : idx === 1 ? "#dfe6e9" : idx === 2 ? "#e67e22" : "#999";
    panel(W / 2 - 230, y - 8, 460, 22, isTop3 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.2)", "rgba(255,255,255,0.08)");

    const cFlag = `[${s.country || "GL"}]`;
    const avSymbol = s.avatar === "solar" ? "☼" : s.avatar === "lunar" ? "☽" : s.avatar === "cosmic" ? "★" : s.avatar === "knight" ? "◈" : "✦";

    text(`#${idx + 1}`, W / 2 - 200, y + 7, 11, rankCol, "center", false);
    text(`${cFlag} ${avSymbol} ${s.name}`, W / 2 - 120, y + 7, 11, "#fff", "left", false);
    text(`Lv ${s.level}`, W / 2 + 10, y + 7, 11, "#00cec9", "center", false);
    text(`★ ${s.stars}`, W / 2 + 70, y + 7, 11, "#ffd166", "center", false);
    text(`${s.time}s`, W / 2 + 140, y + 7, 11, "#fff", "center", false);
    text(`${s.deaths}`, W / 2 + 200, y + 7, 11, s.deaths === 0 ? "#55efc4" : "#ff7675", "center", false);
  });

  if (displayRows.length === 0) {
    text("Belum ada skor tercatat. Selesaikan level untuk masuk papan skor!", W / 2, 160, 12, "#cbd5e1");
  }

  panel(W / 2 - 110, 298, 220, 24, "rgba(255,255,255,0.12)", "#ffd166");
  text("Klik / Tekan ESC untuk Kembali", W / 2, 314, 11, "#fff");
}
const SELCOLS = 7, SELPER = 21;
function drawSelect() {
  ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, W, H);
  text("SELECT LEVEL", W / 2, 38, 24, "#fff", "center", true, FONT_HEADER);

  // Top Back Button for mobile / mouse
  panel(14, 10, 84, 30, "rgba(255,255,255,0.18)", "#ffd166");
  text("◀ Back", 56, 30, 13, "#ffd166", "center", true, FONT_HEADER);

  const n = LEVELS.length, cols = SELCOLS, cw = 76, ch = 66, gap = 10, x0 = (W - (cols * cw + (cols - 1) * gap)) / 2;
  const page = Math.floor(cursor / SELPER), pages = Math.ceil(n / SELPER), first = page * SELPER;
  for (let j = 0; j < SELPER && first + j < n; j++) {
    const i = first + j, x = x0 + (j % cols) * (cw + gap), y = 58 + Math.floor(j / cols) * (ch + gap), locked = i > save.unlocked, sel = i === cursor, b = save.best[i];
    const off = sel ? Math.sin(T * 8) * 1.5 - 3 : 0;
    panel(x, y + off, cw, ch, locked ? "rgba(10,8,30,.55)" : "rgba(30,25,80,.7)", sel ? "#ffd166" : "rgba(255,255,255,.2)");
    text(String(i + 1), x + cw / 2, y + off + 30, 26, locked ? "#888" : "#fff");
    if (locked) text("LOCKED", x + cw / 2, y + off + 54, 10, "#999", "center", false);
    else for (let s = 0; s < 3; s++) star(x + cw / 2 - 16 + s * 16, y + off + 50, 6, b && b.stars > s);
  }

  // Page switcher buttons for touch/mobile
  if (pages > 1) {
    if (page > 0) {
      panel(W - 180, 10, 76, 30, "rgba(255,255,255,0.18)", "#ffd166");
      text("◀ Prev", W - 142, 30, 12, "#fff", "center", true, FONT_HEADER);
    }
    if (page < pages - 1) {
      panel(W - 96, 10, 82, 30, "rgba(255,255,255,0.18)", "#ffd166");
      text("Next ▶", W - 55, 30, 12, "#ffd166", "center", true, FONT_HEADER);
    }
    text(`Page ${page + 1}/${pages}`, W / 2, H - 42, 11, "#cde", "center", false);
  }

  const sl = LEVELS[Math.min(cursor, n - 1)];
  text(cursor > save.unlocked ? "Locked: clear the previous level" : sl.name, W / 2, H - 26, 13, "#ffd166", "center", true, FONT_HEADER);
  text("◀ Slide / Swipe Halaman ▶   •   Tap Level untuk Main", W / 2, H - 10, 10, "rgba(255,255,255,.65)", "center", false);
}
function drawPause() {
  ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, 0, W, H);
  panel(W / 2 - 130, 80, 260, 190); text("PAUSED", W / 2, 116, 26, "#fff", "center", true, FONT_HEADER);
  [
    ["P / ESC", "Resume Game"],
    ["R", "Restart Level"],
    ["Q", "Level Select"],
    ["X", "Quit to Main Menu"],
    ["M", A.muted ? "Sound: off" : "Sound: on"]
  ].forEach(([k, l], i) => {
    keycap(k, W / 2 - 105, 146 + i * 23, 44); text(l, W / 2 - 50, 146 + i * 23, 13, "#fff", "left");
  });
}
function drawWin(final) {
  ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, 0, W, H);
  const pop = Math.min(1, winT * 4), h = final ? 200 : 180; ctx.save(); ctx.translate(W / 2, 180); ctx.scale(.8 + .2 * pop, .8 + .2 * pop); ctx.translate(-W / 2, -180);
  panel(W / 2 - 160, 180 - h / 2, 320, h, "rgba(15,10,50,.88)", "#ffd166");
  text(final ? "ALL LEVELS CLEARED!" : "LEVEL CLEAR!", W / 2, 180 - h / 2 + 38, final ? 24 : 28, "#ffd166", "center", true, FONT_HEADER);
  for (let s = 0; s < 3; s++) { const shown = winT > .35 + s * .3; const sc = shown ? 1 + Math.max(0, .5 - (winT - .35 - s * .3) * 2) : 0; star(W / 2 - 44 + s * 44, 180 - h / 2 + 76, 17 * sc, s < winStars); }
  text(`Time ${levelTime.toFixed(1)}s${newBest ? "  - NEW BEST!" : ""}`, W / 2, 180 - h / 2 + 118, 14, "#fff");
  text(`Deaths ${levelDeaths}`, W / 2, 180 - h / 2 + 138, 14, "#fff");
  if (final) text(`Total ${time.toFixed(1)}s, ${deaths} deaths`, W / 2, 180 - h / 2 + 158, 13, "#cde");
  if (Math.sin(T * 6) > -.3) text(final ? "SPACE: title screen" : "SPACE: next level", W / 2, 180 + h / 2 - 12, 14, "#fff");
  ctx.restore();
}

function draw() {
  ctx.save();
  if (cv && cv.width) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    const sX = cv.width / W, sY = cv.height / H;
    ctx.scale(sX, sY);
  }
  if (shake > 0) ctx.translate((Math.random() - .5) * 8 * shake / .3, (Math.random() - .5) * 8 * shake / .3);
  if (shiftT > 0) {
    drawScene(prevWorld); ctx.save();
    const prog = 1 - shiftT, R = (1 - Math.pow(1 - prog, 3)) * 760;
    ctx.beginPath(); ctx.arc(shiftX - Math.round(camX), shiftY, R, 0, 7); ctx.clip(); drawScene(world); ctx.restore();
    // Shimmering celestial shockwave ring
    ctx.save();
    ctx.strokeStyle = world === 0 ? `rgba(243, 156, 18, ${shiftT})` : `rgba(0, 206, 201, ${shiftT})`;
    ctx.lineWidth = 6 * shiftT + 2; ctx.beginPath(); ctx.arc(shiftX - Math.round(camX), shiftY, R, 0, 7); ctx.stroke();
    ctx.strokeStyle = `rgba(255, 255, 255, ${shiftT})`; ctx.lineWidth = 2 * shiftT + 1; ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI / 6) + T * 3;
      ctx.fillStyle = `rgba(255, 255, 255, ${shiftT * .8})`;
      ctx.beginPath(); ctx.arc(shiftX - Math.round(camX) + Math.cos(a) * R, shiftY + Math.sin(a) * R, 2.5, 0, 7); ctx.fill();
    }
    ctx.restore();
  } else drawScene(world);
  ctx.save();
  ctx.translate(-Math.round(camX), 0);
  for (const q of particles) { ctx.globalAlpha = Math.max(0, q.life); ctx.fillStyle = q.col; ctx.fillRect(q.x, q.y + OFFY, 4, 4); }
  ctx.restore();
  ctx.globalAlpha = 1;
  if (state === "title") drawTitle();
  else if (state === "select") drawSelect();
  else if (state === "lore") drawLore();
  else if (state === "leaderboard") drawLeaderboard();
  else { drawHud(); drawBanner(); drawToast(); drawTouchControls(); }
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
    if (hit("Space", "Enter")) {
      A.click();
      if (typeof PlayerProfile !== "undefined" && !PlayerProfile.isConfigured) {
        openProfileModal(() => { deaths = 0; time = 0; startLevel(0); });
      } else {
        deaths = 0; time = 0; startLevel(0);
      }
    }
    else if (hit("KeyL")) { A.click(); cursor = save.unlocked; setState("select"); load(0, false); }
    else if (hit("KeyH")) { A.click(); comicPage = 0; setState("lore"); }
    else if (hit("KeyB")) { A.click(); showLeaderboard(); }
    else if (hit("KeyT")) { A.click(); if (typeof I18N !== "undefined") I18N.toggleLang(); }
  } else if (state === "lore") {
    const pages = (typeof I18N !== "undefined") ? I18N.pages : [];
    if (hit("ArrowLeft", "KeyA") && comicPage > 0) { A.click(); comicPage--; }
    else if (hit("ArrowRight", "KeyD", "Space", "Enter")) {
      if (comicPage < pages.length - 1) { A.click(); comicPage++; }
      else { A.click(); setState("title"); startLevel(0); }
    }
    else if (hit("Escape", "KeyH")) { A.back(); setState("title"); }
  } else if (state === "leaderboard") {
    if (hit("Escape", "Space", "Enter", "KeyB")) { A.back(); setState("title"); }
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
    if (hit("KeyX")) { A.back(); setState("title"); load(0, false); }
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
  setBudget(n) { budget = n; },
  start(i) { deaths = 0; levelDeaths = 0; load(i, true); state = "play"; banner = 0; fade = 0; particles.length = 0; },
  snap: () => ({ p: { ...player }, lv: level.map(r => r.slice()), dirs: runs.map(r => r.dir), world, budget, deaths, stepT, gate: gateClosed, mt: moverT, sc: shardsCollected, sh: shards.map(s => s.collected) }),
  restore(s) { player = { ...s.p }; level = s.lv.map(r => r.slice()); runs.forEach((r, i) => r.dir = s.dirs[i]); world = s.world; gateClosed = s.gate; moverT = s.mt; stepMovers(0); budget = s.budget; deaths = s.deaths; stepT = s.stepT; shardsCollected = s.sc || 0; if (s.sh) shards.forEach((sh, idx) => sh.collected = s.sh[idx]); state = "play"; },
  info: () => ({ ride: player.ride, mt: moverT, movers: movers.length > 0, gate: gateClosed, x: player.x, y: player.y, vx: player.vx, vy: player.vy, ground: player.ground, world, budget, state, deaths, sc: shardsCollected, grid: runs.map(r => level[r.r].join("")).join("|") + runs.map(r => r.dir).join("") + +gateClosed + +!!player.pad + +!!player.onLever + shardsCollected }),
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
if (typeof window !== "undefined") {
  if (typeof I18N !== "undefined") I18N.init();
}
load(0, false);
requestAnimationFrame(frame);
})();
