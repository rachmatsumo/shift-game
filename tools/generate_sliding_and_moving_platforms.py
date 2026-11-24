import os
import subprocess
from PIL import Image

OUT_DIR = "assets"
os.makedirs(OUT_DIR, exist_ok=True)

# 1. Day Sliding Block (256x256, RGBA)
# Ornate Kinetic Shift Block for Day: Royal amethyst/obsidian with gold/brass trim and inlaid glowing kinetic arrow runes
svg_slide_day = """<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldRim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffeaa7"/>
      <stop offset="35%" stop-color="#fdcb6e"/>
      <stop offset="70%" stop-color="#e17055"/>
      <stop offset="100%" stop-color="#d63031"/>
    </linearGradient>
    <linearGradient id="innerPurple" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#9b5de5"/>
      <stop offset="50%" stop-color="#6c2eb9"/>
      <stop offset="100%" stop-color="#4a1585"/>
    </linearGradient>
    <linearGradient id="runeGlow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#ffeaa7"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
    <linearGradient id="bevelLight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Drop Shadow -->
  <rect x="8" y="10" width="240" height="240" rx="14" fill="#1e0838" opacity="0.45"/>

  <!-- Outer Beveled Metallic Rim -->
  <rect x="10" y="10" width="236" height="236" rx="12" fill="url(#goldRim)"/>
  <rect x="12" y="12" width="232" height="232" rx="10" fill="#380e60"/>

  <!-- Inner Stone Relic Face -->
  <rect x="22" y="22" width="212" height="212" rx="8" fill="url(#innerPurple)"/>

  <!-- Top Glass Highlight -->
  <rect x="24" y="24" width="208" height="22" rx="6" fill="url(#bevelLight)"/>

  <!-- Corner Ornamental Brass Brackets -->
  <path d="M 22 46 L 22 22 L 46 22 L 46 28 L 28 28 L 28 46 Z" fill="url(#goldRim)"/>
  <path d="M 234 46 L 234 22 L 210 22 L 210 28 L 228 28 L 228 46 Z" fill="url(#goldRim)"/>
  <path d="M 22 210 L 22 234 L 46 234 L 46 228 L 28 228 L 28 210 Z" fill="url(#goldRim)"/>
  <path d="M 234 210 L 234 234 L 210 234 L 210 228 L 228 228 L 228 210 Z" fill="url(#goldRim)"/>

  <!-- Conduit Grooves (Horizontal Track) -->
  <rect x="36" y="52" width="184" height="6" rx="3" fill="#2d0a4e"/>
  <rect x="36" y="198" width="184" height="6" rx="3" fill="#2d0a4e"/>
  <rect x="38" y="53" width="180" height="2" fill="#e056fd" opacity="0.6"/>
  <rect x="38" y="199" width="180" height="2" fill="#e056fd" opacity="0.6"/>

  <!-- Central Recessed Channel for Arrows -->
  <rect x="34" y="80" width="188" height="96" rx="10" fill="#240740"/>
  <rect x="36" y="82" width="184" height="92" rx="8" fill="#1b0430"/>
  <rect x="36" y="82" width="184" height="92" rx="8" fill="none" stroke="url(#goldRim)" stroke-width="2" opacity="0.6"/>

  <!-- Left Kinetic Arrow Glyphs (◀) -->
  <g filter="url(#softGlow)">
    <polygon points="62,128 108,94 108,162" fill="url(#runeGlow)"/>
    <polygon points="68,128 104,100 104,156" fill="#ffffff"/>
  </g>

  <!-- Right Kinetic Arrow Glyphs (▶) -->
  <g filter="url(#softGlow)">
    <polygon points="194,128 148,94 148,162" fill="url(#runeGlow)"/>
    <polygon points="188,128 152,100 152,156" fill="#ffffff"/>
  </g>

  <!-- Center Celestial Power Core Diamond -->
  <polygon points="128,110 138,128 128,146 118,128" fill="url(#goldRim)"/>
  <circle cx="128" cy="128" r="3" fill="#ffffff"/>
</svg>"""

