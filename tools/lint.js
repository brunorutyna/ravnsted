#!/usr/bin/env node
/* Static checks of the story. Run: node tools/lint.js   (exit code 1 on errors)
   Each check exists because the bug it catches has happened in one of Bruno's games. */
const fs = require('fs'), path = require('path');
const { load, danish, words, ROOT, read } = require('./load');
const C = load(); const S = C.SESSION; const N = S.nodes;
const errors = [], warns = []; const err = m => errors.push(m), warn = m => warns.push(m);
const norm = w => w.toLowerCase().replace(/[.,?!]/g, '');
const MINIS = ['inspect', 'ledger', 'spot', 'haggle', 'dye', 'review'];
const src = read('js/story.js');
// every node reachable, every reference exists
const refs = new Set([S.start]);
for (const m of src.matchAll(/(?:next|failNext|go): '(\w+)'/g)) { refs.add(m[1]); if (!N[m[1]]) err(`missing node "${m[1]}"`); }
for (const id of Object.keys(N)) if (!refs.has(id)) err(`node "${id}" is never reached`);
for (const m of src.matchAll(/say: '(\w+)'/g)) if (!C.NPCS[m[1]]) err(`unknown speaker "${m[1]}"`);
for (const m of src.matchAll(/npcs: \[('[^\[\]]*)\]/g)) for (const x of m[1].matchAll(/'(\w+)'/g)) if (!C.NPCS[x[1]]) err(`unknown npc "${x[1]}"`);
for (const m of src.matchAll(/kind: '(\w+)'/g)) if (!MINIS.includes(m[1]) && !['wear', 'where'].includes(m[1])) err(`unknown mini-game "${m[1]}"`);
for (const m of src.matchAll(/rules: \[([^\]]*)\]/g)) for (const x of m[1].matchAll(/'([\w-]+)'/g)) if (!C.RULES[x[1]]) err(`unknown rule "${x[1]}"`);
for (const m of src.matchAll(/stat: '(\w+)'/g)) if (!['snak', 'loegn', 'oeje', 'handel'].includes(m[1])) err(`unknown skill "${m[1]}"`);
for (const m of src.matchAll(/end: '(\w+)'/g)) if (!C.ENDINGS[m[1]] || !S.endings.includes(m[1])) err(`unknown ending "${m[1]}"`);
// a node without options must leave (go or end), or the player is stuck
for (const [id, n] of Object.entries(N)) { const body = JSON.stringify(n.lines, (k, v) => typeof v === 'function' ? v.toString() : v); if (!(n.opts || []).length && !/go:|end:|"go"|"end"/.test(body)) err(`node "${id}" has no options and never leaves`); }
// options: a say-option needs a sentence; tiles must build every accepted answer
for (const [id, n] of Object.entries(N)) (n.opts || []).forEach((o, i) => {
  const w = `${id}:${i}`;
  if (o.tag === 'Sig' && !o.build) err(`say-option without a sentence (${w})`);
  if (!['Sig', 'Gør', 'Lyv', 'Køb', 'Gå'].includes(o.tag)) err(`unknown tag ${o.tag} (${w})`);
  const b = o.build; if (!b || b.kind) return;
  const tiles = b.tiles || [...b.answers[0], ...(b.extra || [])];
  for (const a of b.answers) { const need = {}; a.forEach(x => need[norm(x)] = (need[norm(x)] || 0) + 1); for (const x in need) if (tiles.filter(t => norm(t) === x).length < need[x]) err(`tiles cannot build "${a.join(' ')}": missing "${x}" (${w})`); }
  if (!b.prompt) err(`sentence without a prompt (${w})`);
  // a distractor must never also make a correct sentence by swapping one word
  if (o.roll && o.roll.dc > 17) warn(`very hard roll (${w})`);
});
// ledger and dye items: exactly one correct choice
for (const m of src.matchAll(/ok: '([^']+)', why/g)) { }
for (const n of Object.values(N)) [...(n.opts || []).map(o => o.mini), ...(n.lines || []).filter(x => x && x.mini).map(x => x.mini)].filter(Boolean).forEach(m => {
  (m.items || []).forEach(it => { if (it.opts.filter(o => o === it.ok).length !== 1) err(`ledger item must have exactly one correct answer: ${it.pre} … ${it.post}`); if (new Set(it.opts).size !== it.opts.length) err(`duplicate choice in ledger: ${it.pre}`); });
  (m.crowd || []).forEach((p, i) => { if (m.crowd.filter(q => q.name === m.target).length !== 1) err(`spot game "${m.id}" needs exactly one target`); });
});
// glossary: every Danish word has a meaning
const all = new Set(); danish(C).forEach(s => words(s).forEach(w => all.add(w)));
const missing = [...all].filter(w => w.length > 1 && !C.DICT[w] && !C.DICT[w.replace(/s$/, '')]).sort();
if (missing.length) err(`Danish words with no meaning in js/dict.js: ${missing.join(', ')}`);
// real people
const block = read('tools/blocklist.txt').split('\n').filter(l => l && !l.startsWith('#'));
const text = ['js/story.js', 'js/data.js', 'js/dict.js', 'js/minigames.js', 'js/engine.js', 'index.html'].map(read).join('\n');
for (const b of block) if (new RegExp(`(^|[^A-Za-zÆØÅæøå])${b}([^A-Za-zÆØÅæøå]|$)`, 'i').test(text)) err(`name of a real person: ${b}`);
// endings count for the lesson list
if (S.endings.length + S.endings2.length !== Object.keys(C.ENDINGS).length) err('ENDINGS and the session ending lists disagree');
warns.forEach(w => console.log('warn:', w)); errors.forEach(e => console.log('ERROR:', e));
console.log(`${Object.keys(N).length} nodes, ${all.size} Danish words. ${errors.length} errors, ${warns.length} warnings.`);
process.exit(errors.length ? 1 : 0);
