#!/usr/bin/env node
// Captures README screenshots into docs/ using puppeteer + system Chrome (serves the repo on a local port).
// Usage: NODE_PATH=$(npm root -g) node tools/screenshots.js
const puppeteer = require("puppeteer"), http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), OUT = path.join(ROOT, "docs");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2", ".ttf": "font/ttf" };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0]).replace(/^\/$/, "/index.html"));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(r);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await new Promise(r => srv.listen(0, r)); const url = `http://localhost:${srv.address().port}/index.html`;
  const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
  const pg = await b.newPage(); await pg.setViewport({ width: 1280, height: 720 });
  await pg.evaluateOnNewDocument(() => {
    localStorage.setItem("shift_player_profile", JSON.stringify({ name: "Weaver", avatar: "weaver", country: "ID", countryName: "Indonesia", initialized: true }));
    localStorage.setItem("shift_save", JSON.stringify({ unlocked: 49, legit: 49, best: Object.fromEntries([...Array(12).keys()].map(i => [i, { time: 20 + i, stars: 3 - (i % 3) }])) }));
    localStorage.setItem("shift_muted", "1");
  });
  await pg.goto(url, { waitUntil: "load" }); await sleep(1800);
  const shot = async n => { await pg.screenshot({ path: path.join(OUT, n + ".png") }); console.log("saved", n); };
  const key = async (k, ms = 80) => { await pg.keyboard.down(k); await sleep(ms); await pg.keyboard.up(k); };
  await shot("title");
  await key("KeyL"); await sleep(600); await shot("level-select");
  await key("Escape"); await sleep(400);
  // level 1 -> play a few seconds, then shift
  await key("Space"); await sleep(3200);
  await pg.keyboard.down("ArrowRight"); await sleep(900); await key("Space", 120); await sleep(350); await key("ShiftLeft"); await sleep(500); await shot("gameplay-night");
  await pg.keyboard.up("ArrowRight");
  // boss chase: level 5 via level select
  await key("Escape"); await sleep(300); await key("KeyQ"); await sleep(500);
  for (let i = 0; i < 4; i++) await key("ArrowRight", 40);
  await key("Enter"); await sleep(3300); await shot("boss-chase"); // boss closing in from the left
  await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
