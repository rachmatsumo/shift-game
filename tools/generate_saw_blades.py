import os
import subprocess
from PIL import Image

OUT_DIR = "assets"
os.makedirs(OUT_DIR, exist_ok=True)

# 1. Day Saw Blade (256x256, RGBA)
# Radiant Sunfire Rotary Blade: Razor-sharp tempered damascus steel teeth with gold/crimson core and brass mechanical housing
svg_saw_day = """<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bladeSteel" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f5f6fa"/>
      <stop offset="45%" stop-color="#dcdde1"/>
      <stop offset="75%" stop-color="#718093"/>
      <stop offset="100%" stop-color="#2f3640"/>
    </radialGradient>
    <radialGradient id="brassHub" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffeaa7"/>
      <stop offset="60%" stop-color="#e17055"/>
      <stop offset="100%" stop-color="#63171b"/>
    </radialGradient>
    <radialGradient id="fireCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#ff7675"/>
      <stop offset="70%" stop-color="#d63031"/>
      <stop offset="100%" stop-color="#800020"/>
    </radialGradient>
    <filter id="bladeGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Drop Shadow behind saw -->
  <circle cx="128" cy="132" r="116" fill="#1b1424" opacity="0.35"/>

  <!-- 12 Razor Curved Rotary Teeth -->
  <g fill="url(#bladeSteel)" stroke="#2f3640" stroke-width="2" stroke-linejoin="round">
    <!-- Tooth 0 -->
    <path d="M 128 12 Q 138 48 160 62 L 188 32 Q 182 70 196 90 L 232 78 Q 212 110 216 134 L 254 138 Q 224 164 216 188 L 246 206 Q 210 218 194 234 L 208 266 Q 174 254 150 262 L 146 296 Q 124 266 102 266 L 90 298 Q 78 262 56 252 L 34 274 Q 38 238 24 218 L 0 218 Q 22 186 20 162 L -12 144 Q 22 124 30 98 L 6 72 Q 44 68 62 48 L 52 14 Q 86 32 108 22 Z" transform="translate(14, -6) scale(0.9)"/>
  </g>

  <!-- Precise 12 Curved Rip Teeth (overlay with crisp geometry) -->
  <path d="
    M 128 8 L 144 62 L 188 28 L 186 86 L 238 72 L 214 126 L 260 134 L 216 172 L 246 200 L 192 216 L 198 252 L 150 244 L 134 264 L 110 244 L 66 254 L 72 214 L 18 200 L 48 172 L 4 134 L 50 126 L 26 72 L 78 86 L 76 28 L 120 62 Z
  " fill="url(#bladeSteel)" stroke="#2c3437" stroke-width="3" stroke-linejoin="round"/>

  <!-- Secondary Razor Chamfer Edge bevels -->
  <path d="
    M 128 8 L 144 62 L 138 68 Z
    M 188 28 L 186 86 L 178 88 Z
    M 238 72 L 214 126 L 208 122 Z
    M 260 134 L 216 172 L 212 166 Z
    M 246 200 L 192 216 L 192 208 Z
    M 198 252 L 150 244 L 154 238 Z
    M 134 264 L 110 244 L 118 240 Z
    M 66 254 L 72 214 L 80 216 Z
    M 18 200 L 48 172 L 54 176 Z
    M 4 134 L 50 126 L 54 132 Z
    M 26 72 L 78 86 L 82 80 Z
    M 76 28 L 120 62 L 126 58 Z
  " fill="#ffffff" opacity="0.6"/>

  <!-- Outer Steel Body Disc -->
  <circle cx="128" cy="128" r="82" fill="url(#bladeSteel)" stroke="#1e272e" stroke-width="3"/>
  <circle cx="128" cy="128" r="78" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.45"/>

  <!-- 4 Deep Stress-Relief Expansion Slots -->
  <rect x="124" y="52" width="8" height="42" rx="4" fill="#1e272e"/>
  <circle cx="128" cy="56" r="6" fill="#1e272e"/>
  <rect x="124" y="162" width="8" height="42" rx="4" fill="#1e272e"/>
  <circle cx="128" cy="200" r="6" fill="#1e272e"/>
  <rect x="52" y="124" width="42" height="8" rx="4" fill="#1e272e"/>
  <circle cx="56" cy="128" r="6" fill="#1e272e"/>
  <rect x="162" y="124" width="42" height="8" rx="4" fill="#1e272e"/>
  <circle cx="200" cy="128" r="6" fill="#1e272e"/>

  <!-- Ornate Brass Flange Hub -->
  <circle cx="128" cy="128" r="54" fill="url(#brassHub)" stroke="#3a0d11" stroke-width="3.5"/>
  <circle cx="128" cy="128" r="50" fill="none" stroke="#ffeaa7" stroke-width="1.5" opacity="0.75"/>

  <!-- 8 Perimeter Gear Rivets on Brass Hub -->
  <g fill="#ffeaa7" stroke="#63171b" stroke-width="1">
    <circle cx="128" cy="84" r="3.5"/>
    <circle cx="159" cy="97" r="3.5"/>
    <circle cx="172" cy="128" r="3.5"/>
    <circle cx="159" cy="159" r="3.5"/>
    <circle cx="128" cy="172" r="3.5"/>
    <circle cx="97" cy="159" r="3.5"/>
    <circle cx="84" cy="128" r="3.5"/>
    <circle cx="97" cy="97" r="3.5"/>
  </g>

  <!-- Glowing Sunfire Core (Crimson / White Plasma) -->
  <circle cx="128" cy="128" r="36" fill="url(#fireCore)" stroke="#800020" stroke-width="2" filter="url(#bladeGlow)"/>
  <circle cx="128" cy="128" r="26" fill="#ff4757"/>
  <circle cx="128" cy="128" r="14" fill="#ffffff"/>
</svg>"""

