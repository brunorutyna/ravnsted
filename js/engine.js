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

/* ---------------- Danish voice: a line always finishes, the next waits ---------------- */
const TTS = {
  ok: 'speechSynthesis' in window, voice: null, busy: false, next: null,
  init() { if (!this.ok) return; const p = () => { this.voice = speechSynthesis.getVoices().find(v => /^da/i.test(v.lang)) || null; }; p(); try { speechSynthesis.onvoiceschanged = p; } catch (e) { } },
  say(t, force) {
    if (!this.ok || FAST || (!SETTINGS.voiceOn && !force)) return Promise.resolve();
    let done; const job = { t, p: new Promise(r => done = r) }; job.done = done;
    if (force || !this.busy) { try { speechSynthesis.cancel(); } catch (e) { } if (this.next) this.next.done(); this.next = null; this.speak(job); }
    else { if (this.next) this.next.done(); this.next = job; }
    return job.p;
  },
  speak(job) {
    const tok = this.tok = (this.tok || 0) + 1; this.busy = true; AUDIO.duck(true);
    let fired = false; const end = () => { if (fired || tok !== this.tok) return; fired = true; this.busy = false; job.done(); const n = this.next; this.next = null; if (n) this.speak(n); else AUDIO.duck(false); };
    try {
      const u = new SpeechSynthesisUtterance(job.t.replace(/[“”…]/g, ' ')); u.lang = 'da-DK'; if (this.voice) u.voice = this.voice; u.rate = SETTINGS.rate; u.pitch = .85; u.volume = SETTINGS.voice;
      u.onend = u.onerror = end; setTimeout(end, 2500 + job.t.length * 110 / SETTINGS.rate);
      speechSynthesis.speak(u);
    } catch (e) { end(); }
  },
};

/* ---------------- state ---------------- */
let G = null;
let META = Object.assign({ played: 0, endings: [], words: {}, runs: 0 }, lsGet(META_KEY, {}));
const saveMeta = () => lsSet(META_KEY, META);
const save = () => { if (G) lsSet(KEY, G); };
function newGame() {
  G = { node: null, kr: 3, time: 0, sk: { snak: 1, loegn: 1, oeje: 1, handel: 1 }, use: { snak: 0, loegn: 0, oeje: 0, handel: 0 },
    flags: {}, used: {}, mini: {}, rules: {}, words: {}, npcs: [], wear: null, stats: { built: 0, perfect: 0, rolls: 0, wins: 0, eng: 0 }, at: null };
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
  clearTimeout(showTip.t); showTip.t = setTimeout(() => tip.hidden = true, 3500); AUDIO.sfx('tick');
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
  const T = TIMES[G.time];
  $('#hud').innerHTML = `<span class="clock">${T.name}</span><span class="kr"><b>${G.kr}</b> kr.</span><button class="hb" id="jOpen" aria-label="Journal">Bog</button>`;
  $('#jOpen').onclick = journal;
}
function kr(n, why) { if (n < 0) n = -Math.min(G.kr, -n); if (!n) return; G.kr += n; hud(); AUDIO.sfx(n >= 0 ? 'coin' : 'coinout'); addLog(`<span>${n >= 0 ? '+' : '−'} ${Math.abs(n)} kr.</span> ${why ? '· ' + daHTML(why) : ''}`, 'money'); }

/* ---------------- continue ---------------- */
function waitTap() {
  if (FAST) return Promise.resolve();
  return new Promise(res => {
    const b = document.createElement('button'); b.id = 'cont'; b.className = 'cont'; b.textContent = 'Videre';
    $('#act').innerHTML = ''; $('#act').appendChild(b);
    const go = () => { logEl().removeEventListener('click', lg); b.remove(); AUDIO.sfx('page'); res(); };
    const lg = e => { if (!e.target.closest('button') && !e.target.closest('.w')) go(); };
    b.onclick = go; setTimeout(() => logEl().addEventListener('click', lg), 250);
  });
}

