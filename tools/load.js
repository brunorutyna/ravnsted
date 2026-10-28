// Loads the game's data files into Node (no browser) so tools can inspect story, glossary and rules.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
function load(files = ['js/data.js', 'js/dict.js', 'js/story.js', 'js/voicemap.js']) {
  const ctx = { console, Math, JSON }; vm.createContext(ctx);
  for (const f of files) if (fs.existsSync(path.join(ROOT, f))) vm.runInContext(read(f).replace(/^(const|let) (\w+) =/gm, 'var $2 ='), ctx, { filename: f });
  return ctx;
}
/* Every Danish string the game can show, found by walking the story with sample states. */
function danish(C) {
  const out = new Set(); const add = s => { if (typeof s === 'string' && s.trim()) out.add(s); };
  const samples = [];
  const solds = ['gertrud', 'mads', 'hulda', 'kept'];
  for (const sold of solds) for (const v of [0, 1]) {
    const f = { sold, price: 20, betterCut: v, inkBad: v, kept: sold === 'kept' ? 1 : 0, askedWhere: v, inspected: v, lieH: v, clueHue: v, pay2: v ? 15 : 0, truthJ: v, bribe: v, reported: v, inkBad2: v, warmG: v, lieG: v, lieGfail: v, truthG: v, warmM: v, knowsEllen: v, paidScribe: v };
    samples.push({ flags: f, kr: 10, mini: { c1: { bad: !!v }, c2: { bad: !!v }, dress: { found: v ? 3 : 1 }, findG: { ok: !!v }, findJ: { ok: !!v }, dye: { score: v ? 3 : 1 }, saleG: { walked: !!v, price: 30 }, saleM: { walked: !!v, price: 12 } }, wear: { da: 'En rød trøje', en: 'A red sweater', pron: 'den' } });
  }
  const steps = (list, seen = 0) => { if (!list || seen > 6) return; if (typeof list === 'function') { samples.forEach(G => { try { steps(list(G), seen + 1); } catch (e) { } }); return; } if (Array.isArray(list)) return list.forEach(x => steps(x, seen + 1));
    const st = list; add(st.da); add(st.why);
    if (st.mini) mini(st.mini);
  };
  const mini = m => { samples.forEach(G => { ['say'].forEach(k => add(typeof m[k] === 'function' ? m[k](G) : m[k])); });
    (m.items || []).forEach(it => { add(it.pre); add(it.post); it.opts.forEach(add); add(it.ok); });
    (m.orders || []).forEach(o => { add(o.want); o.name.forEach(add); add(`Det er ${o.art} ${o.ok} ${o.noun}.`); });
  };
  const build = b => { if (!b) return; (b.answers || []).forEach(a => add(a.join(' '))); (b.tiles || []).forEach(add); (b.extra || []).forEach(add); };
  for (const N of Object.values(C.SESSION.nodes)) { steps(N.lines); (N.opts || []).forEach(o => { steps(o.ok); steps(o.fail); build(o.build); if (o.mini) mini(o.mini); }); }
  C.LORE.forEach(l => add(l.da)); C.TIMES.forEach(t => { add(t.name); add('Klokken slår ' + t.clock + '.'); });
  Object.values(C.RULES).forEach(r => r.ex.forEach(add));
  Object.keys(C.WEAR_NOUNS).forEach(add); Object.values(C.COLORS).forEach(c => c.f.forEach(add));
  for (let n = 5; n <= 60; n++) add(C.numDa(n) + ' kroner');
  // fixed Danish in the engine and mini-games
  ['Jeg giver dig', 'Mit sidste bud', 'Ja … det er en aftale.', 'Det er en aftale.', 'Det er for lidt!', 'Så er der ingen handel.', 'Kanten er våd.', 'Der er et siv i sømmen.', 'Der er mudder på kraven.', 'Blækket løber. Bogen tror ikke på det.', 'Bogen drikker blækket.', 'Tre ordrer. Godt.', 'Tre ordrer. Langsomt.', 'Sikke en smuk kjole! Hvor har du købt den henne?', 'Jeg har på en et nogle par', 'i en butik genbrugsbutik på et loppemarked nettet indkøbscenter fået af min mor ven købt den det dem', 'Fru Gertrud betaler Mads betaler sølv fra bjerget Sidsels del kontrakten er brudt fogeden betaler Jens betaler oversættelse engelsk', 'Du har ingen penge.', 'Hvor er det nogle smukke sko!', 'Nej. Det er ikke det, de vil have.', 'brun lilla grøn', 'kjole tørklæde handsker hue kappe bælte knapper sko rød grøn hvid sort grå stribet ternet dyr billig kostede købt smuk flot pæn våd pris aftale penge sølv mose blæk sandt prikket', 'Hvor er det'].forEach(add);
  return [...out];
}
const words = s => (s.match(/[A-Za-zÆØÅæøå][A-Za-zÆØÅæøå'-]*/g) || []).map(w => w.toLowerCase().replace(/'$/, ''));
module.exports = { load, danish, words, ROOT, read };
