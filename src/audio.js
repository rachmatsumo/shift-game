// Procedural audio: modern cinematic ambient synth pads, adaptive world crossfade,
// boss tension drone, and rich organic sound effects. 100% Web Audio, zero external assets.
const Audio8 = (() => {
  let ac, master, sfxG, musG, dayG, nightG, bossG, noiseBuf, timer;
  let muted = false, world = 0, step = 0, nextT = 0, duck = 1, bossTension = 0;
  try { muted = localStorage.getItem("shift_muted") === "1"; } catch {}

  // Pentatonic & Atmospheric chords
  // DAY: Lydian / Major Warm Ambient Pad (Cmaj9 / Fmaj9)
  // NIGHT: Mystical Dorian / Aeolian Twilight Chime (Am9 / Em9)
  const DAY_NOTES = [261.63, 329.63, 392.00, 493.88, 587.33, 659.25, 783.99]; // C, E, G, B, D, E, G
  const NIGHT_NOTES = [220.00, 261.63, 329.63, 392.00, 440.00, 523.25, 659.25]; // A, C, E, G, A, C, E
  const hz = s => 261.63 * Math.pow(2, s / 12);

  const dayPat = [0, -1, 2, 4, -1, 3, 1, 5, 2, -1, 4, 1, -1, 3, 2, 0];
  const nightPat = [0, -1, 3, -1, 2, 4, -1, 1, 0, -1, 4, -1, 2, 5, 3, -1];

  function init() {
    if (ac) { if (ac.state === "suspended") ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
    master = ac.createGain(); master.gain.value = muted ? 0 : .75; master.connect(ac.destination);
    sfxG = ac.createGain(); sfxG.gain.value = .9; sfxG.connect(master);
    musG = ac.createGain(); musG.gain.value = .45; musG.connect(master);

    dayG = ac.createGain(); nightG = ac.createGain(); bossG = ac.createGain();
    dayG.connect(musG); nightG.connect(musG); bossG.connect(musG);

    dayG.gain.value = world ? 0 : 1;
    nightG.gain.value = world ? 1 : 0;
    bossG.gain.value = 0;

    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    nextT = ac.currentTime + .1;
    timer = setInterval(schedule, 50);
  }

  // Modern atmospheric synth note with harmonic depth and stereo-like warmth
  function synthPad(f, dur, dest, vol = .08, isNight = false) {
    if (!ac) return;
    const t = ac.currentTime;
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain();
    o1.type = isNight ? "sine" : "triangle";
    o2.type = "sine";
    o1.frequency.setValueAtTime(f, t);
    o2.frequency.setValueAtTime(f * 1.004, t); // gentle chorus detune

    fl.type = "lowpass";
    fl.frequency.setValueAtTime(isNight ? 1200 : 2200, t);
    fl.frequency.exponentialRampToValueAtTime(isNight ? 450 : 800, t + dur);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * .25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    o1.connect(fl); o2.connect(fl);
    fl.connect(g).connect(dest || musG);
    o1.start(t); o2.start(t);
    o1.stop(t + dur + .05); o2.stop(t + dur + .05);
  }

  function tone(f, dur, type = "sine", vol = .08, slide = 0, delay = 0, dest) {
    if (!ac) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(25, f + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + .006);
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
    if (nextT < ac.currentTime) nextT = ac.currentTime + .05;
    const dur = .28;
    while (nextT < ac.currentTime + .3) {
      const i = step % 16;
      const dn = dayPat[i], nn = nightPat[i];
      const relT = nextT - ac.currentTime;

      // Day ambient arpeggio / bells
      if (dn >= 0) {
        const f = DAY_NOTES[dn % DAY_NOTES.length];
        tone(f, dur * 2.2, "sine", .09, 0, relT, dayG);
        if (i % 4 === 0) tone(f * 2, dur * 1.5, "triangle", .04, 0, relT, dayG);
      }

      // Night mystical resonant chimes
      if (nn >= 0) {
        const f = NIGHT_NOTES[nn % NIGHT_NOTES.length];
        tone(f, dur * 3.5, "sine", .12, 0, relT, nightG);
        tone(f * .5, dur * 4.0, "sine", .16, 0, relT, nightG);
      }

      // Sub bass foundation
      if (i % 8 === 0) {
        tone(hz(-24), dur * 7, "sine", .22, 0, relT, dayG);
        tone(hz(-29), dur * 8, "triangle", .24, 0, relT, nightG);
      }

      // Boss tension rhythmic pulse
      if (bossTension > 0 && i % 2 === 0) {
        const bpFreq = 65 + Math.sin(step) * 15;
        tone(bpFreq, .12, "sawtooth", .15 * bossTension, -20, relT, bossG);
      }

      // Soft cinematic shaker/pulse
      if (i % 4 === 2) {
        const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
        s.buffer = noiseBuf; f.type = "bandpass"; f.frequency.value = 4200; f.Q.value = 3;
        g.gain.setValueAtTime(.03, nextT); g.gain.exponentialRampToValueAtTime(.0001, nextT + .07);
        s.connect(f).connect(g).connect(dayG); s.start(nextT); s.stop(nextT + .08);
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
      if (master) master.gain.setTargetAtTime(muted ? 0 : .75, ac.currentTime, .03);
      if (!muted) api.click();
      return muted;
    },
    setWorld(w) {
      world = w; if (!ac) return;
      dayG.gain.setTargetAtTime(w ? 0 : 1, ac.currentTime, .2);
      nightG.gain.setTargetAtTime(w ? 1 : 0, ac.currentTime, .2);
    },
    setBossTension(val) {
      bossTension = Math.max(0, Math.min(1, val));
      if (bossG && ac) bossG.gain.setTargetAtTime(bossTension * 0.45, ac.currentTime, .1);
    },
    duck(on) { if (musG) musG.gain.setTargetAtTime(on ? .14 : .45, ac.currentTime, .12); },
    pad() {
      tone(220, .35, "sine", .14, 880);
      tone(440, .28, "triangle", .08, 660, .02);
      noise(.15, .08, "bandpass", 600, 3200);
    },
    lever() {
      tone(280, .08, "sine", .12);
      tone(560, .12, "triangle", .09, 0, .04);
      noise(.09, .1, "bandpass", 1500, 300);
    },
    click() {
      tone(700, .04, "sine", .08);
      tone(1050, .05, "triangle", .06, 0, .03);
    },
    move() { tone(480, .035, "sine", .07); },
    back() { tone(420, .08, "sine", .08, -140); },
    jump() {
      // Modern warm jump whoosh + acoustic sine kick
      tone(240, .16, "sine", .11, 380);
      noise(.08, .04, "bandpass", 400, 1800);
    },
    land(v) {
      const k = Math.min(1, v / 700);
      noise(.08, .08 + .15 * k, "lowpass", 700, 90);
      tone(95, .1, "sine", .14 * k + .05, -35);
    },
    step() {
      noise(.025, .02, "bandpass", 1600 + Math.random() * 500, 800);
    },
    shift(w) {
      // Modern ethereal whoosh with cinematic harmonic wash
      if (w) { // Day -> Night (Deep cosmic dive)
        noise(.45, .16, "bandpass", 3200, 180);
        tone(523, .4, "sine", .12, -260);
        tone(392, .45, "triangle", .09, -200, .03);
        tone(261, .6, "sine", .15, -120, .06);
      } else { // Night -> Day (Bright celestial bloom)
        noise(.45, .16, "bandpass", 220, 3600);
        tone(261, .4, "sine", .12, 260);
        tone(392, .45, "triangle", .09, 200, .03);
        tone(523, .6, "sine", .15, 120, .06);
      }
    },
    deny() {
      tone(140, .09, "triangle", .12);
      tone(105, .15, "sawtooth", .1, 0, .08);
    },
    die() {
      noise(.4, .25, "lowpass", 2400, 60);
      tone(280, .5, "sawtooth", .14, -220);
      tone(140, .6, "sine", .12, -70, .04);
    },
    win() {
      const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      chord.forEach((f, i) => {
        tone(f, .35, "sine", .09, 0, i * .08);
        tone(f * 2, .3, "triangle", .04, 0, i * .08);
      });
      synthPad(523.25, 1.2, sfxG, .15);
    },
    star(i) {
      const base = 880 * Math.pow(1.26, i);
      tone(base, .25, "sine", .11, 0, 0);
      tone(base * 1.5, .2, "triangle", .06, 0, .02);
      tone(base * 2, .18, "sine", .04, 0, .04);
    },
    pause(on) {
      tone(on ? 380 : 580, .08, "sine", .07, on ? -100 : 100);
    },
    locked() {
      tone(180, .1, "sawtooth", .08);
      tone(150, .1, "sawtooth", .08, 0, .08);
    },
    end() {
      [392, 523, 659, 784, 1047, 1318].forEach((f, i) => tone(f, .45, "sine", .1, 0, i * .12));
    },
  };
  return api;
})();
