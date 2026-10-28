/* =========================================================================
   RAVNSTED · Kapitel 3.3 · "Dødsboet"
   SPOILERS: this file holds the whole plot. Do not quote it to Bruno.
   Same step and option format as story.js. One night: Skumring → Aften → Midnat → Ulvetimen → Hanegal.
   The dead stay in their house until their things are shared, and they hear the definite form.
   G.flags.lys is the dead man's patience (candles, 0..5): wrong endings and rude reactions put candles out.
   ========================================================================= */

Object.assign(NPCS, {
  provst: { name: 'Provst Bertel', role: 'præsten' },
  agnete: { name: 'Agnete', role: 'skriverens niece' },
  tove: { name: 'Gamle Tove', role: 'dødningekræmmer' },
  genfaerd: { name: 'Absalon', role: 'den døde' },
});

const SESSION33 = (() => {
  const lys = n => ({ lys: n });  // a step that changes the candles (see engine: st.lys)
  const prev = (G, e) => G.prev && (G.prev.e1 === e || G.prev.e2 === e);

  /* the estate. Card images are the woodcut objects in img/. */
  const THINGS = {
    laenestol: { da: 'den grønne lænestol', img: 'o_laenestol', g: 'en' },
    kommode: { da: 'den lille blå kommode', img: 'o_kommode_lille_blaa', g: 'en' },
    bord: { da: 'det gamle runde bord', img: 'o_bord_gammelt_rundt', g: 'et' },
    taeppe: { da: 'det ternede tæppe', img: 'o_taeppe_ternet', g: 'et' },
    skab: { da: 'det lille grå skab', img: 'o_skab_lille_graat', g: 'et' },
    stole: { da: 'de små stole', img: 'o_stole_smaa', g: 'pl' },
    hylder: { da: 'de gule hylder', img: 'o_hylder_gule', g: 'pl' },
    puder: { da: 'de stribede puder', img: 'o_puder_stribede', g: 'pl' },
    storkommode: { da: 'den store blå kommode', img: 'o_kommode_stor_blaa', g: 'en' },
    gardiner: { da: 'de lækre røde gardiner', img: 'o_gardiner_roede', g: 'pl' },
    storskab: { da: 'det store grå skab', img: 'o_skab_stort_graat', g: 'et' },
    lampe: { da: 'den hvide lampe', img: 'o_lampe_hvid', g: 'en' },
  };
  // Agnete's real taste, best first. The labels are the five ways the book grades liking.
  const AGNETE = [['hylder', 'kan bedst lide'], ['puder', 'er vild med'], ['kommode', 'kan godt lide'], ['lampe', 'kan ikke så godt lide'], ['laenestol', 'kan ikke lide']];

  const nodes = {

/* ======================= SKUMRING · gaden ======================= */
gade: { place: 'gade33', time: 0, npcs: [], lines: [
  { n: 'Skumring. Three days after the red dress.' },
  G => prev(G, 'seng') ? { t: 'Fru Gertrud\'s side of the bailiff\'s bed is still empty. Herluf has started wearing his hat indoors.' }
    : prev(G, 'klud') ? { t: 'Mads Klud\'s stall still stands in the square. Nobody dares take the checked cap from its nail.' }
    : prev(G, 'soelv') ? { t: 'The hill silver in your pocket is still damp. It will always be damp.' }
    : prev(G, 'mosen') ? { t: 'Your feet are finally dry. The marsh has kept its word. So far.' }
    : { t: 'Three kroner, a crow\'s name and no plans. The usual.' },
  { n: 'The bell of Sankt Olai rings for the dead. In Ravnsted it rings slower for the dead, so they can keep up.' },
  { n: 'A bundle of straw is tied to the scribe\'s door. That is how Ravnsted says it: somebody in here has stopped.' },
  { npcs: ['provst'] },
  { say: 'provst', da: 'Kragen. Absalon skriveren er død. I går nat.', en: 'Kragen. Absalon the scribe is dead. Last night.' },
  { say: 'provst', da: 'Hans ting skal deles før hanegal. Ellers bliver han i huset.', en: 'His things must be shared out before cockcrow. Otherwise he stays in the house.' },
  { t: 'In Ravnsted the dead are patient. They sit in their chairs while the living argue about the chairs.' },
  { say: 'provst', da: 'Ingen vil gå derind. Jeg giver dig ti kroner. Og tyve mere, hvis han er gået ved hanegal.', en: 'Nobody will go in. I\'ll give you ten kroner. And twenty more if he is gone by cockcrow.' },
], opts: [
  { tag: 'Sig', label: 'Ask why nobody will go in', once: true,
    build: { prompt: 'Why will nobody go in there?', answers: [['Hvorfor', 'vil', 'ingen', 'gå', 'derind']], extra: ['går', 'ikke', 'derinde'], punct: '?', rules: ['spoerg'], tip: 'Question word, then the modal verb: Hvorfor vil ingen … ? Direction: derind (movement), not derinde.' },
    ok: [{ say: 'provst', da: 'Fordi han lytter. De døde hører alt, hvad vi siger om deres ting.', en: 'Because he listens. The dead hear everything we say about their things.' },
      { say: 'provst', da: 'Og Absalon hørte altid efter ordene. Hver eneste endelse.', en: 'And Absalon always listened to the words. Every single ending.' },
      { t: 'A dead man who corrects your grammar. Ravnsted, you never disappoint.' }] },
  { tag: 'Sig', label: 'Haggle: the house is far too big for ten kroner', once: true, roll: { stat: 'handel', dc: 12 },
    build: { prompt: 'The house is far too big for ten kroner. (et hus)', answers: [['Huset', 'er', 'alt', 'for', 'stort', 'til', 'ti', 'kroner']], extra: ['stor', 'store', 'meget'], punct: '.', rules: ['adj-er', 'for-adj'], tip: 'Huset is an et-word. After er the adjective agrees with it: stort.' },
    ok: [{ say: 'provst', da: 'Femten, så. Og tyve ved hanegal. Kirken er ikke rig, Kragen.', en: 'Fifteen, then. And twenty at cockcrow. The church is not rich, Kragen.' }, { t: 'The church owns half the fields in Ravnsted. But fine.' }, { set: { pay: 15 } }],
    fail: [{ say: 'provst', da: 'Ti. Den døde betaler ikke mere end den levende.', en: 'Ten. The dead pay no more than the living.' }] },
  { tag: 'Gå', label: 'Take the job. Go in', next: 'stue', ok: [G => ({ kr: G.flags.pay || 10, why: 'provsten betaler' })] },
] },

/* ======================= SKUMRING · stuen ======================= */
stue: { place: 'stue', time: 0, npcs: [], lines: [
  { n: 'Inside it smells of ink, tallow and something that has stopped.' },
  { n: 'The coffin stands on two trestles in the middle of the room, lid closed. Next to it, an old green armchair turned towards the coffin, as if waiting for a conversation.' },
  { t: 'The armchair is empty. You check twice.' },
  { npcs: ['agnete'] },
  { n: 'A woman in a black veil is counting the spoons.' },
  { say: 'agnete', da: 'Er du Kragen? Godt. Jeg er Agnete. Hans niece. Hans eneste familie.', en: 'Are you Kragen? Good. I am Agnete. His niece. His only family.' },
  { say: 'agnete', da: 'Jeg vil have det hele solgt før hanegal. Huset er alt for koldt, og jeg har en søn, der er sulten.', en: 'I want it all sold before cockcrow. The house is far too cold, and I have a son who is hungry.' },
  { npcs: ['agnete', 'foged'] },
  { n: 'The door again. Red cloak, black hat: Herluf, the bailiff.' },
  G => prev(G, 'seng') ? { t: 'Since his wife walked into the marsh, Herluf has looked like a man carrying water in his hands.' }
    : prev(G, 'bogen') ? { t: 'His son sat in the stocks because of your ink. He does not look at you. That is a kind of looking too.' }
    : prev(G, 'tredive') ? { t: 'His son\'s thirty kroner are long spent. Herluf does not know that. Probably.' } : [],
  { say: 'foged', da: 'Den sorte bog tilhører byen. Den tager jeg.', en: 'The black book belongs to the town. I am taking it.' },
  { say: 'agnete', da: 'Bogen er min. Alt her er mit.', en: 'The book is mine. Everything here is mine.' },
  { say: 'agnete', da: 'Og han skrev sit testamente i bogen. Den ligger oppe på loftet. Ved den hvide lampe.', en: 'And he wrote his will in the book. It is up in the attic. By the white lamp.' },
  { t: 'A scribe who wrote his will in the book that makes things true. Of course he did.' },
  { say: 'agnete', da: 'Jeg kan ikke lide den grønne lænestol. Den er simpelthen grim.', en: 'I don\'t like the green armchair. It is simply ugly.' },
], opts: [
  { tag: 'Sig', label: 'Agree: you don\'t like it either', once: true, if: G => !G.flags.chair,
    build: { prompt: 'I don\'t either. (agree with something negative)', answers: [['Det', 'kan', 'jeg', 'heller', 'ikke']], extra: ['også', 'er', 'gør'], punct: '.', rules: ['ogsaa-heller'], tip: 'She said something negative (kan ikke lide), so agree with heller ikke, and repeat her verb: kan.' },
    ok: [{ n: 'The armchair creaks. Nobody is sitting in it.' }, { t: 'Nobody you can see.' }, lys(-1), { set: { chair: 'insult' } }] },
  { tag: 'Sig', label: 'React with surprise', once: true, if: G => !G.flags.chair,
    build: { prompt: 'Don\'t you?! (surprised, short answer)', answers: [['Kan', 'du', 'ikke']], extra: ['det', 'er', 'gør'], punct: '?!', rules: ['reakt'], tip: 'Repeat her verb as a question. She said kan ikke, so: Kan du ikke?!' },
    ok: [{ say: 'agnete', da: 'Nej! Den er grøn som mos. Hvem har en grøn lænestol?', en: 'No! It is green like moss. Who has a green armchair?' }, { n: 'The armchair settles, the way an old man settles when somebody takes his side.' }, lys(1), { set: { chair: 'defend' } }] },
  { tag: 'Sig', label: 'Ask the bailiff why he wants the black book', once: true,
    build: { prompt: 'Why do you want the black book?', answers: [['Hvorfor', 'vil', 'du', 'have', 'den', 'sorte', 'bog']], extra: ['sort', 'det', 'bogen'], punct: '?', rules: ['adj-def', 'spoerg'], tip: 'After den the adjective takes -e: den sorte bog. And the noun stays without -en.' },
    ok: [{ say: 'foged', da: 'Fordi der står ting i den om alle i Ravnsted.', en: 'Because there are things written in it about everybody in Ravnsted.' }, { say: 'foged', da: 'Også om mig.', en: 'Also about me.' }, { t: 'Especially about you, from the way you hold your hat.' }, { set: { askedFoged: 1 } }] },
  { tag: 'Gør', label: 'Lift the coffin lid an inch', once: true, roll: { stat: 'oeje', dc: 11 },
    ok: [{ n: 'Absalon lies with his hands folded, a quill between his fingers like a flower. You keep your eyes on the hands.' }, { n: 'His fingertips are not stained with ink. They glow, very faintly, green. Like marsh light.' }, { t: 'Forty years of reading by that lamp. Something rubbed off.' }, { set: { greenFingers: 1 } }],
    fail: [{ n: 'The lid is heavier than it looks. Or something is holding it down from the inside. You decide not to find out which.' }] },
  { tag: 'Gå', label: 'Climb up to the attic', next: 'loft' },
] },

/* ======================= AFTEN · loftet ======================= */
loft: { place: 'loftet', time: 0, npcs: [], lines: [
  { time: 1 },
  { n: 'Aften. The attic ladder complains about every rung.' },
  { n: 'Absalon\'s things sleep under grey sheets. In the middle of the floor, on a stool, a white lamp is burning. There is no oil in it.' },
  { t: 'A lamp without oil. A town without honest people. Both somehow keep going.' },
  { n: 'Beside the lamp lies the black book, open at his will. Half the words have lost their endings, as if he died between two letters.' },
  { mini: { kind: 'ledger', id: 'test', title: 'Testamentet', items: [
    { pre: 'Den', post: 'lænestol skal brændes.', opts: ['grøn', 'grønne', 'grønt'], ok: 'grønne', rule: 'adj-def', why: 'After den the adjective takes -e: den grønne lænestol.' },
    { pre: 'Det', post: 'runde bord skal tilbage til kirken.', opts: ['gammel', 'gamle', 'gammelt'], ok: 'gamle', rule: 'adj-def-irr', why: 'gammel loses an e before the ending: det gamle bord.' },
    { pre: 'Mit', post: 'tæppe skal i graven med mig.', opts: ['ternet', 'ternede', 'ternete'], ok: 'ternede', rule: 'adj-def-poss', why: 'After mit the adjective takes the e-form, and -et becomes -ede: mit ternede tæppe.' },
    { pre: 'De', post: 'stole skal sælges på markedet.', opts: ['lille', 'små', 'lilles'], ok: 'små', rule: 'adj-def-irr', why: 'lille has its own plural: de små stole.' },
    { pre: 'Den lille', post: 'kommode skal til Agnetes søn.', opts: ['blå', 'blåe', 'blåt'], ok: 'blå', rule: 'adj-def-irr', why: 'blå and grå never take -e: den lille blå kommode.' },
    { pre: 'Det lille', post: 'skab skal på bålet. Ingen må læse brevene.', opts: ['grå', 'gråe', 'gråt'], ok: 'grå', rule: 'adj-def-irr', why: 'grå never takes -e: det lille grå skab.' },
  ] } },
  G => G.mini.test.mistakes === 0 ? [{ n: 'Every word drinks its ending. Somewhere below you, an armchair creaks with pleasure.' }, lys(1)]
    : G.mini.test.mistakes >= 3 ? [{ n: 'The ink runs before it sinks in. Downstairs, a door slams by itself.' }, lys(-1)] : [],
  { n: 'The last line stops in the middle: "Min sorte bog skal til …"' },
  { t: 'Til whom, Absalon? You died one word too early.' },
  { t: 'Now the will names five things. They are all up here, somewhere under the sheets, between their cousins.' },
  { mini: { kind: 'find', id: 'find', rounds: [
    { da: 'den lille blå kommode', ok: 'o_kommode_lille_blaa', others: ['o_kommode_stor_blaa', 'o_kommode_lille_roed'] },
    { da: 'det gamle runde bord', ok: 'o_bord_gammelt_rundt', others: ['o_bord_nyt_rundt', 'o_bord_gammelt_firkantet'] },
    { da: 'det ternede tæppe', ok: 'o_taeppe_ternet', others: ['o_taeppe_stribet', 'o_taeppe_prikket'] },
    { da: 'det lille grå skab', ok: 'o_skab_lille_graat', others: ['o_skab_stort_graat', 'o_skab_lille_hvidt'] },
    { da: 'de små stole', ok: 'o_stole_smaa', others: ['o_stole_store', 'o_stol_lille'] },
  ] } },
  G => G.mini.find.wrong >= 2 ? [{ n: 'Every wrong sheet you lift, something sighs in the dark. Twice it sounds like a name.' }, lys(-1)] : [],
  { npcs: ['hulda'] },
  { n: 'The roof hatch opens. Somebody too tall folds herself in through it, bare feet first.' },
  G => prev(G, 'soelv') ? { say: 'hulda', da: 'Krage. Du solgte mig en kjole. Nu køber jeg en lampe.', en: 'Crow. You sold me a dress. Now I am buying a lamp.' }
    : { say: 'hulda', da: 'Krage. Jeg har set dig på torvet. Du taler med alle.', en: 'Crow. I have seen you in the square. You talk to everybody.' },
  { say: 'hulda', da: 'Den hvide lampe er vores. Han lånte den af bjerget for fyrre år siden.', en: 'The white lamp is ours. He borrowed it from the hill forty years ago.' },
  { say: 'hulda', da: 'Giv mig den før hanegal, og du får sølv.', en: 'Give it to me before cockcrow, and you get silver.' },
  { t: 'Hill folk do not lie. They say true things in an order that suits them.' },
], opts: [
  { tag: 'Sig', label: 'Ask what is in the white lamp', once: true,
    build: { prompt: 'What is in the white lamp?', answers: [['Hvad', 'er', 'der', 'i', 'den', 'hvide', 'lampe']], extra: ['hvid', 'det', 'lampen'], punct: '?', rules: ['adj-def'], tip: 'den + hvide + lampe: after den the adjective takes -e, and lampe stays without -n.' },
    ok: [{ say: 'hulda', da: 'En lygtemand. En mand, der flyttede en skelsten.', en: 'A will-o\'-the-wisp. A man who moved a boundary stone.' },
      { say: 'hulda', da: 'Nu skal han lyse, til nogen siger sandheden om ham.', en: 'Now he must give light until somebody tells the truth about him.' },
      { t: 'The oldest crime in Danish fields: moving the stone at night, a little at a time. They say the guilty walk the marshes forever, carrying a light.' },
      { say: 'hulda', da: 'Lampen kan ikke lyve. Derfor var bogen sand.', en: 'The lamp cannot lie. That is why the book was true.' }, { set: { knowsLamp: 1 } }] },
  { tag: 'Gør', label: 'Look into the flame', once: true, roll: { stat: 'oeje', dc: 12 },
    ok: [{ n: 'In the flame, small as a beetle, a man is walking. Always walking. He carries a stone on his back.' }, { n: 'He stops and points: down through the floor, through the town, towards the bailiff\'s fields below the hill.' }, { set: { sawStone: 1 } }],
    fail: [{ n: 'A flame is a flame. It burns a green spot into your eyes that follows you down the ladder.' }] },
  { tag: 'Sig', label: 'Promise Hulda the lamp', once: true, if: G => !G.flags.promised,
    build: { prompt: 'I will give it to you. I promise. (den = the lamp)', answers: [['Jeg', 'skal', 'nok', 'give', 'dig', 'den'], ['Den', 'skal', 'jeg', 'nok', 'give', 'dig']], extra: ['det', 'dem', 'vil'], punct: '.', rules: ['skal-nok', 'pron-den'], tip: 'A promise: skal nok + infinitive. Lampe is an en-word: den.' },
    ok: [{ say: 'hulda', da: 'Det står ikke i bogen. Men jeg husker det.', en: 'That is not written in the book. But I remember it.' }, { set: { promised: 'hulda' } }] },
  { tag: 'Gå', label: 'Take the black book down to the living room', next: 'genfaerd' },
] },

/* ======================= AFTEN · genfærdet ======================= */
genfaerd: { place: 'stue', time: 1, npcs: [], lines: [
  { n: 'The living room is dark. In the kitchen Agnete and Herluf argue about spoons and justice, in that order.' },
  { npcs: ['genfaerd'] },
  { n: 'The green armchair is not empty any more. A shape sits in it, darker than the dark, two pale points where the eyes should be.' },
  G => G.flags.chair === 'insult' ? { say: 'genfaerd', da: 'Du kan ikke lide min grønne lænestol, hørte jeg.', en: 'You don\'t like my green armchair, I heard.' }
    : G.flags.chair === 'defend' ? { say: 'genfaerd', da: 'Du forsvarede min grønne lænestol. Tak.', en: 'You defended my green armchair. Thank you.' } : [],
  G => G.mini.test.mistakes === 0 ? { say: 'genfaerd', da: 'Kragen. Du skrev mit testamente rigtigt. Hver eneste endelse.', en: 'Kragen. You wrote my will correctly. Every single ending.' }
    : { say: 'genfaerd', da: 'Kragen. Du skriver dårligt. Men du hører godt.', en: 'Kragen. You write badly. But you listen well.' },
  { say: 'genfaerd', da: 'Sæt dig. Vi skal tale om mine ting. Jeg er ikke færdig med dem endnu.', en: 'Sit down. We must talk about my things. I am not finished with them yet.' },
  { t: 'You sit on the coffin. It seems rude, but there is nowhere else.' },
  { mini: { kind: 'ghost', id: 'ghost', lines: [
    { da: 'Jeg kan godt lide den grønne lænestol.', en: 'I like the green armchair.', agree: 'Det kan jeg også.', surprise: 'Kan du det?!', wrong: ['Det kan jeg heller ikke.', 'Er du det?!'], clue: { da: 'Ja. Jeg har siddet i den i fyrre år. Derfor skal den brændes. Ingen andre skal sidde i den.', en: 'Yes. I have sat in it for forty years. That is why it must be burned. Nobody else shall sit in it.' }, why: 'Positive statement (kan godt lide): agree with også, or ask Kan du det?!' },
    { da: 'Jeg er ikke så vild med de gule hylder.', en: 'I\'m not so keen on the yellow shelves.', agree: 'Det er jeg heller ikke.', surprise: 'Er du ikke?!', wrong: ['Det er jeg også.', 'Kan du ikke?!'], clue: { da: 'Nej. Agnete gav mig dem. Hun kan bedst lide gult.', en: 'No. Agnete gave them to me. She likes yellow best.' }, flag: 'clueYellow', why: 'Negative statement with er: Det er jeg heller ikke, or Er du ikke?!' },
    { da: 'Jeg synes, den hvide lampe er smuk.', en: 'I think the white lamp is beautiful.', agree: 'Det synes jeg også.', surprise: 'Gør du det?!', wrong: ['Det synes jeg heller ikke.', 'Er du det?!'], clue: { da: 'Ja. Der bor en mand i den. Han bærer en sten.', en: 'Yes. A man lives in it. He carries a stone.' }, flag: 'clueLamp', why: 'After synes, react with synes or gør: Det synes jeg også, Gør du det?!' },
    { da: 'Jeg kan ikke lide fogedens hat.', en: 'I don\'t like the bailiff\'s hat.', agree: 'Det kan jeg heller ikke.', surprise: 'Kan du ikke?!', wrong: ['Det kan jeg også.', 'Kan du det?!'], clue: { da: 'Nej. Hans farfar havde den samme hat. Og den samme samvittighed.', en: 'No. His grandfather had the same hat. And the same conscience.' }, flag: 'clueStone', why: 'Negative: heller ikke. Surprise: Kan du ikke?!' },
    { da: 'Jeg er vild med mit ternede tæppe.', en: 'I love my checked blanket.', agree: 'Det er jeg også.', surprise: 'Er du det?!', wrong: ['Det er jeg heller ikke.', 'Kan du det?!'], clue: { da: 'Ja. Jeg fryser. De døde fryser altid.', en: 'Yes. I am cold. The dead are always cold.' }, why: 'He used er (er vild med), so react with er: Det er jeg også, Er du det?!' },
    { da: 'Jeg synes ikke, Ravnsted er så pænt.', en: 'I don\'t think Ravnsted is very pretty.', agree: 'Det gør jeg heller ikke.', surprise: 'Synes du ikke?!', wrong: ['Det gør jeg også.', 'Gør du det?!'], clue: { da: 'Nej. Men det er sandt. Det er bedre end pænt.', en: 'No. But it is true. That is better than pretty.' }, why: 'Negative synes: Det gør (synes) jeg heller ikke, or Synes du ikke?!' },
  ] } },
  G => G.flags.lys >= 3 || (G.mini.ghost && G.mini.ghost.clues >= 3) ? [{ say: 'genfaerd', da: 'Du er en god lytter, Krage. Det er sjældent i Ravnsted.', en: 'You are a good listener, Crow. That is rare in Ravnsted.' }]
    : [{ say: 'genfaerd', da: 'Du lytter ikke. Ingen lytter.', en: 'You don\'t listen. Nobody listens.' }, { n: 'Up in the attic the white lamp flares. You feel it through the ceiling, like heat from a neighbour\'s fire.' }],
], opts: [
  { tag: 'Sig', label: 'Ask him who should get his black book', once: true,
    build: { prompt: 'Who should have your black book? (din, a possessive)', answers: [['Hvem', 'skal', 'have', 'din', 'sorte', 'bog']], extra: ['sort', 'dit', 'bogen'], punct: '?', rules: ['adj-def-poss', 'spoerg'], tip: 'After din the adjective takes -e too: din sorte bog.' },
    ok: [G => G.flags.lys >= 3 ? [{ say: 'genfaerd', da: 'Den, der kan skrive den sidste linje. Rigtigt.', en: 'The one who can write the last line. Correctly.' }, { t: 'And whom he trusts. Three candles at least, by the look of him.' }]
      : [{ say: 'genfaerd', da: 'Ikke til en, der ikke lytter.', en: 'Not to someone who doesn\'t listen.' }, { t: 'Keep his candles burning, or the book will not have you.' }]] },
  { tag: 'Sig', label: 'Ask about the man in the lamp', once: true, if: G => G.flags.clueLamp || G.flags.knowsLamp || G.flags.sawStone,
    build: { prompt: 'Who is the man in the lamp?', answers: [['Hvem', 'er', 'manden', 'i', 'lampen']], extra: ['mand', 'lampe', 'den'], punct: '?', rules: ['spoerg'], tip: 'A known man, a known lamp: definite, manden and lampen.' },
    ok: [G => G.flags.clueStone ? [{ say: 'genfaerd', da: 'Fogedens farfar. Han flyttede stenen mellem sin mark og bjerget. Hver nat lidt.', en: 'The bailiff\'s grandfather. He moved the stone between his field and the hill. A little every night.' }, { say: 'genfaerd', da: 'Jeg fangede ham i mosen og satte ham i lampen. Så kunne bogen se.', en: 'I caught him in the marsh and put him in the lamp. So the book could see.' }, { set: { truthLamp: 1 } }]
      : [{ say: 'genfaerd', da: 'En mand fra Ravnsted. Hans familie har stadig hans hat.', en: 'A man from Ravnsted. His family still has his hat.' }, { t: 'A riddle from a dead man. You will think about hats for the rest of the night.' }]] },
  { tag: 'Gå', label: 'Go and find Agnete. The rest must be shared', next: 'skiftet' },
] },

/* ======================= AFTEN · skiftet ======================= */
skiftet: { place: 'stue', time: 1, npcs: ['agnete', 'genfaerd'], lines: [
  { n: 'Agnete comes back from the kitchen with red eyes behind the veil. She does not see the armchair. Or she pretends very well.' },
  { say: 'agnete', da: 'Testamentet siger ikke noget om resten. Så det bestemmer vi.', en: 'The will says nothing about the rest. So we decide.' },
  { t: 'We. Meaning you, with her watching, with him listening.' },
  { say: 'agnete', da: 'Men først: Ved du, hvad jeg kan lide? Ingen spørger mig.', en: 'But first: do you know what I like? Nobody asks me.' },
  G => G.flags.clueYellow ? { t: 'The dead man told you one thing about her. Use it.' } : { t: 'You know nothing about her taste. Guess like a crow.' },
  { mini: { kind: 'smag', id: 'smag', who: 'agnete', items: AGNETE.map(([k, l]) => ({ k, l, da: THINGS[k].da, img: THINGS[k].img, g: THINGS[k].g })) } },
  G => G.mini.smag.score >= 4 ? [{ say: 'agnete', da: 'Du kender mig bedre end min mand gjorde.', en: 'You know me better than my husband did.' }]
    : G.mini.smag.score >= 2 ? [{ say: 'agnete', da: 'Nå. Du gætter ikke helt dårligt.', en: 'Well. You don\'t guess too badly.' }]
    : [{ say: 'agnete', da: 'Du kender mig slet ikke. Det er fint. Det gør ingen.', en: 'You don\'t know me at all. That\'s fine. Nobody does.' }],
  { t: 'Now you know what she likes. Share accordingly. Or don\'t.' },
  { mini: { kind: 'skift', id: 'skift', items: ['hylder', 'puder', 'storkommode', 'gardiner', 'storskab'].map(k => ({ k, da: THINGS[k].da, img: THINGS[k].img, g: THINGS[k].g })), likes: { hylder: 2, puder: 2, storkommode: 0, gardiner: 0, storskab: -1 } } },
  G => { const p = G.mini.skift.piles || {}, out = [];
    if (p.hylder === 'agnete' && p.puder === 'agnete') out.push({ say: 'agnete', da: 'De gule hylder og de stribede puder. Du har lyttet.', en: 'The yellow shelves and the striped cushions. You have been listening.' }, { kr: 5, why: 'Agnete betaler' }, { set: { agneteHappy: 1 } });
    else if (p.hylder === 'baal') out.push({ say: 'agnete', da: 'Mine gule hylder! På bålet?! Dem gav jeg ham.', en: 'My yellow shelves! On the fire?! I gave them to him.' }, { t: 'She will take her half at the market, and then some.' }, { set: { agneteAngry: 1 } });
    if (p.hylder === 'baal') out.push({ n: 'The armchair creaks, a small, satisfied creak.' }, lys(1));
    if (G.mini.skift.mistakes >= 3) out.push({ n: 'Every wrong word, a candle gutters. Absalon does not like sloppy reasons.' }, lys(-1));
    return out; },
  { time: 2 },
  { go: 'marked' },
] },

/* ======================= MIDNAT · markedet ======================= */
marked: { place: 'marked', time: 2, npcs: ['tove'], lines: [
  { n: 'Midnat. Under the church wall: the market of the dead. Chairs nobody sits in any more, coats still shaped like their owners, a cradle. Lanterns. Buyers who keep their hoods up.' },
  { n: 'Gamle Tove runs it. She buys from the dead and sells to the living, and takes a little from both.' },
  G => prev(G, 'klud') ? { t: 'On her stall pole hangs a checked cap. Mads Klud\'s. Tove notices you noticing.' } : [],
  { say: 'tove', da: 'Kragen! Skriverens ting? Lad mig se. Jeg betaler i kobber, og jeg betaler med det samme.', en: 'Kragen! The scribe\'s things? Let me see. I pay in copper, and I pay at once.' },
  { n: 'You set out the little chairs from the will. Tove walks around them twice, like a dog around a stranger.' },
  { say: 'tove', da: 'Jeg er ikke så vild med de små stole. Men de er gamle, og gamle ting sælger godt om natten.', en: 'I\'m not so keen on the little chairs. But they are old, and old things sell well at night.' },
], opts: [
  { tag: 'Sig', label: 'React: Aren\'t you?!', once: true,
    build: { prompt: 'Aren\'t you?! (she said: Jeg er ikke så vild med …)', answers: [['Er', 'du', 'ikke']], extra: ['det', 'kan', 'gør'], punct: '?!', rules: ['reakt'], tip: 'She used er (er ikke vild med), so: Er du ikke?!' },
    ok: [{ say: 'tove', da: 'Nej. Men jeg er vild med penge. Og du har ting.', en: 'No. But I am crazy about money. And you have things.' }, { set: { warmT: 1 } }] },
  { tag: 'Gør', label: 'Sell the estate\'s things to Tove', once: true, next: 'marked_salg' },
  { tag: 'Sig', label: 'Ask Tove about the white lamp', once: true,
    build: { prompt: 'Do you know the scribe\'s old lamp? (skriverens …)', answers: [['Kender', 'du', 'skriverens', 'gamle', 'lampe']], extra: ['gammel', 'den', 'lampen'], punct: '?', rules: ['adj-def-poss', 'adj-def-irr'], tip: 'After a genitive (skriverens) the adjective takes its e-form, and gammel loses an e: skriverens gamle lampe.' },
    ok: [{ say: 'tove', da: 'Alle kender den. Den har aldrig været til salg. Ting, der aldrig har været til salg, er de dyreste.', en: 'Everybody knows it. It has never been for sale. Things that have never been for sale are the most expensive.' },
      { say: 'tove', da: 'Fogeden har købt lys før. Han slukker dem.', en: 'The bailiff has bought lights before. He puts them out.' }, { set: { toveWarned: 1 } }] },
] },

marked_salg: { place: 'marked', time: 2, npcs: ['tove'], lines: [
  G => { const n = Object.values((G.mini.skift && G.mini.skift.piles) || {}).filter(x => x === 'marked').length + 1; return { t: `On her table: the little chairs from the will${n > 1 ? `, and ${n - 1} more ${n - 1 === 1 ? 'thing' : 'things'} you chose to sell` : ''}.` }; },
  { mini: { kind: 'haggle', id: 'saleT', buyer: 'tove', base: G => 8 + 5 * Object.values((G.mini.skift && G.mini.skift.piles) || {}).filter(x => x === 'marked').length + (G.flags.warmT ? 3 : 0), step: 3, cap: 40 } },
  G => G.mini.saleT.walked ? [{ say: 'tove', da: 'Så tag dit skrammel med hjem. Hjem til den døde.', en: 'Then take your junk home. Home to the dead man.' }, { set: { unsold: 1 } }]
    : [{ npcs: ['tove', 'agnete'] }, { n: 'Agnete has followed you like a black flag. She takes her share before the coins are cold.' }, G => ({ kr: G.flags.agneteAngry ? Math.floor(G.mini.saleT.price / 3) : Math.ceil(G.mini.saleT.price / 2), why: G.flags.agneteAngry ? 'din tredjedel' : 'din halvdel' }), G => G.flags.agneteAngry ? { t: 'A third, not half. The yellow shelves are expensive tonight.' } : [], { set: { sold: 1 } }],
  { npcs: ['tove', 'foged'] },
  { n: 'A red cloak between the lanterns. Herluf has followed you.' },
  G => prev(G, 'bogen') ? { say: 'foged', da: 'Du satte min søn i gabestokken. Nu skylder du mig noget.', en: 'You put my son in the stocks. Now you owe me something.' }
    : prev(G, 'tredive') ? { say: 'foged', da: 'Min søn betalte dig engang. Nu betaler jeg. Familien betaler altid.', en: 'My son paid you once. Now I pay. The family always pays.' } : [],
  { say: 'foged', da: 'Den hvide lampe. Fyrre kroner. Giv mig den før hanegal.', en: 'The white lamp. Forty kroner. Give it to me before cockcrow.' },
  G => G.flags.toveWarned ? { t: 'He has bought lights before. He puts them out.' } : { t: 'Forty kroner for an oil lamp. Nobody pays forty kroner for an oil lamp.' },
], opts: [
  { tag: 'Lyv', label: 'Lie: the lamp is broken', once: true, roll: { stat: 'loegn', dc: 13 },
    build: { prompt: 'The white lamp is broken. (gå i stykker)', answers: [['Den', 'hvide', 'lampe', 'er', 'gået', 'i', 'stykker'], ['Den', 'hvide', 'lampe', 'er', 'i', 'stykker']], extra: ['hvid', 'gik', 'det'], punct: '.', rules: ['adj-def'], tip: 'Den hvide lampe: -e after den. gå i stykker → er gået i stykker.' },
    ok: [{ say: 'foged', da: 'Gået i stykker? Godt. Så er det slut.', en: 'Broken? Good. Then it is over.' }, { t: 'He walks away lighter than he came. A man who wanted a lamp destroyed, not a lamp.' }, { set: { fooledF: 1 } }],
    fail: [{ say: 'foged', da: 'Lampen går ikke i stykker. Den har brændt i fyrre år.', en: 'That lamp does not break. It has burned for forty years.' }, { t: 'So he knows exactly what it is.' }, { set: { sniffedF: 1 } }] },
  { tag: 'Sig', label: 'Promise him the lamp', once: true, if: G => !G.flags.fooledF,
    build: { prompt: 'I will give you the white lamp. I promise.', answers: [['Jeg', 'skal', 'nok', 'give', 'dig', 'den', 'hvide', 'lampe'], ['Den', 'hvide', 'lampe', 'skal', 'jeg', 'nok', 'give', 'dig']], extra: ['hvid', 'vil', 'lampen'], punct: '.', rules: ['skal-nok', 'adj-def'], tip: 'skal nok + give. den hvide lampe.' },
    ok: [G => G.flags.promised === 'hulda' ? { t: 'You have now promised the same lamp to the hill and to the law. Ravnsted will enjoy this.' } : [], { say: 'foged', da: 'Godt. Jeg venter ved huset.', en: 'Good. I\'ll wait by the house.' }, G => ({ set: { promised: G.flags.promised === 'hulda' ? 'begge' : 'foged' } })] },
  { tag: 'Gå', label: 'Count the night\'s words under the church wall', next: 'review33' },
] },

review33: { place: 'marked', time: 2, npcs: [], lines: [
  { n: 'You sit on a gravestone that does not mind, and count the night\'s words.' },
  { mini: { kind: 'review', id: 'rev' } },
  { time: 3 },
  { go: 'ulve' },
] },

/* ======================= ULVETIMEN · lampen ======================= */
ulve: { place: 'stue', time: 3, npcs: ['genfaerd', 'hulda'], lines: [
  { n: 'Ulvetimen. The hour when the old die and the young are born, and everybody in between lies awake.' },
  { n: 'The white lamp has come down from the attic by itself. It stands on the coffin lid and burns brighter, as if it were hungry.' },
  { n: 'Hulda stands by the fireplace. She has not used the door.' },
  G => G.flags.fooledF ? { t: 'Herluf does not come. He thinks the lamp is broken. One hand fewer.' } : [{ npcs: ['genfaerd', 'hulda', 'foged'] }, { n: 'Herluf comes in without knocking. Bailiffs never knock.' }],
  { n: 'Then the window fogs over from the outside, and a face of steam and peat looks in. Two red coals for eyes.' },
  { say: 'mosekonen', da: 'Lyset er mit. Alle lygtemænd er mine. Han gik i min mose, før skriveren tog ham.', en: 'The light is mine. All will-o\'-wisps are mine. He walked in my marsh before the scribe took him.' },
  G => G.flags.truthLamp || (G.flags.clueStone && (G.flags.sawStone || G.flags.knowsLamp || G.flags.greenFingers))
    ? [{ t: 'You know whose light it is now. The bailiff\'s grandfather, still carrying his stone.' }, { say: 'hulda', da: 'Lampen viser, hvor stenen skal stå. Bjerget vil have sin jord tilbage.', en: 'The lamp shows where the stone should stand. The hill wants its land back.' }]
    : [{ say: 'hulda', da: 'Lampen er bjergets. Mere behøver du ikke vide, Krage.', en: 'The lamp belongs to the hill. You don\'t need to know more, Crow.' }],
  G => G.flags.promised === 'begge' ? { say: 'genfaerd', da: 'Du har lovet den samme lampe til to. Det skriver jeg ikke.', en: 'You have promised the same lamp to two. I won\'t write that.' } : [],
  G => G.flags.greenFingers ? { t: 'Absalon\'s green fingertips. Forty years of holding a man\'s light so a book could see.' } : [],
  G => ({ t: G.flags.fooledF ? 'Two hands reach for one light: the hill and the marsh. The dead man in the chair watches you, not them.' : 'Three hands reach for one light: the hill, the law and the marsh. The dead man in the chair watches you, not them.' }),
], opts: [
  { tag: 'Sig', label: 'Give the lamp to Hulda and the hill', next: 'bog', set: { lamp: 'bjerget' }, engFlag: 'giftEng',
    build: { prompt: 'The white lamp is yours. (din, because lampe is an en-word)', answers: [['Den', 'hvide', 'lampe', 'er', 'din']], extra: ['hvid', 'dit', 'dine'], punct: '.', rules: ['adj-def'], tip: 'Den hvide lampe … er din (en-word).' },
    ok: [{ n: 'Hulda lifts the lamp with two fingers, the way you lift a sleeping bird. The flame leans towards the hill.' }, G => G.flags.giftEng ? [{ say: 'hulda', da: 'Bjerget forstår ikke dit sprog. Tyve.', en: 'The hill does not understand your language. Twenty.' }, { kr: 20, why: 'sølv fra bjerget' }] : { kr: 30, why: 'sølv fra bjerget' }] },
  { tag: 'Gør', label: 'Sell the lamp to the bailiff for forty kroner', if: G => !G.flags.fooledF, next: 'bog', set: { lamp: 'fogeden' },
    ok: [{ kr: 40, why: 'fogeden betaler' }, { n: 'Herluf wraps the lamp in his red cloak. Something inside it beats against the cloth like a moth.' }] },
  { tag: 'Gør', label: 'Open the window. Let the light go home to the marsh', next: 'bog', set: { lamp: 'mosen' },
    ok: [{ n: 'You open the window. The lamp\'s flame leaves the wick like a bird leaving a hand, and goes out over the roofs towards the black water.' }, { say: 'mosekonen', da: 'Tak, Krage. Nu skylder jeg dig.', en: 'Thank you, Crow. Now I owe you.' }] },
] },

/* ======================= ULVETIMEN · den sidste linje ======================= */
bog: { place: 'stue', time: 3, npcs: ['genfaerd'], lines: [
  G => G.flags.lamp === 'mosen' ? { n: 'The room is dark now, darker than before the lamp. Only the two pale points in the armchair.' } : { n: 'The lamp is gone. The room is darker, and smaller.' },
  { say: 'genfaerd', da: 'Én ting mere. Den sidste linje.', en: 'One more thing. The last line.' },
  { n: 'He holds out the quill from his coffin. It is cold, and it is wet, and it is yours for one sentence.' },
  { t: '"Min sorte bog skal til …" Whatever you write will be true.' },
], opts: [
  { tag: 'Sig', label: 'To the church', next: 'hanegal', set: { book: 'kirken' }, engFlag: 'bookEng',
    build: { prompt: 'My black book goes to the church.', answers: [['Min', 'sorte', 'bog', 'skal', 'til', 'kirken']], extra: ['sort', 'mit', 'kirke'], punct: '.', rules: ['adj-def-poss'], tip: 'Min sorte bog: -e after a possessive.' } },
  { tag: 'Sig', label: 'To Agnete', next: 'hanegal', set: { book: 'agnete' }, engFlag: 'bookEng',
    build: { prompt: 'My black book goes to Agnete.', answers: [['Min', 'sorte', 'bog', 'skal', 'til', 'Agnete']], extra: ['sort', 'mit', 'hende'], punct: '.', rules: ['adj-def-poss'], tip: 'Min sorte bog: -e after a possessive.' } },
  { tag: 'Sig', label: 'To Kragen (only if he trusts you)', next: 'hanegal', set: { book: 'kragen' }, engFlag: 'bookEng',
    build: { prompt: 'My black book goes to Kragen.', answers: [['Min', 'sorte', 'bog', 'skal', 'til', 'Kragen']], extra: ['sort', 'mit', 'mig'], punct: '.', rules: ['adj-def-poss'], tip: 'Min sorte bog: -e after a possessive.' } },
] },

/* ======================= HANEGAL ======================= */
hanegal: { place: 'stue', time: 3, npcs: ['genfaerd'], lines: [
  { time: 4 },
  { n: 'Hanegal. Somewhere in Ravnsted a rooster is clearing its throat.' },
  { say: 'genfaerd', da: 'Inden jeg går, Krage. Fortæl mig om dit hjem. Ikke Kragens loft. Dit.', en: 'Before I go, Crow. Tell me about your home. Not Kragen\'s loft. Yours.' },
  { t: 'Yours. The real one, wherever you are, holding this.' },
  { say: 'genfaerd', da: 'Hvad kan du bedst lide hjemme hos dig?', en: 'What do you like best at your home?' },
], opts: [
  { tag: 'Sig', label: 'Tell him the thing you like best at home (really)', next: 'hanegal2', build: { kind: 'home', verb: 'love', prompt: 'What I like best at home is my …' } },
] },

hanegal2: { place: 'stue', time: 4, npcs: ['genfaerd'], lines: [
  G => ({ say: 'genfaerd', da: `${G.home.love.your.replace(/^./, c => c.toUpperCase())}. Det kan jeg godt forstå.`, en: `Your ${G.home.love.en}. I can understand that.` }),
  { say: 'genfaerd', da: 'Og hvad er du træt af?', en: 'And what are you tired of?' },
], opts: [
  { tag: 'Sig', label: 'Tell him something at home you are tired of', next: 'hanegal3', build: { kind: 'home', verb: 'tired', prompt: 'I am tired of my …' } },
] },

hanegal3: { place: 'stue', time: 4, npcs: ['genfaerd'], lines: [
  G => ({ say: 'genfaerd', da: `Er du det?! Så giv ${G.home.tired.pron} til Gamle Tove. Nogen kan altid bruge ${G.home.tired.pron}.`, en: `Are you?! Then give ${G.home.tired.pron === 'dem' ? 'them' : 'it'} to Old Tove. Somebody can always use ${G.home.tired.pron === 'dem' ? 'them' : 'it'}.` }),
  { n: 'The rooster crows. The first time, the dark shape in the armchair gets thinner.' },
  G => {
    const cold = G.flags.lys <= 0, b = G.flags.bookEng ? 'kirken' : G.flags.book;
    if (cold) return [{ say: 'genfaerd', da: 'Nej. Jeg bliver. Ingen har lyttet til mig.', en: 'No. I am staying. Nobody listened to me.' }, { n: 'The rooster crows a second time. A third. The armchair stays dark and full. Agnete leaves the house to its tenant.' }, { end: 'bliver' }];
    if (b === 'kragen' && G.flags.lys < 3) return [{ n: 'The ink runs off the last line like rain off a window. The book does not believe it.' }, { say: 'genfaerd', da: 'Bogen kender dig ikke godt nok, Krage. Så bliver den hos mig.', en: 'The book does not know you well enough, Crow. So it stays with me.' }, { n: 'The rooster crows three times. The armchair stays full. The book stays shut.' }, { end: 'bliver' }];
    if (b === 'kragen') return [{ n: 'The ink sinks in. The book closes itself, slowly, and pushes against your hand like a cat.' }, { say: 'genfaerd', da: 'Skriv ordentligt, Krage. Eller betal for mit blæk.', en: 'Write properly, Crow. Or pay for my ink.' }, { n: 'The third crow. The armchair is an armchair again, green and ugly and empty.' }, G => ({ kr: 20, why: 'provsten betaler' }), { end: 'skriver' }];
    if (b === 'agnete') return [{ n: 'The ink sinks in. Agnete takes the book in both arms, like a child, and does not cry until she is out of the door.' }, { n: 'The third crow. The armchair is empty.' }, G => ({ kr: 20, why: 'provsten betaler' }), { end: 'agnete' }];
    return [G.flags.bookEng ? { n: 'The quill will not write English. The words slide off the page, and the book closes itself. Provst Bertel takes it, as books without an owner always go to the church.' } : { n: 'The ink sinks in.' }, { n: 'Provst Bertel will lock the book in the crypt with the other true things the church keeps.' }, { n: 'The third crow. The armchair is empty, and for a moment it smells of ink and tallow and nothing else.' }, G => ({ kr: 20, why: 'provsten betaler' }), { end: 'hvile' }];
  },
] },

  };

  /* sample states for the tools (lint, speech): every flag that changes a line, both ways */
  function samples() {
    const out = [];
    const prevs = [null, { e1: 'seng', e2: 'bogen' }, { e1: 'klud', e2: 'tredive' }, { e1: 'soelv', e2: 'tavs' }, { e1: 'mosen', e2: 'bogen' }];
    const homes = [homeOf('sofa', 'grøn', 'love'), homeOf('bord', 'hvid', 'love'), homeOf('puder', 'blå', 'love')];
    const tired = [homeOf('skab', 'grå', 'tired'), homeOf('lampe', 'sort', 'tired'), homeOf('gardiner', 'rød', 'tired')];
    prevs.forEach((p, i) => [0, 1].forEach(v => ['kirken', 'agnete', 'kragen'].forEach((book, j) => ['mosen', 'fogeden', 'bjerget'].forEach((lamp, k) => {
      out.push({ prev: p, kr: 10, flags: { lys: v ? 4 : (j === 2 ? 2 : 0), chair: v ? 'defend' : 'insult', pay: v ? 15 : 0, promised: ['hulda', 'foged', 'begge', 0][(i + k) % 4], truthLamp: v, clueStone: v, sawStone: v, knowsLamp: v, toveWarned: v, warmT: v, book, lamp, giftEng: (i + k) % 2, bookEng: j === 0 && !v ? 1 : 0, fooledF: (i + j) % 3 === 0 ? 1 : 0, greenFingers: v, agneteAngry: !v, clueYellow: v },
        mini: { test: { mistakes: v ? 0 : 3 }, find: { wrong: v ? 0 : 2 }, smag: { score: [0, 2, 4][(i + j) % 3] }, skift: { mistakes: v ? 0 : 3, piles: v ? { hylder: 'agnete', puder: 'agnete', storkommode: 'marked', gardiner: 'kirken', storskab: 'baal' } : { hylder: 'baal', puder: 'marked', storkommode: 'marked', gardiner: 'marked', storskab: 'marked' } }, saleT: { walked: !v && i % 2 === 0, price: 20 }, ghost: { candles: 3, clues: v ? 4 : 1 } },
        home: { love: homes[(i + j) % 3], tired: tired[(k + i) % 3] } });
    }))));
    return out;
  }

  return {
    id: 'k3s3', num: '3.3', title: 'Dødsboet', book: 'Danish to Go 2 · 3.3 · Kan du ikke lide den hvide lampe?',
    start: 'gade', endings: ['hvile', 'agnete', 'skriver', 'bliver'], endings2: ['mosen', 'fogeden', 'bjerget'],
    times: [
      { name: 'Skumring', clock: 'seks', hour: 6 },
      { name: 'Aften', clock: 'ni', hour: 9 },
      { name: 'Midnat', clock: 'tolv', hour: 12 },
      { name: 'Ulvetimen', clock: 'tre', hour: 3 },
      { name: 'Hanegal', clock: 'fem', hour: 5 },
    ],
    music: { title: 'title', 0: 'skumring', 1: 'dodsbo', 2: 'midnat', 3: 'ulvetime', 4: 'daggry', end: 'slut' },
    lore: [
      { da: 'Når nogen dør i Ravnsted, bliver de i huset.', en: 'When somebody dies in Ravnsted, they stay in their house until their things have been shared. They listen to everything the living say about their things.', art: 'lore_doed' },
      { da: 'Ved hanegal går de døde.', en: 'At cockcrow the dead go. What has not been shared by then stays with them. And so do they.', art: 'lore_hane' },
      { da: 'Absalon skriveren er død.', en: 'Absalon the scribe is dead. Forty years of other people\'s secrets in one black book, and one white lamp that never went out.', art: 'lore_lampe' },
    ],
    review: { pool: ['lænestol', 'kommode', 'skab', 'bord', 'tæppe', 'hylder', 'puder', 'gardiner', 'lampe', 'stole', 'grim', 'slidt', 'gammel', 'lækker', 'vild', 'træt', 'også', 'heller', 'testamente', 'hanegal', 'lygtemand', 'skelsten', 'arv', 'kiste', 'bål', 'lys'],
      forms: [{ q: 'den ___ lampe', o: ['hvid', 'hvide', 'hvidt'], a: 'hvide' }, { q: 'det ___ bord', o: ['gammel', 'gamle', 'gammelt'], a: 'gamle' }, { q: 'de ___ stole', o: ['lille', 'små'], a: 'små' },
        { q: 'mit ___ tæppe', o: ['ternet', 'ternede'], a: 'ternede' }, { q: 'den ___ kommode', o: ['blå', 'blåe'], a: 'blå' }, { q: 'Det grå skab er ___.', o: ['stor', 'stort', 'store'], a: 'stort' }] },
    preload: ['lore_doed', 'lore_hane', 'lore_lampe', 'gade33_0', 'p_provst', 'stue_0', 'p_agnete', 'p_foged33', 'kirke33', 'loftet_1', 'p_hulda33', 'p_genfaerd', 'stue_1', 'marked_2', 'p_tove', 'stue_3', 'p_mosekone33', 'stue_4', 'loftet_3'],
    candles: 3, people: { foged: 'p_foged33', hulda: 'p_hulda33', mosekonen: 'p_mosekone33' }, timeCard: 'kirke33',
    nodes, THINGS, samples,
    endText: {
      hvile: { title: 'Han går ved hanegal', en: 'Everything was shared, and the book went to the church.' },
      agnete: { title: 'Agnetes arv', en: 'The niece got the black book.' },
      skriver: { title: 'Den nye skriver', en: 'The dead scribe gave his book to you.' },
      bliver: { title: 'Han bliver', en: 'The dead man stayed in his chair.' },
      mosen: { title: 'Lyset går hjem', en: 'You let the light go back to the marsh.' },
      fogeden: { title: 'Fogeden slukker', en: 'You sold the lamp to the bailiff.' },
      bjerget: { title: 'Skelstenen', en: 'You gave the lamp to the hill.' },
    },
    ending2: G => G.flags.lamp || 'mosen',
    epilogue2: {
      mosen: G => 'At dawn a small light walks out over the black water with a stone on its back, and puts the stone down where it belongs.' + (G.flags.book === 'kragen' && G.flags.lys >= 3 && !G.flags.bookEng ? ' The black book still pushes against your hand at night. But without the lamp it only remembers. It no longer sees.' : ' From today the black book is only a book.'),
      fogeden: G => 'Herluf puts the lamp out with two wet fingers, the way you put out a candle in church. Something in the flame screams, very quietly. The bailiff\'s fields stay the bailiff\'s.' + (G.flags.promised === 'hulda' || G.flags.promised === 'begge' ? ' Hulda heard about it before the sun was up. The hill remembers promises.' : ''),
      bjerget: G => 'By sunrise the hill has moved a stone. Half the bailiff\'s barley now grows on hill land.' + (G.flags.promised === 'foged' || G.flags.promised === 'begge' ? ' Herluf will remember that you promised him the lamp.' : ' Hulda\'s silver never quite dries.'),
    },
  };
})();
