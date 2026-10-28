# Raw paintings -> img/*.webp. People (p_*) are cut out with rembg and trimmed to their outline.
import os, sys, glob
from PIL import Image, ImageFilter
RAW = os.environ.get('ART_RAW', os.path.expanduser('~/ravnsted-art-raw'))
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'img')
os.makedirs(OUT, exist_ok=True)
_sess = None
def cut(im):
    global _sess
    from rembg import remove, new_session
    _sess = _sess or new_session('isnet-general-use')
    a = remove(im, session=_sess).getchannel('A')
    a = a.point(lambda v: 0 if v < 24 else min(255, int((v - 24) * 1.15)))  # drop haze, firm edges
    a = a.filter(ImageFilter.GaussianBlur(.8))
    out = im.convert('RGBA'); out.putalpha(a)
    return out.crop(a.point(lambda v: 255 if v > 40 else 0).getbbox())
def pack(name):
    src = os.path.join(RAW, name + '.png'); im = Image.open(src).convert('RGB')
    if name.startswith('p_'):
        im = cut(im); im.thumbnail((900, 900)); im.save(os.path.join(OUT, name + '.webp'), quality=82, method=6)
    else:
        lim = 1600 if name.startswith('title') else 640 if name.startswith('c_') else 512 if name.startswith('o_') else 1280
        im.thumbnail((lim, lim)); im.save(os.path.join(OUT, name + '.webp'), quality=78, method=6)
    return name
if __name__ == '__main__':
    names = sys.argv[1:] or [os.path.basename(f)[:-4] for f in sorted(glob.glob(os.path.join(RAW, '*.png')))]
    for n in names: print(pack(n), flush=True)
