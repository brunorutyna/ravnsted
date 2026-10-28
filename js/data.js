/* RAVNSTED — grammar notes (Hvorfor?), colours, wardrobe, numbers. The glossary is in dict.js. */

const RULES = {
  'adj-en': { name: 'Adjective + en-word', rule: 'With an en-word in the singular, the adjective has no ending.', ex: ['en rød kjole', 'en smuk hue', 'Den er rød.'] },
  'adj-et': { name: 'Adjective + et-word', rule: 'With an et-word in the singular, the adjective takes -t. Some never do: sort, ternet, stribet, prikket, orange and lilla. blå and grå do: et blåt, et gråt.', ex: ['et rødt tørklæde', 'et smukt bælte', 'et sort bælte'] },
  'adj-pl': { name: 'Adjective + plural', rule: 'In the plural, the adjective takes -e. Words ending in -et get -ede. blå, grå and orange stay the same.', ex: ['nogle røde sko', 'nogle stribede sokker', 'nogle blå handsker'] },
  'adj-et-ending': { name: 'ternet, stribet, prikket', rule: 'Patterns ending in -et do not change in the singular, and become -ede in the plural.', ex: ['en ternet hue', 'et stribet tørklæde', 'nogle prikkede sokker'] },
  'sikke': { name: 'Sikke …!', rule: 'Sikke + en / et / nogle + adjective + noun praises something. Hvor er det + en / et / nogle … ! does the same.', ex: ['Sikke en flot kjole!', 'Sikke et smukt tørklæde!', 'Hvor er det nogle smukke sko!'] },
  'pron-den': { name: 'den, det, de', rule: 'A pronoun has the gender of the noun it stands for: an en-word becomes den, an et-word det, a plural de (dem as an object).', ex: ['Kjolen? Hvor har du købt den?', 'Tørklædet? Det er nyt.', 'Skoene? De var dyre.'] },
  'pron-dem': { name: 'de or dem', rule: 'Plural things are de as the subject and dem as the object.', ex: ['De var dyre.', 'Hvor har du købt dem?', 'Må jeg se dem?'] },
  'pron-ham': { name: 'han or ham', rule: 'han is the subject, ham the object.', ex: ['Han har sorte handsker.', 'Jeg har fundet ham.', 'Kender du ham?'] },
  'pron-match': { name: 'It must match', rule: 'den for an en-word, det for an et-word, dem for plural things you bought.', ex: ['Jakken har jeg købt i en butik. → den', 'Tørklædet har jeg fået af min mor. → det', 'Skoene har jeg købt på nettet. → dem'] },
  'hvor-henne': { name: 'Hvor … henne?', rule: 'Hvor … henne? asks where. Henne at the end is common in speech, and it is fine to leave it out.', ex: ['Hvor har du købt den henne?', 'Hvor ligger butikken henne?'] },
  'datid-koste': { name: 'Past tense: kostede', rule: 'Ask about the price in the past: koste → kostede. Was it expensive? Var den dyr?', ex: ['Hvad kostede den?', 'Den kostede 300 kr.', 'Var den dyr?'] },
  'har-koebt': { name: 'har + købt', rule: 'Perfect tense: har + past participle. købe → har købt, få → har fået, finde → har fundet.', ex: ['Jeg har købt den i Ribe.', 'Hvem har købt sorte handsker?', 'Jeg har fået den af min mor.'] },
  'i-paa': { name: 'i or på', rule: 'i with towns and shops, på with markets, the net and squares.', ex: ['i en butik', 'i Ribe', 'på et loppemarked', 'på nettet'] },
  'inversion': { name: 'Verb in second place', rule: 'When something other than the subject comes first, the verb comes before the subject.', ex: ['Den har jeg fået af Sidsel.', 'I dag skal jeg sælge en kjole.'] },
  'faa-af': { name: 'få noget af nogen', rule: 'To get something from someone: få … af.', ex: ['Jeg har fået den af Sidsel.', 'Jeg har fået et tørklæde af min mor.'] },
  'det-er': { name: 'Det er …', rule: 'Det er + noun says what something is.', ex: ['Det er en aftale.', 'Det er en god pris.'] },
  'for-adj': { name: 'for + adjective', rule: 'for before an adjective means too.', ex: ['Det er for lidt.', 'Den er for dyr.', 'Kjolen er for stor.'] },
  'kort-svar': { name: 'Short answers', rule: 'Answer with det + the same verb, and put ikke after it.', ex: ['Det kan jeg ikke.', 'Nej, det har jeg ikke.', 'Ja, det er jeg.'] },
  'spoerg': { name: 'Question word first', rule: 'Question word, then the verb, then the subject.', ex: ['Hvem er hun?', 'Hvor er Ellen?'] },
  'have-paa': { name: 'have … på', rule: 'To wear: have + clothes + på.', ex: ['Jeg har en blå trøje på.', 'Hun har et hvidt tørklæde på.', 'Han har et par sorte handsker på.'] },
};

