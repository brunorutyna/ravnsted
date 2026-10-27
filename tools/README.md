# Checks

Run these before every push. Each check exists because the bug it catches has happened in one of these games.

| Command | What it does | Needs |
| --- | --- | --- |
| `node tools/lint.js` | Static checks of the story: missing or unreachable scenes, scenes that never leave, unknown speakers, mini-games, rules, skills and endings; word tiles that cannot build an accepted answer; ledger items with more than one right answer; spot games without exactly one target; Danish words with no meaning in the glossary; names of real people (`tools/blocklist.txt`). | Node only |
| `node tools/playtest.js` | Plays the whole day to an ending in a phone-sized browser. Fails on JavaScript errors, stuck screens, rejected answers or "undefined" on screen. `--runs 5` for several endings, `--shots dir/` for screenshots with real animations. | Playwright + Chromium |
| `tools/bump.sh` | Stamps css/js with a new version so phones load new files at once, and an open game offers "Ny version". | sh |

Manual checks the tools cannot do: listen on a phone (voice not cut off, music per time of day, ducking under speech), watch one time-of-day transition, read the new Danish aloud once.
