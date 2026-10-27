/* RAVNSTED — sound. Progressive, psychedelic heavy rock made in the browser:
   fuzz guitar in odd meters, a phased Leslie organ, a delay-soaked lead, a real-feeling kit.
   One piece per time of day, a title song, and woodcut-world effects (bells, ink, coins). */
const AUDIO = (() => {
  let ac = null, master, music, sfxBus, comp, verb, delay, gIn, gOut, leadIn, orgIn, bassIn, drumBus, noise, duckG;
  let song = null, songKey = null, bar = 0, nextT = 0, timer = null, sec = 0, secBar = 0;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const E2 = 40, A2 = 45, D2 = 38, B1 = 35;

  function curve(k) { const n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / n * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); } return c; }
  function impulse(sec, decay) { const r = ac.sampleRate, len = r * sec, b = ac.createBuffer(2, len, r); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); } return b; }
  function lfo(freq, depth, target, type = 'sine') { const o = ac.createOscillator(); o.type = type; o.frequency.value = freq; const g = ac.createGain(); g.gain.value = depth; o.connect(g); g.connect(target); o.start(); return o; }

  function init() {
    if (ac) return; ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = .005; comp.release.value = .2;
    master.connect(comp); comp.connect(ac.destination);
    music = ac.createGain(); duckG = ac.createGain(); music.connect(duckG); duckG.connect(master); sfxBus = ac.createGain(); sfxBus.connect(master);
    verb = ac.createConvolver(); verb.buffer = impulse(3.2, 2.6); const vg = ac.createGain(); vg.gain.value = .32; verb.connect(vg); vg.connect(music);
    delay = ac.createDelay(2); const fb = ac.createGain(); fb.gain.value = .42; const dlp = ac.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2400; delay.connect(dlp); dlp.connect(fb); fb.connect(delay); const dg = ac.createGain(); dg.gain.value = .45; dlp.connect(dg); dg.connect(music); dg.connect(verb);
    lfo(.07, .004, delay.delayTime); // the delay drifts: tape wobble
    // guitar amp: drive → shaper → cab
    gIn = ac.createGain(); const pre = ac.createBiquadFilter(); pre.type = 'highpass'; pre.frequency.value = 110;
    const sh = ac.createWaveShaper(); sh.curve = curve(28); sh.oversample = '4x';
    const mid = ac.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 750; mid.gain.value = -5; mid.Q.value = .8;
    const cab = ac.createBiquadFilter(); cab.type = 'lowpass'; cab.frequency.value = 3600; cab.Q.value = .9;
    const cab2 = ac.createBiquadFilter(); cab2.type = 'peaking'; cab2.frequency.value = 1800; cab2.gain.value = 3;
    gOut = ac.createGain(); gOut.gain.value = .26;
    // a slow phaser on the guitar for the psychedelic swirl
    const ph = []; let last = cab2; for (let i = 0; i < 4; i++) { const ap = ac.createBiquadFilter(); ap.type = 'allpass'; ap.frequency.value = 700 + i * 300; ap.Q.value = .7; lfo(.18, 500, ap.frequency); last.connect(ap); last = ap; ph.push(ap); }
    const dry = ac.createGain(); dry.gain.value = .7; const wet = ac.createGain(); wet.gain.value = .45;
    gIn.connect(pre); pre.connect(sh); sh.connect(mid); mid.connect(cab); cab.connect(cab2); cab2.connect(dry); last.connect(wet); dry.connect(gOut); wet.connect(gOut); gOut.connect(music); const gs = ac.createGain(); gs.gain.value = .25; gOut.connect(gs); gs.connect(verb);
    // bass: fuzz, low-passed
    bassIn = ac.createGain(); const bsh = ac.createWaveShaper(); bsh.curve = curve(4); const blp = ac.createBiquadFilter(); blp.type = 'lowpass'; blp.frequency.value = 900; const bo = ac.createGain(); bo.gain.value = .32; bassIn.connect(bsh); bsh.connect(blp); blp.connect(bo); bo.connect(music);
    // organ: drawbars → phaser → leslie
    orgIn = ac.createGain(); let ol = orgIn; for (let i = 0; i < 6; i++) { const ap = ac.createBiquadFilter(); ap.type = 'allpass'; ap.frequency.value = 400 + i * 260; lfo(.25, 380, ap.frequency); ol.connect(ap); ol = ap; }
    const les = ac.createGain(); les.gain.value = .75; lfo(5.8, .22, les.gain); const omix = ac.createGain(); omix.gain.value = .5; orgIn.connect(omix); ol.connect(omix); omix.connect(les); const oo = ac.createGain(); oo.gain.value = .16; les.connect(oo); oo.connect(music); const os = ac.createGain(); os.gain.value = .4; les.connect(os); os.connect(verb);
    // lead: hotter fuzz, into delay and room
    leadIn = ac.createGain(); const lsh = ac.createWaveShaper(); lsh.curve = curve(40); const llp = ac.createBiquadFilter(); llp.type = 'lowpass'; llp.frequency.value = 3200; const lbp = ac.createBiquadFilter(); lbp.type = 'bandpass'; lbp.frequency.value = 900; lbp.Q.value = 1.2; lfo(.35, 600, lbp.frequency); // slow auto-wah
    const lo = ac.createGain(); lo.gain.value = .13; leadIn.connect(lsh); lsh.connect(llp); llp.connect(lbp); const lmix = ac.createGain(); llp.connect(lmix); lbp.connect(lmix); lmix.connect(lo); lo.connect(music); lo.connect(delay); lo.connect(verb);
    drumBus = ac.createGain(); drumBus.gain.value = .55; drumBus.connect(music); const ds = ac.createGain(); ds.gain.value = .12; drumBus.connect(ds); ds.connect(verb);
    noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    volumes();
  }
  function volumes() { if (!ac) return; music.gain.setTargetAtTime(SETTINGS.music * .9, ac.currentTime, .1); sfxBus.gain.setTargetAtTime(SETTINGS.sfx, ac.currentTime, .1); }

  /* ---------- instruments ---------- */
  function env(g, t, a, d, peak, sus = 0) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(sus, t + a, d); }
  function osc(type, f, t, end, dest, det = 0) { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = det; o.connect(dest); o.start(t); o.stop(end); return o; }
  function guitar(t, semis, dur, kind, drive = 1) {
    const g = ac.createGain(); let dest = g;
    if (kind === 'm') { const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.connect(gIn); g.connect(lp); } else g.connect(gIn);
    const notes = kind === 'c' ? [semis, semis + 7, semis + 12] : [semis];
    const end = t + dur + .25; notes.forEach(s => { osc('sawtooth', mtof(s), t, end, g, -6); osc('sawtooth', mtof(s), t, end, g, 7); });
    const pk = (kind === 'm' ? .55 : .45) * drive; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + .006); g.gain.setTargetAtTime(kind === 'm' ? 0 : pk * .7, t + .01, kind === 'm' ? .06 : .4); g.gain.setTargetAtTime(0, t + dur, .06);
  }
  function swell(t, semis, dur) { const g = ac.createGain(); g.connect(gIn); [semis, semis + 7, semis + 12].forEach(s => { osc('sawtooth', mtof(s), t, t + dur + .5, g, -5); osc('sawtooth', mtof(s), t, t + dur + .5, g, 5); }); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.35, t + dur * .7); g.gain.setTargetAtTime(0, t + dur, .15); }
  function bass(t, semis, dur) { const g = ac.createGain(); g.connect(bassIn); osc('sawtooth', mtof(semis - 12), t, t + dur + .2, g); osc('sine', mtof(semis - 12), t, t + dur + .2, g); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.7, t + .01); g.gain.setTargetAtTime(.45, t + .02, .2); g.gain.setTargetAtTime(0, t + dur, .05); }
  function organ(t, chord, dur, vol = 1) { const g = ac.createGain(); g.connect(orgIn); const bars = [[1, .8], [2, .55], [3, .3], [4, .3], [8, .14]]; chord.forEach(s => bars.forEach(([h, a]) => { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(s + 24) * h / 2; const og = ac.createGain(); og.gain.value = a; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + .3); })); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.22 * vol, t + .05); g.gain.setValueAtTime(.22 * vol, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + .25); }
  function lead(t, semis, dur, bend) { const g = ac.createGain(); g.connect(leadIn); const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(mtof(bend ? semis - 2 : semis), t); if (bend) o.frequency.setTargetAtTime(mtof(semis), t + .03, .06); const v = lfo(5.5, 6, o.frequency); v.stop(t + dur + .3); o.connect(g); o.start(t); o.stop(t + dur + .3); const o2 = ac.createOscillator(); o2.type = 'square'; o2.frequency.setValueAtTime(mtof(semis - 12), t); o2.connect(g); o2.start(t); o2.stop(t + dur + .3); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.5, t + .02); g.gain.setTargetAtTime(.35, t + .05, .3); g.gain.setTargetAtTime(0, t + dur, .08); }
  function nz(t, dur, type, f, q, peak, dest = drumBus, dec) { const s = ac.createBufferSource(); s.buffer = noise; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ac.createGain(); g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(.0008, t + (dec || dur)); s.connect(fl); fl.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + dur + .05); }
  const DR = {
    k(t) { const o = ac.createOscillator(); const g = ac.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .12); g.gain.setValueAtTime(1.1, t); g.gain.exponentialRampToValueAtTime(.001, t + .35); o.connect(g); g.connect(drumBus); o.start(t); o.stop(t + .4); nz(t, .02, 'highpass', 3000, .5, .25); },
    s(t) { nz(t, .25, 'bandpass', 1900, .6, .9, drumBus, .2); const o = ac.createOscillator(); const g = ac.createGain(); o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(160, t + .1); g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.001, t + .14); o.connect(g); g.connect(drumBus); o.start(t); o.stop(t + .16); },
    h(t) { nz(t, .05, 'highpass', 7500, .7, .22, drumBus, .045); },
    o(t) { nz(t, .3, 'highpass', 6500, .7, .2, drumBus, .28); },
    c(t) { nz(t, 1.8, 'highpass', 4200, .4, .45, drumBus, 1.6); nz(t, 1.2, 'bandpass', 9000, .8, .2, drumBus, 1); },
    r(t) { nz(t, .9, 'bandpass', 6000, 2.5, .14, drumBus, .8); },
    t(t) { const o = ac.createOscillator(); const g = ac.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(80, t + .3); g.gain.setValueAtTime(.8, t); g.gain.exponentialRampToValueAtTime(.001, t + .45); o.connect(g); g.connect(drumBus); o.start(t); o.stop(t + .5); },
    f(t) { const o = ac.createOscillator(); const g = ac.createGain(); o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(55, t + .35); g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .55); o.connect(g); g.connect(drumBus); o.start(t); o.stop(t + .6); },
  };

  /* ---------- songs. Tokens per step: '.' rest, '-' hold, '0m' muted chug, '3c' power chord, '7n' note, '12s' swell ---------- */
  const R = str => { const tk = str.trim().split(/\s+/); return tk.map((x, i) => { if (x === '.' || x === '-') return null; let l = 1; while (tk[i + l] === '-') l++; const m = x.match(/^(-?\d+)([mcns])(\^?)$/); return { s: +m[1], k: m[2], l, bend: !!m[3] }; }); };
  const D = str => str.trim().split(/\s+/).map(x => x === '.' ? '' : x);
  const SONGS = {
    title: { root: E2, step: 60 / 138 / 2, sec: [
      { bars: 4, n: 7, gtr: [R('12n 19n 15n 22n 19n 15n 12n')], drive: .45, org: [[0, 7, 12, 15]], drums: [D('. . . . . . .'), D('. . . . . . .'), D('r . . . . . .'), D('t . t . t t f')], bass: false },
      { bars: 8, n: 7, gtr: [R('0m 0m 3c 0m 5c 6c 5c'), R('0m 0m 3c 0m 7c - 5c')], org: [[0, 7, 12, 15]], drums: [D('kc h s h k h s'), D('k h s h k k s')] },
      { bars: 8, n: 7, gtr: [R('0m 0m 3c 0m 5c 6c 5c'), R('0m 0m 3c 0m 7c - 5c')], org: [[0, 7, 12, 15], [-2, 5, 10, 14]], drums: [D('kc h s h k h s'), D('k h s h k k s')],
        lead: [R('24n - - 22n 19n - 22n^'), R('24n - 27n - 26n^ - -'), R('31n - 29n 27n 26n 24n -'), R('22n - - 19n^ - - -'), R('24n - - 22n 19n - 17n'), R('19n - - - 22n^ - -'), R('27n 26n 24n 22n 19n 17n 15n'), R('12n - - - - - -')] },
      { bars: 4, n: 8, stepMul: 1.6, gtr: [R('0c - - - 1c - 6c -'), R('0c - - - 3c - 6c 5c')], org: [[0, 6, 12]], drums: [D('kc . . . s . . .'), D('k . . k s . . .')] },
    ] },
    0: { root: D2, step: 60 / 76 / 2, sec: [
      { bars: 8, n: 10, gtr: [R('12n 17n 19n 24n 19n 17n 15n 17n 12n -'), R('10n 14n 17n 22n 17n 14n 12n 14n 10n -')], drive: .4, org: [[0, 7, 12, 15], [-2, 5, 10, 14]], drums: [D('k . . h . . s . . h'), D('k . h . k . s . h .')], bass: 'root' },
      { bars: 4, n: 10, gtr: [R('0s - - - - - - - - -'), R('-2s - - - - - - - - -')], org: [[0, 7, 12, 15], [-2, 5, 10, 14]], drums: [D('k . . h . . s . . h'), D('t . . t . . t . f .')], lead: [R('24n - - - 22n - 19n - - -'), R('22n - - - 17n - - - - -'), R('19n - 22n - 24n^ - - - - -'), R('26n - - - 24n - - - - -')] },
    ] },
    1: { root: A2, step: 60 / 150 / 2, sec: [
      { bars: 8, n: 7, gtr: [R('0m 0m 0m 3c 0m 5c 3c'), R('0m 0m 0m 3c 0m 7c 6c')], org: null, drums: [D('kc h s h k h s'), D('k h s h k k s')] },
      { bars: 8, n: 7, gtr: [R('0m 0m 0m 3c 0m 5c 3c'), R('0m 0m 0m 3c 0m 7c 6c')], org: [[0, 7, 12], [3, 10, 15]], drums: [D('kc h s h k h s'), D('k h s h k k s')], lead: [R('19n - 17n 15n 12n - 15n^'), R('17n - - - 19n - -'), R('24n - 22n 19n 17n 15n -'), R('12n - - - - - -')] },
    ] },
    3: { root: E2, step: 60 / 120 / 2, sec: [
      { bars: 8, n: 10, gtr: [R('0m 0m 12n 10n 7n 0m 0m 5c - 3c'), R('0m 0m 12n 10n 7n 0m 0m 3c - 2c')], org: [[0, 7, 12, 15]], drums: [D('kc h s h k h k s h h'), D('k h s h k h k s s h')] },
      { bars: 4, n: 10, gtr: [R('0m 0m 12n 10n 7n 0m 0m 5c - 3c')], org: [[0, 7, 12, 15], [5, 12, 17]], drums: [D('k h s h k h k s h o')], lead: [R('24n - 22n - 19n - 17n - 19n^ -'), R('22n - - - 24n - - - - -')] },
    ] },
    4: { root: E2, step: 60 / 64 / 2, sec: [
      { bars: 8, n: 8, gtr: [R('0c - - - - - 3c -'), R('6c - - - 5c - 3c -')], org: [[0, 7, 12], [6, 13, 18]], drums: [D('kc . . . s . . .'), D('k . . k s . . .')] },
      { bars: 4, n: 8, gtr: [R('0c - - - - - 3c -'), R('6c - - - 5c - 3c -')], org: [[0, 7, 12]], drums: [D('kc . . . s . . .'), D('k . . k s . s s')], lead: [R('24n - - - - - 22n^ -'), R('18n - - - 19n - - -')] },
    ] },
    5: { root: B1, step: 60 / 100 / 2, sec: [
      { bars: 8, n: 6, gtr: [R('12s - - - - -'), null, R('10s - - - - -'), null], drive: .5, org: [[0, 7, 12], [0, 7, 12], [-2, 5, 10], [-2, 5, 10]], drums: [D('t . t . t f'), D('t . t t . f')], bass: R('0n . 7n 0n . 5n'),
        lead: [R('31n - - 29n - -'), R('27n - - - - -'), R('26n - 24n - 22n^ -'), R('24n - - - - -')] },
      { bars: 4, n: 6, gtr: [R('0c - - - - -'), R('-2c - - - - -')], org: [[0, 7, 12], [-2, 5, 10]], drums: [D('kc . h s . h'), D('k . h s k h')], bass: R('0n . 7n 0n . 5n') },
    ] },
    6: { root: E2, step: 60 / 168 / 2, sec: [
      { bars: 8, n: 7, gtr: [R('0m 0m 1c 0m 0m 6c 5c'), R('0m 0m 1c 0m 3c - 1c')], org: [[0, 6, 12]], drums: [D('kc k s k k h s'), D('k k s k k s s')] },
      { bars: 8, n: 7, gtr: [R('0m 0m 1c 0m 0m 6c 5c'), R('0m 0m 1c 0m 3c - 1c')], org: [[0, 6, 12], [1, 8, 13]], drums: [D('kc k s k k h s'), D('k k s k k s s')], lead: [R('28n^ - - 27n 24n - 22n'), R('24n - 25n^ - 24n - -'), R('31n - 30n - 28n 27n 24n'), R('22n^ - - - - - -')] },
    ] },
    end: { root: E2, step: 60 / 56 / 2, sec: [
      { bars: 4, n: 8, gtr: [R('0s - - - - - - -'), R('3s - - - - - - -'), R('-2s - - - - - - -'), R('0s - - - - - - -')], org: [[0, 7, 12, 15], [3, 10, 15], [-2, 5, 10, 14], [0, 7, 12, 15]], drums: [D('r . . . . . . .'), D('. . . . . . . .')], drive: .6 },
    ] },
  };
  SONGS[2] = SONGS[1];

  function scheduleBar(t) {
    const S = song.sec[sec], k = bar, step = song.step * (S.stepMul || 1), root = song.root;
    const gp = S.gtr[k % S.gtr.length]; const drive = S.drive || 1;
    if (gp) gp.forEach((e, i) => { if (!e) return; const tt = t + i * step, d = e.l * step * .95; if (e.k === 's') swell(tt, root + e.s, d); else guitar(tt, root + e.s, d, e.k, drive); if (S.bass !== false && !S.bass) bass(tt, root + (e.s >= 12 ? e.s - 12 : e.s), d); });
    if (S.bass === 'root' && gp) bass(t, root + (gp.find(Boolean) || { s: 0 }).s % 12, step * S.n * .95);
    if (Array.isArray(S.bass)) S.bass.forEach((e, i) => { if (e) bass(t + i * step, root + e.s, e.l * step * .9); });
    if (S.org) organ(t, S.org[k % S.org.length].map(x => root + x), step * S.n * .98, .9);
    const dp = S.drums && S.drums[k % S.drums.length]; if (dp) dp.forEach((tok, i) => { for (const ch of tok) DR[ch] && DR[ch](t + i * step + (ch === 'h' ? (Math.random() - .5) * .006 : 0)); });
    const lp = S.lead && S.lead[k % S.lead.length]; if (lp) lp.forEach((e, i) => { if (e) lead(t + i * step, root + e.s, e.l * step * .95, e.bend); });
    delay.delayTime.setValueAtTime(Math.min(1.9, step * 3), t);
    return step * S.n;
  }
  function tick() {
    if (!song) return;
    while (nextT < ac.currentTime + .25) {
      const len = scheduleBar(nextT); nextT += len; bar++; secBar++;
      if (secBar >= song.sec[sec].bars) { secBar = 0; bar = 0; sec = (sec + 1) % song.sec.length; }
    }
  }
  function play(key) {
    if (!ac || key === songKey) return; songKey = key;
    const t = ac.currentTime; music.gain.cancelScheduledValues(t); music.gain.setValueAtTime(music.gain.value, t); music.gain.linearRampToValueAtTime(0, t + .8);
    setTimeout(() => { song = SONGS[key]; sec = 0; bar = 0; secBar = 0; nextT = ac.currentTime + .1; music.gain.cancelScheduledValues(ac.currentTime); music.gain.setValueAtTime(0, ac.currentTime); music.gain.linearRampToValueAtTime(SETTINGS.music * .9, ac.currentTime + 1.5); }, 850);
    if (!timer) timer = setInterval(() => { try { tick(); } catch (e) { console.error(e); } }, 40);
  }

  /* ---------- effects ---------- */
  function blip(f, d, type = 'sine', vol = .2, slide) { const t = ac.currentTime; const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d); const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + d + .05); }
  function bellAt(t, f = 196, vol = .35) { [[1, 1], [2.0, .5], [2.4, .35], [3.0, .25], [4.2, .15], [5.4, .1]].forEach(([m, a]) => { const o = ac.createOscillator(); o.frequency.value = f * m; const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * a, t + .005); g.gain.exponentialRampToValueAtTime(.0005, t + 4 / Math.sqrt(m)); o.connect(g); g.connect(sfxBus); const s = ac.createGain(); s.gain.value = .5; g.connect(s); s.connect(verb); o.start(t); o.stop(t + 4.2); }); }
  const SFX = {
    tick: () => blip(1400, .04, 'square', .05), tile: () => blip(520, .06, 'triangle', .14), page: () => { const t = ac.currentTime; nz(t, .18, 'bandpass', 2500, .6, .12, sfxBus, .16); },
    coin: () => { blip(1800, .25, 'triangle', .14); setTimeout(() => blip(2400, .3, 'triangle', .1), 70); }, coinout: () => blip(900, .2, 'triangle', .12, 500),
    ok: () => blip(660, .18, 'triangle', .14), perfect: () => { blip(523, .2, 'triangle', .14); setTimeout(() => blip(784, .3, 'triangle', .14), 90); setTimeout(() => blip(1046, .4, 'triangle', .12), 180); },
    wrong: () => blip(180, .3, 'sawtooth', .1, 90), dice: () => { const t = ac.currentTime; for (let i = 0; i < 8; i++) nz(t + i * .09 + Math.random() * .03, .05, 'bandpass', 1200 + Math.random() * 1500, 2, .3, sfxBus, .04); },
    win: () => bellAt(ac.currentTime, 392, .25), lose: () => blip(220, .7, 'sawtooth', .1, 70),
    ink: () => { const t = ac.currentTime; nz(t, .5, 'lowpass', 800, .5, .2, sfxBus, .45); }, inkrun: () => { const t = ac.currentTime; nz(t, .8, 'bandpass', 600, 3, .3, sfxBus, .7); blip(300, .7, 'sine', .1, 80); },
    splash: () => { const t = ac.currentTime; nz(t, .35, 'lowpass', 1200, 1, .3, sfxBus, .3); }, voice: () => { },
  };

  return {
    start() { init(); if (ac.state === 'suspended') ac.resume(); play(songKey === null ? 'title' : songKey); },
    setTime(k) { if (!ac) return; play(k); },
    sfx(n) { if (!ac || FAST) return; try { SFX[n] && SFX[n](); } catch (e) { } },
    bell() { if (!ac || FAST) return; bellAt(ac.currentTime, 147, .4); },
    duck(on) { if (!ac) return; duckG.gain.setTargetAtTime(on ? .45 : 1, ac.currentTime, .15); },
    volumes,
    get ctx() { return ac; },
    get out() { return comp; },
    play(k) { init(); songKey = null; play(k); },
  };
})();