/* colour → forms (en, et, plural), wash colour for the woodcut, English */
const COLORS = {
  rød: { f: ['rød', 'rødt', 'røde'], hex: '#b3342a', en: 'red' },
  grøn: { f: ['grøn', 'grønt', 'grønne'], hex: '#5d7f3e', en: 'green' },
  blå: { f: ['blå', 'blåt', 'blå'], hex: '#3c5a8f', en: 'blue' },
  gul: { f: ['gul', 'gult', 'gule'], hex: '#d1a43a', en: 'yellow' },
  hvid: { f: ['hvid', 'hvidt', 'hvide'], hex: '#f2ead6', en: 'white' },
  sort: { f: ['sort', 'sort', 'sorte'], hex: '#141110', en: 'black' },
  grå: { f: ['grå', 'gråt', 'grå'], hex: '#8a8a86', en: 'grey' },
  brun: { f: ['brun', 'brunt', 'brune'], hex: '#7a5032', en: 'brown' },
  orange: { f: ['orange', 'orange', 'orange'], hex: '#d9792b', en: 'orange' },
  lyserød: { f: ['lyserød', 'lyserødt', 'lyserøde'], hex: '#e3a1a1', en: 'pink' },
  lyseblå: { f: ['lyseblå', 'lyseblåt', 'lyseblå'], hex: '#9cb9d6', en: 'light-blue' },
  lilla: { f: ['lilla', 'lilla', 'lilla'], hex: '#7c5a8e', en: 'purple' },
};
/* things the player can really be wearing: noun → [gender, English] */
const WEAR_NOUNS = {
  trøje: ['en', 'sweater'], 'hættetrøje': ['en', 'hoodie'], skjorte: ['en', 'shirt'], bluse: ['en', 'blouse'], 't-shirt': ['en', 'T-shirt'],
  jakke: ['en', 'jacket'], kjole: ['en', 'dress'], nederdel: ['en', 'skirt'], hue: ['en', 'hat'],
  tørklæde: ['et', 'scarf'], 'bælte': ['et', 'belt'], ur: ['et', 'watch'], jakkesæt: ['et', 'suit'],
  bukser: ['pl', 'trousers'], sko: ['pl', 'shoes'], sokker: ['pl', 'socks'], handsker: ['pl', 'gloves'], 'støvler': ['pl', 'boots'], shorts: ['pl', 'shorts'],
};

/* numbers said aloud while haggling */
function numDa(n) {
  const one = ['nul', 'en', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'otte', 'ni', 'ti', 'elleve', 'tolv', 'tretten', 'fjorten', 'femten', 'seksten', 'sytten', 'atten', 'nitten'];
  const tens = { 2: 'tyve', 3: 'tredive', 4: 'fyrre', 5: 'halvtreds', 6: 'tres', 7: 'halvfjerds', 8: 'firs', 9: 'halvfems' };
  if (n < 20) return one[n];
  const t = Math.floor(n / 10), u = n % 10;
  return u ? one[u] + 'og' + tens[t] : tens[t];
}

/* ---------- shared by the game and the voice generator ---------- */
const PROPER = ['Sidsel', 'Ribe', 'Ellen', 'Kragen', 'Gertrud', 'Mads', 'Hulda', 'Jens', 'Bodil', 'Absalon', 'Herluf'];
// a built sentence as it is shown and spoken: proper nouns keep their capital, comma after a first ja / nej / jo
function sentenceOf(words, punct) {
  const w = words.map(x => PROPER.includes(x) ? x : x.toLowerCase());
  return w.join(' ').replace(/^(nej|ja|jo) /, '$1, ').replace(/^./, c => c.toUpperCase()) + punct;
}
// the key a voice clip is stored under: who + the words, without case or punctuation
function vkey(who, text) { return who + '|' + String(text).toLowerCase().replace(/[^a-z0-9æøåéü]+/g, ' ').trim(); }
// the finale: what the player wears
const WEAR_PLACES = [['i', 'en', 'butik'], ['i', 'en', 'genbrugsbutik'], ['på', 'et', 'loppemarked'], ['på', 'nettet'], ['i', 'et', 'indkøbscenter']];
const WEAR_GIFTS = [['af', 'min', 'mor'], ['af', 'en', 'ven']];
const PAIRS = ['bukser', 'sko', 'handsker', 'sokker', 'støvler'];
function wearOf(n, c) {
  const g = WEAR_NOUNS[n][0], forms = COLORS[c].f, adj = g === 'en' ? forms[0] : g === 'et' ? forms[1] : forms[2];
  const art = g === 'pl' ? (PAIRS.includes(n) ? 'et par' : 'nogle') : g;
  const okArts = g === 'en' ? [['en']] : g === 'et' ? [['et']] : [['nogle'], ['et', 'par']];
  const en = (g === 'pl' ? '' : /^[aeiou]/.test(COLORS[c].en) ? 'an ' : 'a ') + COLORS[c].en + ' ' + WEAR_NOUNS[n][1];
  return { n, c, g, forms, adj, art, okArts, en, pron: g === 'en' ? 'den' : g === 'et' ? 'det' : 'dem',
    da: `${art.charAt(0).toUpperCase() + art.slice(1)} ${adj} ${n}`, answers: okArts.map(a => ['Jeg', 'har', ...a, adj, n, 'på']) };
}
function whereAnswers(pron) {
  const out = [];
  WEAR_PLACES.forEach(p => { out.push(['Jeg', 'har', 'købt', pron, ...p]); out.push([pron, 'har', 'jeg', 'købt', ...p]); });
  WEAR_GIFTS.forEach(p => { out.push(['Jeg', 'har', 'fået', pron, ...p]); out.push([pron, 'har', 'jeg', 'fået', ...p]); });
  return out;
}
const HAGGLE_RANGE = { gertrud: [15, 50], mads: [5, 22] };

const INSPECT = [
  { k: 'kant', x: .5, y: .85, da: 'Kanten er våd.', en: 'The hem is wet.' },
  { k: 'som', x: .37, y: .6, da: 'Der er et siv i sømmen.', en: 'There is a reed in the seam.' },
  { k: 'krave', x: .5, y: .1, da: 'Der er mudder på kraven.', en: 'There is mud on the collar.' },
];
