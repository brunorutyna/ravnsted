/* =========================================================================
   RAVNSTED · Kapitel 3.2 · "Den røde kjole"
   SPOILERS: this file holds the whole plot. Do not quote it to Bruno.
   Steps:  {n} narration · {t} inner thought · {say,da,en} a line · {set} flags · {kr,why} money
           {time} time of day passes · {mini,id,...} a mini-game · {go} jump · {end} ending
           A step can also be a function (G) => step | [steps].
   Options: {tag,label,build,roll,ok,fail,next,failNext,once,if,cost,set}
   ========================================================================= */

const TIMES = [
  { name: 'Daggry', clock: 'seks', hour: 6 },
  { name: 'Formiddag', clock: 'ni', hour: 9 },
  { name: 'Middag', clock: 'tolv', hour: 12 },
  { name: 'Eftermiddag', clock: 'tre', hour: 3 },
  { name: 'Skumring', clock: 'seks', hour: 6 },
  { name: 'Nat', clock: 'ni', hour: 9 },
  { name: 'Midnat', clock: 'tolv', hour: 12 },
];

/* Who can stand in a scene. Outfit words are the ones the game teaches; the art reads them. */
const NPCS = {
  sidsel: { name: 'Sidsel', role: 'møllerens kone', look: { body: ['kappe', 'grå'], hood: 'grå', holds: 'kjole' } },
  absalon: { name: 'Absalon', role: 'skriveren', look: { body: ['kappe', 'brun'], hat: ['kalot', 'sort'], beard: 1, milky: 1 } },
  gertrud: { name: 'Fru Gertrud', role: 'fogedens kone', look: { body: ['kjole', 'grøn'], scarf: 'hvid', shoes: 'sort' } },
  mads: { name: 'Mads Klud', role: 'kludekræmmer', look: { body: ['jakke', 'brun'], hat: ['hue', 'brun', 'ternet'], mitten: 'grøn' } },
  hulda: { name: 'Hulda', role: 'fra bjerget', look: { body: ['sjal', 'blå'], tall: 1, hair: 1, bare: 1 } },
  foged: { name: 'Fogeden', role: 'Herluf', look: { body: ['kappe', 'rød'], hat: ['hat', 'sort'] } },
  bodil: { name: 'Bodil', role: 'farversken', look: { body: ['forklæde', 'blå'], hands: 'blå', hair: 1 } },
  jens: { name: 'Jens', role: 'fogedens søn', look: { body: ['kappe', 'grå'], hat: ['hue', 'grå', 'stribet'], gloves: 'sort' } },
  mosekonen: { name: 'Mosekonen', role: '', look: { steam: 1 } },
};

/* The opening, shown once before the first scene. Each card carries one Danish line. */
const LORE = [
  { da: 'Ravnsted ligger mellem mosen og bjerget.', en: 'Ravnsted. A wet town between the marsh and the hill. The people on the hill are not people. Nobody minds, as long as the rent is paid.', art: 'town' },
  { da: 'I mosen bor mosekonen. Hun brygger.', en: 'When the marsh steams, the old woman in it is brewing. Children are told to stay out. Adults are told nothing, and go anyway.', art: 'marsh' },
  { da: 'Det, der står i bogen, er sandt.', en: 'The scribe\'s book is older than the church. What is written in it, in exact words, is true. People pay to have things written. They pay more to have them not written.', art: 'book' },
  { da: 'Du tager det arbejde, der er.', en: 'They call you Kragen, the crow. You take whatever work there is. Today there will be work.', art: 'crow' },
];

/* ---------- shared builder sentences ---------- */
const B = {
  hvorKoebtDen: { prompt: 'Where did you buy it? (the dress: en kjole)', answers: [['Hvor', 'har', 'du', 'købt', 'den', 'henne'], ['Hvor', 'har', 'du', 'købt', 'den'], ['Hvor', 'henne', 'har', 'du', 'købt', 'den']], extra: ['det', 'dem', 'købte'], punct: '?', rules: ['pron-den', 'hvor-henne'], tip: 'kjole is an en-word, so "it" is den. Henne at the end is optional.' },
  hvadKostede: { prompt: 'What did it cost? (past tense)', answers: [['Hvad', 'kostede', 'den']], extra: ['koster', 'det', 'dem'], punct: '?', rules: ['pron-den', 'datid-koste'], tip: 'Ask in the past: kostede. And kjole is an en-word: den.' },
};

