# Checks

Run these before every push. Each check exists because the bug it catches has happened in one of these games.

| Command | What it does | Needs |
| --- | --- | --- |
| `node tools/lint.js` | Static checks of the story: missing or unreachable scenes, scenes that never leave, unknown speakers, mini-games, rules, skills and endings; word tiles that cannot build an accepted answer; ledger items with more than one right answer; spot games without exactly one target; Danish words with no meaning in the glossary; names of real people (`tools/blocklist.txt`). | Node only |
| `node tools/playtest.js` | Plays the whole day to an ending in a phone-sized browser. Fails on JavaScript errors, stuck screens, rejected answers or "undefined" on screen. `--runs 5` for several endings, `--shots dir/` for screenshots with real animations. | Playwright + Chromium |
| `node tools/speech.js` then `python3 tools/voices.py` | Lists every line the game can speak and who says it, then renders each character's voice and packs the clips into `audio/voice/` with `js/voicemap.js`. Only new or changed lines are rendered. Run after any change to Danish text. `node tools/speech.js --check` fails if a spoken line has no clip. | Python: piper-tts, pyworld, soundfile; the Danish Piper model (`RAVNSTED_TTS`) |
| `python3 tools/music/build.py [name]` | Renders the soundtrack into `audio/music/`: pieces written in `tools/music/tracks.py`, played by the GeneralUser GS SoundFont (`RAVNSTED_SF2`), mixed with pedalboard effects. Each file is one seamless loop. | Python: tinysoundfont (`--no-deps`), pedalboard, numpy |
| `tools/bump.sh` | Stamps css/js with a new version so phones load new files at once, and an open game offers "Ny version". | sh |

Manual checks the tools cannot do: listen on a phone (voice not cut off, music per time of day, ducking under speech), watch one time-of-day transition, read the new Danish aloud once.

## Art (tools/art)
The paintings are made with Google's Gemini image model on Vertex AI (project "ravnsted").
- `gen.py` holds every prompt (style, hidden faces, crowd clothing). `RAVNSTED_KEY=/path/key.json python3 tools/art/gen.py [name ...]` makes the missing raw paintings in `~/ravnsted-art-raw` (delete one to redo it). Never commit the key.
- `pack.py` turns them into `img/*.webp`; people (`p_*`) are cut out with rembg (isnet-general-use).
- `refs/` are the approved style-1 portraits used as references so characters stay the same.
- In `js/art.js`, `FX` places the living effects (candles, fire, fog, rain, wisps, eyes) in painting coordinates, and `AMBIENT` tints people with each room's light.
- Rules: no human face is ever shown; crowd clothing must match the Danish description exactly (check every card by eye).