/* ---------------- steps ---------------- */
function expand(st) { if (typeof st === 'function') return expand(st(G)); if (Array.isArray(st)) return st.flatMap(expand); return st ? [st] : []; }
async function runSteps(list) {
  // steps are expanded one at a time, so a step can read what the step before it did (a mini-game's result)
  for (const raw of (Array.isArray(list) ? list : list ? [list] : [])) {
    if (typeof raw === 'function' || Array.isArray(raw)) { const r = await runSteps(typeof raw === 'function' ? raw(G) : raw); if (r) return r; continue; }
    const st = raw; if (!st) continue;
    if (st.n) { addLog(esc(st.n), 'n'); await waitTap(); }
    else if (st.t) { addLog(esc(st.t), 't'); await waitTap(); }
    else if (st.say) { sayLine(st); await waitTap(); }
    else if (st.npcs) { G.npcs = st.npcs.slice(); ART.setNpcs(G.npcs); await sleep(300); }
    else if (st.set) Object.assign(G.flags, st.set);
    else if (st.kr !== undefined) { if (st.kr) kr(st.kr, st.why); }
    else if (st.time !== undefined) await passTime(st.time);
    else if (st.mini) { G.mini[st.mini.id] = await MINI[st.mini.kind](st.mini); save(); }
    else if (st.go) return { go: st.go };
    else if (st.end) return { end: st.end };
  }
  return null;
}
function sayLine(st) {
  const P = NPCS[st.say]; ART.speaker(st.say);
  const d = addLog(`<b class="who">${esc(P.name)}${P.role ? ` <small>${esc(P.role)}</small>` : ''}</b><p class="da">${daHTML(st.da)}</p>
    <div class="tools"><button class="tb hear" aria-label="Hør">▶ Hør</button><button class="tb tr">Engelsk · 1 kr.</button></div><p class="en" hidden>${esc(st.en)}</p>`, 'say');
  $('.hear', d).onclick = e => { e.stopPropagation(); TTS.say(st.da, true); };
  $('.tr', d).onclick = e => { e.stopPropagation(); if (G.kr < 1) { toast('Du har ingen penge.'); return; } kr(-1, 'oversættelse'); $('.en', d).hidden = false; e.target.remove(); G.stats.eng++; };
  TTS.say(st.da); AUDIO.sfx('voice');
}

