# Ravnsted 3.3 "Dødsboet": art in style B, Træsnit (Bruno, 2026-10-28): a carved woodcut on parchment with one blood red,
# hand-coloured with thin washes only where a colour matters to the Danish (den grønne lænestol, den lille blå kommode …).
#   RAVNSTED_KEY=/path/key.json python3 tools/art/gen33.py [name ...]      then   python3 tools/art/pack.py
import os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from gen import RAW, run as _run, J as J32  # same raw folder, same retry loop
import gen

WOOD = ("A medieval woodcut print: bold black ink carved into a woodblock, printed on warm parchment, rough gouge marks and wood grain "
        "visible in the black areas, flowing carved contour lines that follow the forms (no ruled straight hatching), one spot colour of dried "
        "blood red used sparingly. Like a 16th-century Danish broadsheet, but darker and more monumental. Match the style of the reference "
        "image exactly. Absolutely no violet, purple, magenta or lilac.")
WASH = " Where a colour is named, it is added as a thin, uneven hand-coloured watercolour wash, like an old broadsheet, so the colour is clearly readable."
HIDE = (" No human face is visible: every face is hidden by a deep hood in black shadow, a veil, a low hat brim or a bowed head, as in Dark Souls art.")
NOTEXT = " No text, no letters, no signature."
EMPTY = " The scene is empty of people, with open floor space in the lower middle where figures will stand later."
CUT = " Full body from head to feet, standing, the whole figure inside the picture with space around it, alone on plain empty parchment with no floor line, no shadow and no scenery."
OBJ = " A single object, centred, the whole object visible with space around it, alone on plain empty parchment, no floor line, no other objects."
SP, SPP = 'wood_place', 'wood_people'

def place(d, aspect='16:9', people=False, refs=()): return dict(prompt=d + ('' if people else EMPTY) + ' ' + WOOD + WASH + NOTEXT, aspect=aspect, refs=('@' + SP,) + refs)
def person(d, refs=()): return dict(prompt=d + HIDE + CUT + ' ' + WOOD + WASH + NOTEXT, aspect='3:4', refs=('@' + SPP,) + refs)
def obj(d): return dict(prompt=d + OBJ + ' ' + WOOD + WASH + NOTEXT, aspect='1:1', refs=('@' + SP,))

ROOM = ("The living room of a dead old scribe in a medieval Danish town: low beamed ceiling, a small window, a cold fireplace, shelves of ink pots. "
        "In the middle of the room a long, narrow, closed wooden COFFIN with a lid (clearly a coffin, shaped wider at the shoulders) rests on two trestles, with two candles on it. Next to it stands an old GREEN armchair turned towards the coffin, empty. ")
