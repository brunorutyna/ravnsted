"""A tiny studio for Ravnsted's soundtrack.

Parts are written as notes (in beats), played by sampled instruments from a General MIDI SoundFont
(GeneralUser GS), then each part goes through its own effects chain (pedalboard) and into a mix bus.
A piece is rendered twice in a row and the second pass is kept, so reverb and delay tails from the end of
the loop are already ringing at its start: the file loops without a seam.
"""
import numpy as np, tinysoundfont, pedalboard as pb, os, random

SR = 44100
SF2 = os.environ.get('RAVNSTED_SF2', os.path.expanduser('~/GeneralUser-GS.sf2'))

# General MIDI programs used
P = dict(clean=27, muted=28, od=29, dist=30, bass_finger=33, bass_pick=34, organ_rock=18, organ_perc=17, organ_church=19,
         strings=48, slow_strings=49, choir=52, voice_oohs=53, flute=73, recorder=74, pan_flute=75, sitar=104, bell=14, fx_goblin=101, harp=46)

class Part:
    """Notes for one instrument. Times and lengths are in beats; pitch is a MIDI number (or a list for a chord)."""
    def __init__(self, program, bank=0, drums=False):
        self.program, self.bank, self.drums, self.notes, self.bends = program, bank, drums, [], []
    def add(self, t, pitch, dur, vel=100, bend=0, vib=0):
        for p in (pitch if isinstance(pitch, (list, tuple)) else [pitch]):
            self.notes.append((t, p, dur, vel, bend, vib))
        return self

def humanize(part, bpm, ms=7, vel=8, seed=1):
    """Players are never exactly on the grid."""
    r = random.Random(seed); spb = 60 / bpm
    part.notes = [(max(0, t + r.uniform(-1, 1) * ms / 1000 / spb), p, d, max(1, min(127, v + r.randint(-vel, vel))), b, vb) for (t, p, d, v, b, vb) in part.notes]
    return part

def render_part(part, beats, bpm, passes=2, block=128, seed=0):
    """Render a part for `passes` times `beats` (the loop played back to back). Returns stereo float32 (2, n)."""
    syn = tinysoundfont.Synth(samplerate=SR, gain=-3)
    sf = syn.sfload(SF2)
    ch = 9 if part.drums else 0
    syn.program_select(ch, sf, 128 if part.drums else part.bank, part.program, part.drums)
    syn.pitchbend_range(ch, 2)
    spb = 60 / bpm
    ev = []  # (sample, kind, note, vel, bend, vib, len)
    for k in range(passes):
        for (t, p, d, v, b, vb) in part.notes:
            s0 = int(round((t + k * beats) * spb * SR)); s1 = int(round((t + d + k * beats) * spb * SR))
            ev.append((max(0, s0), 1, p, v, b, vb, s1 - s0)); ev.append((s1, 0, p, 0, 0, 0, 0))
    ev.sort(key=lambda e: (e[0], e[1]))
    total = int(round(passes * beats * spb * SR)) + SR * 3  # a tail for releases
    out = np.zeros((total, 2), np.float32); pos = 0; i = 0
    active_mod = None  # (start, len, bend, vib)
    while pos < total:
        while i < len(ev) and ev[i][0] <= pos:
            s, on, p, v, b, vb, ln = ev[i]
            if on:
                syn.noteon(ch, p, v)
                if b or vb: active_mod = (s, ln, b, vb)
                else: syn.pitchbend(ch, 8192); active_mod = None
            else: syn.noteoff(ch, p)
            i += 1
        n = min(block, total - pos, (ev[i][0] - pos) if i < len(ev) else block) or block
        if active_mod:  # bends rise into the note; vibrato swells in after half the note
            s, ln, b, vb = active_mod; x = (pos - s) / max(1, ln)
            semis = -b * max(0.0, 1 - x * 5) + (vb * np.sin(2 * np.pi * 5.5 * (pos - s) / SR) * min(1, max(0, x * 2 - .5)) if vb else 0)
            syn.pitchbend(ch, int(np.clip(8192 + semis / 2 * 8191, 0, 16383)))
        buf = np.frombuffer(syn.generate(n), dtype=np.float32).reshape(-1, 2)
        out[pos:pos + len(buf)] = buf; pos += len(buf)
    return out.T.copy()

def fx(audio, chain):
    return pb.Pedalboard(chain)(audio, SR)

def pan(audio, p, width=1.0):
    """p in -1..1. Mono-sums first, so a part sits in one place."""
    m = audio.mean(axis=0)
    l, r = np.cos((p + 1) * np.pi / 4), np.sin((p + 1) * np.pi / 4)
    out = np.stack([m * l, m * r])
    if width < 1: out = out  # kept simple
    return out

def db(x): return 10 ** (x / 20)

# effects chains, built per part
def guitar_rhythm(drive=18):
    # tested against an AudioSet tagger: this chain on GM 30 reads as progressive rock / heavy metal
    return [pb.HighpassFilter(90), pb.Distortion(drive_db=drive), pb.LowpassFilter(5500), pb.PeakFilter(750, -5, .8), pb.PeakFilter(110, 3, 1), pb.PeakFilter(2600, 4, 1), pb.HighShelfFilter(7500, -8), pb.Compressor(-18, 3, 5, 80)]
def guitar_lead(delay=.375, drive=30, phase=True):
    ch = [pb.HighpassFilter(150), pb.Distortion(drive_db=drive), pb.LowpassFilter(6000), pb.PeakFilter(1200, 3, 1)]
    if phase: ch.append(pb.Phaser(rate_hz=.4, depth=.6, centre_frequency_hz=900, feedback=.4, mix=.45))
    ch += [pb.Delay(delay_seconds=delay, feedback=.38, mix=.28), pb.Reverb(room_size=.7, damping=.5, wet_level=.22, dry_level=.85)]
    return ch
def organ(drive=8):
    return [pb.Distortion(drive_db=drive), pb.LowpassFilter(7000), pb.Chorus(rate_hz=5.8, depth=.35, centre_delay_ms=4, feedback=0, mix=.6), pb.Reverb(room_size=.5, wet_level=.18, dry_level=.9)]
def bass(drive=10):
    return [pb.HighpassFilter(35), pb.Distortion(drive_db=drive), pb.LowpassFilter(2600), pb.Compressor(-20, 4, 5, 100), pb.Gain(2)]
def drums():
    return [pb.Compressor(-16, 3, 2, 60), pb.Reverb(room_size=.35, damping=.6, wet_level=.12, dry_level=.95)]
def pad(size=.9):
    return [pb.LowpassFilter(5000), pb.Reverb(room_size=size, damping=.4, wet_level=.45, dry_level=.6)]
def clean(trem=0):
    ch = [pb.Chorus(rate_hz=.8, depth=.25, mix=.4), pb.Delay(delay_seconds=.5, feedback=.3, mix=.2), pb.Reverb(room_size=.75, wet_level=.3, dry_level=.8)]
    return ch

def mix(stems, beats, bpm):
    """stems: list of (stereo audio, gain dB). Masters the whole render, then keeps the second pass: one seamless loop."""
    spb = 60 / bpm; L = int(round(beats * spb * SR))
    n = max(s.shape[1] for s, _ in stems); bus = np.zeros((2, n), np.float32)
    for s, g in stems: bus[:, :s.shape[1]] += s * db(g)
    master = pb.Pedalboard([pb.HighpassFilter(30), pb.LowShelfFilter(90, 1.5), pb.Compressor(-14, 2.5, 10, 150), pb.Gain(3), pb.Limiter(-1.0, 120)])
    out = master(bus, SR)
    return out[:, L:2 * L].copy()
