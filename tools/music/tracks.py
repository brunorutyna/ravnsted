"""Ravnsted's soundtrack: progressive, psychedelic heavy rock. One piece per time of day, a title song and an outro.
Each function returns (parts, beats, bpm). Parts are (Part, effects chain, pan, gain dB, takes).
Notes: E2 = 40 (low E string), A2 = 45, D3 = 50."""
from studio import *
import pedalboard as pb

E1, E2, A2, D2, B1 = 28, 40, 45, 38, 35
PC = lambda r: [r, r + 7, r + 12]            # power chord
P5 = lambda r: [r, r + 7]

def kit(part, t0, pattern, step=.5, vel=100, accents=None):
    """pattern: one token per step, letters played together: k kick, s snare, h hat, o open hat, c crash, r ride, b ride bell,
    1 2 3 high/mid/low tom, f floor tom, x rimshot, '.' rest."""
    M = dict(k=36, s=38, h=42, o=46, c=49, r=51, b=53, x=37, f=41, **{'1': 50, '2': 47, '3': 45})
    for i, tok in enumerate(pattern.split()):
        for ch in tok:
            if ch in M:
                v = vel - (14 if ch in 'hr' and i % 2 else 0) + (8 if accents and i in accents else 0)
                part.add(t0 + i * step, M[ch], step * .9, v)

def riff(part, t0, seq, root, step=.5, vel=105, chord=PC):
    """seq: tokens like '0', '3', '-' (hold), '.' (rest), 'm0' (palm-muted single note)."""
    toks = seq.split(); i = 0
    while i < len(toks):
        tk = toks[i]
        if tk in '.-': i += 1; continue
        n = 1
        while i + n < len(toks) and toks[i + n] == '-': n += 1
        if tk.startswith('m'): part.add(t0 + i * step, root + int(tk[1:]), step * .55, vel - 12)
        else: part.add(t0 + i * step, chord(root + int(tk)), step * n * .96, vel)
        i += n
    return part

def bassline(part, t0, seq, root, step=.5, vel=100):
    toks = seq.split(); i = 0
    while i < len(toks):
        tk = toks[i]
        if tk in '.-': i += 1; continue
        n = 1
        while i + n < len(toks) and toks[i + n] == '-': n += 1
        part.add(t0 + i * step, root + int(tk.lstrip('m')), step * n * .92, vel)
        i += n

def melody(part, t0, seq, root, step=.5, vel=100):
    """seq tokens: semitone offsets from root, '-' hold, '.' rest, suffix ^ = bend up into the note, ~ = vibrato."""
    toks = seq.split(); i = 0
    while i < len(toks):
        tk = toks[i]
        if tk in '.-': i += 1; continue
        n = 1
        while i + n < len(toks) and toks[i + n] == '-': n += 1
        b = 2 if '^' in tk else 0; vb = .35 if '~' in tk or n >= 3 else 0
        part.add(t0 + i * step, root + int(tk.strip('^~')), step * n * .97, vel, bend=b, vib=vb)
        i += n

def stack(t0, chords, dur, part, vel=80):
    for k, c in enumerate(chords): part.add(t0 + k * dur, c, dur * .98, vel)