const SESSION = {
  id: 'k3s2', title: 'Den røde kjole', book: 'Danish to Go 2 · 3.2 · Hvor har du købt den henne?',
  start: 'loft', endings: ['seng', 'klud', 'soelv', 'mosen'], endings2: ['bogen', 'tredive', 'tavs'],
  nodes: {

/* ======================= DAGGRY · loftet ======================= */
loft: { place: 'loft', time: 0, npcs: [], lines: [
  { n: 'Daggry. Hay in your hair, a rat on your boot, three kroner in your pocket. The bell of Sankt Olai has just rung six.' },
  { n: 'Someone climbs the ladder. A woman in a grey cloak, holding a bundle against her chest as if it might bite.' },
  { npcs: ['sidsel'] },
  { say: 'sidsel', da: 'Er du Kragen? Ham, der tager arbejde for penge?', en: 'Are you Kragen? The one who takes work for money?' },
  { t: '"The one who takes work for money." Put it on my grave.' },
  { say: 'sidsel', da: 'Jeg hedder Sidsel. Jeg har en kjole, jeg skal sælge. I dag. Før middag.', en: 'My name is Sidsel. I have a dress I have to sell. Today. Before noon.' },
  { n: 'She unfolds it. Red wool, a black belt, small white buttons. Too good for this loft. Too good for her.' },
  { say: 'sidsel', da: 'Sikke en smuk kjole, ikke? Den er rød … næsten.', en: 'What a beautiful dress, isn\'t it? It\'s red … almost.' },
], opts: [
  { tag: 'Sig', label: 'Praise the dress', once: true, build: { prompt: 'What a beautiful dress! (Sikke …!)', answers: [['Sikke', 'en', 'smuk', 'kjole'], ['Sikke', 'en', 'flot', 'kjole']], tiles: ['Sikke', 'en', 'et', 'smuk', 'smukt', 'smukke', 'flot', 'kjole'], punct: '!', rules: ['sikke', 'adj-en'] },
    ok: [{ say: 'sidsel', da: 'Ja. Den er for smuk til mig.', en: 'Yes. It is too beautiful for me.' }, { t: 'She does not say it like a compliment.' }], set: { praised: 1 } },
  { tag: 'Sig', label: 'Ask where she bought it', once: true, build: B.hvorKoebtDen,
    ok: [{ say: 'sidsel', da: 'Købt? Den har jeg haft længe.', en: 'Bought? I have had it for a long time.' }, { t: 'She has not. The hem is still wet, and the wet smells of the marsh.' }], set: { askedWhere: 1 } },
  { tag: 'Sig', label: 'Ask what it cost', once: true, build: B.hvadKostede,
    ok: [{ say: 'sidsel', da: 'Det husker jeg ikke.', en: 'I don\'t remember.' }, { t: 'People always remember what they paid. Unless they never paid.' }], set: { askedPrice: 1 } },
  { tag: 'Sig', label: 'Ask if it was expensive', once: true, if: G => G.flags.askedPrice, build: { prompt: 'Was it expensive? (den = the dress)', answers: [['Var', 'den', 'dyr']], extra: ['det', 'dyrt', 'dyre'], punct: '?', rules: ['adj-en', 'datid-koste'], tip: 'Past tense of er is var. den kjole → den er dyr (no ending).' },
    ok: [{ say: 'sidsel', da: 'Ja. Meget dyr.', en: 'Yes. Very expensive.' }, { t: 'She remembers that it was expensive, but not what it cost. Noted.' }], set: { caught: 1 } },
  { tag: 'Gør', label: 'Look closely at the dress', once: true, mini: { kind: 'inspect', id: 'dress' },
    ok: [G => G.mini.dress && G.mini.dress.found >= 3 ? { t: 'Wet hem, a reed in the seam, marsh water. This dress has been somewhere nobody goes on purpose.' } : { t: 'Something about it is wrong. You put the thought away for later. Later always comes.' }], set: { inspected: 1 } },
  { tag: 'Gør', label: 'Shrug. Say it isn\'t worth your time', once: true, if: G => !G.flags.betterCut,
    ok: [{ say: 'sidsel', da: 'Vent! Du får mere. To tredjedele af prisen.', en: 'Wait! You get more. Two thirds of the price.' }, { t: 'Nobody pays two thirds for help with a dress. Unless the dress is the problem.' }], set: { betterCut: 1 } },
  { tag: 'Gå', label: 'Take the job', next: 'loft_deal' },
] },

loft_deal: { place: 'loft', time: 0, npcs: ['sidsel'], lines: [
  G => ({ say: 'sidsel', da: G.flags.betterCut ? 'Godt. To tredjedele er dine.' : 'Godt. Halvdelen er din.', en: G.flags.betterCut ? 'Good. Two thirds are yours.' : 'Good. Half is yours.' }),
  { say: 'sidsel', da: 'Men vi skriver det i bogen. Hos skriveren. Så ingen kan snyde.', en: 'But we write it in the book. At the scribe\'s. So nobody can cheat.' },
  { t: 'Nobody can cheat. Including you, Kragen.' },
  { time: 1 },
  { go: 'skriver' },
] },

/* ======================= FORMIDDAG · skriverens bod ======================= */
skriver: { place: 'skriver', time: 1, npcs: ['absalon', 'sidsel'], lines: [
  { n: 'Formiddag. The scribe\'s booth leans against the church wall like a drunk against a friend. Inside: one candle, one book, one old man.' },
  { say: 'absalon', da: 'Kragen. Og Sidsel fra møllen. Hvad skal vi skrive?', en: 'Kragen. And Sidsel from the mill. What shall we write?' },
  { n: 'Absalon\'s left eye is milky. People say it reads the book while the right one reads you.' },
  { say: 'absalon', da: 'Husk: Det, der står i bogen, er sandt. Skriv ordentligt, eller betal for mit blæk.', en: 'Remember: what stands in the book is true. Write properly, or pay for my ink.' },
], opts: [
  { tag: 'Gør', label: 'Dictate the contract yourself', next: 'skriver_done', mini: { kind: 'ledger', id: 'c1', title: 'Kontrakt', items: [
    { pre: 'Kragen skal sælge en', post: 'kjole for Sidsel før middag.', rule: 'adj-en', opts: ['rød', 'rødt', 'røde'], ok: 'rød', why: 'kjole is an en-word: no ending. en rød kjole.' },
    { pre: 'Kjolen har et', post: 'bælte.', rule: 'adj-et', opts: ['sort', 'sorte'], ok: 'sort', why: 'bælte is an et-word, but sort never takes -t: et sort bælte.' },
    { pre: 'Og nogle små', post: 'knapper.', rule: 'adj-pl', opts: ['hvid', 'hvidt', 'hvide'], ok: 'hvide', why: 'knapper is plural: -e. nogle hvide knapper.' },
  ] } },
  { tag: 'Køb', label: 'Let Absalon write it for you', cost: 2, next: 'skriver_done', ok: [{ say: 'absalon', da: 'To kroner. Tak.', en: 'Two kroner. Thank you.' }, { t: 'He writes fast, without looking. The ink drinks the page.' }], set: { paidScribe: 1 } },
] },

skriver_done: { place: 'skriver', time: 1, npcs: ['absalon', 'sidsel'], lines: [
  G => G.mini.c1 && G.mini.c1.bad ? [{ n: 'The ink runs down the page in thin red-black tears. The book does not accept it.' }, { say: 'absalon', da: 'Blækket løber. Bogen tror ikke på det.', en: 'The ink runs. The book does not believe it.' }, { say: 'sidsel', da: 'Så står der ingenting. Godt for mig.', en: 'Then nothing stands there. Good for me.' }, { set: { inkBad: 1 } }]
    : [{ n: 'The ink sinks into the page and is gone, as if the book had swallowed it.' }, { say: 'absalon', da: 'Så står det i bogen.', en: 'Then it stands in the book.' }],
  { n: 'Sidsel leaves without a word, the bundle now under your arm. It is cold through the cloth.' },
  G => (G.flags.askedWhere || G.flags.inspected || G.flags.caught) ? [{ say: 'absalon', da: 'En våd kjole fra møllen … Pas på, Kragen. Mosen glemmer ikke sine ting.', en: 'A wet dress from the mill … Careful, Kragen. The marsh does not forget its things.' }] : [],
  { say: 'absalon', da: 'Og hvis du vil sælge noget rødt: Fru Gertrud køber alt, der er rødt. Hun står på torvet nu.', en: 'And if you want to sell something red: Fru Gertrud buys everything that is red. She is in the square now.' },
], opts: [
  { tag: 'Køb', label: 'Pay to ask about Sidsel', cost: 1, once: true, build: { prompt: 'Who is she? (ask about Sidsel)', answers: [['Hvem', 'er', 'hun']], extra: ['han', 'hvor'], punct: '?', rules: ['spoerg'] },
    ok: [{ say: 'absalon', da: 'Møllerens kone. Hans datter, Ellen, er væk. Tre dage nu.', en: 'The miller\'s wife. His daughter, Ellen, is gone. Three days now.' }, { say: 'absalon', da: 'Folk siger, hun er rejst med en soldat.', en: 'People say she has left with a soldier.' }, { t: 'People say a lot of things in Ravnsted. Mostly to stop themselves saying the other things.' }], set: { knowsEllen: 1 } },
  { tag: 'Gå', label: 'Go to the square', next: 'torv' },
] },

/* ======================= FORMIDDAG · torvet ======================= */
torv: { place: 'torv', time: 1, npcs: ['mads', 'hulda'], lines: [
  { n: 'Torvet. Fish, wet wool, a goat eating a sermon nailed to a post.' },
  { t: 'Somewhere in this crowd: a green dress and a white scarf. Fru Gertrud.' },
  { mini: { kind: 'spot', id: 'findG', target: 'gertrud', say: 'Hun har en grøn kjole og et hvidt tørklæde på.', en: 'She is wearing a green dress and a white scarf.', crowd: [
    { img: 'c_g0', name: 'gertrud', body: ['kjole', 'grøn'], scarf: 'hvid' },
    { img: 'c_g1', body: ['kjole', 'grøn'], scarf: 'gul' },
    { img: 'c_g2', body: ['kjole', 'blå'], scarf: 'hvid' },
    { img: 'c_g3', body: ['kappe', 'grøn'], scarf: 'hvid', hat: ['hue', 'grøn'] },
    { img: 'c_g4', body: ['kjole', 'brun'], scarf: 'hvid' },
    { img: 'c_g5', body: ['kjole', 'grøn', 'stribet'], scarf: 'rød' },
  ] } },
  G => G.mini.findG && G.mini.findG.ok ? { t: 'There. Green dress, white scarf, and a face that has never carried anything heavier than an opinion.' } : [{ t: 'You ask a fishwife. She points with a herring, and holds out her other hand.' }, { kr: -1, why: 'fiskekonen' }],
  { npcs: ['gertrud', 'mads', 'hulda'] },
  { t: 'Three people in this square might buy a red dress before noon. One of them is not a person.' },
  { go: 'torv_hub' },
] },

torv_hub: { place: 'torv', time: 1, npcs: ['gertrud', 'mads', 'hulda'], lines: [
  G => ({ npcs: [['gertrud', 'goneG'], ['mads', 'goneM'], ['hulda', 'goneH']].filter(([, f]) => !G.flags[f]).map(([n]) => n) }),
  G => ({ t: G.flags.goneG || G.flags.goneM || G.flags.goneH ? 'The church clock creeps towards noon. The dress gets heavier.' : 'The dress is cold under your arm. Noon is coming.' }),
], opts: [
  { tag: 'Gå', label: 'Talk to Fru Gertrud', if: G => !G.flags.goneG && !G.flags.sold, next: 'gertrud' },
  { tag: 'Gå', label: 'Try Mads Klud\'s rag stall', if: G => !G.flags.goneM && !G.flags.sold, next: 'mads' },
  { tag: 'Gå', label: 'Approach the tall woman by the well', if: G => !G.flags.goneH && !G.flags.sold, next: 'hulda' },
  { tag: 'Gør', label: 'Keep the dress. Nobody gets it', if: G => !G.flags.sold, next: 'keep' },
] },

gertrud: { place: 'torv', time: 1, npcs: ['gertrud'], lines: [
  { n: 'Fru Gertrud, the bailiff\'s wife. Her scarf is whiter than anything in Ravnsted has a right to be.' },
  { say: 'gertrud', da: 'Hvad vil du? Jeg køber ikke af tiggere.', en: 'What do you want? I do not buy from beggars.' },
], opts: [
  { tag: 'Sig', label: 'Flatter her clothes', once: true, roll: { stat: 'snak', dc: 11 },
    build: { prompt: 'Praise one of her things: the dress (en kjole), the scarf (et tørklæde) or the shoes (sko, plural).', answers: [['Sikke', 'et', 'smukt', 'tørklæde'], ['Sikke', 'et', 'flot', 'tørklæde'], ['Sikke', 'en', 'smuk', 'kjole'], ['Sikke', 'en', 'flot', 'kjole'], ['Sikke', 'nogle', 'smukke', 'sko'], ['Sikke', 'nogle', 'flotte', 'sko']], tiles: ['Sikke', 'en', 'et', 'nogle', 'smuk', 'smukt', 'smukke', 'flot', 'flotte', 'kjole', 'tørklæde', 'sko'], punct: '!', rules: ['sikke', 'adj-en', 'adj-et', 'adj-pl'], tip: 'Match the words: en + smuk + kjole · et + smukt + tørklæde · nogle + smukke + sko.' },
    ok: [G => { const w = (G.lastBuilt || []).join(' '); const p = /kjole/.test(w) ? ['Den', 'it'] : /sko/.test(w) ? ['Dem', 'them'] : ['Det', 'it']; return { say: 'gertrud', da: `Ja, ikke? ${p[0]} har jeg fået af min mand.`, en: `Yes, isn't it? I got ${p[1]} from my husband.` }; }, { say: 'gertrud', da: 'Nå. Hvad har du der?', en: 'Well. What have you got there?' }, { set: { warmG: 1 } }],
    fail: [{ say: 'gertrud', da: 'Smiger. Billig smiger.', en: 'Flattery. Cheap flattery.' }, { t: 'But she looks at the bundle anyway. Vanity is patient.' }] },
  { tag: 'Gør', label: 'Show her the red dress', next: 'gertrud_show' },
  { tag: 'Gå', label: 'Back to the square', next: 'torv_hub' },
] },

gertrud_show: { place: 'torv', time: 1, npcs: ['gertrud'], lines: [
  { n: 'You unfold the dress. For one second Fru Gertrud forgets to look bored.' },
  { say: 'gertrud', da: 'Hm. Den er pæn. Hvor har du købt den henne?', en: 'Hm. It is nice. Where did you buy it?' },
], opts: [
  { tag: 'Lyv', label: 'Lie: a shop in Ribe', roll: { stat: 'loegn', dc: 12 }, next: 'gertrud_haggle',
    build: { prompt: 'I bought it in a shop in Ribe.', answers: [['Jeg', 'har', 'købt', 'den', 'i', 'en', 'butik', 'i', 'Ribe'], ['Den', 'har', 'jeg', 'købt', 'i', 'en', 'butik', 'i', 'Ribe'], ['I', 'en', 'butik', 'i', 'Ribe']], extra: ['det', 'på', 'et'], punct: '.', rules: ['har-koebt', 'pron-den', 'i-paa'], tip: 'Jeg har købt den … (den = the dress, an en-word). A town takes i.' },
    ok: [{ say: 'gertrud', da: 'Ribe! Ja, det kan man se.', en: 'Ribe! Yes, one can tell.' }, { set: { lieG: 1 } }],
    fail: [{ say: 'gertrud', da: 'Ribe? Den lugter ikke af Ribe. Den lugter af mose.', en: 'Ribe? It doesn\'t smell of Ribe. It smells of marsh.' }, { set: { lieGfail: 1 } }] },
  { tag: 'Sig', label: 'Tell the truth: from Sidsel at the mill', next: 'gertrud_haggle',
    build: { prompt: 'I have it from Sidsel at the mill.', answers: [['Jeg', 'har', 'den', 'fra', 'Sidsel'], ['Den', 'har', 'jeg', 'fra', 'Sidsel']], extra: ['det', 'købt', 'i'], punct: '.', rules: ['pron-den', 'inversion'] },
    ok: [{ say: 'gertrud', da: 'Fra møllen? Hvor Ellen …', en: 'From the mill? Where Ellen …' }, { t: 'She stops. Then she decides that a dress is a dress.' }, { set: { truthG: 1 } }] },
] },

gertrud_haggle: { place: 'torv', time: 1, npcs: ['gertrud'], lines: [
  { mini: { kind: 'haggle', id: 'saleG', buyer: 'gertrud', base: G => 28 + (G.flags.warmG ? 6 : 0) + (G.flags.lieG ? 6 : 0) - (G.flags.lieGfail ? 6 : 0) - (G.flags.truthG ? 2 : 0), step: 5, cap: 50 } },
  G => G.mini.saleG.walked ? [{ say: 'gertrud', da: 'Nej. Gå din vej.', en: 'No. Go away.' }, { set: { goneG: 1 } }, { go: 'torv_hub' }]
    : [{ say: 'gertrud', da: 'Så er det en aftale.', en: 'Then it\'s a deal.' }, { kr: G.mini.saleG.price, why: 'Fru Gertrud betaler' }, { set: { sold: 'gertrud', price: G.mini.saleG.price } }, { n: 'She holds the dress against herself and smiles at nobody. The hem leaves a dark wet line on her green skirt.' }, { go: 'middag' }],
] },

mads: { place: 'torv', time: 1, npcs: ['mads'], lines: [
  { n: 'Mads Klud deals in rags. His own clothes are a museum of other people\'s: a brown jacket, a checked cap, one green mitten.' },
  { say: 'mads', da: 'Kragen! Hvad har du til mig i dag? Noget, der lugter af penge?', en: 'Kragen! What have you got for me today? Something that smells of money?' },
], opts: [
  { tag: 'Sig', label: 'Compliment his cap', once: true, roll: { stat: 'snak', dc: 10 },
    build: { prompt: 'What a checked cap! (en hue)', answers: [['Sikke', 'en', 'ternet', 'hue'], ['Sikke', 'en', 'flot', 'hue']], tiles: ['Sikke', 'en', 'et', 'nogle', 'ternet', 'ternede', 'flot', 'hue'], punct: '!', rules: ['sikke', 'adj-en', 'adj-et-ending'], tip: 'hue is an en-word. ternet stays ternet in the singular.' },
    ok: [{ say: 'mads', da: 'Den har jeg haft i tyve år. Den var gratis. Manden skulle ikke bruge den mere.', en: 'I have had it for twenty years. It was free. The man didn\'t need it any more.' }, { t: 'Second-hand in Ravnsted means the first hand is cold.' }, { set: { warmM: 1 } }],
    fail: [{ say: 'mads', da: 'Ja ja. Vis mig, hvad du har.', en: 'Yes, yes. Show me what you have.' }] },
  { tag: 'Gør', label: 'Show him the red dress', next: 'mads_show' },
  { tag: 'Gå', label: 'Back to the square', next: 'torv_hub' },
] },

mads_show: { place: 'torv', time: 1, npcs: ['mads'], lines: [
  { n: 'Mads does not touch the dress. He leans over it and sniffs, like a dog at a stranger.' },
  { say: 'mads', da: 'Den er våd. Og kold. Som noget, der har ligget i vand.', en: 'It is wet. And cold. Like something that has been lying in water.' },
  { say: 'mads', da: 'Ingen køber en våd kjole. Ikke i denne uge.', en: 'Nobody buys a wet dress. Not this week.' },
  { say: 'mads', da: 'Men jeg er ikke ingen. Jeg er Mads.', en: 'But I am not nobody. I am Mads.' },
  { mini: { kind: 'haggle', id: 'saleM', buyer: 'mads', base: G => 12 + (G.flags.warmM ? 3 : 0), step: 2, cap: 20 } },
  G => G.mini.saleM.walked ? [{ say: 'mads', da: 'Så sælg den til mosen.', en: 'Then sell it to the marsh.' }, { set: { goneM: 1 } }, { go: 'torv_hub' }]
    : [{ kr: G.mini.saleM.price, why: 'Mads betaler' }, { set: { sold: 'mads', price: G.mini.saleM.price } }, { n: 'Mads rolls the dress into a ball and stuffs it under his stall, next to a box of shoes that all belong to left feet.' }, { go: 'middag' }],
] },

hulda: { place: 'torv', time: 1, npcs: ['hulda'], lines: [
  { n: 'By the well stands a woman who is too tall. Blue shawl, bare feet in the frost, a smell of wet stone. Hill folk. Everybody in the square pretends not to look.' },
  { say: 'hulda', da: 'Den kjole. Den har jeg set før.', en: 'That dress. I have seen it before.' },
  { say: 'hulda', da: 'Jeg giver dig sølv for den. Men du skal sige mig, hvor du har fået den.', en: 'I will give you silver for it. But you must tell me where you got it.' },
], opts: [
  { tag: 'Sig', label: 'Tell the truth: Sidsel from the mill', next: 'hulda_sell',
    build: { prompt: 'I got it from Sidsel.', answers: [['Jeg', 'har', 'fået', 'den', 'af', 'Sidsel'], ['Den', 'har', 'jeg', 'fået', 'af', 'Sidsel']], extra: ['det', 'dem', 'købt'], punct: '.', rules: ['pron-den', 'inversion', 'faa-af'], tip: 'få noget af nogen: get something from someone. den = the dress.' } },
  { tag: 'Lyv', label: 'Lie: you bought it at a flea market', roll: { stat: 'loegn', dc: 16 }, next: 'hulda_sell', failNext: 'hulda_gone',
    build: { prompt: 'I bought it at a flea market.', answers: [['Jeg', 'har', 'købt', 'den', 'på', 'et', 'loppemarked'], ['Den', 'har', 'jeg', 'købt', 'på', 'et', 'loppemarked']], extra: ['i', 'en', 'det'], punct: '.', rules: ['har-koebt', 'pron-den', 'inversion'], tip: 'på et loppemarked. den = the dress.' },
    ok: [{ say: 'hulda', da: 'Et loppemarked. Ja. Mennesker sælger alt.', en: 'A flea market. Yes. Humans sell everything.' }, { set: { lieH: 1 } }],
    fail: [{ say: 'hulda', da: 'Du lyver, Krage. Mennesker lyver altid om tøj.', en: 'You are lying, Crow. Humans always lie about clothes.' }] },
  { tag: 'Gå', label: 'Back away politely', next: 'torv_hub' },
] },

hulda_gone: { place: 'torv', time: 1, npcs: [], lines: [
  { n: 'When you look again, the well has nobody beside it. Only wet footprints, too long, walking towards the hill.' },
  { set: { goneH: 1 } }, { go: 'torv_hub' },
] },

hulda_sell: { place: 'torv', time: 1, npcs: ['hulda'], lines: [
  G => G.flags.lieH ? { say: 'hulda', da: 'Tredive kroner. I sølv. For en kjole uden historie.', en: 'Thirty kroner. In silver. For a dress without a story.' } : [{ say: 'hulda', da: 'Sidsel. Godt. Så ved jeg, hvem der skylder.', en: 'Sidsel. Good. Then I know who owes.' }, { say: 'hulda', da: 'Femogtyve kroner. I sølv.', en: 'Twenty-five kroner. In silver.' }],
  { t: 'Hill folk do not haggle. They say a number once, and the number stays said.' },
], opts: [
  { tag: 'Sig', label: 'Accept', build: { prompt: 'That is a deal.', answers: [['Det', 'er', 'en', 'aftale']], extra: ['et', 'den'], punct: '.', rules: ['det-er'] },
    ok: [G => ({ kr: G.flags.lieH ? 30 : 25, why: 'sølv fra bjerget' }), G => ({ set: { sold: 'hulda', price: G.flags.lieH ? 30 : 25 } }), { n: 'The coins are cold and very slightly damp, and each one has a small mountain stamped on it.' }, { n: 'Hulda folds the dress over her arm like a sleeping child and walks away towards the hill.' }], next: 'middag' },
  { tag: 'Gå', label: 'Refuse. Hill silver brings bad luck', next: 'torv_hub', set: { goneH: 1 } },
] },

keep: { place: 'torv', time: 1, npcs: [], lines: [
  { t: 'You fold the dress back under your coat. It is cold, as if it were still wet. It is still wet.' },
  { set: { sold: 'kept', price: 0, kept: 1 } },
  { go: 'middag' },
] },

/* ======================= MIDDAG ======================= */
middag: { place: 'torv', time: 1, npcs: [], lines: [
  { time: 2 },
  { npcs: ['sidsel'] },
  { n: 'Middag. Sidsel is waiting on the church steps, exactly where you did not tell her to wait.' },
  G => G.flags.kept ? [
    { say: 'sidsel', da: 'Du har den stadig! Du skulle sælge den før middag!', en: 'You still have it! You were supposed to sell it before noon!' },
    G => G.mini.c1 && !G.mini.c1.bad || G.flags.paidScribe ? [{ say: 'sidsel', da: 'Det står i bogen, at du skulle sælge den. Fem kroner, eller jeg går til fogeden.', en: 'It stands in the book that you were to sell it. Five kroner, or I go to the bailiff.' }, { kr: -5, why: 'kontrakten er brudt' }] : [{ say: 'sidsel', da: 'Og bogen hjælper mig ikke. Blækket løb.', en: 'And the book does not help me. The ink ran.' }],
    { say: 'sidsel', da: 'Behold den så. Men den er ikke min mere. Hører du? Den er ikke min!', en: 'Keep it, then. But it is not mine any more. Do you hear? It is not mine!' },
    { t: 'She says it louder than she needs to. Not to you. To something listening.' },
  ] : [
    { say: 'sidsel', da: 'Nå? Er den solgt?', en: 'Well? Is it sold?' },
    G => ({ n: `You tell her: ${G.flags.price} kroner.` }),
    G => {
      const p = G.flags.price, mine = G.flags.inkBad ? Math.floor(p / 4) : G.flags.betterCut ? Math.round(p * 2 / 3) : Math.round(p / 2), give = p - mine;
      const out = [{ kr: -give, why: 'Sidsels del' }];
      if (G.flags.inkBad) out.unshift({ say: 'sidsel', da: 'Bogen siger ingenting. Så du får en fjerdedel.', en: 'The book says nothing. So you get a quarter.' }, { t: 'Should have written it properly. The ink always gets paid, one way or another.' });
      return out;
    },
    { say: 'sidsel', da: 'Godt. Så er den ikke min mere.', en: 'Good. Then it is not mine any more.' },
    { t: 'She says it like a prayer.' },
  ],
], opts: [
  { tag: 'Sig', label: 'Ask about Ellen', once: true, if: G => G.flags.knowsEllen, build: { prompt: 'Where is Ellen?', answers: [['Hvor', 'er', 'Ellen']], extra: ['hun', 'den'], punct: '?', rules: ['spoerg'] },
    ok: [{ say: 'sidsel', da: 'Ellen er rejst. Med en soldat. Alle ved det.', en: 'Ellen has left. With a soldier. Everybody knows that.' }, { t: 'Everybody knows it, and nobody believes it.' }] },
  { tag: 'Gå', label: 'Let her go', next: 'foged' },
] },

/* ======================= EFTERMIDDAG · fogeden ======================= */
foged: { place: 'torv', time: 2, npcs: [], lines: [
  { time: 3 },
  { npcs: ['foged'] },
  { n: 'Eftermiddag. The bailiff finds you, which is never good news.' },
  G => G.flags.sold === 'gertrud' ? { t: 'Herluf. Husband of Fru Gertrud, who is at this moment wearing your dress somewhere. Don\'t think about it.' } : { t: 'Herluf. Red coat, black hat, and a face like a closed door.' },
  { say: 'foged', da: 'Kragen. Du kender alle i Ravnsted. Jeg har arbejde til dig.', en: 'Kragen. You know everybody in Ravnsted. I have work for you.' },
  { say: 'foged', da: 'Møllerens datter, Ellen, er væk. Nogen så hende ved møllen med en mand.', en: 'The miller\'s daughter, Ellen, is gone. Somebody saw her at the mill with a man.' },
  { say: 'foged', da: 'Manden havde et par sorte handsker på. Find ham. Ti kroner.', en: 'The man was wearing a pair of black gloves. Find him. Ten kroner.' },
  { t: 'Black gloves. In Ravnsted, black dye costs more than a goat. Only one place sells it.' },
], opts: [
  { tag: 'Sig', label: 'Ask for more money', once: true, roll: { stat: 'handel', dc: 12 },
    build: { prompt: 'That is too little. (penge = money, uncountable)', answers: [['Det', 'er', 'for', 'lidt']], extra: ['meget', 'mange', 'den'], punct: '.', rules: ['for-adj'] },
    ok: [{ say: 'foged', da: 'Femten. Og ikke en krone mere.', en: 'Fifteen. And not one krone more.' }, { set: { pay2: 15 } }],
    fail: [{ say: 'foged', da: 'Ti. Eller jeg finder en anden krage.', en: 'Ten. Or I find another crow.' }] },
  { tag: 'Gå', label: 'Take the job, go to the dye works', next: 'farveri' },
] },

/* ======================= EFTERMIDDAG · farveriet ======================= */
farveri: { place: 'farveri', time: 3, npcs: ['bodil'], lines: [
  { n: 'Bodil\'s dye works. Three vats steaming red, yellow and blue, a barrel of white lime, and a back shelf of little bottles nobody asks about.' },
  { n: 'Bodil\'s hands are blue to the elbow. They have been blue for thirty years.' },
  { say: 'bodil', da: 'Kragen. Hvis du vil snakke, så arbejd. Jeg har tre ordrer og to hænder.', en: 'Kragen. If you want to talk, then work. I have three orders and two hands.' },
  { mini: { kind: 'dye', id: 'dye', orders: [
    { want: 'et orange tørklæde', mix: ['rød', 'gul'], name: ['orange', 'oranget', 'orangee'], ok: 'orange', noun: 'tørklæde', art: 'et', why: 'orange never changes: en orange hue, et orange tørklæde, orange sko.' },
    { want: 'nogle lyseblå handsker', mix: ['blå', 'hvid'], name: ['lyseblå', 'lyseblåt'], ok: 'lyseblå', noun: 'handsker', art: 'nogle', why: 'blå keeps no -e in the plural: nogle lyseblå handsker.' },
    { want: 'en lyserød kjole', mix: ['rød', 'hvid'], name: ['lyserød', 'lyserødt', 'lyserøde'], ok: 'lyserød', noun: 'kjole', art: 'en', why: 'en-word, singular: no ending. en lyserød kjole.' },
  ] } },
  G => G.mini.dye.score >= 2 ? { say: 'bodil', da: 'Godt. Du er ikke helt dum.', en: 'Good. You are not completely stupid.' } : { say: 'bodil', da: 'Nå. Du er bedre til at snakke end til at arbejde.', en: 'Well. You are better at talking than at working.' },
], opts: [
  { tag: 'Sig', label: 'Ask who bought black dye for gloves', once: true,
    build: { prompt: 'Who has bought black dye? (en farve)', answers: [['Hvem', 'har', 'købt', 'sort', 'farve']], extra: ['sorte', 'hvor', 'den'], punct: '?', rules: ['adj-en', 'har-koebt'], tip: 'farve is an en-word, and sort never takes -t anyway: sort farve.' },
    ok: [G => G.mini.dye.score >= 2 ? [
      { say: 'bodil', da: 'Sorte handsker … Ja. Én mand. I sidste uge.', en: 'Black gloves … Yes. One man. Last week.' },
      { say: 'bodil', da: 'Jeg siger ikke hans navn. Men han havde en grå kappe og en stribet hue på.', en: 'I won\'t say his name. But he was wearing a grey cloak and a striped cap.' },
      { set: { clueHue: 1 } }]
      : [{ say: 'bodil', da: 'En mand med en grå kappe. Mere siger jeg ikke.', en: 'A man with a grey cloak. I won\'t say more.' }, { t: 'Half a description. Half a man. It\'ll have to do.' }]] },
  { tag: 'Gør', label: 'Ask about the little bottles', once: true, ok: [
    { say: 'bodil', da: 'Farver til tøj. Og farver til mennesker.', en: 'Dyes for clothes. And dyes for people.' },
    { say: 'bodil', da: 'Den lille grønne flaske: sandhedsdråber. Tre dråber, og han lyver ikke. Én gang. Fem kroner.', en: 'The little green bottle: truth drops. Three drops, and he does not lie. Once. Five kroner.' }], set: { knowsDrops: 1 } },
  { tag: 'Køb', label: 'Buy the truth drops', cost: 5, once: true, if: G => G.flags.knowsDrops, ok: [{ say: 'bodil', da: 'Tre dråber. Ikke fire. Fire er noget andet.', en: 'Three drops. Not four. Four is something else.' }], set: { drops: 1 } },
  { tag: 'Gå', label: 'Go to the tavern at dusk', next: 'kro' },
] },


/* ======================= SKUMRING · kroen ======================= */
kro: { place: 'kro', time: 3, npcs: [], lines: [
  { time: 4 },
  { n: 'Skumring. Den Druknede Gås. Smoke, wet dogs, and men drinking to forget things they did on purpose.' },
  G => ({ t: G.flags.clueHue ? 'Somewhere in here: a grey cloak, a striped cap, black gloves.' : 'Somewhere in here: a grey cloak and black gloves. In Ravnsted, that is half the tavern.' }),
  { mini: { kind: 'spot', id: 'findJ', target: 'jens', say: G => G.flags.clueHue ? 'Han har en grå kappe, en stribet hue og et par sorte handsker på.' : 'Han har en grå kappe og et par sorte handsker på.', en: G => G.flags.clueHue ? 'He is wearing a grey cloak, a striped cap and a pair of black gloves.' : 'He is wearing a grey cloak and a pair of black gloves.', crowd: [
    { img: 'c_j0', name: 'jens', body: ['kappe', 'grå'], hat: ['hue', 'grå', 'stribet'], gloves: 'sort' },
    { img: 'c_j1', body: ['kappe', 'grå'], hat: ['hue', 'grå', 'ternet'], gloves: 'sort', onlyIf: 'clueHue' },
    { img: 'c_j2', body: ['kappe', 'brun'], hat: ['hue', 'grå', 'stribet'], gloves: 'sort' },
    { img: 'c_j3', body: ['kappe', 'grå'], hat: ['hue', 'rød', 'stribet'], gloves: 'brun' },
    { img: 'c_j4', body: ['jakke', 'grå'], hat: ['hue', 'sort'], gloves: 'sort' },
    { img: 'c_j5', body: ['kappe', 'blå'], hat: ['hue', 'grå', 'stribet'], gloves: 'hvid' },
  ] } },
  G => G.mini.findJ.ok ? { t: 'Him. The corner table. The only man in the room who keeps his gloves on to drink.' } : [{ set: { wary: 1 } }, { n: 'You picked the wrong man. He has the opinion that you should leave his table, and he expresses it with his ale.' }, { t: 'Wet, and wiser. The right one is in the corner, the only man who keeps his gloves on to drink. He saw all of it.' }],
  { npcs: ['jens'] },
  { n: 'Jens, the bailiff\'s son. Twenty years old, soft hands inside hard gloves.' },
  { say: 'jens', da: 'Hvad glor du på?', en: 'What are you staring at?' },
  { go: 'kro_table' },
] },

kro_table: { place: 'kro', time: 4, npcs: ['jens'], lines: [
  { t: 'He drinks. You wait. Somebody has to say something.' },
], opts: [
  { tag: 'Sig', label: 'Admire his gloves', once: true, roll: { stat: 'snak', dc: 11 },
    build: { prompt: 'What fine gloves! (handsker, plural)', answers: [['Sikke', 'nogle', 'flotte', 'handsker'], ['Sikke', 'nogle', 'sorte', 'handsker']], tiles: ['Sikke', 'en', 'et', 'nogle', 'flot', 'flotte', 'sort', 'sorte', 'handsker'], punct: '!', rules: ['sikke', 'adj-pl'], tip: 'Plural: nogle + adjective with -e.' },
    ok: [{ say: 'jens', da: 'De var dyre. Sort farve er dyr.', en: 'They were expensive. Black dye is expensive.' }, { t: 'And he would know where it is sold.' }, { set: { slipJ: 1 } }],
    fail: [{ say: 'jens', da: 'Gå hjem, Krage.', en: 'Go home, Crow.' }] },
  { tag: 'Sig', label: 'Ask where he bought them', once: true, roll: { stat: 'oeje', dc: 11 },
    build: { prompt: 'Where did you buy them? (the gloves: plural)', answers: [['Hvor', 'har', 'du', 'købt', 'dem', 'henne'], ['Hvor', 'har', 'du', 'købt', 'dem']], extra: ['den', 'det', 'de'], punct: '?', rules: ['pron-dem', 'hvor-henne'], tip: 'Plural things as object: dem (not de).' },
    ok: [{ say: 'jens', da: 'Det rager ikke dig.', en: 'That is none of your business.' }, { n: 'But while he says it, you look down. Mud on his boots. Marsh mud, black and fat, with a reed caught in the laces.' }, { set: { mudJ: 1 } }],
    fail: [{ say: 'jens', da: 'Hvorfor spørger du om mine handsker?', en: 'Why are you asking about my gloves?' }] },
  { tag: 'Gør', label: 'Tip three drops into his ale', once: true, if: G => G.flags.drops, next: 'kro_drops' },
  { tag: 'Gå', label: 'Wait for him to make you an offer', if: G => G.flags.slipJ || G.flags.mudJ || G.flags.truthJ, next: 'kro_bribe' },
  { tag: 'Gå', label: 'Leave him. Go to the scribe', next: 'review' },
] },

kro_drops: { place: 'kro', time: 4, npcs: ['jens'], lines: [
  { n: 'Three drops. Not four. He drinks. His face goes the colour of old snow.' },
  { say: 'jens', da: 'Jeg var ved møllen. Hun gik ud i mosen. Jeg … fulgte efter hende.', en: 'I was at the mill. She walked into the marsh. I … followed her.' },
  { say: 'jens', da: 'Der var lys i mosen. Små lys. De dansede.', en: 'There were lights in the marsh. Small lights. They danced.' },
  { t: 'He stops, as if someone cold had put a hand over his mouth.' },
  { set: { truthJ: 1, drops: 0 } }, { go: 'kro_table' },
] },

kro_bribe: { place: 'kro', time: 4, npcs: ['jens'], lines: [
  { n: 'Jens looks at the door, then at you, then at the purse on his belt.' },
  G => G.flags.wary ? { say: 'jens', da: 'Hør her, Krage. Tyve kroner. Du har ikke set mig.', en: 'Listen, Crow. Twenty kroner. You haven\'t seen me.' } : { say: 'jens', da: 'Hør her, Krage. Tredive kroner. Du har ikke set mig.', en: 'Listen, Crow. Thirty kroner. You haven\'t seen me.' },
  G => ({ t: G.flags.wary ? 'Twenty. He saw you pick the wrong man first. Clumsy crows get paid less.' : G.flags.pay2 ? 'Thirty kroner. Twice what his father pays. Family is expensive.' : 'Thirty kroner. Three times what his father pays. Family is expensive.' }),
], opts: [
  { tag: 'Køb', label: 'Take the money', next: 'review', ok: [G => ({ kr: G.flags.wary ? 20 : 30, why: 'Jens betaler' }), { set: { bribe: 1 } }, { t: 'The coins are warm from his belt. The warm ones always cost more.' }] },
  { tag: 'Sig', label: 'Say no', next: 'review', build: { prompt: 'No. I can\'t.', answers: [['Nej', 'det', 'kan', 'jeg', 'ikke']], extra: ['vil', 'er', 'den'], punct: '.', rules: ['kort-svar'] },
    ok: [{ say: 'jens', da: 'Så er du dum, Krage.', en: 'Then you are stupid, Crow.' }, { set: { refusedBribe: 1 } }] },
] },

/* ======================= SKUMRING → NAT · ved lyset ======================= */
review: { place: 'loft', time: 4, npcs: [], lines: [
  { n: 'Back in the loft, a stub of tallow candle. You count coins and count the words of the day, in that order.' },
  { mini: { kind: 'review', id: 'rev' } },
  { time: 5 },
  { go: 'nat' },
] },

/* ======================= NAT · skriverens bod ======================= */
nat: { place: 'skriver', time: 5, npcs: ['absalon', 'foged'], lines: [
  { n: 'Nat. The scribe never sleeps, or never admits it. The bailiff is there too, holding his hat like a dead bird.' },
  { say: 'foged', da: 'Nå, Kragen? Har du fundet ham?', en: 'Well, Kragen? Have you found him?' },
], opts: [
  { tag: 'Gør', label: 'Write the man\'s description in the book', next: 'nat_written', mini: { kind: 'ledger', id: 'c2', title: 'Vidne', items: [
    { pre: 'Manden har en', post: 'kappe,', opts: ['grå', 'gråt'], ok: 'grå', rule: 'adj-en', why: 'en-word: grå. (et gråt tørklæde, grå sko)' },
    { pre: 'en', post: 'hue', opts: ['stribet', 'stribede'], ok: 'stribet', rule: 'adj-et-ending', why: 'en-word, singular: stribet. Plural would be stribede.' },
    { pre: 'og et par', post: 'handsker på.', opts: ['sort', 'sorte'], ok: 'sorte', rule: 'adj-pl', why: 'et par handsker: handsker is plural, so sorte.' },
  ] } },
  { tag: 'Lyv', label: 'Say you found nobody', if: G => !G.flags.refusedBribe, roll: { stat: 'loegn', dc: 12 }, next: 'mose',
    build: { prompt: 'No. I haven\'t found him.', answers: [['Nej', 'jeg', 'har', 'ikke', 'fundet', 'ham'], ['Nej', 'det', 'har', 'jeg', 'ikke'], ['Nej', 'jeg', 'fandt', 'ham', 'ikke'], ['Nej', 'ham', 'har', 'jeg', 'ikke', 'fundet']], tiles: ['Nej', 'jeg', 'har', 'ikke', 'fundet', 'ham', 'han', 'det', 'fandt'], punct: '.', rules: ['kort-svar', 'pron-ham'], tip: 'ham is the object form of han.' },
    ok: [{ say: 'foged', da: 'Ingen? Så får du ingenting.', en: 'Nobody? Then you get nothing.' }, { say: 'absalon', da: 'Bogen husker også det, du ikke skriver, Kragen.', en: 'The book also remembers what you do not write, Kragen.' }, { set: { silent: 1 } }],
    fail: [{ say: 'foged', da: 'Du lugter af kro og løgn. Ti kroner for min tid. Ud!', en: 'You smell of tavern and lies. Ten kroner for my time. Out!' }, { kr: -10, why: 'fogeden tager' }, { set: { silent: 1, sniffed: 1 } }] },
] },

nat_written: { place: 'skriver', time: 5, npcs: ['absalon', 'foged'], lines: [
  G => G.mini.c2.bad ? [
    { n: 'The ink runs. A grey smear where a man should be.' },
    { say: 'absalon', da: 'Blækket løber. Bogen ser ikke nogen mand.', en: 'The ink runs. The book sees no man.' },
    { say: 'foged', da: 'Så har du ingenting. Og jeg har ingenting.', en: 'Then you have nothing. And I have nothing.' },
    { set: { silent: 1, inkBad2: 1 } }]
    : [
    { n: 'The ink sinks in. Absalon turns the book so the bailiff can read it. He reads it twice.' },
    { say: 'foged', da: 'En grå kappe … en stribet hue … Det er Jens\' tøj.', en: 'A grey cloak … a striped cap … Those are Jens\' clothes.' },
    { say: 'absalon', da: 'Bogen lyver ikke, foged.', en: 'The book does not lie, bailiff.' },
    { n: 'For a long moment Herluf is not a bailiff, only a father. Then he puts his hat back on.' },
    G => ({ kr: G.flags.pay2 || 10, why: 'fogeden betaler' }),
    { set: { reported: 1 } }],
  { go: 'mose' },
] },

/* ======================= MIDNAT · mosen ======================= */
mose: { place: 'mose', time: 5, npcs: [], lines: [
  { time: 6 },
  { n: 'Midnat. You did not decide to walk to the marsh. Your feet did.' },
  { n: 'Lygtemænd bob over the black water, polite as waiters.' },
  { npcs: ['mosekonen'] },
  { n: 'Something rises from the reeds: an old woman made of steam and peat, with two red coals for eyes. The mosekone.' },
  { say: 'mosekonen', da: 'Krage. Du har båret min kjole i dag.', en: 'Crow. You have carried my dress today.' },
  { say: 'mosekonen', da: 'Svar mig. Ærligt. Mosen kan høre løgn.', en: 'Answer me. Honestly. The marsh can hear lies.' },
  { say: 'mosekonen', da: 'Hvad har du på i nat?', en: 'What are you wearing tonight?' },
  { t: 'Not Kragen\'s clothes. Yours. The ones you are wearing right now, wherever you are, holding this.' },
], opts: [
  { tag: 'Sig', label: 'Tell her what you are wearing (really)', next: 'mose2', build: { kind: 'wear', prompt: 'I am wearing … (one thing you really have on)' } },
] },

mose2: { place: 'mose', time: 6, npcs: ['mosekonen'], lines: [
  G => ({ say: 'mosekonen', da: `${G.wear.da}. Hvor har du købt ${G.wear.pron} henne?`, en: `${G.wear.en}. Where did you buy ${G.wear.pron === 'dem' ? 'them' : 'it'}?` }),
], opts: [
  { tag: 'Sig', label: 'Tell her where you bought it', next: 'mose3', build: { kind: 'where', prompt: 'I bought it … (den / det / dem must match)' } },
] },

mose3: { place: 'mose', time: 6, npcs: ['mosekonen'], lines: [
  G => { const w = G.where || ''; return /loppemarked|genbrugsbutik/.test(w) ? { say: 'mosekonen', da: 'Brugt tøj. Så har en anden båret det før dig. Ligesom min kjole.', en: 'Second-hand clothes. So someone else wore them before you. Like my dress.' }
    : /af /.test(w) ? { say: 'mosekonen', da: 'En gave. Gaver er de farligste ting, man kan få.', en: 'A gift. Gifts are the most dangerous things one can get.' }
    : w ? { say: 'mosekonen', da: 'Nyt tøj. Det lugter ikke af nogen endnu.', en: 'New clothes. They do not smell of anybody yet.' }
    : { say: 'mosekonen', da: 'Du taler ikke dansk til mig. Men mosen forstår alligevel.', en: 'You do not speak Danish to me. But the marsh understands anyway.' }; },
  G => ({
    gertrud: [{ say: 'mosekonen', da: 'Fru Gertrud har min kjole nu. Så kommer Fru Gertrud til mig.', en: 'Fru Gertrud has my dress now. So Fru Gertrud comes to me.' }, { n: 'In the morning, one side of the bailiff\'s bed is wet and empty. A green dress lies in the reeds. Nobody in Ravnsted says the word marsh for a week.' }, { end: 'seng' }],
    mads: [{ say: 'mosekonen', da: 'Kludekræmmeren har den. Han tager alt. Nu tager jeg ham.', en: 'The rag dealer has it. He takes everything. Now I take him.' }, { n: 'Mads Klud\'s stall stands there next week, and the week after. Mads doesn\'t. Nobody looks very hard for a rag dealer.' }, { end: 'klud' }],
    hulda: G.flags.lieH ? [{ say: 'mosekonen', da: 'Bjergfolket har den. Dem kan jeg ikke tage. Og de ved ikke, hvem der solgte den først.', en: 'The hill folk have it. Them I cannot take. And they do not know who sold it first.' }, { say: 'mosekonen', da: 'Så skylder du mig, Krage. En dag kommer jeg efter det.', en: 'So you owe me, Crow. One day I will come for it.' }, { n: 'You walk home with wet feet. They stay wet for a week, whatever you do.' }, { end: 'soelv' }]
      : [{ say: 'mosekonen', da: 'Bjergfolket har den. Dem kan jeg ikke tage.', en: 'The hill folk have it. Them I cannot take.' }, { say: 'mosekonen', da: 'Så tager jeg den, der solgte den først.', en: 'So I take the one who sold it first.' }, { n: 'The mill wheel stops turning that night. Sidsel\'s grey cloak hangs on it in the morning, wet to the shoulders.' }, { end: 'soelv' }],
    kept: [{ say: 'mosekonen', da: 'Du har den stadig. Giv mig den.', en: 'You still have it. Give it to me.' }, { n: 'You hold the red dress over the black water and let go. It sinks without a ripple.' }, { say: 'mosekonen', da: 'Ellen gik selv. Hun var træt af møllen. Her er hun ikke træt.', en: 'Ellen went by herself. She was tired of the mill. Here she is not tired.' }, { end: 'mosen' }],
  })[G.flags.sold],
] },

  },
};

