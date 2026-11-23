#!/usr/bin/env python3
"""Builds the social/OG image and the itch.io cover from assets/comic_1.jpg (day|night split, same art as the intro comic)."""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
A = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")
SER = "/usr/share/fonts/truetype/noto/NotoSerifDisplay-Black.ttf"
if not os.path.exists(SER): SER = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SERI = "/usr/share/fonts/truetype/noto/NotoSerif-SemiBoldItalic.ttf"
if not os.path.exists(SERI): SERI = SER
src = Image.open(os.path.join(A, "comic_1.jpg")).convert("RGB")

def crop(w, h, cx=0.5):
    r = w / h; sw, sh = src.size
    cw, ch = (sw, int(sw / r)) if sw / sh < r else (int(sh * r), sh)
    x0 = int(min(max(sw * cx - cw / 2, 0), sw - cw)); y0 = (sh - ch) // 2 - int(sh * .03) if ch < sh else 0
    y0 = max(0, min(y0, sh - ch))
    return src.crop((x0, y0, x0 + cw, y0 + ch)).resize((w, h), Image.LANCZOS)

def glow_text(img, xy, s, font, fill, glow, anchor="mm", blur=14):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    d.text(xy, s, font=font, fill=glow + (255,), anchor=anchor)
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    img.alpha_composite(layer); img.alpha_composite(layer)
    d = ImageDraw.Draw(img)
    d.text((xy[0] + 3, xy[1] + 4), s, font=font, fill=(10, 6, 25, 220), anchor=anchor)
    d.text(xy, s, font=font, fill=fill, anchor=anchor)

def compose(w, h, cx, title_px, sub_px, tag_px, out):
    im = crop(w, h, cx).convert("RGBA")
    shade = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(shade)
    for y in range(h):  # vignette: dark bottom + soft dark top, like the comic panels' framing
        t = max(0, (y - h * .38) / (h * .62)); a = int(215 * t ** 1.5)
        t2 = max(0, (h * .18 - y) / (h * .18)); a = max(a, int(110 * t2))
        d.line([(0, y), (w, y)], fill=(9, 6, 20, a))
    im.alpha_composite(shade)
    f1 = ImageFont.truetype(SER, title_px); f2 = ImageFont.truetype(SERI, sub_px); f3 = ImageFont.truetype(SER, tag_px)
    ty = int(h * .66)
    # title: SHIFT, left half warm gold, right half moon cyan, split at the rift
    tw = ImageDraw.Draw(im).textlength("SHIFT", font=f1); x0 = (w - tw) / 2
    mid = w / 2
    gold = Image.new("RGBA", im.size, (0, 0, 0, 0)); cyan = Image.new("RGBA", im.size, (0, 0, 0, 0))
    glow_text(gold, (w / 2, ty), "SHIFT", f1, (255, 214, 102, 255), (255, 150, 40))
    glow_text(cyan, (w / 2, ty), "SHIFT", f1, (190, 245, 255, 255), (60, 200, 255))
    mask_l = Image.new("L", im.size, 0); ImageDraw.Draw(mask_l).rectangle([0, 0, mid, h], fill=255)
    mask_r = Image.new("L", im.size, 0); ImageDraw.Draw(mask_r).rectangle([mid, 0, w, h], fill=255)
    im.paste(gold, (0, 0), Image.composite(gold, Image.new("RGBA", im.size, (0, 0, 0, 0)), mask_l).split()[3])
    im.paste(cyan, (0, 0), Image.composite(cyan, Image.new("RGBA", im.size, (0, 0, 0, 0)), mask_r).split()[3])
    d = ImageDraw.Draw(im)
    d.text((w / 2 + 2, ty + title_px * .62 + 2), "The Twilight Weaver", font=f2, fill=(10, 6, 25, 200), anchor="mm")
    d.text((w / 2, ty + title_px * .62), "The Twilight Weaver", font=f2, fill=(238, 232, 255, 255), anchor="mm")
    tag = "SWAP THE WORLD  ·  SLIDE THE FLOOR  ·  GAME OFF 2026"
    d.text((w / 2, h - tag_px * 1.5), tag, font=f3, fill=(255, 214, 102, 255), anchor="mm")
    im.convert("RGB").save(os.path.join(A, out), quality=88, optimize=True)
    print(out, im.size)

compose(1200, 630, .5, 190, 44, 22, "og-image.jpg")
compose(630, 500, .5, 120, 30, 15, "itch-cover.jpg")
