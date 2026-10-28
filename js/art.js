/* RAVNSTED — art: oil paintings in the manner of 70s doom covers (img/*.webp, made by tools/art).
   The paintings are still; this file makes them live: slow push-in, crossfades between hours,
   candle and fire flicker, drifting fog, rain, marsh lights, dust and embers. Faces are never shown. */
const ART = (() => {
  const BONE = '#e9dcc0', INK = '#15110f', RED = '#b8352a';
  /* ---------- images ---------- */
  const IMG = {}, waiting = {};
  const ALIAS = { stue_1: 'stue_0' };  // the evening living room is the dusk painting with the dark closing in (see FX)
  function img(name, cb) {
    let im = IMG[name];
    if (!im) { im = IMG[name] = new Image(); im.decoding = 'async'; im.onload = () => { (waiting[name] || []).forEach(f => f(im)); delete waiting[name]; }; im.onerror = () => { im.failed = 1; if (window.__dev) (__dev.imgMiss = __dev.imgMiss || []).push(name); }; im.src = `img/${ALIAS[name] || name}.webp?v=${window.VERSION || ''}`; }
    if (cb) { if (im.complete && im.naturalWidth) cb(im); else (waiting[name] = waiting[name] || []).push(cb); }
    return im.complete && im.naturalWidth ? im : null;
  }
  const tintCache = {};
  function tinted(name, im, plate, dim) { // people take on the colour of the room's light; those not speaking sink back
    const key = name + plate + dim; if (tintCache[key]) return tintCache[key];
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d');
    x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-atop';
    const t = AMBIENT[plate]; if (t) { x.fillStyle = `rgba(${t})`; x.fillRect(0, 0, c.width, c.height); }
    if (dim) { x.fillStyle = 'rgba(8,6,10,.42)'; x.fillRect(0, 0, c.width, c.height); }
    return tintCache[key] = c;
  }
  const AMBIENT = { loft_0: '30,60,100,.32', loft_4: '120,45,25,.35', skriver_1: '50,70,85,.28', skriver_5: '70,28,12,.45', torv_1: '35,65,60,.3', torv_2: '90,80,40,.28',
    farveri_3: '95,65,30,.22', stue_1: '30,20,10,.2', stue_3: '30,30,40,.15', loftet_1: '20,20,30,.2', marked_2: '20,30,40,.25', kro_3: '80,48,28,.3', kro_4: '110,38,18,.42', mose_5: '15,45,60,.45', mose_6: '45,15,30,.5' };

  /* ---------- places: a painting per hour, plus what moves in it (coordinates are fractions of the painting) ---------- */
  const PLATES = { loft: [0, 4], skriver: [1, 5], torv: [1, 2], farveri: [3], kro: [3, 4], mose: [5, 6],
    gade33: [0], stue: [0, 1, 3, 4], loftet: [1, 3], marked: [2] };  // 3.3 (woodcut); hours are that session's own
  const FX = { // 'dark' goes first: it darkens everything away from a light, then the lights are added on top
    loft_0: [['candle', .41, .22, .25], ['dust', .49, .37], ['fog', .12]], loft_4: [['dark', .45, .3, .3], ['candle', .41, .22, .35], ['dust', .49, .37], ['fog', .15]],
    skriver_1: [['candle', .83, .43, .5], ['dust', .5, .35]], skriver_5: [['dark', .83, .44, .6], ['candle', .83, .44, .9], ['dust', .5, .4], ['fog', .1]],
    torv_1: [['fog', .3], ['crows']], torv_2: [['fog', .2], ['rain', .5]],
    farveri_3: [['steam', [.2, .41, .62], .44], ['fog', .15]],
    kro_3: [['fire', .23, .62, .8], ['embers', .23, .6], ['candle', .65, .24, .3], ['fog', .15]], kro_4: [['dark', .23, .6, .45], ['fire', .23, .62, 1.1], ['embers', .23, .6], ['candle', .65, .22, .4], ['fog', .25]],
    mose_5: [['wisps', .5, .86], ['fog', .4]], mose_6: [['wisps', .5, .86], ['fog', .6, '120,200,140']],
    title_wide: [['wisps', .5, .85], ['fog', .4], ['eyes', .4005, .27, .0105]], title_tall: [['wisps', .5, .85], ['fog', .4], ['eyes', .4505, .431, .007]],
    lore_marsh: [['wisps', .5, .6], ['fire', .55, .65, .5]],
    // 3.3 · Dødsboet (woodcut)
    gade33_0: [['candle', .43, .15, .25], ['fog', .22], ['crows']],
    stue_0: [['candle', .675, .47, .45], ['dust', .5, .4]], stue_1: [['dark', .675, .47, .38], ['candle', .675, .47, .8], ['dust', .5, .4], ['fog', .08]],
    stue_3: [['dark', .55, .46, .4], ['candle', .55, .46, 1.2], ['dust', .55, .45]], stue_4: [['candle', .665, .45, .2], ['fog', .1]],
    loftet_1: [['dark', .43, .64, .35], ['candle', .43, .64, .8], ['dust', .5, .4]], loftet_3: [['dust', .5, .4], ['fog', .1]],
    marked_2: [['candle', .125, .25, .3], ['candle', .875, .22, .3], ['fog', .3]], lore_lampe: [['candle', .5, .3, .5]],
  };

  function plateFor(place, tf) {
    const hs = PLATES[place]; if (!hs) return [[place, 1]];
    if (hs.length === 1 || tf <= hs[0]) return [[`${place}_${hs[0]}`, 1]];
    for (let i = 0; i < hs.length - 1; i++) if (tf < hs[i + 1]) { const t = (tf - hs[i]) / (hs[i + 1] - hs[i]); return t < .02 ? [[`${place}_${hs[i]}`, 1]] : [[`${place}_${hs[i]}`, 1], [`${place}_${hs[i + 1]}`, t]]; }
    return [[`${place}_${hs[hs.length - 1]}`, 1]];
  }
  const HOURS = ['#7d93b8', '#9fa58e', '#d1b26a', '#d08a46', '#b8402e', '#2a3a78', '#4a0c22'];
  function cover(c, im, W, H, zoom = 1, fx = .5, fy = .5) {
    const k = Math.max(W / im.naturalWidth, H / im.naturalHeight) * zoom, w = im.naturalWidth * k, h = im.naturalHeight * k;
    const ox = (W - w) * fx, oy = (H - h) * fy; c.drawImage(im, ox, oy, w, h); return (u, v) => [ox + u * w, oy + v * h, k];
  }

  /* ---------- moving things ---------- */
  const R = (() => { let a = 7; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
  const motes = Array.from({ length: 60 }, () => [R(), R(), .3 + R()]);
  const drops = Array.from({ length: 160 }, () => [R(), R(), .6 + R() * .6]);
  let fogTex = null;
  function fog() {
    if (fogTex) return fogTex; const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
    for (let i = 0; i < 70; i++) { const px = R() * 512, py = 60 + R() * 196, r = 30 + R() * 90; for (const dx of [-512, 0, 512]) { const g = x.createRadialGradient(px + dx, py, 0, px + dx, py, r); g.addColorStop(0, 'rgba(255,255,255,.16)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(px + dx - r, py - r, r * 2, r * 2); } }
    return fogTex = c;
  }
  function glow(c, x, y, r, col, a) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
  function effects(c, list, at, W, H, f, back) {
    for (const [kind, a, b, s] of list || []) {
      if (back !== (kind === 'fog' || kind === 'rain')) continue;
      if (kind === 'candle' || kind === 'fire') {
        const [x, y] = at(a, b), fl = .78 + .14 * Math.sin(f / 83) * Math.sin(f / 37 + 1) + .08 * Math.sin(f / 13), r = H * (kind === 'fire' ? .55 : .4) * s;
        c.globalCompositeOperation = 'lighter'; glow(c, x, y, r * fl, kind === 'fire' ? '255,110,40' : '255,160,70', .2 * fl); glow(c, x, y, r * .25, '255,210,140', .18 * fl);
        c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(30,20,30,${.12 - .1 * fl})`; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
      } else if (kind === 'dust' || kind === 'embers') {
        const [x, y] = at(a, b); c.globalCompositeOperation = 'lighter';
        motes.forEach((m, i) => { if (kind === 'embers' && i > 24) return; const t = (f / (kind === 'embers' ? 3500 : 26000) * m[2] + m[1]) % 1;
          const px = kind === 'embers' ? x + (m[0] - .5) * W * .12 + Math.sin(f / 400 + i) * W * .01 : (m[0] + Math.sin(f / 5000 + i) * .03) * W, py = kind === 'embers' ? y - t * H * .6 : (1 - t) * H;
          c.fillStyle = kind === 'embers' ? `rgba(255,${120 + i * 4},40,${(1 - t) * .9})` : `rgba(255,225,180,${.35 * Math.sin(t * Math.PI)})`; c.fillRect(px, py, H * .005 * m[2], H * .005 * m[2]); });
        c.globalCompositeOperation = 'source-over';
      } else if (kind === 'steam') {
        c.globalCompositeOperation = 'screen';
        for (let i = 0; i < 9; i++) { const t = (f / 6000 + i / 9) % 1, [x, y] = at(a[i % 3] + Math.sin(f / 1700 + i) * .02, b - t * .4); glow(c, x, y, H * (.06 + t * .16), '235,230,220', .22 * Math.sin(t * Math.PI)); }
        c.globalCompositeOperation = 'source-over';
      } else if (kind === 'wisps') {
        c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) { const [x, y] = at(.08 + i * .17 + Math.sin(f / 2300 + i * 2) * .04, b - (i % 3) * .07 + Math.sin(f / 900 + i) * .025); const p = .6 + .4 * Math.sin(f / 500 + i * 3);
          glow(c, x, y, H * .07 * p, '120,255,170', .35); glow(c, x, y, H * .012, '220,255,230', .9 * p); }
        c.globalCompositeOperation = 'source-over';
      } else if (kind === 'dark') {
        const [x, y] = at(a, b), g = c.createRadialGradient(x, y, H * .1, x, y, Math.hypot(W, H) * .8); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, `rgba(${Math.round(255 * (1 - s))},${Math.round(240 * (1 - s))},${Math.round(250 * (1 - s))},1)`);
        c.globalCompositeOperation = 'multiply'; c.fillStyle = g; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
      } else if (kind === 'eyes') {
        const p = .5 + .5 * Math.sin(f / 1400); c.globalCompositeOperation = 'lighter';
        [-1, 1].forEach(d => { const [x, y] = at(a + d * s, b); glow(c, x, y, H * .009, '255,40,20', .6 * p); glow(c, x, y, H * .0025, '255,200,160', .8 * p); }); c.globalCompositeOperation = 'source-over';
      } else if (kind === 'crows') {
        c.strokeStyle = 'rgba(10,8,8,.85)'; c.lineWidth = H * .006;
        for (let i = 0; i < 3; i++) { const x = ((.05 + i * .2 + f * .000018 * (1 + i * .2)) % 1.15 - .05) * W, y = (.12 + .04 * Math.sin(f / 1300 + i * 2) + i * .03) * H, sz = H * .014, fl = Math.sin(f / 180 + i) * sz * .6;
          c.beginPath(); c.moveTo(x - sz * 1.4, y - fl); c.quadraticCurveTo(x - sz * .5, y - sz * .4, x, y); c.quadraticCurveTo(x + sz * .5, y - sz * .4, x + sz * 1.4, y - fl); c.stroke(); }
      } else if (kind === 'fog') {
        const t = fog(), h = H * .7, w = h * 2, off = (f / 90) % w; c.globalAlpha = a; c.globalCompositeOperation = 'screen';
        for (let x = -off; x < W; x += w) c.drawImage(t, x, H - h * .95, w, h);
        const off2 = (f / 160) % w; c.globalAlpha = a * .6; for (let x = -off2 + w * .4 - w; x < W; x += w) c.drawImage(t, x, H * .15, w, h * .8);
        if (b) { c.globalCompositeOperation = 'overlay'; c.fillStyle = `rgba(${b},${a * .25})`; c.fillRect(0, 0, W, H); }
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      } else if (kind === 'rain') {
        c.strokeStyle = `rgba(190,215,210,${.28 * a})`; c.lineWidth = Math.max(1, H * .002); c.beginPath();
        drops.forEach(d => { const y = ((f / 700) * d[2] + d[1]) % 1 * H * 1.1 - H * .05, x = (d[0] * 1.2 - .1) * W - y * .12; c.moveTo(x, y); c.lineTo(x + H * .012 * d[2], y - H * .06 * d[2]); }); c.stroke();
      }
    }
  }
  function vignette(c, W, H, a = .7) { const g = c.createRadialGradient(W / 2, H * .55, H * .35, W / 2, H * .55, Math.hypot(W, H) * .62); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(6,4,8,${a})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }

  /* ---------- people ---------- */
  const PERSON = { provst: 'p_provst', agnete: 'p_agnete', tove: 'p_tove', genfaerd: 'p_genfaerd', sidsel: 'p_sidsel', absalon: 'p_absalon', gertrud: 'p_gertrud', mads: 'p_mads', hulda: 'p_hulda', foged: 'p_foged', bodil: 'p_bodil', jens: 'p_jens', mosekonen: 'p_mosekonen' };
  const SCALE = { hulda: 1.12, mosekonen: 1.35, genfaerd: 1.05 };
  function personImg(id) { const ov = typeof SES !== 'undefined' && SES.people && SES.people[id]; if (ov) return ov; if (id === 'sidsel' && typeof G !== 'undefined' && G && !['loft', 'loft_deal', 'skriver'].includes(G.node)) return 'p_sidsel_empty'; return PERSON[id]; }
  function nameTag(c, x, y, s, text) {
    const fs = Math.max(15, s * .075); c.font = `${fs}px UnifrakturMaguntia, serif`; const w = c.measureText(text).width + fs * 1.4, h = fs * 1.45;
    const X = Math.max(4, Math.min(c.canvas.width - w - 4, x - w / 2)), Y = Math.max(4, y - h);
    c.fillStyle = 'rgba(14,10,10,.82)'; c.strokeStyle = RED; c.lineWidth = Math.max(1.5, fs * .08);
    c.beginPath(); c.moveTo(X, Y); c.lineTo(X + w, Y); c.lineTo(X + w - fs * .3, Y + h / 2); c.lineTo(X + w, Y + h); c.lineTo(X, Y + h); c.lineTo(X + fs * .3, Y + h / 2); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = BONE; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, X + w / 2, Y + h / 2 + fs * .05);
  }

  /* ---------- stage ---------- */
  const st = { cv: null, ctx: null, place: 'torv', tf: 0, npcs: [], speaker: null, W: 0, H: 0, title: null, alpha: {}, t0: 0 };
  function fit(cv) { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); const W = Math.max(1, Math.round(r.width * d)), H = Math.max(1, Math.round(r.height * d)); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } return [W, H]; }
  function drawPlace(c, W, H, place, tf, f, zoom) {
    let at = null; c.fillStyle = INK; c.fillRect(0, 0, W, H);
    const layers = plateFor(place, tf);
    layers.forEach(([name, a]) => { const im = img(name); if (!im) return; c.globalAlpha = a; const m = cover(c, im, W, H, zoom, .5, .5); c.globalAlpha = 1; if (a >= .5 || !at) at = [m, name]; });
    return at;
  }
  function drawStage(now) {
    const cv = st.cv; if (!cv || !cv.isConnected || cv.closest('[hidden]')) return;
    const [W, H] = fit(cv), c = st.ctx; c.setTransform(1, 0, 0, 1, 0, 0);
    const n = st.npcs.length, spk = st.npcs.indexOf(st.speaker), talking = spk >= 0 && typeof TTS !== 'undefined' && TTS.busy;
    const xs = st.npcs.map((id, i) => n === 1 ? .5 : n === 2 ? (i ? .7 : .3) : .2 + i * .3);
    const zoom = 1.04 + .025 * Math.sin(now / 9000) + (spk >= 0 ? .03 : 0);
    const at = drawPlace(c, W, H, st.place, st.tf, now, zoom);
    const fx = at && FX[at[1]];
    if (at) effects(c, fx, at[0], W, H, now, false);
    st.npcs.forEach((id, i) => {
      const name = personImg(id), im = name && img(name); if (!im) return;
      const a = st.alpha[id] = Math.min(1, (st.alpha[id] || 0) + .035);
      const h = H * .86 * (SCALE[id] || 1) * (st.place === 'kro' ? .95 : 1), w = h * im.naturalWidth / im.naturalHeight, by = H * (st.place === 'mose' ? .99 : 1.02);
      const breathe = 1 + Math.sin(now / 1300 + i * 2) * .004 + (st.speaker === id && talking ? Math.abs(Math.sin(now / 160)) * .006 : 0);
      const x = W * xs[i];
      c.globalAlpha = a * .55; c.fillStyle = '#000'; c.beginPath(); c.ellipse(x, by - H * .03, w * .38, H * .025, 0, 0, 7); c.fill();
      c.globalAlpha = a * (id === 'genfaerd' ? .78 + .12 * Math.sin(now / 900) : 1); const src = tinted(name, im, at ? at[1] : '', spk >= 0 && st.speaker !== id ? 1 : 0);
      c.drawImage(src, x - w * breathe / 2, by - h * breathe, w * breathe, h * breathe);
      if (id === 'genfaerd') { c.globalCompositeOperation = 'lighter'; [-1, 1].forEach(d => glow(c, x + d * w * .06, by - h * .86, h * .03, '230,240,220', .35 + .2 * Math.sin(now / 700 + d))); c.globalCompositeOperation = 'source-over'; }
      if (id === 'mosekonen') { c.globalCompositeOperation = 'lighter'; const p = .6 + .4 * Math.sin(now / 600); glow(c, x, by - h * .82, h * .12, '255,40,20', .25 * p); c.globalCompositeOperation = 'source-over'; }
      c.globalAlpha = 1;
      if (st.speaker === id) nameTag(c, x, by - h * 1.0 - H * .01, H, NPCS[id].name);
    });
    if (at) effects(c, fx, at[0], W, H, now, true);
    vignette(c, W, H, .65);
  }
  function drawTitle(now) {
    const cv = st.title; if (!cv || !cv.isConnected || cv.closest('[hidden]')) return;
    const [W, H] = fit(cv), c = cv.getContext('2d'), name = W / H < 1 ? 'title_tall' : 'title_wide', im = img(name);
    c.fillStyle = INK; c.fillRect(0, 0, W, H); if (!im) return;
    const at = cover(c, im, W, H, 1.03 + .03 * Math.sin(now / 11000), .5, .3); effects(c, FX[name], at, W, H, now, false); effects(c, FX[name], at, W, H, now, true); vignette(c, W, H, .5);
  }
  function loop(now) { try { drawStage(now); drawTitle(now); } catch (e) { console.error(e); } requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  img(innerWidth < innerHeight ? 'title_tall' : 'title_wide');
  // fetch the paintings quietly, in story order, so scenes do not open on black
  setTimeout(() => { const q = ['kirke', 'loft_0', 'p_sidsel', 'skriver_1', 'p_absalon', 'torv_1', 'p_mads', 'p_hulda', 'p_gertrud', 'torv_2', 'p_foged', 'farveri_3', 'p_bodil', 'kro_3', 'kro_4', 'p_jens', 'loft_4', 'skriver_5', 'mose_5', 'mose_6', 'p_mosekonen'];
    const next = () => { const n = q.shift(); if (n) img(n, () => setTimeout(next, 150)); }; next(); next(); }, 2500);

  /* one-off pictures that are drawn into canvases owned by others: draw now, and again once the painting has arrived */
  function once(c, name, draw) { const go = im => { try { draw(im); } catch (e) { console.error(e); } }; const im = img(name, go); if (!im) { c.fillStyle = INK; c.fillRect(0, 0, c.canvas.width, c.canvas.height); } }

  return {
    mountStage(cv) { st.cv = cv; st.ctx = cv.getContext('2d'); },
    mountTitle(cv) { st.title = cv; },
    setPlace(p, t) { st.place = p; st.tf = t; st.alpha = {}; (PLATES[p] || []).forEach(h => img(`${p}_${h}`)); },
    setNpcs(list) { st.npcs = list.slice(); list.forEach(id => PERSON[id] && img(personImg(id))); },
    speaker(id) { st.speaker = id; },
    setTimeFloat(tf) { st.tf = tf; },
    preload(names) { names.forEach(n => img(n)); },
    get state() { return st; },
    timeCard(c, W, H, tf, now) {
      c.fillStyle = INK; c.fillRect(0, 0, W, H); const im = img((typeof SES !== 'undefined' && SES.timeCard) || 'kirke'); if (im) cover(c, im, W, H, 1.02 + (now % 20000) / 400000, .5, .4);
      const i = Math.max(0, Math.min(6, Math.floor(tf))), j = Math.min(6, i + 1), t = Math.max(0, Math.min(1, tf - i));
      c.globalCompositeOperation = 'color'; c.globalAlpha = .45 * (1 - t); c.fillStyle = HOURS[i]; c.fillRect(0, 0, W, H); c.globalAlpha = .45 * t; c.fillStyle = HOURS[j]; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'multiply'; c.globalAlpha = Math.min(.6, Math.max(0, (tf - 3.5) * .25)); c.fillStyle = '#10142a'; c.fillRect(0, 0, W, H);
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; vignette(c, W, H, .75);
    },
    lore(c, W, H, art) {
      // On a tall screen each card uses its own tall painting (img/<name>_tall), which fills the screen sharply.
      // Without one, the wide painting is shown whole and sharp, over a dark blurred copy that fills the rest.
      const wide = { town: 'title_wide', marsh: 'lore_marsh', book: 'skriver_5', crow: 'lore_crow' }[art] || art || 'title_wide';
      const tall = H > W ? { town: 'title_tall', marsh: 'lore_marsh_tall', book: 'lore_book_tall', crow: 'lore_crow_tall', lore_doed: 'lore_doed_tall', lore_hane: 'lore_hane_tall', lore_lampe: 'lore_lampe_tall' }[art] : null;
      const f = performance.now();
      const whole = im => {
        c.fillStyle = INK; c.fillRect(0, 0, W, H);
        try { c.filter = 'blur(18px) brightness(.45)'; cover(c, im, W, H, 1.15); } catch (e) { } c.filter = 'none';
        const k = W / im.naturalWidth, h = im.naturalHeight * k, y = Math.max(0, H * .42 - h / 2);
        c.drawImage(im, 0, y, W, h); const g = c.createLinearGradient(0, y + h - H * .06, 0, y + h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = g; c.fillRect(0, y, W, h);
        effects(c, (FX[wide] || []).filter(e => e[0] !== 'fog'), (u, v) => [u * W, y + v * h, k], W, H, f, false);
      };
      const full = im => { const at = cover(c, im, W, H, 1, .5, .4); effects(c, (FX[wide] || []).filter(e => e[0] !== 'fog' && e[0] !== 'eyes'), at, W, H, f, false); vignette(c, W, H, .3); };
      if (!tall) return once(c, wide, im => { const at = cover(c, im, W, H, 1, .5, .45); effects(c, (FX[wide] || []).filter(e => e[0] !== 'fog'), at, W, H, f, false); vignette(c, W, H, .35); });
      if (tall === 'title_tall') return once(c, tall, full);
      // try the tall painting; fall back to the whole wide one if it does not exist (yet)
      const t = img(tall); if (t) return full(t);
      once(c, wide, im => { if (!img(tall)) whole(im); });
      img(tall, im => full(im));
    },
    die(c, S, n, p) {
      c.clearRect(0, 0, S, S); c.save(); c.translate(S / 2, S / 2); c.rotate(p < 1 ? p * 12 : 0); const r = S * .42;
      const g = c.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#efe3c6'); g.addColorStop(1, '#a8957a'); c.fillStyle = g; c.strokeStyle = INK; c.lineWidth = S * .03;
      c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 - Math.PI / 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke();
      c.lineWidth = S * .012; c.beginPath(); for (let i = 0; i < 6; i += 2) { const a = i / 6 * 6.283 - Math.PI / 2, b = (i + 2) / 6 * 6.283 - Math.PI / 2; c.moveTo(Math.cos(a) * r, Math.sin(a) * r); c.lineTo(Math.cos(b) * r * .5, Math.sin(b) * r * .5); } c.stroke();
      c.rotate(p < 1 ? -p * 12 : 0); c.fillStyle = n === 20 || n === 1 ? RED : INK; c.font = `${S * .3}px UnifrakturMaguntia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n, 0, S * .02); c.restore();
    },
    dress(c, W, H) { once(c, 'dress', im => { c.fillStyle = INK; c.fillRect(0, 0, W, H); const k = H / im.naturalHeight; c.drawImage(im, (W - im.naturalWidth * k) / 2, 0, im.naturalWidth * k, H); }); }, // painting fits the height: INSPECT spots are placed on it
    figureCard(c, W, H, look) { once(c, look.img, im => { cover(c, im, W, H, 1.08, .5, .35); vignette(c, W, H, .45); }); },
  };
})();