/* What the ending screen says about contract 2, and its name. Spoilers. */
const ENDINGS = {
  seng: { title: 'Den våde seng', en: 'You sold the dress to the bailiff\'s wife.' },
  klud: { title: 'Kludekræmmerens sidste handel', en: 'You sold the dress to the rag dealer.' },
  soelv: { title: 'Sølv fra bjerget', en: 'You sold the dress to the hill.' },
  mosen: { title: 'Mosen får sit', en: 'You gave the dress back.' },
  bogen: { title: 'Bogen lyver ikke', en: 'The book named the man in black gloves.' },
  tredive: { title: 'Tredive kroner', en: 'You took the money and kept quiet.' },
  tavs: { title: 'Ingen i bogen', en: 'Nobody was named.' },
};
const ending2 = G => G.flags.reported ? 'bogen' : G.flags.bribe ? 'tredive' : 'tavs';
const EPILOGUE2 = {
  bogen: G => (G.flags.truthJ ? 'Jens tells the court what he told your ale: the lights, the reeds, a girl walking in. ' : '') + 'By morning Jens is in the stocks. His father does not look at him, or at you.' + (G.flags.bribe ? ' Jens\' thirty kroner are still in your pocket. They feel heavier.' : ''),
  tredive: G => 'Thirty kroner. Jens buys new gloves. Grey ones.',
  tavs: G => G.flags.inkBad2 ? 'The book saw no man, so there was no man. The bailiff stops asking.' : 'The bailiff stops asking. The book remembers anyway.',
};

