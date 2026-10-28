#!/usr/bin/env node
/* Lists every line the game can speak, and who speaks it. Writes tools/speech.json for the voice builder.
   node tools/speech.js            write the list
   node tools/speech.js --check    exit 1 if a spoken line has no voice clip in js/voicemap.js */
const fs = require('fs'), path = require('path');
const { load, ROOT } = require('./load');
const C = load(['js/data.js', 'js/dict.js', 'js/story.js', 'js/voicemap.js']);
const out = new Map(); const add = (who, text) => { if (!text || !text.trim()) return; const k = C.vkey(who, text); if (!out.has(k)) out.set(k, { who, text: text.replace(/\s*…\s*/g, ', ').replace(/\s+/g, ' ').trim(), key: k }); };
// sample states, so lines that depend on what happened are all found
const base = [];
for (const sold of ['gertrud', 'mads', 'hulda', 'kept']) for (const v of [0, 1]) base.push({ flags: { sold, price: 20, betterCut: v, inkBad: v, kept: sold === 'kept' ? 1 : 0, askedWhere: v, inspected: v, lieH: v, clueHue: v, pay2: v ? 15 : 0, truthJ: v, bribe: v, reported: v, inkBad2: v, warmG: v, lieG: v, lieGfail: v, truthG: v, warmM: v, knowsEllen: v, paidScribe: v, wary: v, caught: v }, kr: 10,
  mini: { c1: { bad: !!v }, c2: { bad: !!v }, dress: { found: v ? 3 : 1 }, findG: { ok: !!v }, findJ: { ok: !!v }, dye: { score: v ? 3 : 1 }, saleG: { walked: !!v, price: 30 }, saleM: { walked: !!v, price: 12 } }, wear: { da: 'En rød trøje', en: 'A red sweater', pron: 'den' }, lastBuilt: null, where: '' });
const samples = [...base];
// mixed states: what happened in the mini-games crossed with the choices (Bruno's run found a line only reachable this way)
for (let i = 0; i < base.length; i += 2) { samples.push(Object.assign({}, base[i], { mini: base[i + 1].mini })); samples.push(Object.assign({}, base[i + 1], { mini: base[i].mini })); }
[['sikke', 'en', 'smuk', 'kjole'], ['sikke', 'et', 'smukt', 'tørklæde'], ['sikke', 'nogle', 'smukke', 'sko']].forEach(lb => samples.push(Object.assign({}, base[0], { lastBuilt: lb })));
['jeg har købt den på et loppemarked', 'jeg har fået den af min mor', 'jeg har købt den i en butik', ''].forEach(w => samples.push(Object.assign({}, base[0], { where: w })));
const wears = []; for (const n of Object.keys(C.WEAR_NOUNS)) for (const c of Object.keys(C.COLORS)) wears.push(C.wearOf(n, c));
wears.forEach(W => samples.push(Object.assign({}, base[0], { wear: { da: W.da, en: W.en, pron: W.pron, n: W.n } })));
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
  if (m.kind === 'haggle') { const [a, b] = C.HAGGLE_RANGE[m.buyer]; for (let n = a; n <= b; n++) { add(m.buyer, `Jeg giver dig ${C.numDa(n)} kroner.`); add(m.buyer, `Mit sidste bud: ${C.numDa(n)} kroner.`); } add(m.buyer, 'Så er der ingen handel.'); add('kragen', 'Det er en aftale.'); add('kragen', 'Det er for lidt!'); add('kragen', 'Ja, det er en aftale.'); }
};
for (const N of Object.values(C.SESSION.nodes)) {
  steps(N.lines);
  (N.opts || []).forEach(o => { steps(o.ok); steps(o.fail); if (o.mini) mini(o.mini);
    const b = o.build; if (b && !b.kind) b.answers.forEach(a => add('kragen', C.sentenceOf(a, b.punct || '.'))); });
}
wears.forEach(W => W.answers.forEach(a => add('kragen', C.sentenceOf(a, '.'))));
['den', 'det', 'dem'].forEach(p => C.whereAnswers(p).forEach(a => add('kragen', C.sentenceOf(a, '.'))));
C.LORE.forEach(l => add('narrator', l.da));
C.TIMES.forEach(t => add('narrator', `Klokken slår ${t.clock}.`));
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
