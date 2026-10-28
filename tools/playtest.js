#!/usr/bin/env node
/* Plays the whole day to an ending in a phone-sized browser, choosing like a curious player.
   node tools/playtest.js            one run
   node tools/playtest.js --runs 5   five runs (different endings)
   node tools/playtest.js --shots out/   screenshots of each new screen (real animations, slow)
   Exit code 1 on any JavaScript error, stuck screen, rejected answer or broken text. */
const path = require('path'), fs = require('fs');
const { serve, phone } = require('./browser');
const args = process.argv.slice(2), flag = f => args.includes(f), val = f => args[args.indexOf(f) + 1];
const runs = flag('--runs') ? +val('--runs') : 1, shots = flag('--shots') ? val('--shots') : null;
async function play(srv, run) {
  const { browser, page: p, errors } = await phone();
  await p.goto(srv.url + (shots ? '' : '?fast')); await p.waitForTimeout(300);
  const seen = {}; const shot = async n => { if (!shots || seen[n]) return; seen[n] = 1; await p.waitForTimeout(500); fs.mkdirSync(shots, { recursive: true }); await p.screenshot({ path: path.join(shots, `${n}.png`) }); };
  const click = async sel => { const e = await p.$(sel); if (e) { await e.evaluate(x => x.click()).catch(() => { }); return true; } return false; };
  await shot('title');
  await click('#tNew');
  let n = 0, last = '', same = 0, ending = null; const path_ = [];
  while (n++ < 3000) {
    await p.waitForTimeout(shots ? 150 : 15);
    if (shots && await p.$('.lore')) { await shot('lore'); if (await click('#lNext')) continue; }
    const state = await p.evaluate(() => `${__dev.node}:${document.querySelector('#log') ? document.querySelector('#log').childElementCount : 0}:${document.querySelector('#ov').innerHTML.length}`);
    same = state === last ? same + 1 : 0; last = state;
    const bad = await p.evaluate(() => (document.body.innerText.match(/.{0,40}(\bundefined\b|\bNaN\b|\[object Object\]).{0,20}/) || [''])[0]);
    if (bad && !errors.some(e => e.includes(bad))) errors.push(`broken text: “${bad.replace(/\s+/g, ' ')}”`);
    if (same > 300) { errors.push(`stuck at ${state}`); break; }
    if (await p.$('.end-ov')) { ending = await p.evaluate(() => document.querySelector('.end h2').innerText + ' + ' + document.querySelector('.end h3').innerText); await shot('end'); break; }
    if (await p.$('.tcard')) { await shot('time'); continue; }
    if (await p.$('.roll-ov')) { await shot('roll'); if (await click('#rGo')) { await p.waitForTimeout(shots ? 1400 : 20); continue; } await click('#rOk'); continue; }
    if (await p.$('.sheet-ov')) {
      await shot('builder');
      if (await p.$('.sheet.enter')) await p.waitForTimeout(400);
      const cur = await p.evaluate(() => ({ n: !!__dev.cur.pickN, c: !!__dev.cur.pickC }));
      if (cur.n || cur.c) { const els = await p.$$(cur.n ? '.pickn' : '.pickc'); await els[Math.floor(Math.random() * els.length)].evaluate(e => e.click()); await p.waitForTimeout(50); continue; }
      if (Math.random() < .04 && await click('#bEn')) continue;
      const ans = await p.evaluate(() => __dev.cur.sample());
      if (Math.random() < .2) { const t = await p.$$('.pool .tile:not([disabled])'); if (t.length) await t[0].evaluate(e => e.click()); await click('#bOk'); await click('#bClr'); }
      for (const w of ans) for (const t of await p.$$('.pool .tile:not([disabled])')) if ((await t.innerText()).toLowerCase() === w.toLowerCase()) { await t.evaluate(e => e.click()); break; }
      await click('#bOk'); await p.waitForTimeout(shots ? 400 : 30);
      if (await p.$('.sheet-ov:not(.out)')) { errors.push(`answer not accepted at ${state}: ${ans.join(' ')} · built: ${await p.$$eval('.line .tile', x => x.map(e => e.innerText).join(' '))}`); break; }
      continue;
    }
    if (await p.$('.mini-ov')) {
      const k = await p.$eval('.mini-ov', e => e.className.replace('mini-ov', '').trim()).catch(() => 'x'); await shot('mini_' + k);
      const small = await p.$eval('.mini-ov:not(.out)', e => { const r = e.getBoundingClientRect(); return r.width < innerWidth * .9 || r.height < innerHeight * .9; }).catch(() => false);
      if (small && !errors.some(x => x.includes('mini-game ' + k))) errors.push(`mini-game ${k} does not cover the screen (a CSS class clash?)`);
      if (await click('#mDone')) continue;
      const sel = await p.evaluate(() => __dev.answer);
      if (sel && Math.random() < .85 && await click(sel)) { await p.waitForTimeout(20); continue; }
      const els = await p.$$('.mtap:not([disabled])'); if (els.length) await els[Math.floor(Math.random() * els.length)].evaluate(e => e.click());
      await p.waitForTimeout(20); continue;
    }
    if (await p.$('#cont')) { await shot('scene_' + await p.evaluate(() => __dev.node)); await click('#cont'); continue; }
    const opts = await p.$$('.opt:not([disabled])');
    if (opts.length) {
      await shot('opts_' + await p.evaluate(() => __dev.node));
      const labels = await Promise.all(opts.map(o => o.innerText()));
      // prefer things not yet done; go onward sometimes
      let k = Math.floor(Math.random() * opts.length);
      const onward = labels.findIndex(l => /^Gå/.test(l)); if (Math.random() < .25 && onward >= 0) k = onward;
      path_.push(labels[k].replace(/\s+/g, ' ').slice(0, 40)); await opts[k].evaluate(e => e.click()); continue;
    }
  }
  if (!ending && !errors.length) errors.push('no ending reached');
  const gameErr = await p.evaluate(() => __dev.errors || []); gameErr.forEach(e => errors.push('game reported: ' + e));
  const miss = await p.evaluate(() => [...new Set(__dev.voiceMiss || [])]); if (miss.length) errors.push(`lines with no voice clip: ${miss.slice(0, 8).join(' · ')}`);
  const imiss = await p.evaluate(() => [...new Set(__dev.imgMiss || [])]); if (imiss.length) errors.push(`missing paintings: ${imiss.join(' · ')}`);
  await browser.close();
  return { ending, errors, steps: n };
}
(async () => {
  const srv = await serve(); let fail = 0;
  for (let r = 0; r < runs; r++) { const res = await play(srv, r); console.log(`run ${r + 1}: ${res.ending || '—'} (${res.steps} steps)`); res.errors.forEach(e => console.log('  ERROR', e)); if (res.errors.length) fail++; }
  srv.close(); process.exit(fail ? 1 : 0);
})();
