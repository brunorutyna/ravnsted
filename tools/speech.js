#!/usr/bin/env node
/* Lists every line the game can speak, and who speaks it. Writes tools/speech.json for the voice builder.
   node tools/speech.js            write the list
   node tools/speech.js --check    exit 1 if a spoken line has no voice clip in js/voicemap.js */
const fs = require('fs'), path = require('path');
const { load, ROOT } = require('./load');
const C = load();
const out = new Map(); const add = (who, text) => { if (!text || !text.trim()) return; const k = C.vkey(who, text); if (!out.has(k)) out.set(k, { who, text: text.replace(/\s*…\s*/g, ', ').replace(/\s+/g, ' ').trim(), key: k }); };
let samples = []; // each session gives its own sample states (SESSION.samples)
const steps = (list, G, depth = 0) => {
  if (!list || depth > 8) return;
  if (typeof list === 'function') { (G ? [G] : samples).forEach(g => { let r; try { r = list(g); } catch (e) { return; } steps(r, g, depth + 1); }); return; }
  if (Array.isArray(list)) return list.forEach(x => steps(x, G, depth + 1));
  if (list.say) add(list.say, list.da);
  if (list.mini) mini(list.mini);
};
const mini = m => {
  if (m.kind === 'spot') samples.slice(0, 8).forEach(G => add('narrator', typeof m.say === 'function' ? m.say(G) : m.say));
  if (m.kind === 'inspect') C.INSPECT.forEach(s => add('kragen', s.da));
  if (m.kind === 'dye') m.orders.forEach(o => { add('bodil', o.want); add('kragen', `Det er ${o.art} ${o.ok} ${o.noun}.`); });
  if (m.kind === 'find') { m.rounds.forEach(r => add('genfaerd', r.da)); add('genfaerd', 'Ikke den.'); }
  if (m.kind === 'smag') m.items.forEach(x => { add(m.who, `Ja. Jeg ${x.l} ${x.da}.`); add(m.who, `Tror du det?! Jeg ${x.l} ${x.da}.`); });
  if (m.kind === 'skift') m.items.forEach(it => { const S = it.g === 'en' ? 'Den' : it.g === 'et' ? 'Det' : 'De', pron = it.g === 'en' ? 'den' : it.g === 'et' ? 'det' : 'dem', a = { en: 0, et: 1, pl: 2 }[it.g];
    add('kragen', `Agnete er vild med ${pron}.`); add('kragen', `${S} er alt for ${['stor', 'stort', 'store'][a]} til huset.`); add('kragen', `${S} er for ${['fin', 'fint', 'fine'][a]} til et loppemarked.`); add('kragen', `${S} er alt for ${['gammel', 'gammelt', 'gamle'][a]}.`); });
  if (m.kind === 'ghost') m.lines.forEach(L => { add('genfaerd', L.da); add('genfaerd', L.clue.da); add('kragen', L.agree); add('kragen', L.surprise); });
  if (m.kind === 'haggle') { const [a, b] = C.HAGGLE_RANGE[m.buyer]; for (let n = a; n <= b; n++) { add(m.buyer, `Jeg giver dig ${C.numDa(n)} kroner.`); add(m.buyer, `Mit sidste bud: ${C.numDa(n)} kroner.`); } add(m.buyer, 'Så er der ingen handel.'); add('kragen', 'Det er en aftale.'); add('kragen', 'Det er for lidt!'); add('kragen', 'Ja, det er en aftale.'); }
};
for (const S of C.SESSIONS) {
  samples = S.samples();
  for (const N of Object.values(S.nodes)) {
    steps(N.lines);
    (N.opts || []).forEach(o => { steps(o.ok); steps(o.fail); if (o.mini) mini(o.mini);
      const b = o.build; if (b && !b.kind) b.answers.forEach(a => add('kragen', C.sentenceOf(a, b.punct || '.'))); });
  }
  S.lore.forEach(l => add('narrator', l.da));
  S.times.forEach(t => add('narrator', `Klokken slår ${t.clock}.`));
}
const wears = []; for (const n of Object.keys(C.WEAR_NOUNS)) for (const c of Object.keys(C.COLORS)) wears.push(C.wearOf(n, c));
wears.forEach(W => W.answers.forEach(a => add('kragen', C.sentenceOf(a, '.'))));
['den', 'det', 'dem'].forEach(p => C.whereAnswers(p).forEach(a => add('kragen', C.sentenceOf(a, '.'))));
// 3.3 finale: every thing in a home, every colour, both questions
for (const n of Object.keys(C.FURN)) for (const c of Object.keys(C.COLORS)) for (const v of ['love', 'tired']) { const W = C.homeOf(n, c, v); W.answers.forEach(a => add('kragen', C.sentenceOf(a, '.')));
  if (v === 'love') add('genfaerd', `${W.your.replace(/^./, x => x.toUpperCase())}. Det kan jeg godt forstå.`); }
['den', 'det', 'dem'].forEach(p => add('genfaerd', `Er du det?! Så giv ${p} til Gamle Tove. Nogen kan altid bruge ${p}.`));
add('narrator', 'Sikke en smuk kjole! Hvor har du købt den henne?');
Object.keys(C.DICT).forEach(w => add('word', w));
const list = [...out.values()];
if (process.argv.includes('--check')) {
  const have = C.VOICEMAP || {}; const miss = list.filter(x => !have[x.key]);
  if (miss.length) { console.log(`${miss.length} spoken lines without a voice clip. Run: node tools/speech.js && python3 tools/voices.py`); miss.slice(0, 15).forEach(x => console.log('  ', x.key)); process.exit(1); }
  console.log(`all ${list.length} spoken lines have a voice`); process.exit(0);
}
fs.writeFileSync(path.join(__dirname, 'speech.json'), JSON.stringify(list, null, 0));
const by = {}; list.forEach(x => by[x.who] = (by[x.who] || 0) + 1);
console.log(list.length, 'lines', JSON.stringify(by));
