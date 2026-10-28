#!/usr/bin/env python3
"""Renders the soundtrack into audio/music/*.mp3.
  pip install tinysoundfont pedalboard numpy     (tinysoundfont: pip install --no-deps tinysoundfont)
  RAVNSTED_SF2=/path/GeneralUser-GS.sf2 python3 tools/music/build.py [name ...]
The SoundFont is GeneralUser GS by S. Christian Collins (github.com/mrbumpy409/GeneralUser-GS)."""
import sys, os, time, subprocess, numpy as np, pedalboard as pb
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tracks
from studio import render_part, fx, pan, mix, humanize, SR
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'audio', 'music')
NAMES = ['title', 'daggry', 'torv', 'eftermiddag', 'skumring', 'nat', 'midnat', 'slut', 'dodsbo', 'ulvetime']
def build(name):
    t0 = time.time(); parts, beats, bpm = getattr(tracks, name)()
    stems = []
    for k, (part, chain, p, g, takes) in enumerate(parts):
        for take in range(takes):
            humanize(part, bpm, ms=6 if not part.drums else 4, seed=100 * k + take + 1)
            a = fx(render_part(part, beats, bpm), chain)
            stems.append((pan(a, p if take == 0 else -p), g - (1.5 if takes > 1 else 0)))
    loop = mix(stems, beats, bpm)
    # same loudness for every piece, measured above 120 Hz (what a phone speaker plays: the sub is felt, not counted); a fixed gain keeps the loop seamless
    audible = pb.Pedalboard([pb.HighpassFilter(120), pb.HighpassFilter(120)])(loop, SR)
    loop = loop * min(.145 / np.sqrt((audible ** 2).mean()), .89 / np.abs(loop).max())
    os.makedirs(OUT, exist_ok=True)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', 'pipe:0', '-c:a', 'libmp3lame', '-b:a', '128k', f'{OUT}/{name}.mp3'],
                   input=np.ascontiguousarray(loop.T).astype(np.float32).tobytes(), check=True)
    print(f'{name}: {loop.shape[1] / SR:.1f} s, peak {np.abs(loop).max():.2f}, rms {np.sqrt((loop ** 2).mean()):.3f}, {time.time() - t0:.0f} s to render', flush=True)
if __name__ == '__main__':
    for n in (sys.argv[1:] or NAMES): build(n)
