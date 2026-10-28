# Ravnsted art: every painting in the game, generated with Gemini on Vertex AI, then cut out and packed.
#   RAVNSTED_KEY=/path/key.json python3 tools/art/gen.py [name ...]   (generates missing raw paintings)
#   python3 tools/art/pack.py                                        (raw -> img/*.webp)
# Raw paintings go to $ART_RAW (default ~/ravnsted-art-raw), outside the repo.
import os, sys, time, json
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(__file__))
from gimg import gemini

RAW = os.environ.get('ART_RAW', os.path.expanduser('~/ravnsted-art-raw'))
REFS = os.path.join(os.path.dirname(__file__), 'refs')
os.makedirs(RAW, exist_ok=True)

STYLE = ("Oil painting in the manner of a 1970s doom and stoner rock album cover: thick visible brushstrokes on canvas, "
         "saturated, slightly psychedelic colour (deep teal, poison green, bruised violet, molten orange, oxblood), heavy smoke and fog, "
         "dramatic chiaroscuro, a feeling of dread and fate, rich painterly texture. Dark medieval Danish folk fantasy.")
HIDE = (" No human face is visible: every face is hidden as in Dark Souls and Elden Ring art, by a deep hood in black shadow, a veil, "
        "hair hanging over it, a low hat brim, a scarf over the mouth and nose, or the head bowed.")
NOTEXT = " No text, no letters, no logo, no signature, no frame, no border."
EMPTY = " The scene is empty of people, with open floor space in the lower middle where figures will stand later."
CUT = (" Full body from head to feet, standing, the whole figure inside the picture with space around it, "
       "on a plain flat even light grey studio background with no floor, no shadow and no scenery.")

COL = {'rød': 'red', 'grøn': 'green', 'blå': 'blue', 'gul': 'yellow', 'hvid': 'white', 'sort': 'black', 'grå': 'grey', 'brun': 'brown'}
PAT = {'stribet': 'striped', 'ternet': 'checked (tartan)', 'prikket': 'polka-dotted'}
BODY = {'kjole': 'long dress', 'kappe': 'long cloak with its hood thrown back on the shoulders', 'jakke': 'short jacket with trousers', 'forklæde': 'work dress with an apron', 'sjal': 'shawl'}
def wear(look):
    k, c, *p = look['body']
    s = [f"a {PAT[p[0]] + ' ' if p else ''}{COL[c]} {BODY[k]}"]
    if look.get('scarf'): s.append(f"a {COL[look['scarf']]} scarf wound high around the neck and over the mouth")
    if look.get('hat'):
        hk, hc, *hp = look['hat']
        s.append({'hue': f"a {PAT[hp[0]] + ' ' if hp else ''}{COL[hc]} knitted cap, clearly visible, pulled low over the eyes, a dark scarf over the mouth and nose", 'kalot': 'a black skullcap', 'hat': f"a wide-brimmed {COL[hc]} hat pulled low"}[hk])
    if look.get('gloves'): s.append(f"{COL[look['gloves']]} gloves on both hands, clearly visible")
    return ', '.join(s)

def place(desc, aspect='16:9', refs=(), people=False):
    return dict(prompt=desc + ('' if people else EMPTY) + ' ' + STYLE + NOTEXT, aspect=aspect, refs=refs)
PSTYLE = STYLE.replace(' heavy smoke and fog,', '') + " No smoke, no mist, no fog and no clouds anywhere around the figure; the feet stand clearly."
def person(desc, refs=()):
    return dict(prompt=desc + HIDE + CUT + ' ' + PSTYLE + NOTEXT, aspect='3:4', refs=refs)
def crowd(look, where):
    return dict(prompt=f"A single medieval townsperson wearing {wear(look)}. Every item of clothing, its colour and its pattern must be clearly readable, and nothing else is worn over them (no extra cloak or coat unless named). "
                f"Full body, standing, centred, seen from the front, in {where}, the background soft and dark." + HIDE + ' ' + STYLE + NOTEXT, aspect='3:4', refs=())

TOWN = ("Ravnsted, a crooked wet medieval Danish town of leaning half-timbered houses with steep roofs, squeezed between a black steaming marsh "
        "and a huge dark hill. ")
J = {}
# ---- title and lore
J['title_tall'] = place(TOWN + "Seen from the marsh at night under a colossal pale moon ringed with violet haze. The hill looms over the roofs like a sleeping giant, "
                        "two tiny red lights glowing in its side like eyes. A raven on a crooked post in the foreground. Green marsh lights over black water. "
                        "Tall vertical composition, empty dark sky in the upper third.", aspect='9:16', people=True)
