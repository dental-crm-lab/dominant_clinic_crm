#!/usr/bin/env python3
"""Generate PWA icons for Dominant Dental Clinic CRM: black bg, bronze/gold serif 'D' monogram."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(__file__), 'web', 'icons')
os.makedirs(OUT, exist_ok=True)

INK = (21, 20, 15, 255)       # --ink / near-black
GOLD = (200, 161, 92, 255)    # --gold (dark-mode tone, reads well on black)
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"

def make_icon(size, maskable=False, path=None):
    img = Image.new('RGBA', (size, size), INK)
    draw = ImageDraw.Draw(img)

    # subtle radial-ish vignette using overlaid circle (kept simple/flat for crispness at small sizes)
    if maskable:
        # keep the glyph within the safe zone (center ~80% for maskable icons)
        scale = 0.42
    else:
        scale = 0.5

    font_size = int(size * scale)
    font = ImageFont.truetype(FONT_PATH, font_size)
    text = "D"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]
    draw.text((x, y), text, font=font, fill=GOLD)

    # thin gold rule below the letter, echoing the login-screen mark
    rule_w = size * 0.16
    rule_y = size * 0.5 + font_size * 0.42
    if rule_y < size * 0.86:
        draw.rectangle([
            (size - rule_w) / 2, rule_y,
            (size + rule_w) / 2, rule_y + max(1, size * 0.006)
        ], fill=GOLD)

    img.save(path)
    print("wrote", path, size, "maskable" if maskable else "")

make_icon(192, path=os.path.join(OUT, 'icon-192.png'))
make_icon(512, path=os.path.join(OUT, 'icon-512.png'))
make_icon(512, maskable=True, path=os.path.join(OUT, 'icon-512-maskable.png'))
make_icon(180, path=os.path.join(OUT, 'apple-touch-icon.png'))

# Simple favicon.ico from the 192 render
icon192 = Image.open(os.path.join(OUT, 'icon-192.png'))
icon192.save(os.path.join(os.path.dirname(OUT), 'favicon.ico'), sizes=[(16,16),(32,32),(48,48)])
print("wrote favicon.ico")