# 2. Night Saw Blade (256x256, RGBA)
# Abyssal Lunar Shadow Blade: Dark obsidian steel teeth with bioluminescent cyan/violet edges and electric plasma core
svg_saw_night = """<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="obsidianBlade" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#341f5c"/>
      <stop offset="45%" stop-color="#1f1038"/>
      <stop offset="80%" stop-color="#10061e"/>
      <stop offset="100%" stop-color="#05010a"/>
    </radialGradient>
    <radialGradient id="silverMoonHub" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#e0ffff"/>
      <stop offset="50%" stop-color="#00cec9"/>
      <stop offset="100%" stop-color="#1e1145"/>
    </radialGradient>
    <radialGradient id="cyanPlasmaCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#00f2fe"/>
      <stop offset="70%" stop-color="#a29bfe"/>
      <stop offset="100%" stop-color="#2c1a4d"/>
    </radialGradient>
    <filter id="cyanGlowSaw" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Drop Shadow behind saw -->
  <circle cx="128" cy="132" r="116" fill="#030106" opacity="0.6"/>

  <!-- 12 Razor Curved Obsidian Teeth -->
  <path d="
    M 128 8 L 144 62 L 188 28 L 186 86 L 238 72 L 214 126 L 260 134 L 216 172 L 246 200 L 192 216 L 198 252 L 150 244 L 134 264 L 110 244 L 66 254 L 72 214 L 18 200 L 48 172 L 4 134 L 50 126 L 26 72 L 78 86 L 76 28 L 120 62 Z
  " fill="url(#obsidianBlade)" stroke="#00cec9" stroke-width="2.5" stroke-linejoin="round"/>

  <!-- Bioluminescent Cyan Cutting Edges -->
  <path d="
    M 128 8 L 144 62 L 138 68 Z
    M 188 28 L 186 86 L 178 88 Z
    M 238 72 L 214 126 L 208 122 Z
    M 260 134 L 216 172 L 212 166 Z
    M 246 200 L 192 216 L 192 208 Z
    M 198 252 L 150 244 L 154 238 Z
    M 134 264 L 110 244 L 118 240 Z
    M 66 254 L 72 214 L 80 216 Z
    M 18 200 L 48 172 L 54 176 Z
    M 4 134 L 50 126 L 54 132 Z
    M 26 72 L 78 86 L 82 80 Z
    M 76 28 L 120 62 L 126 58 Z
  " fill="#81ecec" opacity="0.85" filter="url(#cyanGlowSaw)"/>

  <!-- Outer Obsidian Disc -->
  <circle cx="128" cy="128" r="82" fill="url(#obsidianBlade)" stroke="#090314" stroke-width="3"/>
  <circle cx="128" cy="128" r="78" fill="none" stroke="#00cec9" stroke-width="1.5" opacity="0.6"/>

  <!-- 4 Expansion Energy Conduits -->
  <rect x="124" y="52" width="8" height="42" rx="4" fill="#080210"/>
  <circle cx="128" cy="56" r="6" fill="#00cec9"/>
  <rect x="124" y="162" width="8" height="42" rx="4" fill="#080210"/>
  <circle cx="128" cy="200" r="6" fill="#00cec9"/>
  <rect x="52" y="124" width="42" height="8" rx="4" fill="#080210"/>
  <circle cx="56" cy="128" r="6" fill="#00cec9"/>
  <rect x="162" y="124" width="42" height="8" rx="4" fill="#080210"/>
  <circle cx="200" cy="128" r="6" fill="#00cec9"/>

  <!-- Moon-Silver / Cyan Arcane Flange Hub -->
  <circle cx="128" cy="128" r="54" fill="url(#silverMoonHub)" stroke="#0a0316" stroke-width="3.5"/>
  <circle cx="128" cy="128" r="50" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>

  <!-- 8 Perimeter Starlight Rivets -->
  <g fill="#ffffff" stroke="#00cec9" stroke-width="1">
    <circle cx="128" cy="84" r="3.5"/>
    <circle cx="159" cy="97" r="3.5"/>
    <circle cx="172" cy="128" r="3.5"/>
    <circle cx="159" cy="159" r="3.5"/>
    <circle cx="128" cy="172" r="3.5"/>
    <circle cx="97" cy="159" r="3.5"/>
    <circle cx="84" cy="128" r="3.5"/>
    <circle cx="97" cy="97" r="3.5"/>
  </g>

  <!-- Glowing Starlight Plasma Eye Core -->
  <circle cx="128" cy="128" r="36" fill="url(#cyanPlasmaCore)" stroke="#00cec9" stroke-width="2" filter="url(#cyanGlowSaw)"/>
  <circle cx="128" cy="128" r="26" fill="#00cec9"/>
  <circle cx="128" cy="128" r="14" fill="#ffffff"/>
</svg>"""

ASSETS = [
  ("saw_blade_day.png", svg_saw_day, 256, 256),
  ("saw_blade_night.png", svg_saw_night, 256, 256),
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
        "--default-background-color=00000000",
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
