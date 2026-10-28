#!/usr/bin/env python3
"""Builds the character voices: every line in tools/speech.json is spoken by a Danish neural voice (Piper,
da_DK talesyntese), reshaped per character with the WORLD vocoder (pitch, melody, vocal-tract size, breath,
tremble, an undertone for creatures) plus a room. Clips are packed into small mp3 sprites per voice
(audio/voice/*.mp3) with js/voicemap.js mapping each line to [file, start, duration].

  pip install piper-tts sherpa-onnx pyworld soundfile numpy
  RAVNSTED_TTS=/path/to/models python3 tools/voices.py
  GOOGLE_TTS_KEYFILE=service-account.json python3 tools/voices.py   (natural voices: Google Chirp 3 HD, one actor per character)
  (or GOOGLE_TTS_KEY=<API key>). Keys stay outside the repo.
The model folder must hold vits-piper-da_DK-talesyntese-medium/ (from the sherpa-onnx tts-models release).
Rendered clips are cached in RAVNSTED_CACHE (default ~/.cache/ravnsted-voices), so reruns only render new lines."""
import os, sys, json, hashlib, subprocess, io, re
import numpy as np, soundfile as sf
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.environ.get('RAVNSTED_TTS', os.path.expanduser('~/tts'))
CACHE = os.environ.get('RAVNSTED_CACHE', os.path.expanduser('~/.cache/ravnsted-voices'))
SR = 24000
# f0: pitch · rng: how far the melody moves · fm: vocal-tract size (>1 smaller, <1 bigger) · br: breath 0..1
# trem: (Hz, cents) tremble · speed · layer: an undertone an octave down · fx: ffmpeg colour and room
V = {
  'narrator': dict(f0=1.0, rng=1.0, fm=1.0, br=0, trem=None, speed=.95, fx='highpass=f=70', raw=True),
  'word':     dict(f0=1.0, rng=1.0, fm=1.0, br=0, trem=None, speed=.85, fx='highpass=f=70', raw=True),
  'kragen':   dict(f0=.94, rng=.85, fm=.98, br=.15, trem=None, speed=1.0, fx='highpass=f=80,equalizer=f=2500:t=q:w=1:g=2'),
  'sidsel':   dict(f0=1.82, rng=1.3, fm=1.17, br=.2, trem=(6.5, 14), speed=1.06, fx='highpass=f=130'),
  'gertrud':  dict(f0=1.62, rng=1.45, fm=1.14, br=0, trem=None, speed=.88, fx='highpass=f=110,equalizer=f=3200:t=q:w=1:g=3'),
  'bodil':    dict(f0=1.45, rng=.8, fm=1.1, br=.3, trem=None, speed=1.04, fx='highpass=f=100,equalizer=f=900:t=q:w=1:g=3'),
  'hulda':    dict(f0=1.3, rng=.55, fm=1.02, br=.08, trem=None, speed=.86, fx='highpass=f=60,aecho=0.8:0.55:90|180:0.25|0.14', layer=.25),
  'absalon':  dict(f0=1.1, rng=.8, fm=1.02, br=.35, trem=(5.2, 30), speed=.86, fx='highpass=f=110,lowpass=f=6500'),
  'mads':     dict(f0=1.18, rng=1.4, fm=1.08, br=.08, trem=None, speed=1.12, fx='highpass=f=150,equalizer=f=1400:t=q:w=1.5:g=4'),
  'foged':    dict(f0=.88, rng=.8, fm=.96, br=.03, trem=None, speed=.92, fx='highpass=f=50,equalizer=f=150:t=q:w=1:g=3'),
  'jens':     dict(f0=1.24, rng=1.1, fm=1.05, br=.1, trem=None, speed=1.05, fx='highpass=f=100'),
  'mosekonen':dict(f0=1.15, rng=1.6, fm=1.05, br=.42, trem=(3.5, 40), speed=.84, fx='highpass=f=70,aecho=0.8:0.55:60|130|260:0.25|0.18|0.1,lowpass=f=5600', layer=.3),
}
# Google Chirp 3 HD: natural Danish with real intonation. One voice actor per character; creatures keep a little shaping.
# rate: speaking rate · shape: optional WORLD shaping on top (same keys as V) · fx: ffmpeg colour and room
GV = {
  'narrator': dict(voice='Charon', rate=.95, fx='highpass=f=60'),
  'word':     dict(voice='Iapetus', rate=.85, fx='highpass=f=60'),
  'kragen':   dict(voice='Algenib', rate=1.0, fx='highpass=f=70'),
  'sidsel':   dict(voice='Achernar', rate=1.08, fx='highpass=f=90'),
  'gertrud':  dict(voice='Pulcherrima', rate=.95, fx='highpass=f=90,equalizer=f=3200:t=q:w=1:g=2'),
  'bodil':    dict(voice='Gacrux', rate=1.02, fx='highpass=f=80'),
  'hulda':    dict(voice='Vindemiatrix', rate=.88, fx='highpass=f=50,aecho=0.8:0.5:90|180:0.2|0.1', shape=dict(f0=.86, rng=.7, fm=.95, br=.05, trem=None, layer=.18)),
  'absalon':  dict(voice='Sadaltager', rate=.88, fx='highpass=f=90', shape=dict(f0=1.0, rng=1.0, fm=1.0, br=.12, trem=(5.2, 16))),  # ffmpeg's vibrato filter made NaNs
  'mads':     dict(voice='Fenrir', rate=1.1, fx='highpass=f=110,equalizer=f=1400:t=q:w=1.5:g=2'),
  'foged':    dict(voice='Alnilam', rate=.92, fx='highpass=f=50'),
  'jens':     dict(voice='Zubenelgenubi', rate=1.04, fx='highpass=f=80'),
  'mosekonen':dict(voice='Despina', rate=.86, fx='highpass=f=60,aecho=0.8:0.5:60|130|260:0.22|0.15|0.08,lowpass=f=6000', shape=dict(f0=.82, rng=1.3, fm=.94, br=.3, trem=(3.5, 30), layer=.25)),
}
ENGINE = 'google' if (os.environ.get('GOOGLE_TTS_KEY') or os.environ.get('GOOGLE_TTS_KEYFILE')) else 'piper'
_tok = [None, 0]
def bearer():
    """A self-signed JWT from the service account (no OAuth round trip needed), renewed every 50 minutes."""
    import time, jwt
    if _tok[0] and time.time() < _tok[1]: return _tok[0]
    k = json.load(open(os.environ['GOOGLE_TTS_KEYFILE'])); now = int(time.time())
    _tok[0] = jwt.encode({'iss': k['client_email'], 'sub': k['client_email'], 'aud': 'https://texttospeech.googleapis.com/', 'iat': now, 'exp': now + 3600}, k['private_key'], algorithm='RS256', headers={'kid': k['private_key_id']})
    _tok[1] = now + 3000; return _tok[0]