/* ---------------- time passing ---------------- */
async function passTime(k) {
  const from = G.time; if (k === from) return; G.time = k; hud(); save();
  const T = TIMES[k]; AUDIO.setTime(k);
  const ov = document.createElement('div'); ov.className = 'tcard'; ov.innerHTML = `<canvas></canvas><div class="tc-txt"><h2>${T.name}</h2><p class="da">${daHTML('Klokken slår ' + T.clock + '.')}</p><p class="strikes"></p></div>`;
  $('#ov').appendChild(ov);
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
async function enter(id) {
  const N = SESSION.nodes[id];
  G.node = id; G.at = { node: id, snap: snap() }; save();
  if (N.time !== undefined && N.time > G.time) { G.time = N.time; }
  ART.setPlace(N.place, G.time); G.npcs = (N.npcs || []).slice(); ART.setNpcs(G.npcs); hud();
  __dev.node = id;
  const r = await runSteps(N.lines);
  if (r && r.go) return enter(r.go);
  if (r && r.end) return finish(r.end);
  showOpts();
}
function optsOf(N) { return (N.opts || []).map((o, i) => [o, i]).filter(([o, i]) => (!o.once || !G.used[G.node + ':' + i]) && (!o.if || o.if(G))); }
function showOpts() {
  const N = SESSION.nodes[G.node]; const act = $('#act'); act.innerHTML = '';
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
  $('#act').innerHTML = ''; AUDIO.sfx('page');
  if (o.once) G.used[G.node + ':' + i] = 1;
  if (o.cost) kr(-o.cost, o.tag === 'Køb' ? o.label.toLowerCase() : '');
  let ok = true, adv = 0;
  if (o.mini) { G.mini[o.mini.id] = await MINI[o.mini.kind](o.mini); }
  if (o.build) {
    const r = await builder(o.build);
    adv = r.english ? -1 : r.mistakes === 0 ? 1 : r.mistakes >= 2 ? -1 : 0;
  }
  if (o.roll) ok = await rollDice(o.roll.stat, o.roll.dc, adv);
  if (ok && o.set) Object.assign(G.flags, o.set);
  const r = await runSteps(ok ? o.ok : (o.fail || []));
  save();
  if (r && r.go) return enter(r.go);
  if (r && r.end) return finish(r.end);
  const nx = ok ? o.next : (o.failNext || o.next);
  if (nx) return enter(nx);
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
        const sent = words.join(' ').replace(/^(nej|ja|jo) /i, '$1, ').replace(/^\w|^[æøå]/i, c => c.toUpperCase()) + spec.punct;
        G.stats.built++; if (!mistakes) G.stats.perfect++; G.lastBuilt = words.map(norm);
        const why = spec.rules.filter(r => RULES[r]); why.forEach(r => { (G.rules[r] = G.rules[r] || []).includes(sent) || G.rules[r].push(sent); });
        const d = addLog(`<b class="who">Kragen</b><p class="da">${daHTML(sent)}</p>${why.length ? '<button class="tb why">Hvorfor?</button>' : ''}<div class="whybox" hidden></div>`, 'say you');
        if (why.length) $('.why', d).onclick = e => { e.stopPropagation(); const box = $('.whybox', d); box.hidden = !box.hidden; box.innerHTML = why.map(r => ruleHTML(r)).join(''); };
        AUDIO.sfx(mistakes ? 'ok' : 'perfect'); TTS.say(sent); if (spec.done) spec.done(words);
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
          const c = cb.dataset.c; ov.remove();
          const g = WEAR_NOUNS[n][0], forms = COLORS[c].f, adj = g === 'en' ? forms[0] : g === 'et' ? forms[1] : forms[2];
          const art = g === 'pl' ? (n === 'bukser' || n === 'sko' || n === 'handsker' || n === 'sokker' || n === 'støvler' ? 'et par' : 'nogle') : g;
          const sample = ['Jeg', 'har', ...art.split(' '), adj, n, 'på'];
          const okArts = g === 'en' ? [['en']] : g === 'et' ? [['et']] : [['nogle'], ['et', 'par']];
          const enTxt = (g === 'pl' ? '' : /^[aeiou]/.test(COLORS[c].en) ? 'an ' : 'a ') + COLORS[c].en + ' ' + WEAR_NOUNS[n][1];
          await buildSheet({ prompt: `I am wearing ${enTxt}.`, tiles: shuffle(['Jeg', 'har', 'på', 'en', 'et', 'nogle', 'par', ...forms.filter((x, i, a) => a.indexOf(x) === i), n]), punct: '.', rules: ['adj-en', 'adj-et', 'adj-pl', 'have-paa'],
            tip: g === 'en' ? `${n} is an en-word: en ${forms[0]} ${n}.` : g === 'et' ? `${n} is an et-word: et ${forms[1]} ${n}.` : `${n} is plural: nogle ${forms[2]} ${n} (or et par ${forms[2]} ${n}).`,
            check: w => { const s = w.map(norm); if (s[0] !== 'jeg' || s[1] !== 'har' || s[s.length - 1] !== 'på') return false; const mid = s.slice(2, -1); return okArts.some(a => mid.length === a.length + 2 && a.every((x, k) => mid[k] === x) && mid[a.length] === adj && mid[a.length + 1] === n); },
            sample: () => sample, english: `I am wearing ${enTxt}.` });
          const daArt = art.charAt(0).toUpperCase() + art.slice(1);
          G.wear = { da: `${daArt} ${adj} ${n}`, en: enTxt.replace(/^./, x => x.toUpperCase()), pron: g === 'en' ? 'den' : g === 'et' ? 'det' : 'dem', n };
          save(); res({ mistakes: 0 });
        });
      });
    });
  },
  where(b) {
    const pron = G.wear.pron;
    const places = [['i', 'en', 'butik'], ['i', 'en', 'genbrugsbutik'], ['på', 'et', 'loppemarked'], ['på', 'nettet'], ['i', 'et', 'indkøbscenter']];
    const gifts = [['af', 'min', 'mor'], ['af', 'en', 'ven']];
    const okWhere = w => places.some(p => p.join(' ') === w.join(' ')), okGift = w => gifts.some(p => p.join(' ') === w.join(' '));
    return buildSheet({ prompt: `I bought ${pron === 'dem' ? 'them' : 'it'} … (or: I got ${pron === 'dem' ? 'them' : 'it'} from …)`, punct: '.', rules: ['pron-match', 'har-koebt', 'i-paa', 'inversion'],
      tiles: ['Jeg', 'har', 'købt', 'fået', 'den', 'det', 'dem', 'i', 'på', 'af', 'en', 'et', 'butik', 'genbrugsbutik', 'loppemarked', 'nettet', 'indkøbscenter', 'min', 'mor', 'ven'],
      tip: `What you are wearing is ${pron === 'den' ? 'an en-word: den' : pron === 'det' ? 'an et-word: det' : 'plural: dem'}. Shops take i (i en butik), markets and the net take på.`,
      check: w => { const s = w.map(norm); let rest;
        if (s[0] === 'jeg' && s[1] === 'har') { if (s[3] !== pron) return false; rest = [s[2], ...s.slice(4)]; }
        else if (s[0] === pron && s[1] === 'har' && s[2] === 'jeg') rest = s.slice(3); else return false;
        const v = rest[0], tail = rest.slice(1); return (v === 'købt' && okWhere(tail)) || (v === 'fået' && okGift(tail)); },
      sample: () => ['Jeg', 'har', 'købt', pron, 'på', 'et', 'loppemarked'], english: 'I bought it somewhere.', done: w => { G.where = w.map(norm).join(' '); } });
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
  ov.querySelectorAll('.wd').forEach(b => b.onclick = () => TTS.say(b.dataset.w, true));
  $('.jClose', ov).onclick = () => ov.remove();
  $('#jSet', ov).onclick = () => settings();
  $('#jHome', ov).onclick = () => { ov.remove(); save(); title(); };
}
function settings() {
  const ov = document.createElement('div'); ov.className = 'jr-ov set-ov';
  const voices = TTS.ok ? speechSynthesis.getVoices().filter(v => /^da/i.test(v.lang)) : [];
  ov.innerHTML = `<div class="jr"><div class="jr-head"><h2>Indstillinger</h2><button class="btn ghost sClose">Luk</button></div>
    <label>Musik <input type="range" id="sMus" min="0" max="1" step=".05" value="${SETTINGS.music}"></label>
    <label>Lyde <input type="range" id="sSfx" min="0" max="1" step=".05" value="${SETTINGS.sfx}"></label>
    <label class="chk"><input type="checkbox" id="sVo" ${SETTINGS.voiceOn ? 'checked' : ''}> Dansk stemme</label>
    <label>Tempo <input type="range" id="sRate" min=".6" max="1.2" step=".05" value="${SETTINGS.rate}"></label>
    <p class="small">${voices.length ? 'Danish voice found: ' + esc(voices[0].name) : 'No Danish voice found on this device. Android: Settings → Text-to-speech → install Danish.'}</p>
    <div class="brow"><button class="btn ghost" id="sTest">Test stemmen</button></div></div>`;
  $('#ov').appendChild(ov);
  const upd = () => { SETTINGS.music = +$('#sMus', ov).value; SETTINGS.sfx = +$('#sSfx', ov).value; SETTINGS.voiceOn = $('#sVo', ov).checked; SETTINGS.rate = +$('#sRate', ov).value; saveSettings(); AUDIO.volumes(); };
  ov.querySelectorAll('input').forEach(i => i.oninput = upd);
  $('#sTest', ov).onclick = () => TTS.say('Sikke en smuk kjole! Hvor har du købt den henne?', true);
  $('.sClose', ov).onclick = () => ov.remove();
}

