# Genera los íconos PNG de la app (PWA) con el rombo de aguayo de Awayu.
# Uso: python assets/iconos/generar.py
import os
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "web", "public", "icons")
os.makedirs(OUT, exist_ok=True)

def icon(size, maskable=False):
    s = size
    im = Image.new("RGB", (s, s), "#a3122a")
    d = ImageDraw.Draw(im)
    pad = int(s * (0.18 if maskable else 0.0))
    inner = s - 2 * pad
    # Franjas
    d.rectangle([0, pad + inner * 0.15, s, pad + inner * 0.33], fill="#f9c22e")
    d.rectangle([0, pad + inner * 0.67, s, pad + inner * 0.85], fill="#13a3b0")
    c = s / 2
    for r, col in ((0.34, "#d81b60"), (0.22, "#f3e6c8"), (0.12, "#d81b60"), (0.05, "#15101c")):
        k = inner * r
        d.polygon([(c, c - k), (c + k, c), (c, c + k), (c - k, c)], fill=col)
    return im

for size in (192, 512):
    icon(size).save(os.path.join(OUT, f"icon-{size}.png"))
icon(512, maskable=True).save(os.path.join(OUT, "maskable-512.png"))
icon(180).save(os.path.join(OUT, "apple-touch-icon.png"))
print("ok", os.listdir(OUT))
