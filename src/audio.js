// Procedural audio: no asset files. SFX + a two-voice music loop whose voices
// crossfade when the world shifts (bright pentatonic by day, dark minor by night).
const Audio8 = (() => {
  let ac, master, sfxG, musG, dayG, nightG, noiseBuf, timer;
  let muted = false, world = 0, step = 0, nextT = 0, duck = 1;
  try { muted = localStorage.getItem("shift_muted") === "1"; } catch {}

  const DAY = [0, 2, 4, 7, 9], NIGHT = [0, 3, 5, 7, 10];
  const hz = s => 261.63 * Math.pow(2, s / 12);
  const dayPat = [0, 2, 4, 2, 1, 3, 4, 3, 0, 2, 4, 2, 3, 1, 2, -1];
  const nightPat = [0, -1, 2, -1, 1, -1, 3, -1, 0, -1, 2, -1, 4, -1, 3, -1];

  function init() {
    if (ac) { if (ac.state === "suspended") ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
    master = ac.createGain(); master.gain.value = muted ? 0 : .8; master.connect(ac.destination);
    sfxG = ac.createGain(); sfxG.gain.value = 1; sfxG.connect(master);
    musG = ac.createGain(); musG.gain.value = .5; musG.connect(master);
    dayG = ac.createGain(); nightG = ac.createGain();
    dayG.connect(musG); nightG.connect(musG);
    dayG.gain.value = world ? 0 : 1; nightG.gain.value = world ? 1 : 0;
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    nextT = ac.currentTime + .1;
    timer = setInterval(schedule, 50);
  }

  function tone(f, dur, type = "square", vol = .08, slide = 0, delay = 0, dest) {
    if (!ac) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(25, f + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + .008);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(dest || sfxG); o.start(t); o.stop(t + dur + .02);
  }
  function noise(dur, vol, ftype, f0, f1, delay = 0) {
    if (!ac) return;
    const t = ac.currentTime + delay, s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; fl.type = ftype; fl.frequency.setValueAtTime(f0, t);
    fl.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(fl).connect(g).connect(sfxG); s.start(t); s.stop(t + dur + .02);
  }

  function schedule() {
    if (!ac) return;
    if (nextT < ac.currentTime) nextT = ac.currentTime + .05; // tab was throttled: resync instead of bursting
    const dur = .17;
    while (nextT < ac.currentTime + .25) {
      const i = step % 16, dn = dayPat[i], nn = nightPat[i];
      if (dn >= 0) tone(hz(DAY[dn % 5] + 12 * (dn >= 5 ? 1 : 0) + 12), dur * 1.4, "triangle", .12, 0, nextT - ac.currentTime, dayG);
      if (nn >= 0) tone(hz(NIGHT[nn % 5] - 12), dur * 3, "sine", .2, 0, nextT - ac.currentTime, nightG);
      if (i % 8 === 0) {
        tone(hz(-24), dur * 6, "triangle", .22, 0, nextT - ac.currentTime, dayG);
        tone(hz(-31), dur * 7, "sine", .26, 0, nextT - ac.currentTime, nightG);
      }
      if (i % 4 === 2) { // soft hat on the day voice
        const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
        s.buffer = noiseBuf; f.type = "highpass"; f.frequency.value = 7000;
        g.gain.setValueAtTime(.05, nextT); g.gain.exponentialRampToValueAtTime(.0001, nextT + .05);
        s.connect(f).connect(g).connect(dayG); s.start(nextT); s.stop(nextT + .06);
      }
      nextT += dur; step++;
    }
  }

  const api = {
    init,
    get muted() { return muted; },
    toggleMute() {
      init(); muted = !muted;
      try { localStorage.setItem("shift_muted", muted ? "1" : "0"); } catch {}
      if (master) master.gain.setTargetAtTime(muted ? 0 : .8, ac.currentTime, .03);
      if (!muted) api.click();
      return muted;
    },
    setWorld(w) {
      world = w; if (!ac) return;
      dayG.gain.setTargetAtTime(w ? 0 : 1, ac.currentTime, .12);
      nightG.gain.setTargetAtTime(w ? 1 : 0, ac.currentTime, .12);
    },
    duck(on) { if (musG) musG.gain.setTargetAtTime(on ? .18 : .5, ac.currentTime, .1); },
    pad() { tone(260, .3, "sine", .12, 900); tone(520, .2, "triangle", .06, 600, .03); },
    lever() { tone(180, .06, "square", .08); tone(320, .09, "square", .07, 0, .06); noise(.08, .08, "bandpass", 1200, 400); },
    click() { tone(660, .06, "square", .05); tone(990, .05, "square", .04, 0, .04); },
    move() { tone(520, .04, "triangle", .06); },
    back() { tone(440, .07, "square", .05, -120); },
    jump() { tone(300, .14, "square", .07, 380); },
    land(v) { const k = Math.min(1, v / 700); noise(.09, .1 + .25 * k, "lowpass", 900, 120); tone(110, .08, "sine", .12 * k + .04, -50); },
    step() { noise(.035, .035, "bandpass", 1800 + Math.random() * 600, 900); },
    shift(w) {
      if (w) { noise(.4, .2, "bandpass", 2500, 250); tone(660, .3, "triangle", .1, -330); tone(495, .3, "sine", .08, -250, .03); tone(392, .45, "sine", .08, -150, .06); }
      else   { noise(.4, .2, "bandpass", 250, 3500); tone(330, .3, "triangle", .1, 330); tone(495, .3, "sine", .08, 250, .03); tone(660, .45, "sine", .08, 200, .06); }
    },
    deny() { tone(130, .09, "sawtooth", .09); tone(100, .14, "sawtooth", .09, 0, .09); },
    die() { noise(.35, .22, "lowpass", 2000, 80); tone(360, .45, "sawtooth", .1, -300); tone(180, .5, "square", .06, -140, .05); },
    win() { [523, 659, 784, 1047].forEach((f, i) => { tone(f, .22, "square", .07, 0, i * .09); tone(f * 2, .22, "triangle", .04, 0, i * .09); }); tone(1047, .6, "triangle", .08, 0, .38); },
    star(i) { tone(880 * Math.pow(1.26, i), .2, "triangle", .09, 0, 0); tone(1760 * Math.pow(1.26, i), .15, "sine", .04, 0, .02); },
    pause(on) { tone(on ? 400 : 600, .09, "square", .05, on ? -120 : 120); },
    locked() { tone(160, .12, "square", .07); tone(150, .12, "square", .07, 0, .1); },
    end() { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, .35, "triangle", .08, 0, i * .12)); },
  };
  return api;
})();
