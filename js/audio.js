/* RAVNSTED — sound.
   Music: recorded loops (audio/music/*.mp3) made by tools/music: progressive, psychedelic heavy rock played by sampled
   instruments with real amp, Leslie, phaser, delay and reverb chains. One piece per time of day, a title song, an outro.
   They crossfade when the hour changes and duck under speech.
   Voices: sprites in audio/voice (see engine.js TTS). Effects: bells, ink, coins, dice, made in the browser. */
const MUSIC = { title: 'title', 0: 'daggry', 1: 'torv', 2: 'torv', 3: 'eftermiddag', 4: 'skumring', 5: 'nat', 6: 'midnat', end: 'slut' };
const AUDIO = (() => {
  let ac = null, master, comp, music, duckG, sfxBus, voiceBus, verb, noise;
  const sprites = new Map(), tracks = new Map();
  let want = null, cur = null; // cur: { name, src, g }

  function impulse(sec, decay) { const r = ac.sampleRate, len = r * sec, b = ac.createBuffer(2, len, r); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); } return b; }
  function init() {
    if (ac) return; ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); comp = ac.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 3; comp.attack.value = .005; comp.release.value = .25;
    master.connect(comp); comp.connect(ac.destination);
    music = ac.createGain(); duckG = ac.createGain(); music.connect(duckG); duckG.connect(master);
    sfxBus = ac.createGain(); sfxBus.connect(master); voiceBus = ac.createGain(); voiceBus.connect(master);
    verb = ac.createConvolver(); verb.buffer = impulse(3.2, 2.6); const vg = ac.createGain(); vg.gain.value = .32; verb.connect(vg); vg.connect(master);
    noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    volumes();
  }
  function volumes() { if (!ac) return; const t = ac.currentTime; music.gain.setTargetAtTime(SETTINGS.music * .85, t, .1); sfxBus.gain.setTargetAtTime(SETTINGS.sfx, t, .1); voiceBus.gain.setTargetAtTime(SETTINGS.voice * 1.1, t, .1); }

  /* ---------- music: decoded once, the last three kept ---------- */
  function track(name) {
    if (tracks.has(name)) { const p = tracks.get(name); tracks.delete(name); tracks.set(name, p); return p; }
    const p = fetch(`audio/music/${name}.mp3`).then(r => { if (!r.ok) throw new Error('music ' + name); return r.arrayBuffer(); }).then(b => new Promise((res, rej) => ac.decodeAudioData(b, res, rej)));
    p.catch(() => tracks.delete(name)); tracks.set(name, p);
    while (tracks.size > 3) { const k = tracks.keys().next().value; if (cur && k === cur.name) { const v = tracks.get(k); tracks.delete(k); tracks.set(k, v); break; } tracks.delete(k); }
    return p;
  }
  function play(key) {
    const name = MUSIC[key]; if (!name) return; want = name;
    if (cur && cur.name === name) return; // the same piece keeps playing across the change
    track(name).then(buf => {
      if (want !== name || (cur && cur.name === name)) return;
      const t = ac.currentTime, g = ac.createGain(), src = ac.createBufferSource();
      src.buffer = buf; src.loop = true; src.connect(g); g.connect(music);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 2.5); src.start(t);
      if (cur) { const o = cur; o.g.gain.cancelScheduledValues(t); o.g.gain.setValueAtTime(o.g.gain.value, t); o.g.gain.linearRampToValueAtTime(0, t + 2.5); setTimeout(() => { try { o.src.stop(); } catch (e) { } }, 2800); }
      cur = { name, src, g };
      const next = { title: 'daggry', daggry: 'torv', torv: 'eftermiddag', eftermiddag: 'skumring', skumring: 'nat', nat: 'midnat', midnat: 'slut' }[name];
      if (next) setTimeout(() => track(next).catch(() => { }), 4000); // have the next hour ready
    }).catch(e => console.warn(e));
  }

  /* ---------- effects ---------- */
  function nz(t, dur, type, f, q, peak, dest, dec) { const s = ac.createBufferSource(); s.buffer = noise; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ac.createGain(); g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(.0008, t + (dec || dur)); s.connect(fl); fl.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + dur + .05); }
  function blip(f, d, type = 'sine', vol = .2, slide) { const t = ac.currentTime; const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d); const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + d + .05); }
  function bellAt(t, f = 196, vol = .35) { [[1, 1], [2.0, .5], [2.4, .35], [3.0, .25], [4.2, .15], [5.4, .1]].forEach(([m, a]) => { const o = ac.createOscillator(); o.frequency.value = f * m; const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * a, t + .005); g.gain.exponentialRampToValueAtTime(.0005, t + 4 / Math.sqrt(m)); o.connect(g); g.connect(sfxBus); const s = ac.createGain(); s.gain.value = .5; g.connect(s); s.connect(verb); o.start(t); o.stop(t + 4.2); }); }
  const SFX = {
    tick: () => blip(1400, .04, 'square', .05), tile: () => blip(520, .06, 'triangle', .14), page: () => nz(ac.currentTime, .18, 'bandpass', 2500, .6, .12, sfxBus, .16),
    coin: () => { blip(1800, .25, 'triangle', .14); setTimeout(() => blip(2400, .3, 'triangle', .1), 70); }, coinout: () => blip(900, .2, 'triangle', .12, 500),
    ok: () => blip(660, .18, 'triangle', .14), perfect: () => { blip(523, .2, 'triangle', .14); setTimeout(() => blip(784, .3, 'triangle', .14), 90); setTimeout(() => blip(1046, .4, 'triangle', .12), 180); },
    wrong: () => blip(180, .3, 'sawtooth', .1, 90), dice: () => { const t = ac.currentTime; for (let i = 0; i < 8; i++) nz(t + i * .09 + Math.random() * .03, .05, 'bandpass', 1200 + Math.random() * 1500, 2, .3, sfxBus, .04); },
    win: () => bellAt(ac.currentTime, 392, .25), lose: () => blip(220, .7, 'sawtooth', .1, 70),
    ink: () => nz(ac.currentTime, .5, 'lowpass', 800, .5, .2, sfxBus, .45), inkrun: () => { nz(ac.currentTime, .8, 'bandpass', 600, 3, .3, sfxBus, .7); blip(300, .7, 'sine', .1, 80); },
    splash: () => nz(ac.currentTime, .35, 'lowpass', 1200, 1, .3, sfxBus, .3),
  };

  return {
    /* call from a tap: browsers allow sound only after one */
    start(key) { if (FAST) return; init(); if (ac.state === 'suspended') ac.resume(); play(key !== undefined ? key : (want ? Object.keys(MUSIC).find(k => MUSIC[k] === want) : 'title')); },
    get running() { return !!ac && ac.state === 'running'; },
    setTime(k) { if (!ac || FAST) return; play(k); },
    sfx(n) { if (!ac || FAST) return; try { SFX[n] && SFX[n](); } catch (e) { } },
    bell() { if (!ac || FAST) return; bellAt(ac.currentTime, 147, .4); },
    /* voice sprites: fetched and decoded once, the last few kept */
    sprite(name) {
      init(); if (sprites.has(name)) { const p = sprites.get(name); sprites.delete(name); sprites.set(name, p); return p; }
      const p = fetch(`audio/voice/${name}.mp3`).then(r => { if (!r.ok) throw new Error('voice ' + name); return r.arrayBuffer(); }).then(b => new Promise((res, rej) => ac.decodeAudioData(b, res, rej)));
      p.catch(() => sprites.delete(name)); sprites.set(name, p); while (sprites.size > 12) sprites.delete(sprites.keys().next().value); return p;
    },
    prefetch(names) { if (!ac) return; names.forEach(n => this.sprite(n).catch(() => { })); },
    clip(m, onEnd) {
      init(); if (ac.state === 'suspended') ac.resume(); let src = null, stopped = false;
      this.sprite(m[0]).then(buf => { if (stopped) return; src = ac.createBufferSource(); src.buffer = buf; src.connect(voiceBus); src.onended = onEnd; src.start(0, Math.max(0, m[1] - .02), m[2] + .04); }).catch(onEnd);
      return { stop() { stopped = true; try { src && src.stop(); } catch (e) { } } };
    },
    duck(on) { if (!ac) return; duckG.gain.setTargetAtTime(on ? .4 : 1, ac.currentTime, .15); },
    volumes,
    get ctx() { return ac; },
    get out() { return comp; },
    get playing() { return cur && cur.name; },
  };
})();