/* ---------- this session as the engine sees it (3.3 lives in story33.js) ---------- */
Object.assign(SESSION, {
  num: '3.2', times: TIMES, lore: LORE, endText: ENDINGS, ending2, epilogue2: EPILOGUE2,
  music: { title: 'title', 0: 'daggry', 1: 'torv', 2: 'torv', 3: 'eftermiddag', 4: 'skumring', 5: 'nat', 6: 'midnat', end: 'slut' },
  // sample states for the tools (lint, speech): every flag that changes a line, both ways, and mixed
  samples() {
    const base = [];
    for (const sold of ['gertrud', 'mads', 'hulda', 'kept']) for (const v of [0, 1]) base.push({ flags: { sold, price: 20, betterCut: v, inkBad: v, kept: sold === 'kept' ? 1 : 0, askedWhere: v, inspected: v, lieH: v, clueHue: v, pay2: v ? 15 : 0, truthJ: v, bribe: v, reported: v, inkBad2: v, warmG: v, lieG: v, lieGfail: v, truthG: v, warmM: v, knowsEllen: v, paidScribe: v, wary: v, caught: v }, kr: 10,
      mini: { c1: { bad: !!v }, c2: { bad: !!v }, dress: { found: v ? 3 : 1 }, findG: { ok: !!v }, findJ: { ok: !!v }, dye: { score: v ? 3 : 1 }, saleG: { walked: !!v, price: 30 }, saleM: { walked: !!v, price: 12 } }, wear: { da: 'En rød trøje', en: 'A red sweater', pron: 'den' }, lastBuilt: null, where: '' });
    const out = [...base];
    for (let i = 0; i < base.length; i += 2) { out.push(Object.assign({}, base[i], { mini: base[i + 1].mini })); out.push(Object.assign({}, base[i + 1], { mini: base[i].mini })); }
    [['sikke', 'en', 'smuk', 'kjole'], ['sikke', 'et', 'smukt', 'tørklæde'], ['sikke', 'nogle', 'smukke', 'sko']].forEach(lb => out.push(Object.assign({}, base[0], { lastBuilt: lb })));
    ['jeg har købt den på et loppemarked', 'jeg har fået den af min mor', 'jeg har købt den i en butik', ''].forEach(w => out.push(Object.assign({}, base[0], { where: w })));
    for (const n of Object.keys(WEAR_NOUNS)) for (const c of Object.keys(COLORS)) { const W = wearOf(n, c); out.push(Object.assign({}, base[0], { wear: { da: W.da, en: W.en, pron: W.pron, n: W.n } })); }
    return out;
  },
});