def google(text, who):
    import urllib.request, base64
    g = GV[who]
    body = json.dumps({'input': {'text': text}, 'voice': {'languageCode': 'da-DK', 'name': f"da-DK-Chirp3-HD-{g['voice']}"},
                       'audioConfig': {'audioEncoding': 'LINEAR16', 'sampleRateHertz': 24000, 'speakingRate': g['rate']}}).encode()
    url, hdr = 'https://texttospeech.googleapis.com/v1/text:synthesize', {'Content-Type': 'application/json'}
    if os.environ.get('GOOGLE_TTS_KEYFILE'): hdr['Authorization'] = 'Bearer ' + bearer()
    else: url += '?key=' + os.environ['GOOGLE_TTS_KEY']
    req = urllib.request.Request(url, data=body, headers=hdr)
    import time, urllib.error
    for attempt in range(8):
        try:
            with urllib.request.urlopen(req, timeout=60) as r: wav = base64.b64decode(json.loads(r.read())['audioContent'])
            break
        except urllib.error.HTTPError as e:  # 429: Google's per-minute quota; wait it out
            if attempt == 7 or e.code not in (429, 500, 503): raise
            time.sleep(15 * (attempt + 1))
        except Exception:
            if attempt == 7: raise
            time.sleep(3 * (attempt + 1))
    a, sr = sf.read(io.BytesIO(wav), dtype='float64'); return a, sr

_pv = None
def piper(text, speed):
    global _pv
    from piper import PiperVoice, SynthesisConfig
    if _pv is None: _pv = PiperVoice.load(f'{MODELS}/vits-piper-da_DK-talesyntese-medium/da_DK-talesyntese-medium.onnx')
    cfg = SynthesisConfig(length_scale=1 / speed, noise_scale=.667, noise_w_scale=.8)
    a = np.concatenate([c.audio_float_array for c in _pv.synthesize(text, syn_config=cfg)]); return a.astype(np.float64), 22050
def warp(sp, fm):
    if abs(fm - 1) < 1e-3: return sp
    n = sp.shape[1]; k = np.arange(n); src = np.clip(k / fm, 0, n - 1)
    return np.array([np.interp(src, k, row) for row in sp])
def shape(x, sr, v, seed):
    import pyworld as pw
    rnd = np.random.default_rng(seed)
    f0, t = pw.harvest(x, sr, f0_floor=60, f0_ceil=600, frame_period=5); sp = pw.cheaptrick(x, f0, t, sr); ap = pw.d4c(x, f0, t, sr)
    voiced = f0 > 0
    if voiced.any():
        m = np.exp(np.mean(np.log(f0[voiced])))
        f0 = np.where(voiced, m * np.exp((np.log(np.maximum(f0, 1)) - np.log(m)) * v['rng']) * v['f0'], 0)
        if v['trem']:
            rate, cents = v['trem']; f0 = np.where(voiced, f0 * 2 ** (cents / 1200 * np.sin(2 * np.pi * rate * t + rnd.random() * 6)), 0)
    sp = warp(sp, v['fm'])
    if v['br']: ap = np.clip(ap + (1 - ap) * v['br'] * np.linspace(.3, 1, ap.shape[1])[None, :], 0, 1)
    y = pw.synthesize(f0, sp, ap, sr, 5)
    if v.get('layer'):
        y2 = pw.synthesize(f0 * .5, warp(sp, .85), np.clip(ap + .2, 0, 1), sr, 5); L = min(len(y), len(y2)); y = y[:L] + y2[:L] * v['layer']
    return y