J['title_wide'] = place(TOWN + "Seen from the marsh at night under a colossal pale moon ringed with violet haze. The hill looms over the roofs like a sleeping giant, "
                        "two tiny red lights glowing in its side like eyes. A raven on a crooked post. Green marsh lights over black water.", people=True)
J['lore_crow'] = place("A big black raven with one red eye perched on a crooked fence post above wet rooftops of a medieval town at a cold grey-pink dawn, smoke from chimneys.", people=True)
J['lore_marsh'] = place("A colossal hunched marsh hag made of peat, moss, roots and rising steam stands waist deep in black bog water at night, two ember-red eyes under a hood of reeds. "
                        "A copper cauldron steams on a hummock beside her. Green will-o'-wisps. A tiny lit town far behind.", people=True)
J['kirke'] = place("A tall crooked medieval stone church tower with a bell hanging in the open belfry, ravens circling it, seen from below against a vast dramatic sky. "
                   "The sky takes most of the picture.", people=True)
# ---- places by hour (0 daggry, 1 formiddag, 2 middag, 3 eftermiddag, 4 skumring, 5 nat, 6 midnat)
J['loft_0'] = place("Inside a cramped hayloft under a steep roof with heavy crossed beams. Cold blue dawn light falls in thin rays through a small square window high in the back wall. "
                    "A heap of straw on the left, a ladder going down on the right, a stub of candle on a beam, a rat in the straw. Dust in the light.")
J['loft_4'] = place("The same hayloft at dusk: the window glows blood orange and violet, the candle stub is lit, long dark shadows, smoke in the air.", refs=('loft_0',))
J['skriver_1'] = place("A cold stone scriptorium. In the middle an old lectern carrying an enormous ancient book with a red ribbon. A shelf of rolled scrolls on the left wall, "
                       "a tall narrow window on the right with grey morning light, an iron candelabra with three candles. Ink pots, quills, wax.")
J['skriver_5'] = place("The same scriptorium at night: only the three candles light the huge book, everything else sinks into black and deep red shadow, the window is dark blue with a moon.", refs=('skriver_1',))
J['torv_1'] = place(TOWN + "The muddy town square in the morning: an old stone well on the left, a rag dealer's market stall with a striped red and black awning and piles of cloth on the right, "
                    "the dark hill behind the roofs, wet cobbles, smoke, grey-green morning light, crows on the roofs.")
J['torv_2'] = place("The same town square at noon under a sickly yellow overcast sky, puddles on the cobbles, steam rising from the marsh beyond the roofs.", refs=('torv_1',))
J['farveri_3'] = place("Inside a medieval dye works in the afternoon: three big wooden vats side by side with pale steam rising, the left vat full of bright red dye, the middle vat bright yellow dye, the right vat deep blue dye. A shelf of glass bottles on the right, "
                       "one bottle glowing poison green. A lime barrel. Cloth hanging from beams, dripping colour. Hazy warm light through a window on the left.")
J['kro_3'] = place("Inside a low smoky medieval tavern in the afternoon: a big stone fireplace with a fire on the left, a long heavy table with clay mugs on the right, "
                   "a lantern hanging from the beams, a small window. Dark corners.")
J['kro_4'] = place("The same tavern at dusk: firelight only, deep red and orange glow, heavy smoke under the beams, the window violet.", refs=('kro_3',))
J['mose_5'] = place("A black marsh at night: still dark water, tall reeds at both sides, a dead twisted tree on the right, green will-o'-wisps floating low over the water, "
                    "the lights of a small town far away on the left, a big moon in teal clouds, mist on the water.")
J['mose_6'] = place("The same marsh at midnight: a blood red moon, thick poison green mist rolling over the water, the will-o'-wisps brighter, the town lights gone.", refs=('mose_5',))
# ---- people on stage (cut out later)
J['p_sidsel'] = person("A worn-out miller's wife in a long grey cloak with the grey hood up, holding a folded red dress against her chest with both hands.")
J['p_sidsel_empty'] = person("Exactly the same woman as in the reference picture, with the identical long ragged GREY cloak, the same grey hood up, the same dark dress and boots. The only change: she no longer holds the red dress; her empty hands are folded in front of her.", refs=('p_sidsel',))
J['p_absalon'] = person("An old medieval town scribe in a deep brown hooded cloak over a black skullcap, long white beard, one faint milky glint where an eye should be, long ink-stained fingers holding a quill.", refs=('@absalon',))
J['p_gertrud'] = person("A proud medieval noblewoman, the bailiff's wife, in a long dark green dress, black shoes, a white scarf wound around her neck and a sheer white veil over her face, rings on folded hands.", refs=('@gertrud',))
J['p_mads'] = person("A wiry rag dealer in a short brown jacket and patched trousers, a brown checked (tartan) knitted cap pulled down, a grubby scarf over mouth and nose, "
                     "ONE green mitten on his right hand and a bare dirty left hand, a huge bundle of rags on his back.")