# 2. Night Sliding Block (256x256, RGBA)
# Ornate Kinetic Shift Block for Night: Deep midnight obsidian with electric violet/cyan bioluminescent borders & runes
svg_slide_night = """<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cyanRim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#81ecec"/>
      <stop offset="40%" stop-color="#00cec9"/>
      <stop offset="80%" stop-color="#6c5ce7"/>
      <stop offset="100%" stop-color="#a29bfe"/>
    </linearGradient>
    <linearGradient id="innerNight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2c1a4d"/>
      <stop offset="50%" stop-color="#190e32"/>
      <stop offset="100%" stop-color="#0b0518"/>
    </linearGradient>
    <linearGradient id="cyanRune" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#00f2fe"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
    <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Drop Shadow -->
  <rect x="8" y="10" width="240" height="240" rx="14" fill="#04020a" opacity="0.6"/>

  <!-- Outer Beveled Arcane Rim -->
  <rect x="10" y="10" width="236" height="236" rx="12" fill="url(#cyanRim)"/>
  <rect x="12" y="12" width="232" height="232" rx="10" fill="#090514"/>

  <!-- Inner Night Void Face -->
  <rect x="22" y="22" width="212" height="212" rx="8" fill="url(#innerNight)"/>

  <!-- Top Bioluminescent Sheen -->
  <rect x="24" y="24" width="208" height="20" rx="6" fill="#81ecec" opacity="0.25"/>

  <!-- Corner Lunar Brackets -->
  <path d="M 22 46 L 22 22 L 46 22 L 46 28 L 28 28 L 28 46 Z" fill="url(#cyanRim)"/>
  <path d="M 234 46 L 234 22 L 210 22 L 210 28 L 228 28 L 228 46 Z" fill="url(#cyanRim)"/>
  <path d="M 22 210 L 22 234 L 46 234 L 46 228 L 28 228 L 28 210 Z" fill="url(#cyanRim)"/>
  <path d="M 234 210 L 234 234 L 210 234 L 210 228 L 228 228 L 228 210 Z" fill="url(#cyanRim)"/>

  <!-- Conduit Grooves (Arcane Cyan Light Tracks) -->
  <rect x="36" y="52" width="184" height="6" rx="3" fill="#080312"/>
  <rect x="36" y="198" width="184" height="6" rx="3" fill="#080312"/>
  <rect x="38" y="53" width="180" height="2" fill="#00cec9" opacity="0.85"/>
  <rect x="38" y="199" width="180" height="2" fill="#00cec9" opacity="0.85"/>

  <!-- Central Recessed Channel -->
  <rect x="34" y="80" width="188" height="96" rx="10" fill="#0e061e"/>
  <rect x="36" y="82" width="184" height="92" rx="8" fill="#080312"/>
  <rect x="36" y="82" width="184" height="92" rx="8" fill="none" stroke="url(#cyanRim)" stroke-width="2" opacity="0.5"/>

  <!-- Left Kinetic Arrow Glyphs (◀) -->
  <g filter="url(#cyanGlow)">
    <polygon points="62,128 108,94 108,162" fill="url(#cyanRune)"/>
    <polygon points="68,128 104,100 104,156" fill="#ffffff"/>
  </g>

  <!-- Right Kinetic Arrow Glyphs (▶) -->
  <g filter="url(#cyanGlow)">
    <polygon points="194,128 148,94 148,162" fill="url(#cyanRune)"/>
    <polygon points="188,128 152,100 152,156" fill="#ffffff"/>
  </g>

  <!-- Center Lunar Star Crystal -->
  <polygon points="128,108 136,128 128,148 120,128" fill="#00cec9"/>
  <circle cx="128" cy="128" r="3.5" fill="#ffffff"/>
</svg>"""