def ff(y, sr, fx):
    buf = io.BytesIO(); sf.write(buf, y.astype(np.float32), sr, format='WAV'); buf.seek(0)
    r = subprocess.run(['ffmpeg', '-loglevel', 'error', '-f', 'wav', '-i', 'pipe:0', '-af', f"{fx},adelay=60|60,apad=pad_dur=0.25,loudnorm=I=-17:TP=-1.5:LRA=11", '-ac', '1', '-ar', str(SR), '-f', 'f32le', 'pipe:1'], input=buf.read(), capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32)
def cfg(who): return dict(engine='google', **GV[who]) if ENGINE == 'google' else V[who]
def hid(item): return hashlib.sha1((json.dumps(cfg(item['who']), sort_keys=True) + '|' + item['text']).encode()).hexdigest()[:16]
def render(item):
    p = f"{CACHE}/{item['who']}/{hid(item)}.npy"
    if os.path.exists(p): return np.load(p)
    who = item['who']
    if ENGINE == 'google':
        g = GV[who]; x, sr = google(item['text'], who)
        y = shape(x, sr, dict(speed=1, **g['shape']), int(hid(item)[:8], 16)) if g.get('shape') else x
        fxc = g['fx']
    else:
        v = V[who]; x, sr = piper(item['text'], v['speed'])
        y = x if v.get('raw') else shape(x, sr, v, int(hid(item)[:8], 16)); fxc = v['fx']
    y = y / (np.max(np.abs(y)) + 1e-9) * .9
    z = ff(y, sr, fxc)
    if not np.isfinite(z).all() or not np.abs(z).max() > 1e-3: raise ValueError(f"bad audio for {who}: {item['text'][:40]}")  # never cache silence or NaN
    os.makedirs(os.path.dirname(p), exist_ok=True); np.save(p, z); return z
def pack(items, chunk_sec=40):
    """Group clips per voice into ~40 s sprites, encode each once, and map every line to [file, start, dur]."""
    out = f'{ROOT}/audio/voice'; os.makedirs(out, exist_ok=True)
    for f in os.listdir(out): os.remove(f'{out}/{f}')
    vmap = {}; gap = np.zeros(int(.2 * SR), np.float32)
    by = {}
    for it in items: by.setdefault(it['who'], []).append(it)
    for who, lst in by.items():
        k = 0; cur = []; pos = 0.0
        def flush():
            nonlocal k, cur, pos
            if not cur: return
            name = f'{who}-{k}'; pcm = np.concatenate([gap] + [c for c, _ in cur])
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', 'pipe:0', '-c:a', 'libmp3lame', '-b:a', '32k', f'{out}/{name}.mp3'], input=pcm.tobytes(), check=True)
            for _, (key, start, dur) in cur: vmap[key] = [name, round(start, 3), round(dur, 3)]
            k += 1; cur = []; pos = 0.0
        for it in lst:
            z = render(it); seg = np.concatenate([z, gap]); start = pos + len(gap) / SR
            cur.append((seg, (it['key'], start, len(z) / SR))); pos += len(seg) / SR
            if pos > chunk_sec: flush()
        flush()
    with open(f'{ROOT}/js/voicemap.js', 'w') as f:
        f.write('/* Generated by tools/voices.py: voice clip for each spoken line → [sprite, start s, duration s]. Do not edit. */\nconst VOICEMAP = ')
        json.dump(vmap, f, ensure_ascii=False, separators=(',', ':')); f.write(';\n')
    return vmap
if __name__ == '__main__':
    items = json.load(open(f'{ROOT}/tools/speech.json'))
    args = sys.argv[1:]
    if '--render' in args:  # render only (used to split work across processes): --render i n
        i, n = int(args[args.index('--render') + 1]), int(args[args.index('--render') + 2])
        todo = [it for j, it in enumerate(items) if j % n == i]
        for j, it in enumerate(todo):
            render(it)
            if j % 25 == 0: print(f'[{i}] {j}/{len(todo)}', flush=True)
        sys.exit(0)
    if ENGINE == 'google':  # network-bound: render with a few requests in flight, then pack
        from concurrent.futures import ThreadPoolExecutor
        todo = [it for it in items if not os.path.exists(f"{CACHE}/{it['who']}/{hid(it)}.npy")]
        print(f'Google Chirp 3 HD: {len(todo)} lines to render', flush=True)
        with ThreadPoolExecutor(2) as ex:
            for j, _ in enumerate(ex.map(render, todo)):
                if j % 50 == 0: print(f'  {j}/{len(todo)}', flush=True)
    vm = pack(items); size = sum(os.path.getsize(f'{ROOT}/audio/voice/{f}') for f in os.listdir(f'{ROOT}/audio/voice'))
    print(f'{len(vm)} clips in {len(os.listdir(ROOT + "/audio/voice"))} sprites, {size / 1e6:.1f} MB')
