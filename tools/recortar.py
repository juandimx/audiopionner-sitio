"""
Recorta el fondo de las fotos de productos para la función "Ver en tu espacio".
Guarda cada recorte en cutouts/<nombre-de-la-foto>.webp

Uso:
  pip install rembg onnxruntime pillow numpy
  python tools/recortar.py comedor-eclis.jpg cama-alondra.jpg
Luego, en products.js, el producto debe tener:  "cutout": "cutouts/<nombre>.webp"
(y cada color en "colors" su propio "cutout").

Nota: en camas con cabecero contra la pared o comedores con base de listones,
el recorte automático a veces borra partes. Revisa el resultado y, si falta algo,
rellena esa zona con un rectángulo (ver ejemplos en el historial del proyecto).
"""
import sys
from PIL import Image
import numpy as np
from rembg import remove, new_session

s = new_session("isnet-general-use")
for f in sys.argv[1:]:
    im = Image.open(f).convert("RGB")
    a = np.array(remove(im, session=s, only_mask=True)).copy()
    a[a < 110] = 0  # quita sombras y restos semitransparentes
    o = im.copy(); o.putalpha(Image.fromarray(a)); o = o.crop(o.getbbox())
    o.thumbnail((800, 800))
    out = "cutouts/" + f.rsplit("/", 1)[-1].rsplit(".", 1)[0] + ".webp"
    o.save(out, quality=80)
    print("ok", out)
