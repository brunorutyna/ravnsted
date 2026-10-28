/* =========================================================================
   RAVNSTED — engine: a linear story told scene by scene over one day.
   Danish is the lever: a sentence built right first time gives advantage on the roll,
   two or more mistakes give disadvantage. English always works, but costs a krone.
   ========================================================================= */
window.__dev = {};
const KEY = 'ravnsted_save', META_KEY = 'ravnsted_meta', SET_KEY = 'ravnsted_settings';
const $ = (s, r = document) => r.querySelector(s);
const FAST = /[?&]fast/.test(location.search);
const sleep = ms => new Promise(r => setTimeout(r, FAST ? 0 : ms));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = w => String(w).toLowerCase().replace(/[.,?!…“”"]/g, '');
const MOD_CAP = 4; // skill + bonus never above +4: the die always matters
const STATS = { snak: 'Snak', loegn: 'Løgn', oeje: 'Øje', handel: 'Handel' };
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };

let SETTINGS = Object.assign({ music: .7, sfx: .8, voice: 1, voiceOn: true, rate: .9 }, lsGet(SET_KEY, {}));
const saveSettings = () => lsSet(SET_KEY, SETTINGS);

/* ---------------- voices: every character has its own recorded voice (audio/voice, js/voicemap.js).
   A line being spoken always finishes; the next one waits. Tapping ahead keeps only the newest waiting line.
   ▶ Hør (force) replays at once. A line with no clip falls back to the phone's Danish voice. ---------------- */
const TTS = {
  busy: false, next: null, cur: null, phone: null,
  init() { if (!('speechSynthesis' in window)) return; const p = () => { this.phone = speechSynthesis.getVoices().find(v => /^da/i.test(v.lang)) || null; }; p(); try { speechSynthesis.onvoiceschanged = p; } catch (e) { } },
  has(t, who = 'narrator') { return !!VOICEMAP[vkey(who, t)]; },
  say(t, force, who = 'narrator') {
    if (FAST || (!SETTINGS.voiceOn && !force)) { if (!VOICEMAP[vkey(who, t)]) (__dev.voiceMiss = __dev.voiceMiss || []).push(vkey(who, t)); return Promise.resolve(); }
    let done; const job = { t, who, p: new Promise(r => done = r) }; job.done = done;
    if (force || !this.busy) { this.stop(); if (this.next) this.next.done(); this.next = null; this.speak(job); }
    else { if (this.next) this.next.done(); this.next = job; }
    return job.p;
  },
  stop() { try { this.cur && this.cur.stop(); } catch (e) { } this.cur = null; try { speechSynthesis.cancel(); } catch (e) { } },
  speak(job) {
    const tok = this.tok = (this.tok || 0) + 1; this.busy = true; this.who = job.who; AUDIO.duck(true);
    let fired = false; const end = () => { if (fired || tok !== this.tok) return; fired = true; this.busy = false; this.cur = null; job.done(); const n = this.next; this.next = null; if (n) this.speak(n); else AUDIO.duck(false); };
    const m = VOICEMAP[vkey(job.who, job.t)];
    if (m && AUDIO.ctx) { this.cur = AUDIO.clip(m, end); setTimeout(end, (m[2] + 4) * 1000); return; }
    if (!m) { (__dev.voiceMiss = __dev.voiceMiss || []).push(vkey(job.who, job.t)); }
    try {
      const u = new SpeechSynthesisUtterance(job.t.replace(/[“”…]/g, ' ')); u.lang = 'da-DK'; if (this.phone) u.voice = this.phone; u.rate = .9; u.pitch = .85; u.volume = SETTINGS.voice;
      u.onend = u.onerror = end; setTimeout(end, 2500 + job.t.length * 120); speechSynthesis.speak(u);
    } catch (e) { end(); }
  },
};
function prefetchVoices(lines) { const s = new Set(); lines.forEach(([who, t]) => { const m = VOICEMAP[vkey(who, t)]; if (m) s.add(m[0]); }); AUDIO.prefetch([...s]); }

/* ---------------- state ---------------- */
let G = null;
/* Sessions, in book order. SES is the one being played. */
const SESSIONS = [SESSION, SESSION33];
let SES = SESSIONS[0];
const sesById = id => SESSIONS.find(s => s.id === id) || SESSIONS[0];
let META = Object.assign({ played: 0, endings: [], words: {}, runs: 0, s: {}, carry: null }, lsGet(META_KEY, {}));
if (!META.s) META.s = {};
if (!META.s.k3s2 && (META.played || META.endings.length)) META.s.k3s2 = { played: META.played, endings: META.endings.slice() }; // saves from before 3.3
const sMeta = id => META.s[id] = META.s[id] || { played: 0, endings: [] };
const saveMeta = () => lsSet(META_KEY, META);
const save = () => { if (G) lsSet(KEY, G); };
/* carry: the Kragen from the chapter before (money, skills, what happened), or null for a fresh one */
function newGame(ses, carry) {
  SES = ses || SES;
  G = { sess: SES.id, node: null, kr: carry ? carry.kr : SES.num === '3.2' ? 3 : 5, time: 0, sk: carry ? Object.assign({}, carry.sk) : { snak: 1, loegn: 1, oeje: 1, handel: 1 },
    use: carry ? Object.assign({}, carry.use) : { snak: 0, loegn: 0, oeje: 0, handel: 0 }, prev: carry ? { e1: carry.e1, e2: carry.e2, from: carry.from } : null,
    flags: SES.candles ? { lys: SES.candles } : {}, used: {}, mini: {}, rules: {}, words: {}, npcs: [], wear: null, home: {}, stats: { built: 0, perfect: 0, rolls: 0, wins: 0, eng: 0 }, at: null };
}
const snap = () => { const c = Object.assign({}, G); delete c.at; return JSON.stringify(c); };

/* ---------------- Danish text with tappable words ---------------- */
function daHTML(text) {
  return esc(text).replace(/([A-Za-zÆØÅæøå][A-Za-zÆØÅæøå'-]*)/g, (m) => {
    const k = norm(m).replace(/'$/, ''); G && (G.words[k] = 1); META.words[k] = META.words[k] || { s: 0 };
    return `<span class="w" data-w="${esc(k)}">${m}</span>`;
  });
}
function gloss(k) { return DICT[k] || DICT[k.replace(/s$/, '')] || null; }
function showTip(el, k) {
  const g = gloss(k); const tip = $('#tip'); if (!g) return;
  tip.innerHTML = `<b>${esc(k)}</b> ${esc(g)}`; tip.hidden = false;
  const r = el.getBoundingClientRect(); const tw = Math.min(300, innerWidth - 24);
  tip.style.maxWidth = tw + 'px'; tip.style.left = Math.max(12, Math.min(innerWidth - tw - 12, r.left + r.width / 2 - tw / 2)) + 'px';
  tip.style.top = (r.top > 110 ? r.top - 8 : r.bottom + 48) + 'px'; tip.classList.toggle('below', r.top <= 110);
  clearTimeout(showTip.t); showTip.t = setTimeout(() => tip.hidden = true, 3500); TTS.say(k, true, 'word');
}
document.addEventListener('click', e => { const w = e.target.closest('.w'); if (w && !w.closest('button')) { e.stopPropagation(); showTip(w, w.dataset.w); } else if (!e.target.closest('#tip')) $('#tip').hidden = true; }, true);
// long-press inside buttons shows the meaning instead of pressing
function longPress(el, k) {
  let t = null, fired = false;
  el.addEventListener('pointerdown', () => { fired = false; t = setTimeout(() => { fired = true; showTip(el, k); }, 480); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => el.addEventListener(ev, () => clearTimeout(t)));
  el.addEventListener('click', e => { if (fired) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
}

/* ---------------- log ---------------- */
const logEl = () => $('#log');
function addLog(html, cls) {
  const d = document.createElement('div'); d.className = 'entry ' + (cls || ''); d.innerHTML = html; logEl().appendChild(d);
  requestAnimationFrame(() => d.classList.add('in')); logEl().scrollTop = logEl().scrollHeight + 999; return d;
}
function toast(text) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = text; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 2600); }
function hud() {
  const T = SES.times[G.time];
  const lys = G.flags.lys !== undefined ? `<span class="lys" aria-label="Den dødes tålmodighed: ${G.flags.lys} af 5 lys">${[0, 1, 2, 3, 4].map(i => `<i class="${i < G.flags.lys ? 'on' : ''}"></i>`).join('')}</span>` : '';
  $('#hud').innerHTML = `<span class="clock">${T.name}</span>${lys}<span class="kr"><b>${G.kr}</b> kr.</span><button class="hb" id="jOpen" aria-label="Journal">Bog</button>`;
  $('#jOpen').onclick = journal;
}
function kr(n, why) { if (n < 0) n = -Math.min(G.kr, -n); if (!n) return; G.kr += n; hud(); AUDIO.sfx(n >= 0 ? 'coin' : 'coinout'); addLog(`<span>${n >= 0 ? '+' : '−'} ${Math.abs(n)} kr.</span> ${why ? '· ' + daHTML(why) : ''}`, 'money'); }

/* ---------------- continue ---------------- */
/* A run is one walk through the story. Going back to the title or continuing a save starts a new run;
   an older run that is still waiting somewhere stops instead of acting on the new one. */
let RUN = 0; const STALE = { stale: true };
const alive = r => { if (r !== RUN) throw STALE; };
function waitTap() {
  if (FAST) return Promise.resolve();
  const r = RUN;
  return new Promise((res, rej) => {
    const b = document.createElement('button'); b.id = 'cont'; b.className = 'cont'; b.textContent = 'Videre';
    $('#act').innerHTML = ''; $('#act').appendChild(b);
    let armed = false, done = false; const log = logEl();
    const go = () => { if (done) return; done = true; clearTimeout(t); log.removeEventListener('click', lg); b.remove(); if (r !== RUN) return rej(STALE); AUDIO.sfx('page'); res(); };
    // A tap on the story text never moves on (Bruno, 2026-10-28: a tap that just missed a word skipped the line). Only empty space below the text, or Videre.
    const lg = e => { if (armed && !e.target.closest('.entry') && !e.target.closest('button') && !e.target.closest('.w') && $('#tip').hidden) go(); };
    b.onclick = go; log.addEventListener('click', lg); const t = setTimeout(() => armed = true, 250);
    waitTap.cancel = () => { if (!done) { done = true; log.removeEventListener('click', lg); b.remove(); rej(STALE); } };
  });
}

/* ---------------- steps ---------------- */
function expand(st) { if (typeof st === 'function') return expand(st(G)); if (Array.isArray(st)) return st.flatMap(expand); return st ? [st] : []; }
async function runSteps(list) {
  // steps are expanded one at a time, so a step can read what the step before it did (a mini-game's result)
  for (const raw of (Array.isArray(list) ? list : list ? [list] : [])) {
    if (typeof raw === 'function' || Array.isArray(raw)) { const r = await runSteps(typeof raw === 'function' ? raw(G) : raw); if (r) return r; continue; }
    const st = raw; if (!st) continue;
    const r = RUN;
    try {
    if (st.n) { addLog(esc(st.n), 'n'); await waitTap(); }
    else if (st.t) { addLog(esc(st.t), 't'); await waitTap(); }
    else if (st.say) { sayLine(st); await waitTap(); }
    else if (st.npcs) { G.npcs = st.npcs.slice(); ART.setNpcs(G.npcs); await sleep(300); }
    else if (st.set) Object.assign(G.flags, st.set);
    else if (st.lys !== undefined) candles(st.lys);
    else if (st.kr !== undefined) { if (st.kr) kr(st.kr, st.why); }
    else if (st.time !== undefined) await passTime(st.time);
    else if (st.mini) { G.mini[st.mini.id] = await MINI[st.mini.kind](st.mini); save(); }
    else if (st.go) return { go: st.go };
    else if (st.end) return { end: st.end };
    } catch (e) { if (e === STALE || r !== RUN) throw STALE; report(e, 'step in ' + G.node); if (st.mini) G.mini[st.mini.id] = G.mini[st.mini.id] || {}; }
    alive(r);
  }
  return null;
}
/* the dead man's patience: five candles. Wrong words put them out, kind words light them. */
function candles(d) {
  if (G.flags.lys === undefined || !d) return; const before = G.flags.lys; G.flags.lys = Math.max(0, Math.min(5, before + d)); if (G.flags.lys === before) return;
  hud(); AUDIO.sfx(d > 0 ? 'ok' : 'inkrun'); toast(d > 0 ? 'Et lys tændes.' : 'Et lys går ud.');
}
function sayLine(st) {
  const P = NPCS[st.say]; ART.speaker(st.say);
  const d = addLog(`<b class="who">${esc(P.name)}${P.role ? ` <small>${esc(P.role)}</small>` : ''}</b><p class="da">${daHTML(st.da)}</p>
    <div class="tools"><button class="tb hear" aria-label="Hør">▶ Hør</button><button class="tb tr">Engelsk · 1 kr.</button></div><p class="en" hidden>${esc(st.en)}</p>`, 'say');
  $('.hear', d).onclick = e => { e.stopPropagation(); TTS.say(st.da, true, st.say); };
  $('.tr', d).onclick = e => { e.stopPropagation(); if (G.kr < 1) { toast('Du har ingen penge.'); return; } kr(-1, 'oversættelse'); $('.en', d).hidden = false; e.target.remove(); G.stats.eng++; };
  TTS.say(st.da, false, st.say);
}

/* ---------------- time passing ---------------- */
async function passTime(k) {
  const from = G.time; if (k === from) return; G.time = k; hud(); save();
  const T = SES.times[k]; AUDIO.setTime(k);
  const ov = document.createElement('div'); ov.className = 'tcard'; ov.innerHTML = `<canvas></canvas><div class="tc-txt"><h2>${T.name}</h2><p class="da">${daHTML('Klokken slår ' + T.clock + '.')}</p><p class="strikes"></p></div>`;
  $('#ov').appendChild(ov); TTS.say('Klokken slår ' + T.clock + '.', false, 'narrator');
  const cv = $('canvas', ov), c = cv.getContext('2d'); const fit = () => { cv.width = innerWidth; cv.height = innerHeight; }; fit();
  const strikes = T.hour; const dur = FAST ? 0 : 1400 + strikes * 380 + 900; const t0 = performance.now();
  let s = 0;
  await new Promise(res => {
    const step = now => {
      const p = FAST ? 1 : Math.min(1, (now - t0) / dur);
      ART.setTimeFloat(from + (k - from) * Math.min(1, p * 1.3));
      ART.timeCard(c, cv.width, cv.height, from + (k - from) * p, now);
      const want = Math.min(strikes, Math.floor(Math.max(0, now - t0 - 900) / 380) + (now - t0 > 900 ? 1 : 0));
      while (s < want) { s++; AUDIO.bell(); $('.strikes', ov).textContent = '·'.repeat(s); }
      if (p < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
  ov.classList.add('out'); await sleep(700); ov.remove(); ART.setTimeFloat(k);
}

/* ---------------- scenes and options ---------------- */
function report(e, where) {
  const msg = (e && (e.message || e.reason && e.reason.message)) || String(e); console.error(where || '', e);
  const errs = lsGet('ravnsted_errors', []); errs.unshift({ t: new Date().toISOString().slice(0, 16), m: `${where || ''}: ${msg}`.slice(0, 200), s: String(e && e.stack || '').split('\n').slice(0, 3).join(' | ').slice(0, 300) }); lsSet('ravnsted_errors', errs.slice(0, 8));
  const b = document.createElement('div'); b.className = 'errbox'; b.textContent = `Fejl · ${msg}`.slice(0, 160); document.body.appendChild(b); setTimeout(() => b.remove(), 9000);
  __dev.errors = (__dev.errors || []).concat(msg);
}
window.addEventListener('error', e => report(e.error || e.message, 'error'));
window.addEventListener('unhandledrejection', e => { if (e.reason !== STALE) report(e.reason, 'promise'); });
async function enter(id, fresh) {
  if (fresh) { RUN++; waitTap.cancel && waitTap.cancel(); }
  const run = RUN;
  try { await enterRun(id, run); } catch (e) { if (e !== STALE && run === RUN) { report(e, 'scene ' + id); showOpts(); } }
}
async function enterRun(id, run) {
  const N = SES.nodes[id];
  G.node = id; G.at = { node: id, snap: snap() }; save();
  if (N.time !== undefined && N.time > G.time) { G.time = N.time; }
  ART.setPlace(N.place, G.time); G.npcs = (N.npcs || []).slice(); ART.setNpcs(G.npcs); hud();
  prefetchVoices((N.lines || []).filter(x => x && x.say).map(x => [x.say, x.da]));
  __dev.node = id;
  const r = await runSteps(N.lines); alive(run);
  if (r && r.go) return enterRun(r.go, run);
  if (r && r.end) return finish(r.end);
  showOpts();
}
function optsOf(N) { return (N.opts || []).map((o, i) => [o, i]).filter(([o, i]) => (!o.once || !G.used[G.node + ':' + i]) && (!o.if || o.if(G))); }
function showOpts() {
  const N = SES.nodes[G.node]; const act = $('#act'); act.innerHTML = '';
  const list = optsOf(N);
  if (!list.length) { addLog('(Nothing left to do here.)', 'n'); return; }
  list.forEach(([o, i]) => {
    const b = document.createElement('button'); b.className = 'opt'; b.dataset.i = i;
    const broke = o.cost && G.kr < o.cost;
    b.innerHTML = `<span class="tag t-${norm(o.tag)}">${esc(o.tag)}</span><span class="lbl">${esc(o.label)}</span>${o.cost ? `<span class="cost">${o.cost} kr.</span>` : ''}${o.roll ? `<span class="cost">${STATS[o.roll.stat]}</span>` : ''}`;
    if (broke) { b.disabled = true; b.title = 'Not enough kroner'; }
    b.onclick = () => choose(o, i);
    act.appendChild(b);
  });
  requestAnimationFrame(() => { logEl().scrollTop = logEl().scrollHeight + 999; });
}
async function choose(o, i) {
  const run = RUN;
  try { await chooseRun(o, i, run); } catch (e) { if (e !== STALE && run === RUN) { report(e, 'choice in ' + G.node); showOpts(); } }
}
async function chooseRun(o, i, run) {
  $('#act').innerHTML = ''; AUDIO.sfx('page');
  if (o.once) G.used[G.node + ':' + i] = 1;
  if (o.cost) kr(-o.cost, o.tag === 'Køb' ? o.label.toLowerCase() : '');
  let ok = true, adv = 0;
  if (o.mini) { G.mini[o.mini.id] = await MINI[o.mini.kind](o.mini); }
  if (o.build) {
    const r = await builder(o.build);
    adv = r.english ? -1 : r.mistakes === 0 ? 1 : r.mistakes >= 2 ? -1 : 0;
    if (o.engFlag) G.flags[o.engFlag] = r.english ? 1 : 0; // some choices care whether they were said in Danish
  }
  if (o.roll) ok = await rollDice(o.roll.stat, o.roll.dc, adv);
  if (ok && o.set) Object.assign(G.flags, o.set);
  alive(run);
  const r = await runSteps(ok ? o.ok : (o.fail || [])); alive(run);
  save();
  if (r && r.go) return enterRun(r.go, run);
  if (r && r.end) return finish(r.end);
  const nx = ok ? o.next : (o.failNext || o.next);
  if (nx) return enterRun(nx, run);
  showOpts();
}

/* ---------------- sentence builder ---------------- */
function builder(b) {
  if (b.kind) return SPECIAL_BUILD[b.kind](b);
  return buildSheet({ prompt: b.prompt, tiles: b.tiles || [...b.answers[0], ...(b.extra || [])], punct: b.punct || '.', tip: b.tip, rules: b.rules || [],
    check: words => b.answers.some(a => a.length === words.length && a.every((x, k) => norm(x) === norm(words[k]))), sample: () => pick(b.answers), english: b.prompt });
}
function buildSheet(spec) {
  return new Promise(res => {
    const ov = document.createElement('div'); ov.className = 'sheet-ov';
    ov.innerHTML = `<div class="sheet enter"><p class="prompt">${esc(spec.prompt)}</p><div class="line" aria-live="polite"></div><p class="tipline" hidden></p><div class="pool"></div>
      <div class="brow"><button class="btn ghost" id="bClr">Ryd</button><button class="btn ghost" id="bEn">På engelsk · 1 kr.</button><button class="btn" id="bOk">Sig det</button></div></div>`;
    $('#ov').appendChild(ov); setTimeout(() => $('.sheet', ov).classList.remove('enter'), 380);
    const line = $('.line', ov), pool = $('.pool', ov); let mistakes = 0; const built = [];
    __dev.cur = { sample: spec.sample };
    shuffle(spec.tiles).forEach(w => {
      const t = document.createElement('button'); t.className = 'tile'; t.textContent = w; longPress(t, norm(w));
      t.onclick = () => { if (t.disabled) return; t.disabled = true; built.push(t); const c = t.cloneNode(true); c.disabled = false; c.onclick = () => { built.splice(built.indexOf(t), 1); t.disabled = false; c.remove(); render(); AUDIO.sfx('tick'); }; line.appendChild(c); render(); AUDIO.sfx('tile'); };
      pool.appendChild(t);
    });
    const render = () => { $('#bOk', ov).disabled = !built.length; };
    render();
    const close = r => { ov.classList.add('out'); setTimeout(() => ov.remove(), 250); res(r); };
    $('#bClr', ov).onclick = () => { built.splice(0).forEach(t => t.disabled = false); line.innerHTML = ''; render(); };
    $('#bEn', ov).onclick = () => {
      if (G.kr >= 1) kr(-1, 'engelsk'); G.stats.eng++;
      G.lastBuilt = null; addLog(`<b class="who">Kragen</b><p class="en-you">“${esc(spec.english)}”</p>`, 'say you'); close({ mistakes: 9, english: true });
    };
    $('#bOk', ov).onclick = () => {
      const words = built.map(t => t.textContent);
      if (spec.check(words)) {
        const sent = sentenceOf(words, spec.punct);
        G.stats.built++; if (!mistakes) G.stats.perfect++; G.lastBuilt = words.map(norm);
        const why = spec.rules.filter(r => RULES[r]); why.forEach(r => { (G.rules[r] = G.rules[r] || []).includes(sent) || G.rules[r].push(sent); });
        const d = addLog(`<b class="who">Kragen</b><p class="da">${daHTML(sent)}</p>${why.length ? '<button class="tb why">Hvorfor?</button>' : ''}<div class="whybox" hidden></div>`, 'say you');
        if (why.length) $('.why', d).onclick = e => { e.stopPropagation(); const box = $('.whybox', d); box.hidden = !box.hidden; box.innerHTML = why.map(r => ruleHTML(r)).join(''); };
        AUDIO.sfx(mistakes ? 'ok' : 'perfect'); TTS.say(sent, false, 'kragen'); if (spec.done) spec.done(words);
        close({ mistakes, words });
      } else {
        mistakes++; AUDIO.sfx('wrong'); line.classList.add('shake'); setTimeout(() => line.classList.remove('shake'), 400);
        const tl = $('.tipline', ov); tl.hidden = false; tl.textContent = spec.tip || 'Not quite. Check the word order and the endings.';
        if (mistakes >= 2 && !$('#bShow', ov)) { const s = document.createElement('button'); s.className = 'btn ghost'; s.id = 'bShow'; s.textContent = 'Vis svaret'; s.onclick = () => { const a = spec.sample(); tl.textContent = 'Svar: ' + a.join(' ') + spec.punct; }; $('.brow', ov).prepend(s); }
      }
    };
  });
}
function ruleHTML(r) { const R = RULES[r]; return `<div class="rule"><b>${esc(R.name)}</b><p>${esc(R.rule)}</p><p class="ex">${R.ex.map(x => daHTML(x)).join('<br>')}</p></div>`; }

/* The finale's free sentences about the real player */
const SPECIAL_BUILD = {
  /* 3.3: a thing in the player's real home. Pick it, pick its colour, then say it with the definite form. */
  home(b) {
    return new Promise(res => {
      const ov = document.createElement('div'); ov.className = 'sheet-ov';
      ov.innerHTML = `<div class="sheet"><p class="prompt">${esc(b.prompt)}</p><p class="small">First: which thing in your home?</p><div class="pool items">${Object.keys(FURN).map(n => `<button class="tile pickn" data-n="${n}">${n} <small>${esc(FURN[n][1])}</small></button>`).join('')}</div></div>`;
      $('#ov').appendChild(ov); __dev.cur = { pickN: true };
      ov.querySelectorAll('.pickn').forEach(t => t.onclick = () => {
        const n = t.dataset.n; $('.sheet', ov).innerHTML = `<p class="prompt">Which colour is it?</p><div class="pool items">${Object.keys(COLORS).map(c => `<button class="tile pickc" data-c="${c}"><i class="sw" style="background:${COLORS[c].hex}"></i>${c}</button>`).join('')}</div>`;
        __dev.cur = { pickC: true };
        ov.querySelectorAll('.pickc').forEach(cb => cb.onclick = async () => {
          const c = cb.dataset.c; ov.remove(); const W = homeOf(n, c, b.verb);
          await buildSheet({ prompt: W.en, tiles: shuffle(['Jeg', ...HOME_VERB[b.verb], 'min', 'mit', 'mine', W.art, W.adj, ...W.wrong.slice(0, 2), n]), punct: '.', rules: ['adj-def-poss', 'adj-def-irr', 'liking'],
            tip: `${n} is ${W.g === 'en' ? 'an en-word: min' : W.g === 'et' ? 'an et-word: mit' : 'plural: mine'}. After a possessive the adjective takes its e-form: ${W.adj}.`,
            check: w => W.answers.some(a => a.length === w.length && a.every((x, k) => norm(x) === norm(w[k]))), sample: () => W.answers[0], english: W.en });
          G.home[b.verb] = { da: W.da, your: W.your, en: `${COLORS[c].en} ${FURN[n][1]}`, pron: W.pron, n };
          save(); res({ mistakes: 0 });
        });
      });
    });
  },
  wear(b) {
    return new Promise(res => {
      const ov = document.createElement('div'); ov.className = 'sheet-ov';
      ov.innerHTML = `<div class="sheet"><p class="prompt">${esc(b.prompt)}</p><p class="small">First: what is it?</p><div class="pool items">${Object.keys(WEAR_NOUNS).map(n => `<button class="tile pickn" data-n="${n}">${n} <small>${esc(WEAR_NOUNS[n][1])}</small></button>`).join('')}</div></div>`;
      $('#ov').appendChild(ov);
      __dev.cur = { pickN: true };
      ov.querySelectorAll('.pickn').forEach(t => t.onclick = () => {
        const n = t.dataset.n; $('.sheet', ov).innerHTML = `<p class="prompt">Which colour?</p><div class="pool items">${Object.keys(COLORS).map(c => `<button class="tile pickc" data-c="${c}"><i class="sw" style="background:${COLORS[c].hex}"></i>${c}</button>`).join('')}</div>`;
        __dev.cur = { pickC: true };
        ov.querySelectorAll('.pickc').forEach(cb => cb.onclick = async () => {
          const c = cb.dataset.c; ov.remove(); const W = wearOf(n, c);
          await buildSheet({ prompt: `I am wearing ${W.en}.`, tiles: shuffle(['Jeg', 'har', 'på', 'en', 'et', 'nogle', 'par', ...W.forms.filter((x, i, a) => a.indexOf(x) === i), n]), punct: '.', rules: ['adj-en', 'adj-et', 'adj-pl', 'have-paa'],
            tip: W.g === 'en' ? `${n} is an en-word: en ${W.forms[0]} ${n}.` : W.g === 'et' ? `${n} is an et-word: et ${W.forms[1]} ${n}.` : `${n} is plural: nogle ${W.forms[2]} ${n} (or et par ${W.forms[2]} ${n}).`,
            check: w => W.answers.some(a => a.length === w.length && a.every((x, k) => norm(x) === norm(w[k]))),
            sample: () => W.answers[0], english: `I am wearing ${W.en}.` });
          G.wear = { da: W.da, en: W.en.replace(/^./, x => x.toUpperCase()), pron: W.pron, n };
          save(); res({ mistakes: 0 });
        });
      });
    });
  },
  where(b) {
    const pron = G.wear.pron, ok = whereAnswers(pron);
    return buildSheet({ prompt: `I bought ${pron === 'dem' ? 'them' : 'it'} … (or: I got ${pron === 'dem' ? 'them' : 'it'} from …)`, punct: '.', rules: ['pron-match', 'har-koebt', 'i-paa', 'inversion'],
      tiles: ['Jeg', 'har', 'købt', 'fået', 'den', 'det', 'dem', 'i', 'på', 'af', 'en', 'et', 'butik', 'genbrugsbutik', 'loppemarked', 'nettet', 'indkøbscenter', 'min', 'mor', 'ven'],
      tip: `What you are wearing is ${pron === 'den' ? 'an en-word: den' : pron === 'det' ? 'an et-word: det' : 'plural: dem'}. Shops take i (i en butik), markets and the net take på.`,
      check: w => ok.some(a => a.length === w.length && a.every((x, k) => norm(x) === norm(w[k]))),
      sample: () => ok[4], english: 'I bought it somewhere.', done: w => { G.where = w.map(norm).join(' '); } });
  },
};

/* ---------------- dice ---------------- */
function rollDice(stat, dc, adv) {
  return new Promise(res => {
    const mod = Math.min(MOD_CAP, G.sk[stat]);
    const ov = document.createElement('div'); ov.className = 'roll-ov';
    const advTxt = adv > 0 ? 'Fordel: godt dansk. Du kaster to gange og tager det bedste.' : adv < 0 ? 'Ulempe: du kaster to gange og tager det dårligste.' : 'Et kast.';
    ov.innerHTML = `<div class="roll"><p class="rs">${esc(STATS[stat])} +${mod}</p><canvas width="220" height="220"></canvas><p class="rt">Du skal bruge ${dc}.</p><p class="small">${esc(advTxt)}</p><div class="brow"><button class="btn" id="rGo">Kast</button></div></div>`;
    $('#ov').appendChild(ov); const cv = $('canvas', ov), c = cv.getContext('2d'); ART.die(c, 220, 20, 0);
    $('#rGo', ov).onclick = async () => {
      $('#rGo', ov).remove(); AUDIO.sfx('dice');
      const a = 1 + Math.floor(Math.random() * 20), b2 = 1 + Math.floor(Math.random() * 20);
      const r = adv > 0 ? Math.max(a, b2) : adv < 0 ? Math.min(a, b2) : a;
      const t0 = performance.now(), dur = FAST ? 0 : 1100;
      await new Promise(done => { const f = now => { const p = Math.min(1, (now - t0) / (dur || 1)); ART.die(c, 220, p < 1 ? 1 + Math.floor(Math.random() * 20) : r, p); if (p < 1) requestAnimationFrame(f); else done(); }; requestAnimationFrame(f); });
      const tot = r + mod, ok = r === 20 || (r !== 1 && tot >= dc);
      G.stats.rolls++; if (ok) G.stats.wins++;
      G.use[stat]++; if (G.use[stat] % 3 === 0 && G.sk[stat] < 3) { G.sk[stat]++; toast(`${STATS[stat]} +1`); }
      $('.rt', ov).innerHTML = `${adv ? `${a} og ${b2} → ` : ''}${r} + ${mod} = <b>${tot}</b> · ${ok ? 'Det lykkes.' : 'Det lykkes ikke.'}`;
      AUDIO.sfx(ok ? 'win' : 'lose');
      const k = document.createElement('button'); k.className = 'btn'; k.id = 'rOk'; k.textContent = 'Videre'; k.onclick = () => { ov.remove(); res(ok); }; $('.brow', ov).appendChild(k);
    };
  });
}

/* ---------------- journal and settings ---------------- */
function journal() {
  const ov = document.createElement('div'); ov.className = 'jr-ov';
  const rules = Object.keys(G.rules);
  const words = Object.keys(G.words).filter(gloss).sort();
  ov.innerHTML = `<div class="jr"><div class="jr-head"><h2>Kragens bog</h2><button class="btn ghost jClose">Luk</button></div>
    <div class="tabs"><button class="tabb on" data-t="r">Regler</button><button class="tabb" data-t="o">Ord</button><button class="tabb" data-t="s">Dig</button></div>
    <div class="tab" data-t="r">${rules.length ? rules.map(r => ruleHTML(r) + `<p class="mine">${G.rules[r].map(s => '“' + daHTML(s) + '”').join('<br>')}</p>`).join('') : '<p class="small">The rules you use will be written here, with your own sentences.</p>'}</div>
    <div class="tab" data-t="o" hidden><p class="small">${words.length} words met today. Tap one to hear it.</p><div class="words">${words.map(w => `<button class="wd" data-w="${esc(w)}"><b>${esc(w)}</b> ${esc(gloss(w))}</button>`).join('')}</div></div>
    <div class="tab" data-t="s" hidden><div class="skills">${Object.keys(STATS).map(s => `<p><b>${STATS[s]}</b> +${G.sk[s]} <small>${G.use[s]} forsøg</small></p>`).join('')}</div>
      <p class="small">Skills grow when you use them. Sentences built: ${G.stats.built}, perfect: ${G.stats.perfect}. Rolls won: ${G.stats.wins} of ${G.stats.rolls}.</p></div>
    <div class="brow"><button class="btn ghost" id="jSet">Indstillinger</button><button class="btn ghost" id="jHome">Til forsiden</button></div></div>`;
  $('#ov').appendChild(ov);
  ov.querySelectorAll('.tabb').forEach(b => b.onclick = () => { ov.querySelectorAll('.tabb').forEach(x => x.classList.toggle('on', x === b)); ov.querySelectorAll('.tab').forEach(t => t.hidden = t.dataset.t !== b.dataset.t); });
  ov.querySelectorAll('.wd').forEach(b => b.onclick = () => TTS.say(b.dataset.w, true, 'word'));
  $('.jClose', ov).onclick = () => ov.remove();
  $('#jSet', ov).onclick = () => settings();
  $('#jHome', ov).onclick = () => { ov.remove(); save(); title(); };
}
function settings() {
  const ov = document.createElement('div'); ov.className = 'jr-ov set-ov';
  ov.innerHTML = `<div class="jr"><div class="jr-head"><h2>Indstillinger</h2><button class="btn ghost sClose">Luk</button></div>
    <label>Musik <input type="range" id="sMus" min="0" max="1" step=".05" value="${SETTINGS.music}"></label>
    <label>Lyde <input type="range" id="sSfx" min="0" max="1" step=".05" value="${SETTINGS.sfx}"></label>
    <label class="chk"><input type="checkbox" id="sVo" ${SETTINGS.voiceOn ? 'checked' : ''}> Stemmer</label>
    <label>Stemmer <input type="range" id="sVol" min="0" max="1" step=".05" value="${SETTINGS.voice}"></label>
    <p class="small">Every character has a voice of its own, recorded for the game. No phone voice needed.</p>
    <div class="brow"><button class="btn ghost" id="sTest">Hør en stemme</button></div>
    ${lsGet('ravnsted_errors', []).length ? `<p class="small"><b>Seneste fejl</b> (send a screenshot of this to Claude)</p><div class="errlist">${lsGet('ravnsted_errors', []).map(x => `<p>${esc(x.t)} · ${esc(x.m)}<br><small>${esc(x.s)}</small></p>`).join('')}</div><div class="brow"><button class="btn ghost" id="sClr">Ryd fejl</button></div>` : ''}</div>`;
  $('#ov').appendChild(ov);
  const upd = () => { SETTINGS.music = +$('#sMus', ov).value; SETTINGS.sfx = +$('#sSfx', ov).value; SETTINGS.voiceOn = $('#sVo', ov).checked; SETTINGS.voice = +$('#sVol', ov).value; saveSettings(); AUDIO.volumes(); };
  ov.querySelectorAll('input').forEach(i => i.oninput = upd);
  $('#sTest', ov).onclick = () => { AUDIO.start(); TTS.say('Sikke en smuk kjole! Hvor har du købt den henne?', true, 'narrator'); };
  $('.sClose', ov).onclick = () => ov.remove();
  if ($('#sClr', ov)) $('#sClr', ov).onclick = () => { lsSet('ravnsted_errors', []); $('.errlist', ov).remove(); $('#sClr', ov).remove(); };
}

/* ---------------- screens ---------------- */
function show(id) { document.querySelectorAll('.screen').forEach(s => s.hidden = s.id !== id); }
/* The title song starts with the first touch on the title screen (browsers allow no sound before one). */
function titleMusic() {
  const scr = $('#title'); let chip = $('#mChip');
  if (AUDIO.running) { AUDIO.setTime('title'); if (chip) chip.remove(); return; }
  if (!chip && !FAST) { chip = document.createElement('button'); chip.id = 'mChip'; chip.className = 'mchip'; chip.textContent = '♪ Tryk for musik'; scr.appendChild(chip); }
  const go = () => { scr.removeEventListener('pointerdown', go); AUDIO.start('title'); const c = $('#mChip'); if (c) c.remove(); };
  scr.addEventListener('pointerdown', go);
}
function title() {
  RUN++; waitTap.cancel && waitTap.cancel(); TTS.stop();
  $('#ov').innerHTML = ''; show('title'); ART.mountTitle($('#tcv'));
  const saved = lsGet(KEY, null), has = saved && saved.at;
  // Begynd starts the first chapter not finished yet (or the last one)
  const next = SESSIONS.find(x => !sMeta(x.id).played) || SESSIONS[SESSIONS.length - 1];
  $('#tbtns').innerHTML = `${has ? '<button class="btn big" id="tCont">Fortsæt</button>' : ''}
    <button class="btn big ${has ? 'ghost' : ''}" id="tNew">${has ? `Begynd ${next.num}` : `Begynd · ${next.num}`}</button>
    <button class="btn ghost" id="tLess">Vælg kapitel</button><button class="btn ghost" id="tSet">Indstillinger</button>`;
  $('#tNew').onclick = () => { AUDIO.start('title'); begin(next); };
  if ($('#tCont')) $('#tCont').onclick = () => { const g = JSON.parse(saved.at.snap); SES = sesById(g.sess); AUDIO.start(g.time); resume(saved); };
  titleMusic();
  $('#tSet').onclick = settings;
  $('#tLess').onclick = chapters;
}
function chapters() {
  const ov = document.createElement('div'); ov.className = 'jr-ov';
  ov.innerHTML = `<div class="jr"><div class="jr-head"><h2>Kapitler</h2><button class="btn ghost lClose">Luk</button></div>
    ${SESSIONS.map(x => { const m = sMeta(x.id), all = x.endings.length + x.endings2.length;
      return `<button class="lesson" data-id="${x.id}"><b>${x.num} · ${esc(x.title)}</b><small>${esc(x.book)}</small><small>${m.played ? `Spillet ${m.played} ${m.played === 1 ? 'gang' : 'gange'} · slutninger fundet: ${m.endings.length} af ${all}` : 'Ikke spillet endnu'}</small></button>`; }).join('')}</div>`;
  $('#ov').appendChild(ov); $('.lClose', ov).onclick = () => ov.remove();
  ov.querySelectorAll('.lesson').forEach(b => b.onclick = () => { ov.remove(); AUDIO.start('title'); begin(sesById(b.dataset.id)); });
}
/* A later chapter can go on with the Kragen from the one before, or start with a fresh one. */
async function begin(ses) {
  SES = ses; const i = SESSIONS.indexOf(ses), c = META.carry;
  let carry = null;
  if (i > 0 && c && c.from === SESSIONS[i - 1].id) {
    carry = await new Promise(res => {
      const ov = document.createElement('div'); ov.className = 'jr-ov';
      ov.innerHTML = `<div class="jr"><div class="jr-head"><h2>${esc(ses.num)} · ${esc(ses.title)}</h2></div>
        <p>Your Kragen from ${esc(SESSIONS[i - 1].num)} ended the day with <b>${c.kr} kr.</b> People in Ravnsted remember what happened.</p>
        <div class="brow"><button class="btn ghost" id="cFresh">En ny Kragen</button><button class="btn" id="cGo">Fortsæt med min Kragen</button></div></div>`;
      $('#ov').appendChild(ov); __dev.answer = '#cGo';
      $('#cGo', ov).onclick = () => { ov.remove(); res(c); }; $('#cFresh', ov).onclick = () => { ov.remove(); res(null); };
      if (FAST) { ov.remove(); res(Math.random() < .5 ? c : null); }
    });
  }
  lore(carry);
}
async function lore(carry) {
  RUN++; waitTap.cancel && waitTap.cancel();
  newGame(SES, carry); if (SES.preload) ART.preload(SES.preload); show('game'); $('#log').innerHTML = ''; ART.mountStage($('#cv'));
  const LORE = SES.lore;
  const ov = document.createElement('div'); ov.className = 'lore'; $('#ov').appendChild(ov); prefetchVoices(LORE.map(l => ['narrator', l.da]));
  AUDIO.setTime('title');
  for (let i = 0; i < LORE.length && !ov.dataset.skip; i++) {
    const L = LORE[i];
    ov.innerHTML = `<canvas></canvas><div class="lore-txt"><p class="da big">${daHTML(L.da)}</p><p class="en">${esc(L.en)}</p></div><div class="brow"><button class="btn ghost" id="lSkip">Spring over</button><button class="btn" id="lNext">${i < LORE.length - 1 ? 'Videre' : 'Begynd'}</button></div>`;
    const cv = $('canvas', ov), dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); ART.lore(cv.getContext('2d'), cv.width, cv.height, L.art);
    TTS.say(L.da, false, 'narrator');
    await new Promise(r => { $('#lNext', ov).onclick = r; $('#lSkip', ov).onclick = () => { ov.dataset.skip = 1; r(); }; if (FAST) r(); });
    AUDIO.sfx('page');
  }
  ov.classList.add('out'); await sleep(500); ov.remove();
  META.runs++; saveMeta(); AUDIO.setTime(0);
  enter(SES.start);
}
function resume(saved) {
  G = JSON.parse(saved.at.snap); G.at = saved.at; SES = sesById(G.sess); G.sess = SES.id; G.home = G.home || {};
  show('game'); $('#log').innerHTML = ''; ART.mountStage($('#cv'));
  ART.setTimeFloat(G.time); AUDIO.setTime(G.time); addLog('Where were we …', 'n'); enter(saved.at.node, true);
}
async function finish(e) {
  const e2 = SES.ending2(G), m = sMeta(SES.id); [e, e2].forEach(x => m.endings.includes(x) || m.endings.push(x)); m.played++;
  META.carry = { from: SES.id, kr: G.kr, sk: G.sk, use: G.use, e1: e, e2 }; saveMeta();
  addLog(esc(SES.epilogue2[e2](G)), 'n'); await waitTap();
  AUDIO.setTime('end');
  const eAll = SES.endings.length + SES.endings2.length, T = SES.endText, nxt = SESSIONS[SESSIONS.indexOf(SES) + 1];
  const ov = document.createElement('div'); ov.className = 'end-ov';
  ov.innerHTML = `<div class="end"><p class="small">${SES.num === '3.2' ? 'Slut på dagen' : 'Slut på natten'}</p><h2>${esc(T[e].title)}</h2><p>${esc(T[e].en)}</p><h3>${esc(T[e2].title)}</h3><p>${esc(T[e2].en)}</p>
    <p class="stat">Du har <b>${G.kr}</b> kroner. Sætninger: ${G.stats.built} (${G.stats.perfect} perfekte). Slutninger fundet: ${m.endings.length} af ${eAll}.</p>
    <div class="brow"><button class="btn ghost" id="home">Til forsiden</button><button class="btn ${nxt ? 'ghost' : ''}" id="again">Spil igen</button>${nxt ? `<button class="btn" id="next">${esc(nxt.num)} · ${esc(nxt.title)}</button>` : ''}</div></div>`;
  $('#ov').appendChild(ov); lsSet(KEY, null);
  $('#home', ov).onclick = title; $('#again', ov).onclick = () => { ov.remove(); begin(SES); };
  if (nxt) $('#next', ov).onclick = () => { ov.remove(); begin(nxt); };
}

/* ---------------- watchdog: the player must never be left with nothing to tap ---------------- */
let idle = 0;
setInterval(() => {
  const game = !$('#game').hidden, act = $('#act'), ov = $('#ov');
  const nothing = game && G && !ov.children.length && !act.querySelector('button') && !$('.unstick');
  idle = nothing ? idle + 1 : 0;
  if (idle >= 4) { // about 6 s with no button, no overlay and nothing loading
    idle = 0; report(new Error('stuck at ' + G.node), 'watchdog');
    const b = document.createElement('button'); b.className = 'cont unstick'; b.textContent = 'Videre';
    b.onclick = () => { b.remove(); const N = SES.nodes[G.node]; if (optsOf(N).length) showOpts(); else enter(G.node, true); };
    act.innerHTML = ''; act.appendChild(b);
  }
}, 1500);

/* ---------------- boot ---------------- */
window.addEventListener('load', () => {
  TTS.init(); title();
  // a new deploy while the game is open: offer a reload
  // Only a real stamp counts: a missing file (404 page, or a preview with no version.txt) must never look like a new version.
  setInterval(async () => { try { const r = await fetch('version.txt?' + Date.now(), { cache: 'no-store' }); if (!r.ok) return; const v = (await r.text()).trim(); if (/^\d{14}$/.test(window.VERSION || '') && /^\d{14}$/.test(v) && v > window.VERSION && !$('.newv')) { const b = document.createElement('button'); b.className = 'newv'; b.textContent = 'Ny version · genindlæs'; b.onclick = () => { save(); location.reload(); }; document.body.appendChild(b); } } catch (e) { } }, 60000);
});