# 3. Day Floating Moving Platform (512x128, RGBA)
# Majestic Solar Floating Shrine Glider with gilded carvings and radiant levitation core
svg_mover_day = """<svg width="512" height="128" viewBox="0 0 512 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldSlab" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff5cc"/>
      <stop offset="20%" stop-color="#f6b93b"/>
      <stop offset="70%" stop-color="#b7791f"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
    <linearGradient id="stoneSlab" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#543828"/>
      <stop offset="40%" stop-color="#3d271c"/>
      <stop offset="100%" stop-color="#24150d"/>
    </linearGradient>
    <linearGradient id="topGleam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#f6b93b" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="solarAura" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffd166" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#f39c12" stop-opacity="0"/>
    </linearGradient>
    <filter id="goldGlow" x="-10%" y="-20%" width="120%" height="150%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Lower Levitation Aura (energy field under the platform) -->
  <ellipse cx="256" cy="100" rx="210" ry="24" fill="url(#solarAura)"/>
  <ellipse cx="256" cy="95" rx="140" ry="14" fill="#ffffff" opacity="0.35"/>

  <!-- Keel/Chassis Base Wing Pedestal -->
  <path d="M 64 64 L 112 104 L 400 104 L 448 64 Z" fill="#24150d"/>
  <path d="M 80 64 L 124 98 L 388 98 L 432 64 Z" fill="url(#stoneSlab)"/>

  <!-- Central Levitation Reactor Core -->
  <polygon points="256,66 280,88 256,106 232,88" fill="url(#goldSlab)"/>
  <polygon points="256,72 272,88 256,100 240,88" fill="#fff" filter="url(#goldGlow)"/>

  <!-- Main Gilded Slab Body -->
  <path d="M 24 16 L 488 16 L 476 68 L 36 68 Z" fill="url(#stoneSlab)"/>

  <!-- Gilded Beveled Border Trim -->
  <path d="M 20 12 L 492 12 Q 504 12 500 28 L 478 68 Q 474 76 462 76 L 50 76 Q 38 76 34 68 L 12 28 Q 8 12 20 12 Z" fill="none" stroke="url(#goldSlab)" stroke-width="5"/>
  <path d="M 22 14 L 490 14 L 474 66 L 38 66 Z" fill="url(#goldSlab)" opacity="0.3"/>

  <!-- Walkable Top Platform Plate with Bright Light Strip -->
  <rect x="28" y="16" width="456" height="12" rx="4" fill="url(#topGleam)"/>
  <line x1="36" y1="20" x2="476" y2="20" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Side Carved Celestial Wings & Grips -->
  <path d="M 44 26 L 80 48 L 44 60 Z" fill="url(#goldSlab)"/>
  <path d="M 468 26 L 432 48 L 468 60 Z" fill="url(#goldSlab)"/>

  <!-- Decorative Solar Inlay Studs -->
  <circle cx="160" cy="46" r="6" fill="url(#goldSlab)"/>
  <circle cx="160" cy="46" r="2.5" fill="#fff"/>
  <circle cx="352" cy="46" r="6" fill="url(#goldSlab)"/>
  <circle cx="352" cy="46" r="2.5" fill="#fff"/>
</svg>"""

