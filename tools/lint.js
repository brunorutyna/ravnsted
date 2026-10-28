#!/usr/bin/env node
/* Static checks of the story. Run: node tools/lint.js   (exit code 1 on errors)
   Each check exists because the bug it catches has happened in one of Bruno's games. */
const fs = require('fs'), path = require('path');
const { load, danish, words, ROOT, read } = require('./load');
const C = load();
const errors = [], warns = []; const err = m => errors.push(m), warn = m => warns.push(m);
const norm = w => w.toLowerCase().replace(/[.,?!]/g, '');
const MINIS = ['inspect', 'ledger', 'spot', 'haggle', 'dye', 'review', 'find', 'smag', 'skift', 'ghost'];
const FILES = { k3s2: 'js/story.js', k3s3: 'js/story33.js' };
let nodeCount = 0;
for (const S of C.SESSIONS) {
const N = S.nodes, src = read(FILES[S.id]), tag = S.num + ' ';
nodeCount += Object.keys(N).length;
// every node reachable, every reference exists
const refs = new Set([S.start]);
for (const m of src.matchAll(/(?:next|failNext|go): '(\w+)'/g)) { refs.add(m[1]); if (!N[m[1]]) err(`${tag}missing node "${m[1]}"`); }
for (const id of Object.keys(N)) if (!refs.has(id)) err(`${tag}node "${id}" is never reached`);
for (const m of src.matchAll(/say: '(\w+)'/g)) if (!C.NPCS[m[1]]) err(`${tag}unknown speaker "${m[1]}"`);
for (const m of src.matchAll(/npcs: \[('[^\[\]]*)\]/g)) for (const x of m[1].matchAll(/'(\w+)'/g)) if (!C.NPCS[x[1]]) err(`${tag}unknown npc "${x[1]}"`);
for (const m of src.matchAll(/kind: '(\w+)'/g)) if (!MINIS.includes(m[1]) && !['wear', 'where', 'home'].includes(m[1])) err(`${tag}unknown mini-game "${m[1]}"`);
for (const m of src.matchAll(/rules: \[([^\]]*)\]/g)) for (const x of m[1].matchAll(/'([\w-]+)'/g)) if (!C.RULES[x[1]]) err(`${tag}unknown rule "${x[1]}"`);
for (const m of src.matchAll(/rule: '([\w-]+)'/g)) if (!C.RULES[m[1]]) err(`${tag}unknown rule "${m[1]}"`);
for (const m of src.matchAll(/stat: '(\w+)'/g)) if (!['snak', 'loegn', 'oeje', 'handel'].includes(m[1])) err(`${tag}unknown skill "${m[1]}"`);
for (const m of src.matchAll(/\{ end: '(\w+)'/g)) if (!S.endText[m[1]] || !S.endings.includes(m[1])) err(`${tag}unknown ending "${m[1]}"`);
if (S.endings.length + S.endings2.length !== Object.keys(S.endText).length) err(`${tag}endText and the session ending lists disagree`);
S.endings2.forEach(e => { if (!S.epilogue2[e]) err(`${tag}no epilogue for "${e}"`); });
// a node without options must leave (go or end), or the player is stuck
for (const [id, n] of Object.entries(N)) { const body = JSON.stringify(n.lines, (k, v) => typeof v === 'function' ? v.toString() : v); if (!(n.opts || []).length && !/go:|end:|"go"|"end"/.test(body)) err(`${tag}node "${id}" has no options and never leaves`); }
// options: a say-option needs a sentence; tiles must build every accepted answer
for (const [id, n] of Object.entries(N)) (n.opts || []).forEach((o, i) => {
  const w = `${tag}${id}:${i}`;
  if (o.tag === 'Sig' && !o.build) err(`say-option without a sentence (${w})`);
  if (!['Sig', 'Gør', 'Lyv', 'Køb', 'Gå'].includes(o.tag)) err(`unknown tag ${o.tag} (${w})`);
  const b = o.build; if (!b || b.kind) return;
  const tiles = b.tiles || [...b.answers[0], ...(b.extra || [])];
  for (const a of b.answers) { const need = {}; a.forEach(x => need[norm(x)] = (need[norm(x)] || 0) + 1); for (const x in need) if (tiles.filter(t => norm(t) === x).length < need[x]) err(`tiles cannot build "${a.join(' ')}": missing "${x}" (${w})`); }
  if (!b.prompt) err(`sentence without a prompt (${w})`);
  if (o.roll && o.roll.dc > 17) warn(`very hard roll (${w})`);
});
// mini-games: exactly one correct choice; a spot game has one target; a ghost line has one agree and one surprise
for (const n of Object.values(N)) [...(n.opts || []).map(o => o.mini), ...(n.lines || []).filter(x => x && x.mini).map(x => x.mini)].filter(Boolean).forEach(m => {
  (m.items || []).filter(it => it.opts).forEach(it => { if (it.opts.filter(o => o === it.ok).length !== 1) err(`${tag}ledger item must have exactly one correct answer: ${it.pre} … ${it.post}`); if (new Set(it.opts).size !== it.opts.length) err(`${tag}duplicate choice in ledger: ${it.pre}`); });
  (m.crowd || []).forEach(() => { if (m.crowd.filter(q => q.name === m.target).length !== 1) err(`${tag}spot game "${m.id}" needs exactly one target`); });
  (m.rounds || []).forEach(r => { if (r.others.includes(r.ok)) err(`${tag}find round "${r.da}" lists the answer as a look-alike`); });
  (m.lines || []).forEach(L => { const all = [L.agree, L.surprise, ...L.wrong]; if (new Set(all).size !== all.length) err(`${tag}ghost line has duplicate reactions: ${L.da}`); });
});
}
// glossary: every Danish word has a meaning
const all = new Set(); danish(C).forEach(s => words(s).forEach(w => all.add(w)));
const missing = [...all].filter(w => w.length > 1 && !C.DICT[w] && !C.DICT[w.replace(/s$/, '')]).sort();
if (missing.length) err(`Danish words with no meaning in js/dict.js: ${missing.join(', ')}`);
// real people
const block = read('tools/blocklist.txt').split('\n').filter(l => l && !l.startsWith('#'));
const text = ['js/story.js', 'js/story33.js', 'js/data.js', 'js/dict.js', 'js/minigames.js', 'js/engine.js', 'index.html'].map(read).join('\n');
for (const b of block) if (new RegExp(`(^|[^A-Za-zÆØÅæøå])${b}([^A-Za-zÆØÅæøå]|$)`, 'i').test(text)) err(`name of a real person: ${b}`);
// Bruno, 2026-10-28: the "Ny version" sticker showed all the time. Only a 14-digit stamp may trigger it.
if (!/\/\^\\d\{14\}\$\/\.test\(v\)/.test(read('js/engine.js'))) err('version check must accept only a 14-digit stamp (js/engine.js)');
const vt = fs.existsSync(path.join(ROOT, 'version.txt')) ? read('version.txt').trim() : '', vi = (read('index.html').match(/window.VERSION = '(\d+)'/) || [])[1];
if (vt !== vi) err(`version.txt (${vt}) and window.VERSION in index.html (${vi}) differ: run tools/bump.sh`);
warns.forEach(w => console.log('warn:', w)); errors.forEach(e => console.log('ERROR:', e));
console.log(`${nodeCount} nodes in ${C.SESSIONS.length} sessions, ${all.size} Danish words. ${errors.length} errors, ${warns.length} warnings.`);
process.exit(errors.length ? 1 : 0);