/* ---------------- screens ---------------- */
function show(id) { document.querySelectorAll('.screen').forEach(s => s.hidden = s.id !== id); }
function title() {
  $('#ov').innerHTML = ''; show('title'); ART.mountTitle($('#tcv'));
  const saved = lsGet(KEY, null);
  const eFound = META.endings.length, eAll = SESSION.endings.length + SESSION.endings2.length;
  $('#tbtns').innerHTML = `${saved && saved.at ? '<button class="btn big" id="tCont">Fortsæt</button>' : ''}
    <button class="btn big ${saved && saved.at ? 'ghost' : ''}" id="tNew">${saved && saved.at ? 'Begynd forfra' : 'Begynd'}</button>
    <button class="btn ghost" id="tLess">Vælg kapitel</button><button class="btn ghost" id="tSet">Indstillinger</button>`;
  $('#tNew').onclick = () => { AUDIO.start(); lore(); };
  if ($('#tCont')) $('#tCont').onclick = () => { AUDIO.start(); resume(saved); };
  $('#tSet').onclick = settings;
  $('#tLess').onclick = () => {
    const ov = document.createElement('div'); ov.className = 'jr-ov';
    ov.innerHTML = `<div class="jr"><div class="jr-head"><h2>Kapitler</h2><button class="btn ghost lClose">Luk</button></div>
      <button class="lesson" id="L1"><b>3.2 · ${esc(SESSION.title)}</b><small>${esc(SESSION.book)}</small><small>${META.played ? `Spillet ${META.played} ${META.played === 1 ? 'gang' : 'gange'} · slutninger fundet: ${eFound} af ${eAll}` : 'Ikke spillet endnu'}</small></button>
      <p class="small">3.3 · coming next.</p></div>`;
    $('#ov').appendChild(ov); $('.lClose', ov).onclick = () => ov.remove(); $('#L1', ov).onclick = () => { ov.remove(); AUDIO.start(); lore(); };
  };
}
async function lore() {
  newGame(); show('game'); $('#log').innerHTML = ''; ART.mountStage($('#cv'));
  const ov = document.createElement('div'); ov.className = 'lore'; $('#ov').appendChild(ov);
  AUDIO.setTime('title');
  for (let i = 0; i < LORE.length && !ov.dataset.skip; i++) {
    const L = LORE[i];
    ov.innerHTML = `<canvas></canvas><div class="lore-txt"><p class="da big">${daHTML(L.da)}</p><p class="en">${esc(L.en)}</p></div><div class="brow"><button class="btn ghost" id="lSkip">Spring over</button><button class="btn" id="lNext">${i < LORE.length - 1 ? 'Videre' : 'Begynd'}</button></div>`;
    const cv = $('canvas', ov); cv.width = Math.min(760, innerWidth) * 2; cv.height = cv.width * .55; ART.lore(cv.getContext('2d'), cv.width, cv.height, L.art);
    TTS.say(L.da);
    await new Promise(r => { $('#lNext', ov).onclick = r; $('#lSkip', ov).onclick = () => { ov.dataset.skip = 1; r(); }; if (FAST) r(); });
    AUDIO.sfx('page');
  }
  ov.classList.add('out'); await sleep(500); ov.remove();
  META.runs++; saveMeta(); AUDIO.setTime(0);
  enter(SESSION.start);
}
function resume(saved) {
  G = JSON.parse(saved.at.snap); G.at = saved.at; show('game'); $('#log').innerHTML = ''; ART.mountStage($('#cv'));
  ART.setTimeFloat(G.time); AUDIO.setTime(G.time); addLog('Where were we …', 'n'); enter(saved.at.node);
}
async function finish(e) {
  const e2 = ending2(G); [e, e2].forEach(x => META.endings.includes(x) || META.endings.push(x)); META.played++; saveMeta();
  addLog(esc(EPILOGUE2[e2](G)), 'n'); await waitTap();
  AUDIO.setTime('end');
  const eAll = SESSION.endings.length + SESSION.endings2.length;
  const ov = document.createElement('div'); ov.className = 'end-ov';
  ov.innerHTML = `<div class="end"><p class="small">Slut på dagen</p><h2>${esc(ENDINGS[e].title)}</h2><p>${esc(ENDINGS[e].en)}</p><h3>${esc(ENDINGS[e2].title)}</h3><p>${esc(ENDINGS[e2].en)}</p>
    <p class="stat">Du har <b>${G.kr}</b> kroner. Sætninger: ${G.stats.built} (${G.stats.perfect} perfekte). Slutninger fundet: ${META.endings.length} af ${eAll}.</p>
    <div class="brow"><button class="btn ghost" id="home">Til forsiden</button><button class="btn" id="again">Spil igen</button></div></div>`;
  $('#ov').appendChild(ov); lsSet(KEY, null);
  $('#home', ov).onclick = title; $('#again', ov).onclick = () => { ov.remove(); lore(); };
}

/* ---------------- boot ---------------- */
window.addEventListener('load', () => {
  TTS.init(); title();
  // a new deploy while the game is open: offer a reload
  setInterval(async () => { try { const v = (await (await fetch('version.txt?' + Date.now())).text()).trim(); if (window.VERSION && v && v !== window.VERSION && !$('.newv')) { const b = document.createElement('button'); b.className = 'newv'; b.textContent = 'Ny version · genindlæs'; b.onclick = () => { save(); location.reload(); }; document.body.appendChild(b); } } catch (e) { } }, 60000);
});