# 4. Night Floating Moving Platform (512x128, RGBA)
# Moon-Silver & Deep Obsidian Floating Shrine with bioluminescent cyan starlight levitation
svg_mover_night = """<svg width="512" height="128" viewBox="0 0 512 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="silverRim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="30%" stop-color="#81ecec"/>
      <stop offset="70%" stop-color="#00cec9"/>
      <stop offset="100%" stop-color="#6c5ce7"/>
    </linearGradient>
    <linearGradient id="obsidianSlab" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#24143a"/>
      <stop offset="40%" stop-color="#150a24"/>
      <stop offset="100%" stop-color="#07030e"/>
    </linearGradient>
    <linearGradient id="nightGleam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#81ecec" stop-opacity="0.25"/>
    </linearGradient>
    <linearGradient id="lunarAura" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#00cec9" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#6c5ce7" stop-opacity="0"/>
    </linearGradient>
    <filter id="cyanGlowMover" x="-10%" y="-20%" width="120%" height="150%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Lower Levitation Aura (Cyan / Violet energy field under platform) -->
  <ellipse cx="256" cy="100" rx="210" ry="24" fill="url(#lunarAura)"/>
  <ellipse cx="256" cy="95" rx="140" ry="14" fill="#00f2fe" opacity="0.5"/>

  <!-- Keel/Chassis Base Wing Pedestal -->
  <path d="M 64 64 L 112 104 L 400 104 L 448 64 Z" fill="#07030e"/>
  <path d="M 80 64 L 124 98 L 388 98 L 432 64 Z" fill="url(#obsidianSlab)"/>

  <!-- Central Lunar Star Crystal Reactor Core -->
  <polygon points="256,66 280,88 256,106 232,88" fill="url(#silverRim)"/>
  <polygon points="256,72 272,88 256,100 240,88" fill="#fff" filter="url(#cyanGlowMover)"/>

  <!-- Main Obsidian Slab Body -->
  <path d="M 24 16 L 488 16 L 476 68 L 36 68 Z" fill="url(#obsidianSlab)"/>

  <!-- Silver Arcane Beveled Border Trim -->
  <path d="M 20 12 L 492 12 Q 504 12 500 28 L 478 68 Q 474 76 462 76 L 50 76 Q 38 76 34 68 L 12 28 Q 8 12 20 12 Z" fill="none" stroke="url(#silverRim)" stroke-width="5"/>
  <path d="M 22 14 L 490 14 L 474 66 L 38 66 Z" fill="url(#silverRim)" opacity="0.3"/>

  <!-- Walkable Top Platform Plate with Bright Light Strip -->
  <rect x="28" y="16" width="456" height="12" rx="4" fill="url(#nightGleam)"/>
  <line x1="36" y1="20" x2="476" y2="20" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Side Carved Lunar Wings & Grips -->
  <path d="M 44 26 L 80 48 L 44 60 Z" fill="url(#silverRim)"/>
  <path d="M 468 26 L 432 48 L 468 60 Z" fill="url(#silverRim)"/>

  <!-- Decorative Starlight Inlay Studs -->
  <circle cx="160" cy="46" r="6" fill="url(#silverRim)"/>
  <circle cx="160" cy="46" r="2.5" fill="#fff"/>
  <circle cx="352" cy="46" r="6" fill="url(#silverRim)"/>
  <circle cx="352" cy="46" r="2.5" fill="#fff"/>
</svg>"""

ASSETS = [
  ("tile_slide_day.png", svg_slide_day, 256, 256),
  ("tile_slide_night.png", svg_slide_night, 256, 256),
  ("mover_platform_day.png", svg_mover_day, 512, 128),
  ("mover_platform_night.png", svg_mover_night, 512, 128),
]

html_template = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ background: transparent; overflow: hidden; }}
  </style>
</head>
<body>
  {svg}
</body>
</html>"""

for fname, svg_code, w, h in ASSETS:
    html_path = f"/tmp/{fname}.html"
    png_tmp = f"/tmp/{fname}.png"
    out_path = os.path.join(OUT_DIR, fname)

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_template.format(svg=svg_code))

    cmd = [
        "google-chrome",
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--window-size={w},{h}",
        f"--screenshot={png_tmp}",
        f"file://{html_path}"
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    im = Image.open(png_tmp)
    im = im.crop((0, 0, w, h))
    im.save(out_path, format="PNG")
    print(f"Generated {out_path} ({w}x{h})")

    if os.path.exists(html_path): os.remove(html_path)
    if os.path.exists(png_tmp): os.remove(png_tmp)