# ------------------------------------------------------------------ TITLE: "Ravnsted"
def title():
    bpm = 92; bar = 4
    org, choir, gtr, lead, bas, dr, bell = Part(P['organ_church']), Part(P['choir']), Part(P['dist']), Part(P['dist']), Part(P['bass_pick']), Part(0, drums=True), Part(P['bell'])
    # A · 4 bars: the town at night. Church organ, choir, a bell, a heartbeat on the floor tom
    em, F, D, B7 = [52, 55, 59, 64], [53, 57, 60, 65], [50, 54, 57, 62], [47, 51, 54, 57]
    stack(0, [em, F, em, D], bar, org, 72); stack(0, [em, F, em, B7], bar, choir, 70)
    for b in range(4): bell.add(b * bar, 76, 3, 70); kit(dr, b * bar, 'f . . . . . f f', vel=82)
    bassline(bas, 0, '0 - - - - - - - 1 - - - - - - - 0 - - - - - - - -2 - - - -1 - - -', E1, vel=88)
    # B · 8 bars: the riff
    R1 = '0 . m0 3 2 . 0 . 6 5 . 3 . 1 0 .'          # E . . G F# . E . | Bb A . G . F E .
    R2 = '0 . m0 3 2 . 0 . 7 - 6 - 5 3 1 .'
    for k in range(8):
        t = 16 + k * bar; seq = R1 if k % 2 == 0 else R2
        riff(gtr, t, seq, E2); bassline(bas, t, seq.replace('m', ''), E1, vel=100)
        kit(dr, t, ('kc' if k % 4 == 0 else 'kr') + ' r sr r kr kr sr r', step=.5)
        if k >= 4: stack(t, [[52, 59, 64] if k % 2 == 0 else [53, 57, 62]], bar, org, 64)
    # C · 8 bars: the riff with a lead on top
    L = ['12 - - 13^ 12 - 10 - 7 - - 8 7 - 5 -', '7 - 10 - 12^ - - - 15 - 13 - 12 - 10 -',
         '12 - - 13^ 12 - 10 - 7 - 8 - 10 - 11^ -', '12~ - - - - - - - . . 19 - 17 - 15 -',
         '16^ - 15 - 13 - 12 - 11 - 12 - 13 - - -', '12 - 10 - 8 - 7 - 8 - 7 - 5 - 4 -',
         '7 - 8 - 10 - 12 - 13 - 15 - 16^ - 15 -', '12~ - - - - - - - - - - - . . . .']
    for k in range(8):
        t = 48 + k * bar; seq = R1 if k % 2 == 0 else R2
        riff(gtr, t, seq, E2); bassline(bas, t, seq.replace('m', ''), E1, vel=100)
        kit(dr, t, ('kc' if k % 4 == 0 else 'kr') + ' r sr r kr kr sr r', step=.5)
        melody(lead, t, L[k], E2 + 24, vel=104)
        stack(t, [[52, 59, 64] if k % 2 == 0 else [53, 57, 60]], bar, org, 58)
    # D · 4 bars: half-time, everything rings, then the organ alone leads back to the town
    for k, (r, ch) in enumerate([(0, em), (-4, [48, 52, 55, 60]), (-7, [45, 48, 52, 57]), (-5, B7)]):
        t = 80 + k * bar; gtr.add(t, PC(E2 + r), bar * .95, 112); bas.add(t, E1 + r, bar * .95, 104); choir.add(t, ch, bar, 76)
        kit(dr, t, 'kc . . . s . . . k . k . s . 1 2' if k < 3 else 'kc . . . s . . . 1 1 2 2 3 3 f f', step=.25 * 2)
    return [(gtr, guitar_rhythm(), -.75, 3, 2), (lead, guitar_lead(.49), .2, -3, 1), (org, organ(4), .35, -5, 1), (choir, pad(.92), -.3, -7, 1),
            (bas, bass(), 0, -2, 1), (dr, drums(), 0, -1, 1), (bell, pad(.95), .5, -8, 1)], 96, bpm

