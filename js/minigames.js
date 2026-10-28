/* RAVNSTED — mini-games. Each returns a promise with its result.
   Every tappable thing has class .mtap; __dev.answer names the right one for the test bot. */
function miniOv(cls, html) {
  const ov = document.createElement('div'); ov.className = 'mini-ov ' + cls; ov.innerHTML = `<div class="mini">${html}</div>`; $('#ov').appendChild(ov); return ov;
}
const doneBtn = (ov, label = 'Færdig') => new Promise(r => { const b = document.createElement('button'); b.className = 'btn'; b.id = 'mDone'; b.textContent = label; b.onclick = () => { ov.classList.add('out'); setTimeout(() => ov.remove(), 250); r(); }; $('.mbrow', ov).appendChild(b); __dev.answer = '#mDone'; });
const val = (x) => typeof x === 'function' ? x(G) : x;

const MINI = {
  /* ---- look closely: tap the three wrong things about the dress ---- */
  async inspect(m) {
    const spots = INSPECT;
    const ov = miniOv('inspect', `<p class="mh">Kig godt efter</p><p class="small">Three things are wrong with this dress. Tap them.</p><div class="dressbox"><canvas width="600" height="700"></canvas>${spots.map(s => `<button class="mtap dspot" data-k="${s.k}" style="left:${s.x * 100}%;top:${s.y * 100}%" aria-label="look here">?</button>`).join('')}</div><div class="found"></div><div class="mbrow"></div>`);
    ART.dress($('canvas', ov).getContext('2d'), 600, 700);
    let found = 0; __dev.answer = '.dspot:not(.done)';
    ov.querySelectorAll('.dspot').forEach(b => b.onclick = () => {
      if (b.classList.contains('done')) return; b.classList.add('done'); b.textContent = '✕'; found++;
      const s = spots.find(x => x.k === b.dataset.k); const p = document.createElement('p'); p.className = 'da'; p.innerHTML = daHTML(s.da) + ` <span class="small">${esc(s.en)}</span>`; $('.found', ov).appendChild(p);
      TTS.say(s.da, true, 'kragen'); AUDIO.sfx('tick'); G.use.oeje++;
      if (found === spots.length) doneBtn(ov);
    });
    const skip = document.createElement('button'); skip.className = 'btn ghost'; skip.textContent = 'Nok'; $('.mbrow', ov).appendChild(skip);
    await new Promise(r => { const iv = setInterval(() => { if (!ov.isConnected) { clearInterval(iv); r(); } }, 100); skip.onclick = () => { ov.remove(); }; });
    return { found };
  },

  /* ---- the scribe's book: each gap must have the right ending, or the ink runs ---- */
  async ledger(m) {
    const ov = miniOv('ledger', `<p class="mh">Bogen · ${esc(m.title)}</p><div class="page"></div><p class="why small"></p><div class="mbrow"></div>`);
    const page = $('.page', ov); let mistakes = 0;
    for (const it of m.items) {
      const row = document.createElement('div'); row.className = 'lrow';
      row.innerHTML = `<p class="da">${daHTML(it.pre)} <span class="gap">&nbsp;</span> ${daHTML(it.post)}</p><div class="chips">${shuffle(it.opts).map(o => `<button class="mtap chip" data-ok="${o === it.ok ? 1 : 0}">${esc(o)}</button>`).join('')}</div>`;
      page.appendChild(row); row.querySelectorAll('.chip').forEach(c => longPress(c, c.textContent));
      __dev.answer = '.lrow:last-child .chip[data-ok="1"]';
      await new Promise(res => row.querySelectorAll('.chip').forEach(c => c.onclick = () => {
        if (c.dataset.ok === '1') {
          $('.gap', row).textContent = c.textContent; $('.gap', row).classList.add('ink'); $('.chips', row).remove(); AUDIO.sfx('ink');
          $('.why', ov).textContent = it.why; res();
        } else { mistakes++; c.disabled = true; c.classList.add('blot'); $('.gap', row).classList.add('run'); setTimeout(() => $('.gap', row) && $('.gap', row).classList.remove('run'), 700); AUDIO.sfx('inkrun'); $('.why', ov).textContent = 'Blækket løber. ' + it.why; }
      }));
    }
    const bad = mistakes >= 2;
    m.items.forEach(it => { const r = it.rule || 'adj-en', s = `… ${it.pre} ${it.ok} ${it.post}`.replace(/\s+/g, ' '); (G.rules[r] = G.rules[r] || []).includes(s) || G.rules[r].push(s); });
    const p = document.createElement('p'); p.className = 'verdict'; p.textContent = bad ? 'Blækket løber. Bogen tror ikke på det.' : 'Bogen drikker blækket.'; page.appendChild(p);
    await doneBtn(ov, 'Luk bogen'); return { mistakes, bad };
  },

  /* ---- find a person from a description of their clothes ---- */
  async spot(m) {
    const say = val(m.say), en = val(m.en); const crowd = shuffle(m.crowd.filter(c => !c.onlyIf || G.flags[c.onlyIf]));
    const ov = miniOv('spot', `<p class="mh">Find personen</p><p class="da desc">${daHTML(say)}</p><button class="tb hear">▶ Hør</button><details class="small"><summary>English</summary>${esc(en)}</details><div class="crowd">${crowd.map((c, i) => `<button class="mtap fig" data-ok="${c.name === m.target ? 1 : 0}" data-i="${i}"><canvas width="160" height="240"></canvas></button>`).join('')}</div><div class="mbrow"></div>`);
    ov.querySelectorAll('.fig canvas').forEach((cv, i) => ART.figureCard(cv.getContext('2d'), 160, 240, crowd[i]));
    $('.hear', ov).onclick = () => TTS.say(say, true, 'narrator'); TTS.say(say, false, 'narrator');
    __dev.answer = '.fig[data-ok="1"]';
    const ok = await new Promise(res => ov.querySelectorAll('.fig').forEach(b => b.onclick = () => {
      ov.querySelectorAll('.fig').forEach(x => { x.disabled = true; if (x.dataset.ok === '1') x.classList.add('right'); });
      if (b.dataset.ok !== '1') b.classList.add('wrong'); AUDIO.sfx(b.dataset.ok === '1' ? 'perfect' : 'wrong'); G.use.oeje++; res(b.dataset.ok === '1');
    }));
    await doneBtn(ov, 'Videre'); return { ok };
  },

  /* ---- haggling: the buyer says a price in Danish; hear it right, then push or accept ---- */
  async haggle(m) {
    const P = NPCS[m.buyer]; let offer = Math.min(m.cap, Math.max(HAGGLE_RANGE[m.buyer][0], Math.round(val(m.base)))); let pushes = 0, final = false;
    const ov = miniOv('haggle', `<p class="mh">Handel · ${esc(P.name)}</p><div class="hlog"></div><div class="hact"></div><div class="mbrow"></div>`);
    const hlog = $('.hlog', ov), act = $('.hact', ov);
    const line = (who, html) => { const p = document.createElement('p'); p.innerHTML = `<b>${esc(who)}</b> ${html}`; hlog.appendChild(p); hlog.scrollTop = 1e6; };
    const confusers = n => { const s = new Set([n]); const sw = (n % 10) * 10 + Math.floor(n / 10); if (sw !== n && sw > 4 && sw < 100) s.add(sw); [n + 10, n - 10, n + 1, n + 5].forEach(x => { if (s.size < 4 && x > 4 && x < 100) s.add(x); }); return shuffle([...s]); };
    while (true) {
      const words = `${final ? 'Mit sidste bud: ' : 'Jeg giver dig '}${numDa(offer)} kroner.`;
      line(P.name, daHTML(words)); TTS.say(words, false, m.buyer);
      act.innerHTML = `<p class="small">How much did ${esc(P.name)} say?</p><div class="chips">${confusers(offer).map(n => `<button class="mtap chip num" data-ok="${n === offer ? 1 : 0}">${n} kr.</button>`).join('')}</div><button class="tb hear">▶ Hør igen</button>`;
      $('.hear', act).onclick = () => TTS.say(words, true, m.buyer);
      __dev.answer = '.num[data-ok="1"]';
      const heard = await new Promise(r => act.querySelectorAll('.num').forEach(b => b.onclick = () => r(b.dataset.ok === '1' ? offer : parseInt(b.textContent))));
      if (heard !== offer) {
        line('Kragen', daHTML('Ja … det er en aftale.')); TTS.say('Ja, det er en aftale.', false, 'kragen'); AUDIO.sfx('wrong');
        line('', `<i>You nodded at ${heard}. ${esc(P.name)} said ${offer}: ${esc(numDa(offer))}. The deal is done at ${offer}.</i>`);
        act.innerHTML = ''; await doneBtn(ov, 'Videre'); return { price: offer, walked: false, misheard: true };
      }
      act.innerHTML = `<div class="chips"><button class="mtap btn" id="hAcc">Det er en aftale.</button><button class="mtap btn ghost" id="hPush">Det er for lidt!</button></div>`;
      __dev.answer = Math.random() < .5 ? '#hAcc' : '#hPush';
      const push = await new Promise(r => { $('#hAcc', act).onclick = () => r(false); $('#hPush', act).onclick = () => r(true); });
      if (!push) { line('Kragen', daHTML('Det er en aftale.')); TTS.say('Det er en aftale.', false, 'kragen'); AUDIO.sfx('coin'); act.innerHTML = ''; await doneBtn(ov, 'Videre'); return { price: offer, walked: false }; }
      line('Kragen', daHTML('Det er for lidt!')); TTS.say('Det er for lidt!', false, 'kragen');
      if (final) { line(P.name, daHTML('Så er der ingen handel.')); TTS.say('Så er der ingen handel.', false, m.buyer); act.innerHTML = ''; await doneBtn(ov, 'Videre'); return { price: 0, walked: true }; }
      act.innerHTML = '';
      const ok = await rollDice('handel', 11 + pushes * 2, 0); pushes++;
      if (ok && offer < m.cap && pushes < 3) { offer = Math.min(m.cap, offer + m.step); }
      else final = true;
    }
  },

  /* ---- the dye works: mix the colour, then name it with the right ending ---- */
  async dye(m) {
    const VATS = ['rød', 'gul', 'blå', 'hvid'];
    const MIX = { 'gul+rød': 'orange', 'blå+hvid': 'lyseblå', 'hvid+rød': 'lyserød', 'blå+gul': 'grøn', 'blå+rød': 'lilla', 'gul+hvid': 'gul' };
    const ov = miniOv('dye', `<p class="mh">Farveriet</p><div class="ticket"></div><div class="vats">${VATS.map(v => `<button class="mtap vat" data-v="${v}"><i style="background:${COLORS[v].hex}"></i>${v}</button>`).join('')}</div><div class="pot"><i></i><span></span></div><div class="dname"></div><p class="why small"></p><div class="mbrow"></div>`);
    ov.querySelectorAll('.vat').forEach(b => longPress(b, b.dataset.v));
    let score = 0;
    for (const o of m.orders) {
      $('.ticket', ov).innerHTML = `<p class="small">Ordre</p><p class="da big">${daHTML(o.want)}</p>`; TTS.say(o.want, false, 'bodil');
      $('.dname', ov).innerHTML = ''; $('.pot i', ov).style.background = 'transparent'; $('.pot span', ov).textContent = '';
      let first = true, sel = [];
      // 1) mix
      await new Promise(res => {
        __dev.answer = `.vat[data-v="${o.mix.find(x => !sel.includes(x)) || o.mix[0]}"]`;
        ov.querySelectorAll('.vat').forEach(b => { b.disabled = false; b.classList.remove('sel'); b.onclick = () => {
          if (sel.includes(b.dataset.v)) return; sel.push(b.dataset.v); b.classList.add('sel'); AUDIO.sfx('splash');
          __dev.answer = `.vat[data-v="${o.mix.find(x => !sel.includes(x)) || o.mix[0]}"]`;
          if (sel.length === 2) {
            const k = sel.slice().sort().join('+'), got = MIX[k] || 'brun';
            $('.pot i', ov).style.background = COLORS[got].hex; $('.pot span', ov).textContent = got;
            if (o.mix.slice().sort().join('+') === k) { ov.querySelectorAll('.vat').forEach(x => x.disabled = true); setTimeout(res, FAST ? 0 : 600); }
            else { first = false; $('.why', ov).textContent = `Bodil: Nej. Det er ${got}, ikke det, de vil have.`; AUDIO.sfx('wrong'); setTimeout(() => { sel = []; ov.querySelectorAll('.vat').forEach(x => x.classList.remove('sel')); __dev.answer = `.vat[data-v="${o.mix[0]}"]`; }, FAST ? 0 : 500); }
          }
        }; });
      });
      // 2) name it
      $('.dname', ov).innerHTML = `<p class="da">Det er ${daHTML(o.art)} <span class="gap">&nbsp;</span> ${daHTML(o.noun)}.</p><div class="chips">${shuffle(o.name).map(n => `<button class="mtap chip" data-ok="${n === o.ok ? 1 : 0}">${esc(n)}</button>`).join('')}</div>`;
      __dev.answer = '.dname .chip[data-ok="1"]';
      await new Promise(res => $('.dname', ov).querySelectorAll('.chip').forEach(c => c.onclick = () => {
        if (c.dataset.ok === '1') { $('.dname .gap', ov).textContent = o.ok; $('.dname .chips', ov).remove(); $('.why', ov).textContent = o.why; AUDIO.sfx('ok'); TTS.say(`Det er ${o.art} ${o.ok} ${o.noun}.`, false, 'kragen'); setTimeout(res, FAST ? 0 : 1300); }
        else { first = false; c.disabled = true; $('.why', ov).textContent = o.why; AUDIO.sfx('wrong'); }
      }));
      if (first) score++;
      const rk = o.art === 'en' ? 'adj-en' : o.art === 'et' ? 'adj-et' : 'adj-pl'; (G.rules[rk] = G.rules[rk] || []); const s = `Det er ${o.art} ${o.ok} ${o.noun}.`; if (!G.rules[rk].includes(s)) G.rules[rk].push(s);
    }
    $('.ticket', ov).innerHTML = `<p class="da">${daHTML(score >= 2 ? 'Tre ordrer. Godt.' : 'Tre ordrer. Langsomt.')}</p>`;
    await doneBtn(ov, 'Videre'); return { score };
  },

  /* ---- evening review by the candle: spaced repetition of today's words (each session has its own pool) ---- */
  async review(m) {
    const R = SES.review || {};
    const POOL = R.pool || ['kjole', 'tørklæde', 'handsker', 'hue', 'kappe', 'bælte', 'knapper', 'sko', 'rød', 'grøn', 'hvid', 'sort', 'grå', 'stribet', 'ternet', 'dyr', 'billig', 'kostede', 'købt', 'smuk', 'flot', 'pæn', 'våd', 'pris', 'aftale', 'penge', 'sølv', 'mose', 'blæk', 'sandt'];
    const have = POOL.filter(w => DICT[w]);
    const words = have.sort((a, b) => ((META.words[a] || {}).s || 0) - ((META.words[b] || {}).s || 0) + (G.words[b] ? 1 : 0) - (G.words[a] ? 1 : 0)).slice(0, 3);
    const forms = shuffle(R.forms || [
      { q: 'et ___ tørklæde', o: ['hvid', 'hvidt', 'hvide'], a: 'hvidt' }, { q: 'nogle ___ sko', o: ['sort', 'sorte'], a: 'sorte' },
      { q: 'en ___ hue', o: ['ternet', 'ternede'], a: 'ternet' }, { q: 'nogle ___ handsker', o: ['blå', 'blåt'], a: 'blå' }, { q: 'et ___ bælte', o: ['brun', 'brunt', 'brune'], a: 'brunt' },
    ]).slice(0, 2);
    const items = shuffle([...words.map(w => ({ w })), ...forms]);
    const ov = miniOv('review', `<p class="mh">Ved lyset</p><p class="small">The day's words, before the candle burns down.</p><div class="rv"></div><div class="mbrow"></div>`);
    let right = 0;
    for (const it of items) {
      const rv = $('.rv', ov);
      if (it.w) {
        const others = shuffle(have.filter(x => x !== it.w)).slice(0, 3).map(x => DICT[x]);
        rv.innerHTML = `<p class="da big">${esc(it.w)}</p><div class="chips col">${shuffle([DICT[it.w], ...others]).map(g => `<button class="mtap chip" data-ok="${g === DICT[it.w] ? 1 : 0}">${esc(g)}</button>`).join('')}</div>`; TTS.say(it.w, false, 'word');
      } else rv.innerHTML = `<p class="da big">${esc(it.q)}</p><div class="chips">${shuffle(it.o).map(g => `<button class="mtap chip" data-ok="${g === it.a ? 1 : 0}">${esc(g)}</button>`).join('')}</div>`;
      __dev.answer = Math.random() < .8 ? '.rv .chip[data-ok="1"]' : '.rv .chip';
      const ok = await new Promise(res => rv.querySelectorAll('.chip').forEach(c => c.onclick = () => { rv.querySelectorAll('.chip').forEach(x => { x.disabled = true; if (x.dataset.ok === '1') x.classList.add('right'); }); if (c.dataset.ok !== '1') c.classList.add('wrong'); res(c.dataset.ok === '1'); }));
      AUDIO.sfx(ok ? 'ok' : 'wrong'); if (ok) right++;
      if (it.w) { const mw = META.words[it.w] = META.words[it.w] || { s: 0 }; mw.s = ok ? mw.s + 1 : 0; saveMeta(); }
      await sleep(900);
    }
    $('.rv', ov).innerHTML = `<p class="da big">${right} / ${items.length}</p><p class="small">${right === items.length ? 'The candle gutters out on a perfect count.' : 'The words you missed will come back tomorrow.'}</p>`;
    await doneBtn(ov, 'Sov'); return { right };
  },

  /* ---- 3.3 · Loftet: the will names a thing exactly; find it among its look-alikes ---- */
  async find(m) {
    const ov = miniOv('find', `<p class="mh">Loftet</p><p class="small">The will names five things. Lift the right sheet.</p><div class="ask"></div><div class="cards"></div><p class="why small"></p><div class="mbrow"></div>`);
    let wrong = 0;
    for (const r of m.rounds) {
      $('.ask', ov).innerHTML = `<p class="da big">${daHTML(r.da.replace(/^./, c => c.toUpperCase()))}</p><button class="tb hear">▶ Hør</button>`; $('.why', ov).textContent = '';
      $('.hear', ov).onclick = () => TTS.say(r.da, true, 'genfaerd'); TTS.say(r.da, false, 'genfaerd');
      $('.cards', ov).innerHTML = shuffle([r.ok, ...r.others]).map(n => `<button class="mtap card" data-ok="${n === r.ok ? 1 : 0}"><img src="img/${n}.webp?v=${window.VERSION}" alt=""></button>`).join('');
      __dev.answer = Math.random() < .85 ? '.card[data-ok="1"]' : '.card';
      await new Promise(res => ov.querySelectorAll('.card').forEach(c => c.onclick = () => {
        if (c.dataset.ok === '1') { c.classList.add('right'); ov.querySelectorAll('.card').forEach(x => x.disabled = true); AUDIO.sfx('ok'); setTimeout(res, FAST ? 0 : 900); }
        else { wrong++; c.disabled = true; c.classList.add('wrong'); AUDIO.sfx('wrong'); $('.why', ov).textContent = 'Nej. Ikke den. Something sighs under the sheets. Look at the size, the colour, the pattern.'; TTS.say('Ikke den.', true, 'genfaerd'); }
      }));
    }
    $('.ask', ov).innerHTML = `<p class="da">${daHTML(wrong ? 'Nu ligger de, hvor de skal.' : 'Alle fem. Rigtigt.')}</p>`; $('.cards', ov).innerHTML = '';
    await doneBtn(ov, 'Videre'); return { wrong };
  },

  /* ---- 3.3 · Smagsprøven: put someone's things in order of taste, then hear how wrong you were ---- */
  async smag(m) {
    const P = NPCS[m.who], LABELS = m.items.map(x => x.l);
    const ov = miniOv('smag', `<p class="mh">Smagsprøven</p><p class="small">What does ${esc(P.name)} like best? Tap the things in order, from best to worst.</p><div class="slots">${LABELS.map((l, i) => `<button class="slot" data-i="${i}"><span class="lbl">${daHTML(l)}</span><span class="put"></span></button>`).join('')}</div><div class="cards five">${shuffle(m.items).map(x => `<button class="mtap card" data-k="${x.k}"><img src="img/${x.img}.webp?v=${window.VERSION}" alt=""><small>${esc(x.da)}</small></button>`).join('')}</div><div class="mbrow"></div>`);
    ov.querySelectorAll('.card').forEach(c => longPress(c, $('small', c).textContent));
    const order = Array(m.items.length).fill(null);
    const render = () => { ov.querySelectorAll('.slot').forEach((sl, i) => { const x = m.items.find(y => y.k === order[i]); $('.put', sl).textContent = x ? x.da : ''; sl.classList.toggle('full', !!x); });
      ov.querySelectorAll('.card').forEach(c => c.disabled = order.includes(c.dataset.k)); const b = $('#mSay', ov); if (b) b.disabled = order.includes(null); };
    ov.querySelectorAll('.card').forEach(c => c.onclick = () => { const i = order.indexOf(null); if (i < 0) return; order[i] = c.dataset.k; AUDIO.sfx('tile'); render(); __dev.answer = order.includes(null) ? '.card:not([disabled])' : '#mSay'; });
    ov.querySelectorAll('.slot').forEach(sl => sl.onclick = () => { order[+sl.dataset.i] = null; render(); __dev.answer = '.card:not([disabled])'; });
    const say = document.createElement('button'); say.className = 'btn'; say.id = 'mSay'; say.textContent = 'Sådan'; $('.mbrow', ov).appendChild(say); render();
    __dev.answer = '.card:not([disabled])';
    await new Promise(r => say.onclick = r);
    say.remove(); ov.querySelectorAll('.card, .slot').forEach(x => x.disabled = true);
    let score = 0; const log = document.createElement('div'); log.className = 'hlog'; $('.cards', ov).replaceWith(log);
    for (let i = 0; i < order.length; i++) {
      const x = m.items.find(y => y.k === order[i]), ok = order[i] === m.items[i].k; if (ok) score++;
      const line = `${ok ? 'Ja.' : 'Tror du det?!'} Jeg ${x.l} ${x.da}.`;
      ov.querySelectorAll('.slot')[i].classList.add(ok ? 'right' : 'wrong');
      const p = document.createElement('p'); p.innerHTML = `<b>${esc(P.name)}</b> ${daHTML(line)}`; log.appendChild(p); AUDIO.sfx(ok ? 'ok' : 'wrong');
      await TTS.say(line, false, m.who); await sleep(500);
    }
    (G.rules.liking = G.rules.liking || []); m.items.forEach(x => { const sx = `Jeg ${x.l} ${x.da}.`; if (!G.rules.liking.includes(sx)) G.rules.liking.push(sx); });
    __dev.answer = '#mDone'; await doneBtn(ov, 'Videre'); return { score };
  },

  /* ---- 3.3 · Skiftet: decide where each thing goes, then give the reason with the right ending ---- */
  async skift(m) {
    const PILES = { agnete: 'Agnete beholder', marked: 'Markedet', kirken: 'Kirken', baal: 'Bålet' };
    const ov = miniOv('skift', `<p class="mh">Skiftet</p><p class="small">The will says nothing about these. Where does each one go, and why? The dead man is listening to your reasons.</p><div class="one"></div><p class="why small"></p><div class="mbrow"></div>`);
    const piles = {}; let mistakes = 0;
    for (const it of m.items) {
      const one = $('.one', ov), S = it.g === 'en' ? 'Den' : it.g === 'et' ? 'Det' : 'De', pron = it.g === 'en' ? 'den' : it.g === 'et' ? 'det' : 'dem';
      $('.why', ov).textContent = '';
      one.innerHTML = `<div class="card big"><img src="img/${it.img}.webp?v=${window.VERSION}" alt=""></div><p class="da big">${daHTML(it.da.replace(/^./, c => c.toUpperCase()))}</p><div class="chips">${Object.keys(PILES).map(k => `<button class="mtap chip pile" data-p="${k}">${esc(PILES[k])}</button>`).join('')}</div>`;
      __dev.answer = '.pile';
      const pile = await new Promise(r => one.querySelectorAll('.pile').forEach(b => b.onclick = () => r(b.dataset.p)));
      piles[it.k] = pile; AUDIO.sfx('page');
      const forms = { agnete: ['den', 'det', 'dem'].map(p => [`Agnete er vild med ${p}.`, p === pron]),
        marked: [['stor', 'en'], ['stort', 'et'], ['store', 'pl']].map(([a, g]) => [`${S} er alt for ${a} til huset.`, g === it.g]),
        kirken: [['fin', 'en'], ['fint', 'et'], ['fine', 'pl']].map(([a, g]) => [`${S} er for ${a} til et loppemarked.`, g === it.g]),
        baal: [['gammel', 'en'], ['gammelt', 'et'], ['gamle', 'pl']].map(([a, g]) => [`${S} er alt for ${a}.`, g === it.g]) }[pile];
      one.querySelector('.chips').outerHTML = `<p class="small">${esc(PILES[pile])}. Why?</p><div class="chips col">${shuffle(forms).map(([t, ok]) => `<button class="mtap chip rs" data-ok="${ok ? 1 : 0}">${daHTML(t)}</button>`).join('')}</div>`;
      __dev.answer = Math.random() < .8 ? '.rs[data-ok="1"]' : '.rs';
      await new Promise(r => one.querySelectorAll('.rs').forEach(b => b.onclick = () => {
        if (b.dataset.ok === '1') { b.classList.add('right'); one.querySelectorAll('.rs').forEach(x => x.disabled = true); const t = b.textContent; TTS.say(t, false, 'kragen'); AUDIO.sfx('ok');
          const rk = pile === 'agnete' ? 'pron-den' : 'adj-er'; (G.rules[rk] = G.rules[rk] || []).includes(t) || G.rules[rk].push(t); setTimeout(r, FAST ? 0 : 1100); }
        else { mistakes++; b.disabled = true; b.classList.add('blot'); AUDIO.sfx('inkrun');
          $('.why', ov).textContent = pile === 'agnete' ? `${it.da.split(' ').pop()} is ${it.g === 'pl' ? 'plural: dem' : it.g === 'et' ? 'an et-word: det' : 'an en-word: den'}.` : `After er the adjective agrees with the noun: ${it.g === 'en' ? 'no ending (en-word)' : it.g === 'et' ? '-t (et-word)' : '-e (plural)'}.`; }
      }));
    }
    $('.one', ov).innerHTML = `<p class="da">${daHTML('Så er det delt.')}</p>`;
    await doneBtn(ov, 'Videre'); return { piles, mistakes };
  },

  /* ---- 3.3 · Genfærdet: the dead man gives his opinions. Agree (also / neither) or be surprised; never answer with the wrong verb ---- */
  async ghost(m) {
    const ov = miniOv('ghost', `<p class="mh">Genfærdet</p><p class="small">React to what he says. Agreeing calms him. Surprise makes him explain. A wrong reaction puts a candle out.</p><div class="hlog"></div><div class="hact"></div><div class="mbrow"></div>`);
    const log = $('.hlog', ov), act = $('.hact', ov); let clues = 0;
    const line = (who, html) => { const p = document.createElement('p'); p.innerHTML = `<b>${esc(who)}</b> ${html}`; log.appendChild(p); log.scrollTop = 1e6; };
    for (const L of m.lines) {
      line('Absalon', daHTML(L.da)); TTS.say(L.da, false, 'genfaerd');
      act.innerHTML = `<div class="chips col">${shuffle([[L.agree, 'a'], [L.surprise, 's'], ...L.wrong.map(w => [w, 'w'])]).map(([t, k]) => `<button class="mtap chip gr" data-k="${k}">${daHTML(t)}</button>`).join('')}</div><p class="why small"></p>`;
      __dev.answer = Math.random() < .8 ? '.gr:not([data-k="w"])' : '.gr';
      await new Promise(res => act.querySelectorAll('.gr').forEach(b => b.onclick = async () => {
        const k = b.dataset.k, t = b.textContent;
        if (k === 'w') { b.disabled = true; b.classList.add('blot'); candles(-1); $('.why', act).textContent = L.why; return; }
        act.querySelectorAll('.gr').forEach(x => x.disabled = true); line('Kragen', daHTML(t)); TTS.say(t, false, 'kragen');
        const rk = k === 'a' ? 'ogsaa-heller' : 'reakt'; (G.rules[rk] = G.rules[rk] || []); const ex = `${L.da} – ${t}`; if (!G.rules[rk].includes(ex)) G.rules[rk].push(ex);
        if (k === 'a') { candles(1); await sleep(900); }
        else { await sleep(700); line('Absalon', daHTML(L.clue.da) + `<br><i class="small">${esc(L.clue.en)}</i>`); await TTS.say(L.clue.da, false, 'genfaerd'); if (L.flag) G.flags[L.flag] = 1; clues++; await sleep(600); }
        res();
      }));
    }
    act.innerHTML = '';
    await doneBtn(ov, 'Videre'); return { candles: G.flags.lys, clues };
  },
};
