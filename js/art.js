/* RAVNSTED — art: Træsnit. Black ink cut into bone paper, one spot colour (dried red),
   and hand-coloured washes on clothes, as on old broadsheets. Everything is drawn on canvas. */
const ART = (() => {
  const INK = '#141110', RED = '#a3241a';
  const LIGHT = [ // paper, sky ink 0..1, sun [x,y], night 0..1
    { paper: '#efe1c2', sky: .22, sun: [.12, .58], night: 0, red: 1 },
    { paper: '#ece3cf', sky: .1, sun: [.3, .22], night: 0 },
    { paper: '#eee6d2', sky: .04, sun: [.5, .1], night: 0 },
    { paper: '#e9dcc0', sky: .14, sun: [.72, .22], night: 0 },
    { paper: '#e2cba0', sky: .55, sun: [.88, .52], night: .25, red: 1 },
    { paper: '#e6d9bd', sky: .9, sun: [.76, .16], night: 1 },
    { paper: '#e6d9bd', sky: 1, sun: [.5, .12], night: 1, red: 1 },
  ];
  const lerp = (a, b, t) => a + (b - a) * t;
  const hexl = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); };
  function light(tf) { const i = Math.max(0, Math.min(6, Math.floor(tf))), j = Math.min(6, i + 1), t = Math.max(0, Math.min(1, tf - i)); const A = LIGHT[i], B = LIGHT[j];
    return { paper: hexl(A.paper, B.paper, t), sky: lerp(A.sky, B.sky, t), sun: [lerp(A.sun[0], B.sun[0], t), lerp(A.sun[1], B.sun[1], t)], night: lerp(A.night, B.night, t), red: t < .5 ? A.red : B.red, moon: lerp(A.night, B.night, t) > .5 }; }
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- tools ---------- */
  function poly(c, pts, W, H) { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0] * W, p[1] * H) : c.moveTo(p[0] * W, p[1] * H)); c.closePath(); }
  function hatch(c, clip, W, H, ang, gap, lw, col) { c.save(); clip(); c.clip(); c.strokeStyle = col; c.lineWidth = lw; const L = Math.hypot(W, H); c.translate(W / 2, H / 2); c.rotate(ang); c.beginPath(); for (let y = -L; y < L; y += gap) { c.moveTo(-L, y + Math.sin(y * .7) * gap * .08); c.lineTo(L, y + Math.cos(y * 1.3) * gap * .08); } c.stroke(); c.restore(); }
  const lw = H => Math.max(1, H * .004);

  /* ---------- sky: hatching by day, carved stars by night ---------- */
  const stars = (() => { const r = rng(5); return Array.from({ length: 80 }, () => [r(), r() * .6, r()]); })();
  function sky(c, W, H, L, f, groundY) {
    c.fillStyle = L.paper; c.fillRect(0, 0, W, H);
    if (L.night > .01) { c.globalAlpha = L.night; c.fillStyle = INK; c.fillRect(0, 0, W, groundY * H); c.globalAlpha = 1; }
    if (L.night < .99) { const g = Math.max(3, H * lerp(.05, .012, L.sky)); hatch(c, () => { c.beginPath(); c.rect(0, 0, W, groundY * H * Math.min(1, .25 + L.sky)); }, W, H, 0, g, lw(H) * .8, `rgba(20,17,16,${.4 + L.sky * .6})`); }
    if (L.night > .4) { c.strokeStyle = L.paper; c.lineWidth = lw(H); c.globalAlpha = (L.night - .4) / .6; stars.forEach(s => { const x = s[0] * W, y = s[1] * groundY * H, r = H * (.004 + s[2] * .006) * (.7 + .3 * Math.sin(f / 400 + s[2] * 20)); c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r); c.lineTo(x, y + r); c.stroke(); }); c.globalAlpha = 1; }
    const [sx, sy] = L.sun, sr = H * .06, X = sx * W, Y = sy * H;
    if (L.moon) { c.fillStyle = L.red ? '#d8b0a0' : L.paper; c.beginPath(); c.arc(X, Y, sr, 0, 7); c.fill(); c.fillStyle = INK; c.globalAlpha = L.night; c.beginPath(); c.arc(X + sr * .45, Y - sr * .15, sr * .88, 0, 7); c.fill(); c.globalAlpha = 1; }
    else { c.fillStyle = L.paper; c.strokeStyle = L.red ? RED : INK; c.lineWidth = H * .007; c.beginPath(); c.arc(X, Y, sr, 0, 7); c.fill(); c.stroke(); c.lineWidth = H * .005; const rot = f / 7000; c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + rot; c.moveTo(X + Math.cos(a) * sr * 1.25, Y + Math.sin(a) * sr * 1.25); c.lineTo(X + Math.cos(a) * sr * (i % 2 ? 1.55 : 1.9), Y + Math.sin(a) * sr * (i % 2 ? 1.55 : 1.9)); } c.stroke(); }
  }
  function hill(c, W, H, L, f) {
    c.fillStyle = INK; c.beginPath(); c.moveTo(0, .62 * H); c.quadraticCurveTo(.28 * W, .17 * H, .52 * W, .27 * H); c.quadraticCurveTo(.8 * W, .37 * H, W, .5 * H); c.lineTo(W, .8 * H); c.lineTo(0, .8 * H); c.closePath(); c.fill();
    c.strokeStyle = L.paper; c.lineWidth = lw(H) * .8; c.beginPath(); for (let k = 0; k < 7; k++) { c.moveTo(0, (.66 + k * .025) * H); c.quadraticCurveTo(.3 * W, (.24 + k * .06) * H, .54 * W, (.33 + k * .055) * H); c.quadraticCurveTo(.8 * W, (.42 + k * .05) * H, W, (.55 + k * .04) * H); } c.stroke();
    if (L.night > .2) { c.fillStyle = RED; c.globalAlpha = L.night * (.65 + .35 * Math.sin(f / 1100)); [[.475, .3], [.51, .305]].forEach(e => { c.beginPath(); c.ellipse(e[0] * W, e[1] * H, H * .009, H * .004, 0, 0, 7); c.fill(); }); c.globalAlpha = 1; }
  }
  const houses = (() => { const R = rng(11), out = []; let x = -.04; while (x < 1.04) { const w = .11 + R() * .08, h = .2 + R() * .19, base = .79, top = base - h, peak = top - (.07 + R() * .07), lean = (R() - .5) * .025; const wins = []; const n = 1 + Math.floor(R() * 3); for (let i = 0; i < n; i++) wins.push([x + w * (.18 + R() * .55), top + h * (.15 + R() * .45), R()]); out.push({ x, w, base, top, peak, lean, pts: [[x, base], [x + lean, top], [x + w / 2 + lean * 1.4, peak], [x + w + lean, top], [x + w, base]], wins }); x += w - .006; } return out; })();
  function street(c, W, H, L, f, opts = {}) {
    sky(c, W, H, L, f, .79); hill(c, W, H, L, f);
    houses.forEach(h => {
      c.fillStyle = L.paper; poly(c, h.pts, W, H); c.fill();
      hatch(c, () => poly(c, [[h.x + h.w * .62, h.base], [h.x + h.w * .62 + h.lean, h.top], [h.x + h.w + h.lean, h.top], [h.x + h.w, h.base]], W, H), W, H, .9, H * (L.night > .5 ? .009 : .014), lw(H) * .8, INK);
      if (L.night > .3) { c.globalAlpha = L.night * .55; c.fillStyle = INK; poly(c, h.pts, W, H); c.fill(); c.globalAlpha = 1; }
      c.fillStyle = INK; poly(c, [[h.pts[1][0] - .008, h.top + .004], [h.pts[2][0], h.peak], [h.pts[3][0] + .008, h.top + .004]], W, H); c.fill();
      hatch(c, () => poly(c, [[h.pts[1][0], h.top], [h.pts[2][0], h.peak + .012], [h.pts[3][0], h.top]], W, H), W, H, 0, H * .012, lw(H) * .6, L.paper);
      c.strokeStyle = INK; c.lineWidth = H * .006; poly(c, h.pts, W, H); c.stroke();
      h.wins.forEach(w => { const lit = L.night > .6 || (L.night > .15 && w[2] > .4); c.fillStyle = lit ? (w[2] > .8 ? RED : L.paper) : INK; c.fillRect(w[0] * W, w[1] * H, W * .022, H * .045); c.strokeStyle = INK; c.lineWidth = H * .004; c.strokeRect(w[0] * W, w[1] * H, W * .022, H * .045); });
    });
    c.fillStyle = INK; c.fillRect(0, .79 * H, W, .21 * H);
    c.strokeStyle = L.paper; c.lineWidth = lw(H) * .8; c.beginPath(); for (let i = 0; i < 70; i++) { const x = ((i * .0173 + ((i * 37) % 11) * .003) % 1) * W, y = (.82 + ((i * 13) % 9) * .018) * H; c.moveTo(x, y); c.lineTo(x + H * .01, y - H * .02); } c.stroke();
    if (opts.well) { const x = .1 * W, y = .86 * H, r = H * .07; c.fillStyle = L.paper; c.fillRect(x - r, y - r * .6, r * 2, r * .9); c.strokeStyle = INK; c.lineWidth = H * .006; c.strokeRect(x - r, y - r * .6, r * 2, r * .9); hatch(c, () => { c.beginPath(); c.rect(x - r, y - r * .6, r * 2, r * .9); }, W, H, .3, H * .014, lw(H) * .7, INK); c.beginPath(); c.moveTo(x - r * .8, y - r * .6); c.lineTo(x - r * .8, y - r * 2.2); c.lineTo(x + r * .8, y - r * 2.2); c.lineTo(x + r * .8, y - r * .6); c.stroke(); }
    if (opts.stall) { const x = .86 * W, y = .8 * H, w = W * .2; c.fillStyle = L.paper; c.beginPath(); c.moveTo(x - w / 2, y - H * .2); c.lineTo(x + w / 2, y - H * .2); c.lineTo(x + w / 2 + W * .02, y - H * .14); c.lineTo(x - w / 2 - W * .02, y - H * .14); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = H * .005; c.stroke(); for (let i = 0; i < 6; i++) { if (i % 2) { c.fillStyle = RED; c.globalAlpha = .7; } else c.fillStyle = INK; c.fillRect(x - w / 2 + i * w / 6, y - H * .2, w / 6, H * .06); c.globalAlpha = 1; } c.strokeRect(x - w / 2, y - H * .14, w, H * .12); }
    if (opts.wisps && L.night > .5) for (let i = 0; i < 3; i++) wisp(c, W, H, (.07 + i * .09 + Math.sin(f / 1500 + i * 3) * .02), (.86 + i * .02 + Math.sin(f / 700 + i) * .012), f, L);
    crows(c, W, H, f, L);
  }
  function crows(c, W, H, f, L) { if (L.night > .3) return; c.strokeStyle = INK; c.lineWidth = H * .006; for (let i = 0; i < 3; i++) { const x = ((.05 + i * .2 + f * .000018 * (1 + i * .2)) % 1.15 - .05) * W, y = (.18 + .05 * Math.sin(f / 1300 + i * 2) + i * .03) * H, s = H * .014, fl = Math.sin(f / 180 + i) * s * .6; c.beginPath(); c.moveTo(x - s * 1.4, y - fl); c.quadraticCurveTo(x - s * .5, y - s * .4, x, y); c.quadraticCurveTo(x + s * .5, y - s * .4, x + s * 1.4, y - fl); c.stroke(); } }
  function wisp(c, W, H, x, y, f, L) { c.fillStyle = L.paper; c.beginPath(); c.arc(x * W, y * H, H * .01, 0, 7); c.fill(); c.strokeStyle = L.paper; c.lineWidth = lw(H) * .8; c.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + f / 800; c.moveTo(x * W + Math.cos(a) * H * .016, y * H + Math.sin(a) * H * .016); c.lineTo(x * W + Math.cos(a) * H * .027, y * H + Math.sin(a) * H * .027); } c.stroke(); }

  /* ---------- interiors share a wall, a window on the day, and candle light at night ---------- */
  function interior(c, W, H, L, f, win) {
    c.fillStyle = L.paper; c.fillRect(0, 0, W, H);
    // window onto the sky
    if (win) { c.save(); c.beginPath(); c.rect(win[0] * W, win[1] * H, win[2] * W, win[3] * H); c.clip(); c.translate(win[0] * W, win[1] * H); c.scale(win[2], win[3]); sky(c, W, H, L, f, 1); c.restore(); }
    const dark = .25 + L.night * .5;
    hatch(c, () => { c.beginPath(); c.rect(0, 0, W, H); if (win) c.rect(win[0] * W + win[2] * W, win[1] * H, -win[2] * W, win[3] * H); }, W, H, .78, H * lerp(.022, .009, dark), lw(H) * .8, INK);
    if (win) { c.strokeStyle = INK; c.lineWidth = H * .012; c.strokeRect(win[0] * W, win[1] * H, win[2] * W, win[3] * H); c.lineWidth = H * .006; c.beginPath(); c.moveTo((win[0] + win[2] / 2) * W, win[1] * H); c.lineTo((win[0] + win[2] / 2) * W, (win[1] + win[3]) * H); c.moveTo(win[0] * W, (win[1] + win[3] / 2) * H); c.lineTo((win[0] + win[2]) * W, (win[1] + win[3] / 2) * H); c.stroke(); }
  }
  function candle(c, W, H, x, y, f, L, s = 1) {
    const fl = .85 + .15 * Math.sin(f / 90) * Math.sin(f / 233), r = H * .22 * s * fl;
    if (L.night > .1 || L.sky > .4) { const g = c.createRadialGradient(x * W, y * H, 0, x * W, y * H, r); g.addColorStop(0, 'rgba(239,225,194,.85)'); g.addColorStop(1, 'rgba(239,225,194,0)'); c.fillStyle = g; c.beginPath(); c.arc(x * W, y * H, r, 0, 7); c.fill(); }
    c.fillStyle = L.paper; c.strokeStyle = INK; c.lineWidth = H * .004; c.fillRect(x * W - H * .012 * s, y * H, H * .024 * s, H * .07 * s); c.strokeRect(x * W - H * .012 * s, y * H, H * .024 * s, H * .07 * s);
    c.fillStyle = RED; c.beginPath(); c.ellipse(x * W, y * H - H * .02 * s, H * .007 * s, H * .02 * s * fl, Math.sin(f / 300) * .1, 0, 7); c.fill();
  }
  function beam(c, W, H, x1, y1, x2, y2, t, L) { c.strokeStyle = INK; c.lineWidth = H * t; c.beginPath(); c.moveTo(x1 * W, y1 * H); c.lineTo(x2 * W, y2 * H); c.stroke(); c.strokeStyle = L.paper; c.lineWidth = lw(H) * .6; c.beginPath(); for (let k = -1; k <= 1; k += 2) { c.moveTo(x1 * W, y1 * H + k * H * t * .2); c.lineTo(x2 * W, y2 * H + k * H * t * .2); } c.stroke(); }
  function floor(c, W, H, L, y = .82) { c.fillStyle = INK; c.fillRect(0, y * H, W, (1 - y) * H); c.strokeStyle = L.paper; c.lineWidth = lw(H) * .7; c.beginPath(); for (let i = 0; i < 9; i++) { const yy = (y + .02 + i * i * .003) * H; c.moveTo(0, yy); c.lineTo(W, yy); } for (let i = -6; i < 12; i++) { c.moveTo(W / 2 + i * W * .02, y * H); c.lineTo(W / 2 + i * W * .2, H); } c.stroke(); }

  const PLACES = {
    town(c, W, H, L, f) { street(c, W, H, L, f, { wisps: 1 }); },
    torv(c, W, H, L, f) { street(c, W, H, L, f, { well: 1, stall: 1 }); },
    loft(c, W, H, L, f) {
      interior(c, W, H, L, f, [.44, .1, .12, .18]);
      beam(c, W, H, -.05, .95, .5, -.05, .03, L); beam(c, W, H, 1.05, .95, .5, -.05, .03, L); beam(c, W, H, 0, .42, 1, .42, .022, L);
      // hay
      c.fillStyle = L.paper; c.beginPath(); c.moveTo(0, .82 * H); c.quadraticCurveTo(.12 * W, .5 * H, .3 * W, .82 * H); c.fill(); c.strokeStyle = INK; c.lineWidth = lw(H); c.beginPath(); for (let i = 0; i < 40; i++) { const x = (i * .0071) * W, y = .82 * H - Math.sin(i / 40 * Math.PI) * H * .25; c.moveTo(x, .82 * H); c.lineTo(x + (i % 5 - 2) * H * .01, y + (i % 3) * H * .02); } c.stroke();
      floor(c, W, H, L);
      // ladder
      c.strokeStyle = INK; c.lineWidth = H * .012; c.beginPath(); c.moveTo(.82 * W, H); c.lineTo(.86 * W, .55 * H); c.moveTo(.92 * W, H); c.lineTo(.95 * W, .55 * H); for (let i = 0; i < 5; i++) { const t = i / 5; c.moveTo(lerp(.82, .86, t) * W, lerp(H, .55 * H, t)); c.lineTo(lerp(.92, .95, t) * W, lerp(H, .55 * H, t)); } c.stroke();
      if (L.night > .1 || L.sky > .4) candle(c, W, H, .66, .74, f, L, .9);
      // rat
      const rx = (.3 + .05 * Math.sin(f / 2200)) * W; c.fillStyle = INK; c.beginPath(); c.ellipse(rx, .86 * H, H * .025, H * .012, 0, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = lw(H); c.beginPath(); c.moveTo(rx - H * .025, .86 * H); c.quadraticCurveTo(rx - H * .06, .84 * H, rx - H * .07, .87 * H); c.stroke();
    },
    skriver(c, W, H, L, f) {
      interior(c, W, H, L, f, [.72, .08, .1, .26]);
      // stone blocks
      c.strokeStyle = INK; c.lineWidth = lw(H); c.beginPath(); for (let r = 0; r < 8; r++) { const y = r * .1 * H; c.moveTo(0, y); c.lineTo(.6 * W, y); for (let k = 0; k < 6; k++) { const x = (k * .12 + (r % 2) * .06) * W; c.moveTo(x, y); c.lineTo(x, y + .1 * H); } } c.stroke();
      // shelf with scrolls
      c.fillStyle = INK; c.fillRect(.04 * W, .3 * H, .3 * W, H * .015); for (let i = 0; i < 6; i++) { c.fillStyle = L.paper; c.beginPath(); c.ellipse((.07 + i * .045) * W, .27 * H, H * .02, H * .03, 0, 0, 7); c.fill(); c.strokeStyle = INK; c.stroke(); }
      floor(c, W, H, L, .84);
      // lectern and the book
      c.fillStyle = INK; c.fillRect(.47 * W, .6 * H, .06 * W, .26 * H);
      c.fillStyle = L.paper; c.beginPath(); c.moveTo(.33 * W, .58 * H); c.quadraticCurveTo(.42 * W, .52 * H, .5 * W, .57 * H); c.quadraticCurveTo(.58 * W, .52 * H, .67 * W, .58 * H); c.lineTo(.66 * W, .64 * H); c.quadraticCurveTo(.58 * W, .6 * H, .5 * W, .64 * H); c.quadraticCurveTo(.42 * W, .6 * H, .34 * W, .64 * H); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = H * .005; c.stroke();
      c.lineWidth = lw(H) * .6; c.beginPath(); for (let i = 0; i < 5; i++) { c.moveTo(.37 * W, (.58 + i * .01) * H); c.lineTo(.47 * W, (.575 + i * .01) * H); c.moveTo(.53 * W, (.575 + i * .01) * H); c.lineTo(.63 * W, (.58 + i * .01) * H); } c.stroke();
      c.fillStyle = RED; c.fillRect(.495 * W, .6 * H, W * .01, H * .07);
      candle(c, W, H, .28, .62, f, L, 1);
    },
    farveri(c, W, H, L, f) {
      interior(c, W, H, L, f, [.08, .1, .14, .2]);
      beam(c, W, H, 0, .08, 1, .08, .03, L);
      // bottles on a shelf
      c.fillStyle = INK; c.fillRect(.62 * W, .28 * H, .34 * W, H * .014);
      for (let i = 0; i < 7; i++) { const x = (.64 + i * .045) * W, h = H * (.05 + (i % 3) * .015); c.fillStyle = i === 3 ? '#5d7f3e' : L.paper; c.globalAlpha = i === 3 ? .8 : 1; c.fillRect(x, .28 * H - h, W * .025, h); c.globalAlpha = 1; c.strokeStyle = INK; c.lineWidth = lw(H); c.strokeRect(x, .28 * H - h, W * .025, h); }
      floor(c, W, H, L, .8);
      [['#b3342a', .2], ['#d1a43a', .45], ['#3c5a8f', .7]].forEach(([col, x], i) => {
        const y = .7 * H, rw = W * .1, rh = H * .05;
        c.fillStyle = L.paper; c.fillRect(x * W - rw, y, rw * 2, H * .16); c.strokeStyle = INK; c.lineWidth = H * .006; c.strokeRect(x * W - rw, y, rw * 2, H * .16);
        hatch(c, () => { c.beginPath(); c.rect(x * W - rw, y, rw * 2, H * .16); }, W, H, 1.2, H * .014, lw(H) * .8, INK);
        c.fillStyle = col; c.globalAlpha = .85; c.beginPath(); c.ellipse(x * W, y, rw, rh, 0, 0, 7); c.fill(); c.globalAlpha = 1; c.stroke();
        c.strokeStyle = INK; c.lineWidth = lw(H); c.beginPath(); for (let k = 0; k < 3; k++) { const sx = x * W + (k - 1) * rw * .5, o = (f / 30 + k * 20 + i * 7) % 60; c.moveTo(sx, y - H * .02 - o * H * .002); c.bezierCurveTo(sx + H * .02, y - H * .06 - o * H * .002, sx - H * .02, y - H * .1 - o * H * .002, sx, y - H * .14 - o * H * .002); } c.stroke();
      });
      // barrel of lime
      c.fillStyle = L.paper; c.fillRect(.88 * W, .6 * H, .1 * W, .22 * H); c.strokeStyle = INK; c.lineWidth = H * .005; c.strokeRect(.88 * W, .6 * H, .1 * W, .22 * H); c.beginPath(); c.moveTo(.88 * W, .66 * H); c.lineTo(.98 * W, .66 * H); c.moveTo(.88 * W, .76 * H); c.lineTo(.98 * W, .76 * H); c.stroke();
    },
    kro(c, W, H, L, f) {
      interior(c, W, H, L, f, [.8, .12, .12, .2]);
      beam(c, W, H, 0, .1, 1, .1, .03, L); beam(c, W, H, .3, 0, .3, .82, .025, L);
      // fireplace
      c.fillStyle = INK; c.fillRect(.04 * W, .4 * H, .22 * W, .42 * H); c.fillStyle = L.paper; c.fillRect(.07 * W, .52 * H, .16 * W, .3 * H);
      const fl = f / 120; c.fillStyle = RED; c.beginPath(); c.moveTo(.08 * W, .82 * H); for (let i = 0; i <= 8; i++) { const x = (.08 + i * .0175) * W; c.lineTo(x, (.7 - Math.abs(Math.sin(fl + i)) * .1 - (i % 2) * .04) * H); } c.lineTo(.22 * W, .82 * H); c.fill();
      floor(c, W, H, L, .82);
      // long table, mugs
      c.fillStyle = INK; c.fillRect(.36 * W, .66 * H, .58 * W, H * .04); c.fillRect(.4 * W, .7 * H, W * .02, .14 * H); c.fillRect(.9 * W, .7 * H, W * .02, .14 * H);
      for (let i = 0; i < 4; i++) { const x = (.42 + i * .14) * W; c.fillStyle = L.paper; c.fillRect(x, .6 * H, W * .03, H * .06); c.strokeStyle = INK; c.lineWidth = lw(H); c.strokeRect(x, .6 * H, W * .03, H * .06); }
      // lantern
      const lx = .62 * W, ly = .2 * H + Math.sin(f / 900) * H * .006; c.strokeStyle = INK; c.lineWidth = lw(H); c.beginPath(); c.moveTo(lx, .1 * H); c.lineTo(lx, ly); c.stroke(); candle(c, W, H, .62, (ly / H) + .02, f, L, .6);
    },
    mose(c, W, H, L, f) {
      sky(c, W, H, L, f, .66);
      c.fillStyle = INK; c.beginPath(); c.moveTo(0, .55 * H); c.quadraticCurveTo(.5 * W, .32 * H, W, .5 * H); c.lineTo(W, .66 * H); c.lineTo(0, .66 * H); c.fill();
      // water
      c.fillStyle = INK; c.fillRect(0, .66 * H, W, .34 * H); c.strokeStyle = L.paper; c.lineWidth = lw(H) * .7; c.beginPath(); for (let i = 0; i < 14; i++) { const y = (.69 + i * .022) * H, o = Math.sin(f / 1500 + i) * W * .03; c.moveTo(.05 * W + o + (i % 3) * W * .1, y); c.lineTo(.4 * W + o + (i % 4) * W * .08, y); c.moveTo(.55 * W - o, y + H * .008); c.lineTo(.9 * W - o - (i % 2) * W * .05, y + H * .008); } c.stroke();
      // reeds
      c.strokeStyle = INK; c.lineWidth = H * .006; const reeds = (x0, n) => { c.beginPath(); for (let i = 0; i < n; i++) { const x = (x0 + i * .012) * W, sw = Math.sin(f / 900 + i) * H * .01; c.moveTo(x, .82 * H); c.quadraticCurveTo(x + sw, .7 * H, x + sw * 2, (.55 + (i % 4) * .03) * H); } c.stroke(); };
      c.fillStyle = INK; c.fillRect(0, .8 * H, .28 * W, .2 * H); c.fillRect(.74 * W, .78 * H, .26 * W, .22 * H); reeds(.0, 22); reeds(.75, 20);
      // dead tree
      c.strokeStyle = INK; c.lineWidth = H * .02; c.beginPath(); c.moveTo(.88 * W, .8 * H); c.lineTo(.86 * W, .4 * H); c.lineTo(.8 * W, .3 * H); c.moveTo(.86 * W, .48 * H); c.lineTo(.94 * W, .36 * H); c.moveTo(.83 * W, .35 * H); c.lineTo(.84 * W, .26 * H); c.stroke();
      for (let i = 0; i < 5; i++) wisp(c, W, H, .2 + i * .14 + Math.sin(f / 1700 + i * 2) * .04, .62 + Math.sin(f / 800 + i) * .04 + (i % 2) * .05, f, L);
    },
  };

  /* ---------- figures ---------- */
  function wash(c, col, draw) { const C = COLORS[col]; if (!C) return; if (col === 'sort') { c.fillStyle = INK; draw(); c.fill(); return; } if (col === 'hvid') return; c.globalAlpha = .72; c.fillStyle = C.hex; draw(); c.fill(); c.globalAlpha = 1; }
  function pattern(c, pat, clip, W, H, s, col) { if (!pat) return; const ink = col === 'sort' ? '#efe1c2' : INK; c.save(); clip(); c.clip(); c.fillStyle = ink; c.strokeStyle = ink; c.lineWidth = s * .018;
    const L = 2000; if (pat === 'stribet') { c.beginPath(); for (let y = -L; y < L; y += s * .07) { c.moveTo(-L, y); c.lineTo(L, y); } c.lineWidth = s * .03; c.stroke(); }
    if (pat === 'ternet') { c.beginPath(); for (let y = -L; y < L; y += s * .06) { c.moveTo(-L, y); c.lineTo(L, y); c.moveTo(y, -L); c.lineTo(y, L); } c.stroke(); }
    if (pat === 'prikket') { for (let x = 0; x < W; x += s * .07) for (let y = 0; y < H; y += s * .07) { c.beginPath(); c.arc(x, y, s * .012, 0, 7); c.fill(); } }
    c.restore(); }
  /* cx: centre x, by: feet y, s: height in px */
  function figure(c, cx, by, s, look, f, o = {}) {
    if (look.steam) return steam(c, cx, by, s, f, o);
    if (look.tall) s *= 1.12;
    const bob = Math.sin(f / 700 + cx) * s * .006; by += bob;
    const paper = o.paper || '#efe1c2'; const [kind, col, pat] = look.body || ['kappe', 'grå'];
    const sh = by - s * .78, hem = by - s * .05, hw = s * .2, bw = kind === 'kjole' || kind === 'kappe' || kind === 'sjal' ? s * .27 : s * .22, hemY = kind === 'jakke' ? by - s * .38 : hem;
    c.lineJoin = 'round';
    // legs, feet
    c.fillStyle = INK; if (kind === 'jakke') { c.fillRect(cx - s * .1, hemY, s * .08, by - hemY); c.fillRect(cx + s * .02, hemY, s * .08, by - hemY); }
    c.fillStyle = look.bare ? paper : (look.shoes ? (look.shoes === 'sort' ? INK : COLORS[look.shoes].hex) : INK); c.strokeStyle = INK; c.lineWidth = s * .01;
    [-1, 1].forEach(d => { c.beginPath(); c.ellipse(cx + d * s * .07, by, s * .055, s * .022, 0, 0, 7); c.fill(); c.stroke(); });
    // body
    const body = () => { c.beginPath(); c.moveTo(cx - hw, sh); c.lineTo(cx + hw, sh); c.lineTo(cx + bw, hemY); c.quadraticCurveTo(cx, hemY + s * .03, cx - bw, hemY); c.closePath(); };
    c.fillStyle = paper; body(); c.fill(); wash(c, col, body); pattern(c, pat, body, c.canvas.width, c.canvas.height, s, col);
    hatch(c, () => { c.beginPath(); c.moveTo(cx + hw * .3, sh); c.lineTo(cx + hw, sh); c.lineTo(cx + bw, hemY); c.lineTo(cx + bw * .35, hemY); c.closePath(); }, c.canvas.width, c.canvas.height, .8, s * .028, s * .008, col === 'sort' ? paper : INK);
    c.strokeStyle = INK; c.lineWidth = s * .014; body(); c.stroke();
    if (kind === 'kappe') { c.lineWidth = s * .008; c.beginPath(); c.moveTo(cx, sh + s * .05); c.lineTo(cx, hemY); c.stroke(); }
    if (kind === 'forklæde') { const ap = () => { c.beginPath(); c.rect(cx - s * .13, sh + s * .22, s * .26, hemY - sh - s * .26); }; c.fillStyle = paper; ap(); c.fill(); wash(c, col, ap); c.strokeStyle = INK; c.lineWidth = s * .01; ap(); c.stroke(); }
    if (kind === 'sjal') { const sj = () => { c.beginPath(); c.moveTo(cx - hw - s * .04, sh - s * .01); c.lineTo(cx + hw + s * .04, sh - s * .01); c.lineTo(cx, sh + s * .3); c.closePath(); }; c.fillStyle = paper; sj(); c.fill(); wash(c, col, sj); c.strokeStyle = INK; c.lineWidth = s * .01; sj(); c.stroke(); }
    // belt for dresses
    if (kind === 'kjole') { c.fillStyle = INK; c.fillRect(cx - hw * 1.08, sh + s * .2, hw * 2.16, s * .025); }
    // arms and hands
    const handY = sh + s * .36; c.strokeStyle = INK; c.lineWidth = s * .05; c.lineCap = 'round';
    [-1, 1].forEach(d => { c.beginPath(); c.moveTo(cx + d * hw * .95, sh + s * .03); c.lineTo(cx + d * (hw + s * .05), handY); c.stroke(); });
    c.lineCap = 'butt';
    [-1, 1].forEach(d => { const hx = cx + d * (hw + s * .05); const gc = look.gloves || (look.mitten && d > 0 ? look.mitten : null) || look.hands; c.fillStyle = gc ? (gc === 'sort' ? INK : COLORS[gc].hex) : paper; c.strokeStyle = INK; c.lineWidth = s * .01; c.beginPath(); c.arc(hx, handY + s * .02, s * .035, 0, 7); c.fill(); c.stroke(); });
    if (look.holds === 'kjole') { const dr = () => { c.beginPath(); c.ellipse(cx, sh + s * .32, s * .16, s * .07, -.1, 0, 7); }; c.fillStyle = RED; dr(); c.fill(); c.strokeStyle = INK; c.lineWidth = s * .01; dr(); c.stroke(); }
    // scarf
    if (look.scarf) { const sc = () => { c.beginPath(); c.ellipse(cx, sh + s * .01, hw * .85, s * .04, 0, 0, 7); c.moveTo(cx + hw * .3, sh); c.rect(cx + hw * .25, sh, s * .05, s * .17); }; c.fillStyle = paper; sc(); c.fill(); wash(c, look.scarf, sc); c.strokeStyle = INK; c.lineWidth = s * .01; sc(); c.stroke(); }
    // head
    const hy = sh - s * .1, hr = s * .085;
    if (look.hood) { c.fillStyle = paper; const hd = () => { c.beginPath(); c.ellipse(cx, hy - s * .01, hr * 1.45, hr * 1.5, 0, 0, 7); }; hd(); c.fill(); wash(c, look.hood, hd); c.strokeStyle = INK; c.lineWidth = s * .012; hd(); c.stroke(); }
    if (look.hair) { c.fillStyle = INK; c.beginPath(); c.ellipse(cx, hy + s * .03, hr * 1.25, hr * 1.7, 0, 0, 7); c.fill(); }
    c.fillStyle = paper; c.strokeStyle = INK; c.lineWidth = s * .012; c.beginPath(); c.arc(cx, hy, hr, 0, 7); c.fill(); c.stroke();
    const blink = (Math.floor((f + cx * 50) / 2600) % 3 === 0) && ((f + cx * 50) % 2600) < 140;
    c.fillStyle = INK; [-1, 1].forEach(d => { if (look.milky && d < 0) { c.strokeStyle = INK; c.lineWidth = s * .006; c.beginPath(); c.arc(cx + d * hr * .38, hy - hr * .1, hr * .17, 0, 7); c.stroke(); return; } if (blink) c.fillRect(cx + d * hr * .38 - hr * .12, hy - hr * .1, hr * .24, s * .005); else { c.beginPath(); c.arc(cx + d * hr * .38, hy - hr * .1, hr * .1, 0, 7); c.fill(); } });
    c.strokeStyle = INK; c.lineWidth = s * .007; c.beginPath(); c.moveTo(cx, hy - hr * .05); c.lineTo(cx - hr * .1, hy + hr * .25); c.stroke();
    const talk = o.talking ? Math.abs(Math.sin(f / 90)) : 0; c.beginPath(); c.ellipse(cx, hy + hr * .5, hr * .28, hr * (.04 + talk * .16), 0, 0, 7); c.fillStyle = INK; c.fill();
    if (look.beard) { c.fillStyle = paper; c.beginPath(); c.moveTo(cx - hr * .8, hy + hr * .2); c.quadraticCurveTo(cx, hy + hr * 2.6, cx + hr * .8, hy + hr * .2); c.fill(); c.strokeStyle = INK; c.lineWidth = s * .006; c.stroke(); c.beginPath(); for (let i = -3; i <= 3; i++) { c.moveTo(cx + i * hr * .18, hy + hr * .5); c.lineTo(cx + i * hr * .1, hy + hr * 1.8); } c.stroke(); }
    if (look.hat) { const [hk, hc, hp] = look.hat;
      if (hk === 'hue') { const hu = () => { c.beginPath(); c.arc(cx, hy - hr * .25, hr * 1.02, Math.PI, 0); c.closePath(); }; c.fillStyle = paper; hu(); c.fill(); wash(c, hc, hu); pattern(c, hp, hu, c.canvas.width, c.canvas.height, s * .6, hc); c.strokeStyle = INK; c.lineWidth = s * .012; hu(); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(cx, hy - hr * 1.3, hr * .18, 0, 7); c.fill(); }
      if (hk === 'kalot') { c.fillStyle = INK; c.beginPath(); c.arc(cx, hy - hr * .35, hr * .9, Math.PI, 0); c.fill(); }
      if (hk === 'hat') { c.fillStyle = INK; c.fillRect(cx - hr * 1.6, hy - hr * .75, hr * 3.2, s * .02); c.fillRect(cx - hr * .9, hy - hr * 1.9, hr * 1.8, hr * 1.2); }
    }
    if (o.tag) nameTag(c, cx, hy - hr * 2.6, s, o.tag);
  }
  function steam(c, cx, by, s, f, o) {
    s *= 1.25; const top = by - s; c.strokeStyle = '#efe1c2'; c.lineWidth = s * .008;
    c.beginPath(); for (let i = 0; i < 26; i++) { const t = i / 25, x0 = cx + (t - .5) * s * .5; c.moveTo(x0, by); for (let k = 1; k <= 12; k++) { const y = by - k / 12 * s * (.6 + .4 * Math.sin(t * Math.PI)); c.lineTo(x0 + Math.sin(f / 500 + k * .7 + i) * s * .02 - (t - .5) * k * s * .012, y); } } c.stroke();
    const ey = top + s * .32; c.fillStyle = RED; [-1, 1].forEach(d => { c.globalAlpha = .7 + .3 * Math.sin(f / 300 + d); c.beginPath(); c.ellipse(cx + d * s * .06, ey, s * .018, s * .01, 0, 0, 7); c.fill(); }); c.globalAlpha = 1;
    if (o.tag) nameTag(c, cx, top + s * .08, s * .8, o.tag);
  }
  function nameTag(c, x, y, s, text) {
    const fs = Math.max(15, s * .1); c.font = `${fs}px UnifrakturMaguntia, serif`; const w = c.measureText(text).width + fs * 1.2, h = fs * 1.4;
    const X = Math.max(4, Math.min(c.canvas.width - w - 4, x - w / 2)), Y = Math.max(4, y - h);
    c.fillStyle = '#efe1c2'; c.strokeStyle = INK; c.lineWidth = Math.max(1.5, fs * .1);
    c.beginPath(); c.moveTo(X, Y); c.lineTo(X + w, Y); c.lineTo(X + w - fs * .3, Y + h / 2); c.lineTo(X + w, Y + h); c.lineTo(X, Y + h); c.lineTo(X + fs * .3, Y + h / 2); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, X + w / 2, Y + h / 2 + fs * .05);
  }

  /* ---------- stage: one animated canvas for the current scene ---------- */
  const st = { cv: null, ctx: null, place: 'torv', tf: 0, npcs: [], speaker: null, speakT: 0, W: 0, H: 0, title: null, alpha: {} };
  function fit(cv) { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); const W = Math.max(1, Math.round(r.width * d)), H = Math.max(1, Math.round(r.height * d)); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } return [W, H]; }
  function drawStage(now) {
    const cv = st.cv; if (!cv || !cv.isConnected || cv.closest('[hidden]')) return;
    const [W, H] = fit(cv), c = st.ctx, L = light(st.tf); c.setTransform(1, 0, 0, 1, 0, 0);
    (PLACES[st.place] || PLACES.torv)(c, W, H, L, now);
    const n = st.npcs.length; const s = H * .6;
    st.npcs.forEach((id, i) => {
      const P = NPCS[id]; if (!P) return; const a = st.alpha[id] = Math.min(1, (st.alpha[id] || 0) + .04);
      const x = W * (n === 1 ? .5 : n === 2 ? (i ? .7 : .3) : .2 + i * .3); const by = H * (st.place === 'mose' ? .9 : .97);
      c.globalAlpha = a; const look = id === 'sidsel' && G && !['loft', 'loft_deal', 'skriver'].includes(G.node) ? Object.assign({}, P.look, { holds: null }) : P.look;
      figure(c, x, by, s * (st.place === 'kro' ? .95 : 1), look, now, { paper: L.paper, talking: st.speaker === id && TTS.busy, tag: st.speaker === id ? P.name : null }); c.globalAlpha = 1;
    });
    // a woodcut frame
    c.strokeStyle = INK; c.lineWidth = H * .018; c.strokeRect(0, 0, W, H);
  }
  function drawTitle(now) { const cv = st.title; if (!cv || !cv.isConnected || cv.closest('[hidden]')) return; const [W, H] = fit(cv), c = cv.getContext('2d'); PLACES.town(c, W, H, light(5.4 + Math.sin(now / 9000) * .4), now); }
  function loop(now) { try { drawStage(now); drawTitle(now); } catch (e) { console.error(e); } requestAnimationFrame(loop); }
  requestAnimationFrame(loop);

  return {
    mountStage(cv) { st.cv = cv; st.ctx = cv.getContext('2d'); },
    mountTitle(cv) { st.title = cv; },
    setPlace(p, t) { st.place = p; st.tf = t; st.alpha = {}; },
    setNpcs(list) { st.npcs = list.slice(); },
    speaker(id) { st.speaker = id; },
    setTimeFloat(tf) { st.tf = tf; },
    get state() { return st; },
    timeCard(c, W, H, tf, now) { const L = light(tf); sky(c, W, H, L, now, .72); c.fillStyle = INK; c.fillRect(0, .72 * H, W, .28 * H);
      // church tower with a swinging bell
      const x = W / 2, y = .72 * H, s = Math.min(W, H); c.fillStyle = INK; c.fillRect(x - s * .06, y - s * .36, s * .12, s * .36); c.beginPath(); c.moveTo(x - s * .08, y - s * .36); c.lineTo(x, y - s * .55); c.lineTo(x + s * .08, y - s * .36); c.fill();
      c.fillStyle = L.paper; c.fillRect(x - s * .03, y - s * .32, s * .06, s * .08); c.save(); c.translate(x, y - s * .32); c.rotate(Math.sin(now / 190) * .4); c.fillStyle = RED; c.beginPath(); c.moveTo(-s * .022, s * .055); c.quadraticCurveTo(-s * .02, 0, 0, 0); c.quadraticCurveTo(s * .02, 0, s * .022, s * .055); c.closePath(); c.fill(); c.restore(); },
    lore(c, W, H, art) { const L = art === 'marsh' ? light(5.2) : art === 'book' ? light(4.6) : art === 'crow' ? light(0.3) : light(1); const f = performance.now();
      if (art === 'town') PLACES.town(c, W, H, L, f); else if (art === 'marsh') { PLACES.mose(c, W, H, L, f); steam(c, W * .5, H * .78, H * .55, f, {}); } else if (art === 'book') PLACES.skriver(c, W, H, L, f);
      else { street(c, W, H, L, f, {}); c.fillStyle = INK; const x = W * .5, y = H * .55, s = H * .5; c.fillRect(x - s * .02, y, s * .04, H); c.beginPath(); c.ellipse(x, y - s * .12, s * .16, s * .1, -.3, 0, 7); c.fill(); c.beginPath(); c.arc(x + s * .13, y - s * .23, s * .07, 0, 7); c.fill(); c.beginPath(); c.moveTo(x + s * .18, y - s * .25); c.lineTo(x + s * .3, y - s * .21); c.lineTo(x + s * .18, y - s * .2); c.fill(); c.beginPath(); c.moveTo(x - s * .12, y - s * .1); c.lineTo(x - s * .32, y + s * .02); c.lineTo(x - s * .1, y - s * .03); c.fill(); c.fillStyle = RED; c.beginPath(); c.arc(x + s * .15, y - s * .24, s * .012, 0, 7); c.fill(); }
      c.strokeStyle = INK; c.lineWidth = H * .02; c.strokeRect(0, 0, W, H); },
    die(c, S, n, p) { c.clearRect(0, 0, S, S); c.save(); c.translate(S / 2, S / 2); c.rotate(p < 1 ? p * 12 : 0); const r = S * .42; c.fillStyle = '#efe1c2'; c.strokeStyle = INK; c.lineWidth = S * .03; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 - Math.PI / 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke(); c.lineWidth = S * .012; c.beginPath(); for (let i = 0; i < 6; i += 2) { const a = i / 6 * 6.283 - Math.PI / 2, b = (i + 2) / 6 * 6.283 - Math.PI / 2; c.moveTo(Math.cos(a) * r, Math.sin(a) * r); c.lineTo(Math.cos(b) * r * .5, Math.sin(b) * r * .5); } c.stroke(); c.rotate(p < 1 ? -p * 12 : 0); c.fillStyle = n === 20 || n === 1 ? RED : INK; c.font = `${S * .3}px UnifrakturMaguntia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n, 0, S * .02); c.restore(); },
    dress(c, W, H) { c.fillStyle = '#efe1c2'; c.fillRect(0, 0, W, H); const d = () => { c.beginPath(); c.moveTo(W * .36, H * .1); c.lineTo(W * .64, H * .1); c.lineTo(W * .72, H * .2); c.lineTo(W * .63, H * .24); c.lineTo(W * .6, H * .42); c.lineTo(W * .8, H * .9); c.quadraticCurveTo(W * .5, H * .96, W * .2, H * .9); c.lineTo(W * .4, H * .42); c.lineTo(W * .37, H * .24); c.lineTo(W * .28, H * .2); c.closePath(); };
      c.fillStyle = RED; d(); c.fill(); hatch(c, d, W, H, -.7, H * .016, H * .003, 'rgba(20,17,16,.55)'); c.strokeStyle = INK; c.lineWidth = H * .008; d(); c.stroke();
      c.fillStyle = INK; c.fillRect(W * .39, H * .4, W * .22, H * .035);
      for (let i = 0; i < 4; i++) { c.fillStyle = '#efe1c2'; c.beginPath(); c.arc(W * .5, H * (.15 + i * .06), H * .012, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = H * .004; c.stroke(); }
      c.strokeStyle = INK; c.lineWidth = H * .006; for (let i = 0; i < 9; i++) { const x = W * (.24 + i * .065); c.beginPath(); c.moveTo(x, H * .9); c.lineTo(x + (i % 2) * 4, H * (.93 + (i % 3) * .015)); c.stroke(); c.beginPath(); c.arc(x + (i % 2) * 4, H * (.94 + (i % 3) * .015), H * .006, 0, 7); c.fillStyle = INK; c.fill(); }
      c.strokeStyle = '#5d7f3e'; c.lineWidth = H * .006; c.beginPath(); c.moveTo(W * .3, H * .5); c.quadraticCurveTo(W * .34, H * .56, W * .31, H * .64); c.stroke(); c.strokeStyle = INK; c.lineWidth = H * .016; c.strokeRect(0, 0, W, H); },
    figureCard(c, W, H, look) { c.fillStyle = '#efe1c2'; c.fillRect(0, 0, W, H); c.fillStyle = INK; c.fillRect(0, H * .9, W, H * .1); figure(c, W / 2, H * .92, H * .78, look, 0, {}); c.strokeStyle = INK; c.lineWidth = 4; c.strokeRect(0, 0, W, H); },
  };
})();
