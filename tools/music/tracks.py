"""Ravnsted's soundtrack: doom metal (Bruno, 2026-10-28: "less stoner and more doom metal, with more basses").
Slow, downtuned fuzz walls, a bass guitar doubled by a synthesized sub, big roomy drums, church organ and choir.
One piece per time of day, a title song and an outro.
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

D2_, C2_, B1_, A1_, Cs2 = 38, 36, 35, 33, 37

def low(bas, sb, t, seq, root, step=.5, vel=104):
    """bass guitar an octave under the guitar, doubled by the sub (which skips the palm-muted ghost notes)"""
    bassline(bas, t, seq.replace('m', ''), root - 12, step, vel)
    bassline(sb, t, ' '.join('.' if x.startswith('m') else x for x in seq.split()), root - 12, step, vel)

def band(rhythm_takes=2, drive=26):
    return Part(P['dist']), Part(P['dist']), Part(P['bass_pick']), Part(sub=True), Part(0, drums=True)

def doom_mix(gtr, lead, bas, sb, dr, extra=(), drive=26, room=.7, delay=.6):
    return [(gtr, guitar_doom(drive), -.8, 3, 2), (lead, doom_lead(delay), .25, -4, 1), (bas, bass(16), 0, 0, 1), (sb, sub(), 0, -3, 1),
            (dr, doom_drums(room), 0, 0, 1), *extra]

# ------------------------------------------------------------------ TITLE: "Ravnsted" — a funeral march in D
def title():
    bpm = 60; bar = 4
    gtr, lead, bas, sb, dr = band(); org, choir, bell = Part(P['organ_church']), Part(P['choir']), Part(P['bell'])
    # A · 4 bars: the town at night. Organ, choir, a bell, the floor tom like a heart, the sub breathing under it
    dm, Bb, Gm, A7 = [50, 53, 57, 62], [46, 50, 53, 58], [43, 50, 55, 58], [45, 49, 52, 55]
    stack(0, [dm, Bb, Gm, A7], bar, org, 74); stack(0, [[62, 65, 69], [58, 62, 65], [55, 58, 62], [57, 61, 64]], bar, choir, 66)
    for b, r in enumerate([0, -4, -7, -5]): bell.add(b * bar, 74, 3.5, 66); kit(dr, b * bar, 'f . . . f . f .', vel=84); sb.add(b * bar, D2_ - 12 + r, bar * .98, 96)
    # B · 8 bars: the riff
    R = ['0 - - - - - 1 -', '0 - - - -2 - -4 -', '0 - - - - - 1 -', '3 - 1 - 0 - -1 -']
    for k in range(8):
        t = 16 + k * bar; seq = R[k % 4]
        riff(gtr, t, seq, D2_, vel=112); low(bas, sb, t, seq, D2_)
        kit(dr, t, ('kc' if k % 4 == 0 else 'kr') + ' r r r sr r kr r', vel=108)
        if k >= 4: org.add(t, [50, 57, 62] if k % 2 == 0 else [51, 58, 63], bar, 60)
    # C · 8 bars: the riff, and a lead that mourns over it
    L = ['12 - - - - - 13^ -', '12 - 10 - 8 - 7 -', '12 - - - 15 - 13 -', '12~ - - - - - - -',
         '17^ - - - 15 - 13 -', '12 - 13 - 15 - 17 -', '19^ - - - 17 - 15 -', '14~ - - - - - - -']
    for k in range(8):
        t = 48 + k * bar; seq = R[k % 4]
        riff(gtr, t, seq, D2_, vel=112); low(bas, sb, t, seq, D2_)
        kit(dr, t, ('kc' if k % 4 == 0 else 'kr') + ' r sr r kr kr sr r', vel=110)
        melody(lead, t, L[k], D2_ + 24, vel=100); choir.add(t, [62, 65, 69] if k % 2 == 0 else [63, 67, 70], bar, 58)
    # D · 4 bars: everything rings, then the organ leads back to the town
    for k, (r, ch) in enumerate([(0, dm), (-4, Bb), (-7, Gm), (-5, A7)]):
        t = 80 + k * bar; gtr.add(t, PC(D2_ + r), bar * .95, 116); bas.add(t, D2_ - 12 + r, bar * .95, 108); sb.add(t, D2_ - 12 + r, bar * .95, 110)
        choir.add(t, [x + 12 for x in ch[:3]], bar, 78); org.add(t, ch, bar, 70)
        kit(dr, t, 'kc . . . s . . .' if k < 3 else 'kc . s . 1 2 3 f', vel=114)
    return doom_mix(gtr, lead, bas, sb, dr, [(org, organ(3), .35, -5, 1), (choir, pad(.94), -.3, -6, 1), (bell, pad(.95), .5, -9, 1)], delay=.75), 96, bpm

# ------------------------------------------------------------------ DAGGRY · dawn: a cold dirge in 3/4 (B minor), clean picking under slow fuzz swells
def daggry():
    bpm = 66; bar = 3
    gtr, lead, bas, sb, dr = band(); cl, choir, org = Part(P['clean']), Part(P['voice_oohs']), Part(P['organ_church'])
    B2 = 47
    prog = [(0, [0, 3, 7]), (-2, [0, 4, 7]), (-4, [0, 4, 7]), (-5, [0, 4, 7, 10])]
    for k in range(20):
        t = k * bar; r, ch = prog[(k // 2) % 4]
        for i, o in enumerate([0, 1, 2, 3, 2, 1]): cl.add(t + i * .5, B2 + r + ([*ch, 12])[o % 4] + 12, 1.2, 72)
        if k >= 4:
            if k % 2 == 0: gtr.add(t, PC(B1_ + r), bar * 2 * .95, 100)
            bas.add(t, B1_ - 12 + r, bar * .95, 96); sb.add(t, B1_ - 12 + r, bar * .95, 100)
            kit(dr, t, ('kc' if k % 4 == 0 else 'k') + ' . r . s .', vel=96)
            choir.add(t, [B2 + 12 + r + x for x in ch[:3]], bar, 58)
        else: sb.add(t, B1_ - 12 + r, bar * .95, 70)
        if k >= 12: org.add(t, [B2 + r, B2 + r + 7], bar, 50)
    L = ['12 - - - 14 15', '14 - 12 - 10 -', '12 - - - 9 -', '7~ - - - - -']
    for k in range(12, 20): melody(lead, k * bar, L[(k - 12) % 4] if k % 2 == 0 else '. . . . . .', B2 + 12, vel=94)
    return doom_mix(gtr, lead, bas, sb, dr, [(cl, clean(), -.35, -1, 1), (choir, pad(.95), .3, -7, 1), (org, organ(2), .4, -10, 1)], drive=24, delay=.9), 20 * bar, bpm

# ------------------------------------------------------------------ TORV · the market: a lumbering doom groove (C)
def torv():
    bpm = 76; bar = 4
    gtr, lead, bas, sb, dr = band(); org = Part(P['organ_rock'])
    R = ['0 - m0 m0 3 - 5 -', '6 - 5 - 3 - 0 -', '0 - m0 m0 3 - 5 -', '10 - 8 - 7 - 6 -']
    for k in range(24):
        t = k * bar; seq = R[k % 4]
        riff(gtr, t, seq, C2_, vel=112); low(bas, sb, t, seq, C2_)
        kit(dr, t, ('kc' if k % 8 == 0 else 'k') + ' h sh h k k sh ' + ('o' if k % 4 == 3 else 'h'), vel=106)
        if k >= 8: org.add(t, [48, 55, 60, 63] if k % 4 < 2 else [54, 58, 61], bar, 62)
    L = ['12 - - 15 - 17 - -', '18^ - 17 - 15 - 12 -', '15 - 17 - 19 - 20^ -', '19~ - - - - - - -',
         '24 - 22 - 20 - 19 -', '18 - 17 - 15 - 12 -', '15 - - 17 - 18 - -', '12~ - - - - - - -']
    for k in range(12, 20): melody(lead, k * bar, L[k - 12], C2_ + 24, vel=100)
    return doom_mix(gtr, lead, bas, sb, dr, [(org, organ(10), .45, -7, 1)], drive=24, room=.5, delay=.39), 24 * bar, bpm

# ------------------------------------------------------------------ EFTERMIDDAG · afternoon: a crushing doom waltz (B)
def eftermiddag():
    bpm = 72; bar = 3
    gtr, lead, bas, sb, dr = band(); org = Part(P['organ_rock'])
    R = ['0 - - 3 - 1', '0 - - -2 - -1', '0 - - 3 - 5', '6 - 5 - 3 -']
    for k in range(24):
        t = k * bar
        if k < 20:
            seq = R[k % 4]; riff(gtr, t, seq, B1_, vel=112); low(bas, sb, t, seq, B1_)
            kit(dr, t, ('kc' if k % 4 == 0 else 'k') + ' h s h k h', vel=104)
            if k >= 4: org.add(t, [47, 54, 59] if k % 4 < 2 else [50, 53, 59], bar, 60)
        else:  # three bars that stop the world, then the loop
            r = [0, -2, -5, -6][k - 20]; gtr.add(t, PC(B1_ + r), bar * .95, 118); bas.add(t, B1_ - 12 + r, bar * .95, 108); sb.add(t, B1_ - 12 + r, bar * .95, 110)
            kit(dr, t, 'kc . . . s .' if k < 23 else 'kc . 1 2 3 f', vel=114)
    L = ['12 - - - 15 -', '13^ - 12 - 10 -', '12 - - - 7 -', '8~ - - - - -', '15 - - 17 - 18^', '17 - 15 - 13 -', '12 - 13 - 15 -', '12~ - - - - -']
    for k in range(8, 16): melody(lead, k * bar, L[k - 8], B1_ + 24, vel=100)
    return doom_mix(gtr, lead, bas, sb, dr, [(org, organ(6), .4, -7, 1)], room=.6, delay=.42), 24 * bar, bpm

# ------------------------------------------------------------------ SKUMRING · dusk: the tritone that will not resolve (E, very slow)
def skumring():
    bpm = 54; bar = 4
    gtr, lead, bas, sb, dr = band(); choir, org, bell = Part(P['choir']), Part(P['organ_church']), Part(P['bell'])
    seqA, seqB = '0 - - - 6 - - -', '5 - 3 - 2 - 1 -'
    for k in range(12):
        t = k * bar; seq = seqA if k % 2 == 0 else seqB
        riff(gtr, t, seq, Cs2, vel=116); low(bas, sb, t, seq, Cs2)
        kit(dr, t, ('kc' if k % 4 == 0 else 'k') + ' . . . s . . 1', vel=112)
        choir.add(t, [49, 52, 56] if k % 2 == 0 else [50, 55, 59], bar, 70 if k < 4 else 80)
        if k % 2 == 0: bell.add(t, 61, 3.5, 60)
        if k >= 4: org.add(t, [37, 44, 49, 55] if k % 2 == 0 else [38, 45, 50], bar * .98, 60)
    L = ['. . 12 - 13^ - 12 -', '6^ - - - 7 - 5 -', '. . 15 - 16^ - 15 -', '13~ - - - - - - -']
    for k in range(4, 12): melody(lead, k * bar, L[(k - 4) % 4], Cs2 + 24, vel=98)
    return doom_mix(gtr, lead, bas, sb, dr, [(choir, pad(.95), 0, -5, 1), (org, organ(3), .4, -8, 1), (bell, pad(.95), -.5, -10, 1)], drive=28, room=.8, delay=1.1), 12 * bar, bpm

# ------------------------------------------------------------------ NAT · night: funeral doom (B), the organ and the dead
def nat():
    bpm = 48; bar = 4
    gtr, lead, bas, sb, dr = band(); org, choir = Part(P['organ_church']), Part(P['voice_oohs'])
    prog = [(0, [47, 50, 54, 59]), (-4, [43, 47, 50, 55]), (-2, [45, 49, 52, 57]), (-7, [40, 43, 47, 52])]
    for k in range(16):
        t = k * bar; r, ch = prog[(k // 2) % 4]
        org.add(t, ch, bar, 64); choir.add(t, [x + 12 for x in ch[1:]], bar, 54 if k < 4 else 66)
        sb.add(t, B1_ - 12 + r, bar * .98, 104)
        if k >= 4:
            if k % 2 == 0: gtr.add(t, PC(B1_ + r), bar * 2 * .96, 104)
            bas.add(t, B1_ - 12 + r, bar * .96, 100)
            kit(dr, t, ('kc' if k % 2 == 0 else 'k') + ' . . . s . . .', vel=104)
    L = ['12 - - - - - 10 -', '7~ - - - - - - -', '14 - - - 12 - 10 -', '9~ - - - - - - -']
    for k in range(8, 16): melody(lead, k * bar, L[(k - 8) % 4], B1_ + 24, vel=92)
    return doom_mix(gtr, lead, bas, sb, dr, [(org, organ(1), .35, -4, 1), (choir, pad(.96), -.3, -6, 1)], drive=28, room=.9, delay=1.25), 16 * bar, bpm

# ------------------------------------------------------------------ MIDNAT · midnight: the heaviest, a galloping doom in C# phrygian with a choir
def midnat():
    bpm = 66; bar = 4
    gtr, lead, bas, sb, dr = band(); choir, org = Part(P['choir']), Part(P['organ_church'])
    R = ['0 m0 m0 1 - - 0 -', '0 m0 m0 3 - - 1 -', '0 m0 m0 1 - - 0 -', '6 - 5 - 3 - 1 -']
    for k in range(24):
        t = k * bar; seq = R[k % 4]
        riff(gtr, t, seq, Cs2, vel=116); low(bas, sb, t, seq, Cs2)
        kit(dr, t, ('kc' if k % 4 == 0 else 'k') + ' k sh k kh k sh ' + ('kc' if k % 8 == 7 else 'k'), vel=110)
        choir.add(t, [61, 64, 68] if k % 4 != 3 else [67, 70, 74], bar, 64 if k < 8 else 78)
        if k >= 8: org.add(t, [37, 44, 49], bar, 62)
    L = ['12 - 13 - 12 - 10 -', '9 - 10 - 12 - - -', '13^ - 12 - 10 - 9 -', '7~ - - - - - - -',
         '16 - 15 - 13 - 12 -', '13 - 15 - 16 - 18^ -', '19 - 18 - 16 - 15 -', '13~ - - - - - - -']
    for k in range(8, 24): melody(lead, k * bar, L[(k - 8) % 8], Cs2 + 24, vel=102)
    return doom_mix(gtr, lead, bas, sb, dr, [(choir, pad(.95), -.2, -5, 1), (org, organ(4), .4, -8, 1)], drive=30, room=.75, delay=.68), 24 * bar, bpm

# ------------------------------------------------------------------ SLUT · the end: a requiem
def slut():
    bpm = 52; bar = 4
    gtr, lead, bas, sb, dr = band(); org, choir = Part(P['organ_church']), Part(P['choir'])
    prog = [(0, [50, 53, 57, 62]), (-4, [46, 50, 53, 58]), (-7, [43, 46, 50, 55]), (-5, [45, 49, 52, 57])]
    for k in range(12):
        t = k * bar; r, ch = prog[k % 4]
        org.add(t, ch, bar * .98, 70); choir.add(t, [x + 12 for x in ch[:3]], bar, 64 if k < 4 else 76)
        sb.add(t, D2_ - 12 + r, bar * .95, 100)
        if k >= 4: gtr.add(t, PC(D2_ + r), bar * .95, 106); bas.add(t, D2_ - 12 + r, bar * .95, 100); kit(dr, t, ('kc' if k % 4 == 0 else 'kr') + ' r r r sr r r r', vel=96)
    L = ['19 - - - 17 - 15 -', '17^ - - - 15 - 14 -', '14 - - 15 - 17 19 -', '16~ - - - - - - -']
    for k in range(4, 12): melody(lead, k * bar, L[(k - 4) % 4], D2_ + 12, vel=96)
    return doom_mix(gtr, lead, bas, sb, dr, [(org, organ(2), .3, -3, 1), (choir, pad(.95), -.3, -5, 1)], drive=24, room=.85, delay=1.15), 12 * bar, bpm

# ------------------------------------------------------------------ DØDSBO · 3.3 evening in the dead man's house: a creaking funeral waltz (A, 3/4)
def dodsbo():
    bpm = 56; bar = 3
    gtr, lead, bas, sb, dr = band(); org, box, choir = Part(P['organ_church']), Part(10), Part(P['voice_oohs'])  # 10: music box
    A2_ = 45
    prog = [(0, [0, 3, 7]), (-4, [0, 4, 7]), (1, [0, 4, 7]), (-5, [0, 4, 7, 10])]
    for k in range(24):
        t = k * bar; r, ch = prog[(k // 2) % 4]
        for i, o in enumerate([0, 2, 1, 2, 3, 2]): box.add(t + i * .5, A2_ + 24 + r + ([*ch, 12])[o % 4], .45, 62 if k < 8 else 54)
        org.add(t, [A2_ + r + x for x in ch[:3]], bar, 52)
        sb.add(t, A1_ - 12 + 12 + r, bar * .96, 92)
        if k >= 8:
            if k % 2 == 0: gtr.add(t, PC(A1_ + r), bar * 2 * .95, 104)
            bas.add(t, A1_ - 12 + 12 + r, bar * .95, 96)
            kit(dr, t, ('kc' if k % 4 == 0 else 'k') + ' . r . s .', vel=96)
            choir.add(t, [A2_ + 12 + r + x for x in ch[:3]], bar, 50)
    L = ['12 - - - 13^ -', '12 - 10 - 8 -', '7 - - - 8 -', '5~ - - - - -']
    for k in range(16, 24): melody(lead, k * bar, L[(k - 16) % 4] if k % 2 == 0 else '. . . . . .', A1_ + 24, vel=92)
    return doom_mix(gtr, lead, bas, sb, dr, [(box, pad(.85), .35, -6, 1), (org, organ(1), -.3, -6, 1), (choir, pad(.95), .2, -8, 1)], drive=26, room=.85, delay=1.0), 24 * bar, bpm

# ------------------------------------------------------------------ ULVETIME · 3.3 the wolf hour: a drone, a heartbeat, then the slowest riff of all (C#, minor seconds)
def ulvetime():
    bpm = 46; bar = 4
    gtr, lead, bas, sb, dr = band(); choir, org, bell = Part(P['choir']), Part(P['organ_church']), Part(P['bell'])
    for k in range(16):
        t = k * bar
        sb.add(t, Cs2 - 12, bar * .99, 100); org.add(t, [37, 44, 49] if k % 4 < 2 else [38, 44, 50], bar, 56)
        if k < 4: kit(dr, t, 'f . . . f . . .', vel=90); choir.add(t, [61, 62], bar, 48)
        else:
            seq = ['0 - - - - - 1 -', '0 - - - 6 - - -', '0 - - - - - 1 -', '3 - 2 - 1 - 0 -'][k % 4]
            riff(gtr, t, seq, Cs2, vel=118); low(bas, sb, t, seq, Cs2)
            kit(dr, t, ('kc' if k % 4 == 0 else 'k') + ' . . . s . . 1', vel=114)
            choir.add(t, [61, 64, 67] if k % 2 == 0 else [62, 65, 68], bar, 70)
        if k % 4 == 0: bell.add(t, 49, 3.8, 70)
    L = ['. . 12 - 13^ - - -', '12 - 10 - 9 - - -', '. . 13 - 15 - 16^ -', '13~ - - - - - - -']
    for k in range(8, 16): melody(lead, k * bar, L[(k - 8) % 4], Cs2 + 24, vel=96)
    return doom_mix(gtr, lead, bas, sb, dr, [(choir, pad(.96), 0, -5, 1), (org, organ(2), .4, -8, 1), (bell, pad(.95), -.5, -9, 1)], drive=30, room=.9, delay=1.3), 16 * bar, bpm
