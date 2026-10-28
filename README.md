# Ravnsted

*Mellem mosen og bjerget.*

A dark story game for learning Danish, played in the browser (phone first). One day in Ravnsted, a wet medieval town between the marsh and the hill, told scene by scene from dawn to midnight. You are Kragen, an opportunist who takes whatever contract pays a few kroner. The townsfolk, and the things that are not quite townsfolk, speak Danish.

**Play:** https://brunorutyna.github.io/ravnsted/ (Android Chrome. The voices are part of the game; nothing to install.)

## The world

Fantasy and everyday misery are the same thing here. The hill folk come down to the well, the marsh steams when the old woman in it brews, and lights dance over the water at night. The scribe's book is older than the church: what is written in it, in exact words, is true. Get an ending wrong and the ink runs.

## How it plays

- **A linear day**, revealed scene by scene: Daggry, Formiddag, Middag, Eftermiddag, Skumring, Nat, Midnat. The church bell strikes the hour between scenes, and the light, the art and the music change with it.
- **Contracts** with several endings. Your choices, and your Danish, decide who ends up with what.
- **Danish is the lever.** You build sentences from word tiles. Perfect first time gives advantage on the d20, two or more mistakes give disadvantage. English always works, but costs a krone.
- **Hvorfor?** under every sentence you say shows the rule behind it. The journal (Bog) keeps the rules with your own sentences, the words you met, and your skills (Snak, Løgn, Øje, Handel), which grow when you use them.
- **Mini-games:** the scribe's binding book, finding a person by their clothes, haggling with prices said in Danish, mixing dyes and naming the colour, looking closely at things, and an evening review by the candle.
- **Tap any Danish word** for its meaning (press and hold inside buttons).
- **Art: Træsnit.** Woodcut: black ink cut into bone paper, one dried red, and hand-coloured washes on clothes, as on old broadsheets. All drawn on canvas.
- **Voices:** every character speaks natural Danish with a voice actor of their own (Google Chirp 3 HD voices, rendered once and shipped with the game): Danish intonation, questions that rise, anger and fear in the voice. The hill woman and the thing in the marsh get an echo and an undertone on top. No phone voice needed. Tap any word to hear it.
- **Music:** progressive, psychedelic heavy rock, recorded for the game: double-tracked distorted guitars, a Leslie organ, a fuzz-and-phaser lead with tape delay, bass and drums, in odd meters (7/8, 5/4, 6/8). A piece for each part of the day, a title song and an outro; they crossfade when the church bell strikes. Composed in code and played by sampled instruments (`tools/music/`). Effects (bells, ink, coins) are made in the browser.

## Chapters (spoiler-free)

**3.2 · Den røde kjole.** About 30–40 minutes. Someone needs a dress sold before noon, no questions asked, and later someone needs a man found. Two contracts, seven endings in all, six mini-games. Grammar: adjectives with en-words, et-words and plurals (en rød kjole, et rødt tørklæde, røde handsker), colours and patterns, Sikke …!, Hvad kostede den?, Hvor har du købt den henne?, den / det / dem.

## Credits

Instrument samples: GeneralUser GS by S. Christian Collins (github.com/mrbumpy409/GeneralUser-GS). Voices: Google Cloud Text-to-Speech (Chirp 3 HD, da-DK).

## Development

No build step. Open `index.html`, or serve the folder. Checks are in `tools/` (see `tools/README.md`).