J = {}
J['gade33_0'] = place("A narrow crooked medieval street in a wet Danish town at dusk: leaning half-timbered houses, puddles. One tall narrow house has a single lit window and a bundle of straw tied to its door, the old sign of a death in the house. The church tower behind, crows on the roofs.")
J['stue_0'] = place(ROOM + "Grey dusk light through the window.")
J['stue_3'] = place(ROOM + "The hour of the wolf, deep night: a white lamp now stands on the coffin lid and throws hard carved rays of light across the room; frost on the window.", refs=('stue_0',))
J['stue_4'] = place(ROOM + "First light of dawn: cold pale light through the window, the candles burnt down, the armchair empty.", refs=('stue_0',))
J['loftet_1'] = place("The attic of a dead man's house at night: furniture under dusty sheets, an old chest of drawers, an armchair, a round table, shelves, a big wooden chest. In the middle a white oil lamp on a stool burns by itself with a pale flame, and beside it a big black book lies open. Moonlight through a small window.")
J['loftet_3'] = place("The same attic in the deepest hour of the night, the sheets pulled off the furniture, the stool in the middle empty, moonlight through the small window, a roof hatch open to the stars.", refs=('loftet_1',))
J['marked_2'] = place("Midnight market under the high wall of a medieval church: trestle tables with old chairs, chests, folded clothes, a cradle, lanterns hanging on poles, gravestones beyond a low wall. Small hooded buyers far in the background. Full moon.")
J['lore_doed'] = place("Seen from a dark street at night: a small lit window of an old house, and inside it the dark shadow of an old scribe sitting upright in an armchair beside a long wooden box with two candles. Only a silhouette with two pale points of light for eyes.", people=True)
J['lore_hane'] = place("A black rooster crowing on a weathervane above crooked rooftops at first light, and below it thin trails of pale smoke rising from the chimneys and drifting away like departing souls, carved in long flowing lines. Grave and solemn, not cute.", people=True)
J['lore_lampe'] = place("A white oil lamp burning on a dark table without any oil; inside its tall flame a tiny hooded man walks, carrying a stone on his back.", people=True)
J['kirke33'] = place("A tall crooked medieval stone church tower with a bell swinging in the open belfry, ravens around it, seen from below against a huge sky with carved clouds; the sky takes most of the picture.", people=True)
# people
J['p_provst'] = person("A tall old village priest in a long black cassock and a white ruff collar, a wide black hat pulled low so the face is in shadow, holding a prayer book and a ring of iron keys.")
J['p_agnete'] = person("A thin woman in widow's black: a long black dress, a black lace veil hanging over her whole face, a small ring of keys and a pair of silver spoons in her hands.")
J['p_tove'] = person("A crooked old market woman, a dealer in dead people's things: a patched hooded cloak, the hood deep over her face, a lantern in one hand, a sack over her shoulder full of odd things (a candlestick, a shoe, a doll's arm).")
J['p_genfaerd'] = person("The ghost of an old scribe: a tall shape of solid carved black, a long robe and hood, a long white beard just visible, two tiny pale points for eyes in the black hood, the edges of the figure dissolving into curling wood-grain smoke. A quill in one long hand.")
J['p_foged33'] = person("A stern medieval bailiff in a heavy RED cloak with a fur collar and a wide-brimmed black hat pulled very low, the face in total shadow down to the jaw, a chain of office, one gloved hand on a sword hilt.", refs=('@foged',))
J['p_hulda33'] = person("An unnaturally tall gaunt woman from the hill folk, wrapped in a ragged BLUE shawl, bare long feet, long wet black hair hanging straight down over the whole face. She stands completely alone.", refs=('@hulda',))
J['p_mosekone33'] = person("A towering marsh hag made of peat, moss, dripping roots and rising steam, hunched, two ember-red eyes glowing under a hood of reeds, long root fingers.")
# objects (the estate): the Danish names are the grammar of the lesson, so colour, size and pattern must be unmistakable
O = {
 'o_laenestol': "An old upholstered armchair, painted with a GREEN wash, with worn armrests and carved wooden feet.",
 'o_kommode_lille_blaa': "A SMALL low BLUE chest of drawers with three drawers.",
 'o_kommode_stor_blaa': "A BIG tall BLUE chest of drawers with six drawers.",
 'o_kommode_lille_roed': "A SMALL low chest of drawers with three drawers, the whole chest painted bright RED with a strong red wash, as red as the blue one is blue.",
 'o_bord_gammelt_rundt': "An OLD, worn, cracked ROUND wooden table on one carved leg.",
 'o_bord_nyt_rundt': "A NEW, smooth, shiny ROUND wooden table on one plain leg.",
 'o_bord_gammelt_firkantet': "An OLD, worn, cracked SQUARE wooden table on four legs.",
 'o_taeppe_ternet': "A folded CHECKED (tartan) woollen blanket in red and black squares.",
 'o_taeppe_stribet': "A folded STRIPED woollen blanket with red and black stripes.",
 'o_taeppe_prikket': "A folded woollen blanket with black POLKA DOTS on a pale ground.",
 'o_skab_lille_graat': "A SMALL GREY wooden cabinet with one door and an iron lock.",
 'o_skab_stort_graat': "A BIG tall GREY wooden wardrobe with two doors.",
 'o_skab_lille_hvidt': "A SMALL WHITE wooden cabinet with one door.",
 'o_stole_smaa': "Two SMALL low wooden chairs side by side.",
 'o_stole_store': "Two BIG tall high-backed wooden chairs side by side.",
 'o_stol_lille': "One single SMALL low wooden chair.",
 'o_hylder_gule': "Three YELLOW painted wooden wall shelves stacked one above the other.",
 'o_puder_stribede': "A pile of three STRIPED cushions.",
 'o_gardiner_roede': "A pair of rich, soft, luxurious RED velvet curtains hanging from a rod.",
 'o_lampe_hvid': "An old WHITE oil lamp with a tall glass chimney, burning with a pale flame although it has no oil.",
 'o_bog_sort': "A big old BLACK leather book with iron clasps and a red ribbon.",
}
for k, v in O.items(): J[k] = obj(v)

# tall versions of the opening cards, so they fill a phone screen sharply (Bruno, 2026-10-28: "not filling the screen", then "out of focus")
TALLP = ("Recompose the reference painting as a tall vertical picture: the same subject, the same style, technique, palette and mood, "
         "the main subject large and complete in the upper two thirds, the lower third darker and calm with little detail (text will be laid over it). "
         "Absolutely no violet, purple or magenta.") + NOTEXT
for t, src in [('lore_marsh_tall', 'lore_marsh'), ('lore_book_tall', 'skriver_5'), ('lore_crow_tall', 'lore_crow'), ('lore_doed_tall', 'lore_doed'), ('lore_hane_tall', 'lore_hane'), ('lore_lampe_tall', 'lore_lampe'), ('kirke_tall', 'kirke'), ('kirke33_tall', 'kirke33')]:
    J[t] = dict(prompt=TALLP, aspect='9:16', refs=(src,))
gen.J.update(J)  # gen.run looks names up in gen.J
if __name__ == '__main__':
    from concurrent.futures import ThreadPoolExecutor
    names = sys.argv[1:] or list(J)
    first = [n for n in names if not any(r in J for r in J[n]['refs'])]
    later = [n for n in names if n not in first]
    for batch in (first, later):
        with ThreadPoolExecutor(2) as ex:
            for n, r in ex.map(_run, batch): print(n, r if isinstance(r, str) else json.dumps(r)[:300], flush=True)