J['p_hulda'] = person("An unnaturally tall gaunt woman from the hill folk, wrapped in a ragged blue shawl, bare long grey feet, long wet black hair hanging straight down over the whole face.", refs=('@hulda',))
J['p_foged'] = person("A stern medieval bailiff in a heavy red cloak with a fur collar and a wide-brimmed black hat pulled very low, the face in total shadow down to the jaw, a chain of office, one gloved hand on a sword hilt.", refs=('@foged',))
J['p_bodil'] = person("A strong medieval dyer woman in a blue apron over a plain dress, sleeves rolled up, her hands and forearms stained deep blue to the elbow, "
                      "head bowed so long dark hair falls over her face.")
J['p_jens'] = person("A young man, the bailiff's son, in a long grey cloak, a grey and white striped knitted cap pulled down over the eyes, a thick grey scarf pulled up over his nose and mouth, so that NO part of the face is visible, black leather gloves, boots caked in black marsh mud.")
J['p_mosekonen'] = person("A towering marsh hag made of peat, moss, dripping roots and rising steam, hunched, two ember-red eyes glowing under a hood of reeds, long root fingers.")
# ---- the spot game crowds
SQ = 'a misty market square'; TV = 'a dark smoky tavern'
for i, l in enumerate([dict(body=['kjole', 'grøn'], scarf='hvid'), dict(body=['kjole', 'grøn'], scarf='gul'), dict(body=['kjole', 'blå'], scarf='hvid'),
                       dict(body=['kappe', 'grøn'], scarf='hvid', hat=['hue', 'grøn']), dict(body=['kjole', 'brun'], scarf='hvid'), dict(body=['kjole', 'grøn', 'stribet'], scarf='rød')]):
    J[f'c_g{i}'] = crowd(l, SQ)
for i, l in enumerate([dict(body=['kappe', 'grå'], hat=['hue', 'grå', 'stribet'], gloves='sort'), dict(body=['kappe', 'grå'], hat=['hue', 'grå', 'ternet'], gloves='sort'),
                       dict(body=['kappe', 'brun'], hat=['hue', 'grå', 'stribet'], gloves='sort'), dict(body=['kappe', 'grå'], hat=['hue', 'rød', 'stribet'], gloves='brun'),
                       dict(body=['jakke', 'grå'], hat=['hue', 'sort'], gloves='sort'), dict(body=['kappe', 'blå'], hat=['hue', 'grå', 'stribet'], gloves='hvid')]):
    J[f'c_j{i}'] = crowd(l, TV)
J['dress'] = dict(prompt="A red medieval woman's dress laid out flat on rough dark wooden boards, seen straight from above, the whole dress visible and centred, "
                  "a row of four bone buttons down the bodice and a black belt at the waist. Three things are wrong with it: the hem at the bottom is dark and soaking wet; "
                  "a single green marsh reed is stuck in the side seam on the left at hip height; brown mud is smeared on the collar. " + STYLE + NOTEXT, aspect='3:4', refs=())

def ref_path(r):
    return os.path.join(REFS, r[1:] + '.jpg') if r.startswith('@') else os.path.join(RAW, r + '.png')
def run(name):
    out = os.path.join(RAW, name + '.png')
    if os.path.exists(out): return name, 'kept'
    j = J[name]
    if not all(os.path.exists(ref_path(x)) for x in j['refs']): return name, 'skipped: reference missing'
    for t in range(12):
        r = gemini(j['prompt'], out, refs=[ref_path(x) for x in j['refs']], aspect=j['aspect'])
        if isinstance(r, str): return name, 'ok'
        if 'noimage' in r and t >= 2: return name, r
        time.sleep(min(90, 15 * (t + 1)))
    return name, r

if __name__ == '__main__':
    names = sys.argv[1:] or list(J)
    first = [n for n in names if not any(x in names and not x.startswith('@') for x in J[n]['refs'])]
    later = [n for n in names if n not in first]
    for batch in (first, later):
        with ThreadPoolExecutor(2) as ex:
            for n, r in ex.map(run, batch): print(n, r if isinstance(r, str) else json.dumps(r)[:300], flush=True)