# ------------------------------------------------------------------ DAGGRY · dawn: a cold, slow psych-folk morning (6/8, D dorian)
def daggry():
    bpm = 168; bar = 6  # the beat here is an eighth note
    g, fl, st, org, bas, dr = Part(P['clean']), Part(P['flute']), Part(P['slow_strings']), Part(P['organ_perc']), Part(P['bass_finger']), Part(0, drums=True)
    D3 = 50
    chords = [[0, 7, 14, 15, 19, 26], [-7, 2, 11, 14, 19, 23], [0, 7, 14, 15, 19, 26], [-5, 2, 10, 12, 19, 22],
              [-4, 3, 9, 14, 17, 21], [-2, 5, 10, 14, 17, 22], [0, 7, 12, 15, 19, 24], [-5, 2, 7, 11, 14, 19]]
    roots = [0, -7, 0, -5, -4, -2, 0, -5]
    pads = [[50, 57, 60, 65], [50, 55, 59, 62], [50, 57, 60, 65], [45, 52, 55, 60], [46, 53, 57, 62], [48, 52, 55, 60], [50, 53, 57, 62], [45, 52, 55, 61]]
    tune = ['. . . 14 - 15 17 - - - 15 14', '12 - - - - - . . . . . .', '. . . 14 - 15 17 - 19 - 21 -', '19 - - 17 - 15 14 - - - - -',
            '15 - - 14 - 12 10 - - 12 - -', '14 - - 12 - 10 9 - - - - -', '7 - 9 10 - 12 14 - - 15 - 17', '14 - - - - - . . . . . .']
    for k in range(24):
        t = k * bar; c = chords[k % 8]
        for i, o in enumerate([0, 1, 2, 3, 4, 2]): g.add(t + i, D3 + c[o], 2.6, 74 if i else 84)
        bas.add(t, D2 + roots[k % 8], 2.8, 86); bas.add(t + 3, D2 + roots[k % 8] + (7 if k % 2 else 12), 2.8, 76)
        if k >= 4: st.add(t, pads[k % 8], bar * .98, 52 if k < 8 else 62)
        if 8 <= k < 24 and k % 2 == 0: melody(fl, t, tune[((k - 8) // 2) % 8], D3 + 12, step=1, vel=82)
        if k >= 4: kit(dr, t, ('kr' if k % 8 == 4 else 'k') + ' r r xr r r', step=1, vel=64 if k < 8 else 76)
        if k >= 16: org.add(t, [D3 + roots[k % 8] % 12 + 12, D3 + roots[k % 8] % 12 + 19], bar * .95, 48)
    return [(g, clean(), -.35, 0, 1), (fl, pad(.75), .35, -2, 1), (st, pad(.95), 0, -8, 1), (org, organ(2), .5, -9, 1), (bas, bass(4), 0, -3, 1), (dr, drums(), 0, -5, 1)], 24 * bar, bpm

# ------------------------------------------------------------------ TORV · morning to noon: the market, a 7/8 riff (A dorian)
def torv():
    bpm = 144; bar = 3.5
    gtr, lead, org, bas, dr = Part(P['dist']), Part(P['dist']), Part(P['organ_rock']), Part(P['bass_pick']), Part(0, drums=True)
    R1, R2 = '0 . 3 m0 5 3 7', '0 . 3 m0 10 8 7'
    A1 = 33
    for k in range(32):
        t = k * bar; seq = R1 if k % 4 != 3 else R2
        riff(gtr, t, seq, A2); bassline(bas, t, seq.replace('m', ''), A1)
        kit(dr, t, ('kc' if k % 8 == 0 else 'k') + ' h sh h k sh ' + ('o' if k % 4 == 3 else 'h'), vel=104)
        if 8 <= k < 32: [org.add(t + o, [57, 60, 64, 67] if k % 4 != 3 else [55, 59, 62, 65], .35, 82) for o in (1, 2.5)]
    L = ['12 - 15 - 17^ - -', '19 - 17 15 - 12 -', '15 - 17 - 19 - 22^', '24 - - - - - -',
         '22 21 19 - 17 - 15', '17 - 15 12 - 10 -', '12 - 15 17 19 22 24^', '24~ - - - - - -']
    for k in range(16, 32): melody(lead, k * bar, L[(k - 16) % 8], A2 + 12, vel=104)
    return [(gtr, guitar_rhythm(), -.75, 2, 2), (lead, guitar_lead(.31), .25, -3, 1), (org, organ(10), .4, -5, 1), (bas, bass(), 0, -2, 1), (dr, drums(), 0, 0, 1)], 32 * bar, bpm

# ------------------------------------------------------------------ EFTERMIDDAG · afternoon: a 5/4 groove with a wah lead (E dorian)
def eftermiddag():
    bpm = 116; bar = 5
    gtr, lead, org, bas, dr = Part(P['dist']), Part(P['dist']), Part(P['organ_rock']), Part(P['bass_finger']), Part(0, drums=True)
    R1, R2 = '0 . m0 3 . 5 m0 7 5 3', '0 . m0 3 . 5 m0 10 9 7'
    for k in range(20):
        t = k * bar
        if k < 16:
            seq = R1 if k % 2 == 0 else R2; riff(gtr, t, seq, E2); bassline(bas, t, seq.replace('m', ''), E1)
            kit(dr, t, ('kc' if k % 4 == 0 else 'k') + ' h s h k k s h kh o', vel=100)
            org.add(t, [52, 55, 59, 61] if k % 2 == 0 else [50, 54, 57, 62], bar * .96, 66)
        else:  # half-time break before the loop starts again
            r = [0, 3, 5, 7][k - 16]; gtr.add(t, PC(E2 + r), bar * .95, 110); bas.add(t, E1 + r, bar * .95, 100); org.add(t, [52 + r, 59 + r, 64 + r], bar, 70)
            kit(dr, t, 'kc . . . s . . . k . . . s . . . 1 2 3 f', step=.25)
    L = ['12 - 14 15 - 17 - 19^ - -', '17 15 14 - 12 - 10 - 12 -', '19 - 22^ - 21 19 - 17 - -', '19~ - - - - - - . . .',
         '24^ - 22 - 21 - 19 - 17 -', '15 - 17 - 19 - 21 22 24 -', '26^ - 24 - 22 - 21 19 - 17', '19~ - - - - - - - - -']
    for k in range(8, 16): melody(lead, k * bar, L[k - 8], E2 + 12, vel=102)
    return [(gtr, guitar_rhythm(), -.7, 2, 2), (lead, [pb.Phaser(rate_hz=2.2, depth=.9, centre_frequency_hz=1100, feedback=.6, mix=.7)] + guitar_lead(.39, phase=False), .3, -2, 1),
            (org, organ(8), .45, -6, 1), (bas, bass(), 0, -2, 1), (dr, drums(), 0, 0, 1)], 20 * bar, bpm

# ------------------------------------------------------------------ SKUMRING · dusk: doom, a tritone that will not resolve
def skumring():
    bpm = 62; bar = 4
    gtr, lead, choir, org, bas, dr, bell = Part(P['dist']), Part(P['dist']), Part(P['choir']), Part(P['organ_church']), Part(P['bass_pick']), Part(0, drums=True), Part(P['bell'])
    seqA, seqB = '0 - - - 6 - - -', '5 - 3 - 2 - 1 -'
    for k in range(12):
        t = k * bar; seq = seqA if k % 2 == 0 else seqB
        riff(gtr, t, seq, E2, step=.5, vel=114)
        bassline(bas, t, seq, E1, step=.5)
        kit(dr, t, ('kc' if k % 4 == 0 else 'k') + ' . . . s . . . k . k . s . . 1', step=.25, vel=110)
        choir.add(t, [52, 55, 59] if k % 2 == 0 else [53, 58, 62], bar, 70 if k < 4 else 80)
        if k % 2 == 0: bell.add(t, 64, 3.5, 62)
        if k >= 4: org.add(t, [40, 47, 52, 58] if k % 2 == 0 else [41, 48, 53], bar * .98, 60)
    L = ['. . 12 - 13^ - 12 - 10 - 7 - - - - -', '6^ - - - - - 7 - 5 - 3 - 1 - 0 -', '. . 15 - 16^ - 15 - 13 - 12 - 10 - 12 -', '13~ - - - - - - - - - - - . . . .']
    for k in range(4, 12): melody(lead, k * bar, L[(k - 4) % 4], E2 + 12, step=.25, vel=100)
    return [(gtr, guitar_rhythm(20), -.8, 3, 2), (lead, guitar_lead(.72), .25, -4, 1), (choir, pad(.95), 0, -5, 1), (org, organ(3), .4, -7, 1), (bas, bass(14), 0, -1, 1),
            (dr, [pb.Compressor(-16, 3, 2, 60), pb.Reverb(room_size=.75, wet_level=.25, dry_level=.9)], 0, 0, 1), (bell, pad(.95), -.5, -9, 1)], 12 * bar, bpm

# ------------------------------------------------------------------ NAT · night: a psychedelic 6/8 drift (B minor)
def nat():
    bpm = 200; bar = 6  # eighth-note beat
    org, g, lead, swell, bas, dr = Part(P['organ_rock']), Part(P['clean']), Part(P['dist']), Part(P['dist']), Part(P['bass_finger']), Part(0, drums=True)
    B2 = 47
    prog = [(0, [0, 3, 7]), (-4, [0, 4, 7]), (-7, [0, 3, 7]), (-5, [0, 4, 7, 10])]
    for k in range(24):
        t = k * bar; r, ch = prog[(k // 2) % 4]
        for i, o in enumerate([0, 1, 2, 3, 2, 1]): org.add(t + i, B2 + 12 + r + ([*ch, 12])[o], 1.1, 70)
        for i in (0, 3): g.add(t + i, [B2 + r + 12 + x for x in ch], 2.8, 64)
        bas.add(t, B1 + r, 2.8, 88); bas.add(t + 3, B1 + r + 7, 2.8, 76)
        if k >= 4: kit(dr, t, ('kc' if k % 8 == 4 else 'k') + ' 3 1 sx 2 3', step=1, vel=80)
        if k % 8 == 6: swell.add(t, PC(B2 + r), bar * 2 * .95, 90)
    L = ['12 - - 15 - 14 12 - - 10 - -', '7~ - - - - - - - - . . .', '14 - - 15 - 17 19^ - - 17 - 15', '14~ - - - - - - - - - . .',
         '19 - - 17 - 15 14 - 12 10 - 9', '10~ - - - - - 7 - 9 10 - 12', '14 - - 15 - 17 19 - - 22^ - -', '19~ - - - - - - - - - . .']
    for k in range(8, 24): melody(lead, k * bar, L[(k - 8) % 8], B2 + 12, step=1, vel=96)
    return [(org, organ(6) + [pb.Phaser(rate_hz=.25, depth=.8, mix=.5)], .4, -3, 1), (g, clean(), -.5, -5, 1), (lead, guitar_lead(.9), .2, -3, 1),
            (swell, guitar_rhythm() + [pb.Reverb(room_size=.9, wet_level=.4)], -.7, -4, 2), (bas, bass(6), 0, -2, 1), (dr, drums(), 0, -2, 1)], 24 * bar, bpm

# ------------------------------------------------------------------ MIDNAT · midnight: frantic 7/8 in E phrygian
def midnat():
    bpm = 172; bar = 3.5
    gtr, lead, org, bas, dr = Part(P['dist']), Part(P['dist']), Part(P['organ_perc']), Part(P['bass_pick']), Part(0, drums=True)
    R1, R2 = '0 m0 1 m0 3 m0 1', 'm0 m0 6 m0 5 m0 1'
    for k in range(32):
        t = k * bar; seq = R1 if k % 2 == 0 else R2
        riff(gtr, t, seq, E2, vel=112); bassline(bas, t, seq.replace('m', ''), E1)
        kit(dr, t, ('kc' if k % 8 == 0 else 'k') + ' kh sh kh k sh ' + ('kc' if k % 8 == 7 else 'kh'), vel=106)
        if k % 2 == 0: org.add(t, [52, 58, 64], 1.5, 80); org.add(t + 2, [53, 59, 65], 1.5, 76)
    L = ['12 13 15 13 12 - 11', '12 - - 16 - 15 13', '12 13 15 16 18 - 16', '15 - 13 - 12 - -',
         '19 - 18 16 15 13 12', '13^ - - 12 - 11 -', '12 15 16 19 20^ - -', '19~ - - - - - -']
    for k in range(16, 32): melody(lead, k * bar, L[(k - 16) % 8], E2 + 12, vel=104)
    return [(gtr, guitar_rhythm(20), -.8, 2, 2), (lead, guitar_lead(.26), .25, -3, 1), (org, organ(14), .45, -6, 1), (bas, bass(14), 0, -2, 1), (dr, drums(), 0, 0, 1)], 32 * bar, bpm

# ------------------------------------------------------------------ SLUT · the end of the day
def slut():
    bpm = 56; bar = 4
    org, choir, swell, lead, bas, dr = Part(P['organ_church']), Part(P['choir']), Part(P['dist']), Part(P['dist']), Part(P['bass_finger']), Part(0, drums=True)
    prog = [(0, [52, 55, 59, 64]), (-4, [48, 52, 55, 60]), (-7, [45, 48, 52, 57]), (-5, [47, 51, 54, 57])]
    for k in range(12):
        t = k * bar; r, ch = prog[k % 4]
        org.add(t, ch, bar * .98, 70); choir.add(t, [x + 12 for x in ch[:3]], bar, 66 if k < 4 else 76)
        bas.add(t, E1 + r, bar * .95, 86)
        if k >= 4: swell.add(t, PC(E2 + r), bar * .95, 96); kit(dr, t, ('kc' if k % 4 == 0 else 'kr') + ' r r r sr r r r', step=.5, vel=82)
    L = ['19 - - - 17 - 15 -', '16^ - - - 15 - 12 -', '12 - - 14 - 15 17 -', '15~ - - - - - - -']
    for k in range(4, 12): melody(lead, k * bar, L[(k - 4) % 4], E2 + 12, step=.5, vel=98)
    return [(org, organ(2), .3, -3, 1), (choir, pad(.95), -.3, -5, 1), (swell, guitar_rhythm() + [pb.Reverb(room_size=.85, wet_level=.35)], -.75, -2, 2),
            (lead, guitar_lead(.8), .2, -3, 1), (bas, bass(4), 0, -3, 1), (dr, drums(), 0, -4, 1)], 12 * bar, bpm
