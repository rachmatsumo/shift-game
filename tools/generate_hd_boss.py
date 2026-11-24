import os
import subprocess
from PIL import Image

OUT_DIR = "assets"
os.makedirs(OUT_DIR, exist_ok=True)

# 1024x960 Ultra-HD Vector Artwork for Void Titan / Leviathan Colossus
# Facing right, pursuing the traveler with gaping crystal maw, sweeping ancient horns, and blazing celestial eyes
svg_boss_hd = """<svg width="1024" height="960" viewBox="0 0 1024 960" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Dark Abyssal Body Gradients -->
    <radialGradient id="deepVoid" cx="40%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#1e0b2e"/>
      <stop offset="45%" stop-color="#12061f"/>
      <stop offset="80%" stop-color="#08020e"/>
      <stop offset="100%" stop-color="#030006"/>
    </radialGradient>
    <linearGradient id="armorPlate" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3d1d5a"/>
      <stop offset="30%" stop-color="#24103a"/>
      <stop offset="70%" stop-color="#140722"/>
      <stop offset="100%" stop-color="#090210"/>
    </linearGradient>
    <linearGradient id="chiseledRidge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ff477e" stop-opacity="0.8"/>
      <stop offset="25%" stop-color="#a855f7" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="hornSheen" x1="0" y1="0" x2="1" y2="0.6">
      <stop offset="0%" stop-color="#1a0928"/>
      <stop offset="35%" stop-color="#3d1d5a"/>
      <stop offset="65%" stop-color="#12051d"/>
      <stop offset="100%" stop-color="#050109"/>
    </linearGradient>

    <!-- Glowing Throat / Void Maw Nebula -->
    <radialGradient id="mawFire" cx="45%" cy="55%" r="55%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="20%" stop-color="#ff3366"/>
      <stop offset="55%" stop-color="#990033"/>
      <stop offset="85%" stop-color="#33001a"/>
      <stop offset="100%" stop-color="#050009"/>
    </radialGradient>

    <!-- Translucent Crystalline Fangs -->
    <linearGradient id="fangUpper" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#ffeef2"/>
      <stop offset="70%" stop-color="#ff99bb"/>
      <stop offset="100%" stop-color="#cc2255"/>
    </linearGradient>
    <linearGradient id="fangLower" x1="0" y1="1" x2="0.3" y2="0">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#ffeef2"/>
      <stop offset="70%" stop-color="#ff99bb"/>
      <stop offset="100%" stop-color="#cc2255"/>
    </linearGradient>
    <linearGradient id="fangShine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <!-- Blazing Radiant Eyes -->
    <radialGradient id="eyePrimary" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="25%" stop-color="#fff275"/>
      <stop offset="55%" stop-color="#ff2a6d"/>
      <stop offset="85%" stop-color="#990033"/>
      <stop offset="100%" stop-color="#33001a"/>
    </radialGradient>
    <radialGradient id="eyeWatcher" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#ff477e"/>
      <stop offset="80%" stop-color="#790025"/>
      <stop offset="100%" stop-color="#1f000a"/>
    </radialGradient>

    <!-- Atmospheric Glow Filters -->
    <filter id="crimsonGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="intenseEyeGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="16" result="blur1"/>
      <feGaussianBlur stdDeviation="6" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur1"/>
        <feMergeNode in="blur2"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Group: Back Tendrils & Horn Auras -->
  <g opacity="0.85">
    <!-- Back Horn Curve -->
    <path d="M 280 280 Q 220 140 320 40 Q 420 -20 540 60 Q 430 70 380 150 Q 340 220 320 280 Z" fill="url(#hornSheen)" stroke="#ff477e" stroke-width="2" stroke-opacity="0.4"/>
    <!-- Back Rib Details -->
    <path d="M 330 110 Q 370 100 420 120" stroke="#ff477e" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
    <path d="M 350 150 Q 390 140 430 160" stroke="#ff477e" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
    <path d="M 360 190 Q 400 180 430 200" stroke="#ff477e" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
  </g>

  <!-- Colossal Neck & Torso Foundation (anchored to the left) -->
  <path d="
    M 0 960
    L 280 960
    Q 320 860 380 800
    Q 440 760 520 740
    Q 460 670 420 630
    L 340 620
    Q 260 560 180 480
    L 0 420
    Z
  " fill="url(#deepVoid)"/>

  <!-- Open Abyssal Maw Cavity (Interior Darkness & Molten Void Fire) -->
  <path d="
    M 380 440
    Q 460 480 580 500
    L 660 520
    Q 540 640 460 690
    Q 380 660 340 600
    Q 320 530 350 470
    Z
  " fill="#08000d"/>

  <!-- Swirling Nebula Void Core inside the Throat -->
  <ellipse cx="430" cy="560" rx="90" ry="70" fill="url(#mawFire)" opacity="0.9" filter="url(#crimsonGlow)"/>
  <ellipse cx="440" cy="560" rx="45" ry="32" fill="#ffffff" opacity="0.8"/>

  <!-- Upper Skull Structure & Snout (Rightward Facing, Menacing Chiseled Brow) -->
  <path d="
    M 120 420
    Q 200 320 320 280
    Q 460 250 620 310
    Q 740 370 820 450
    Q 860 490 890 530
    L 710 520
    Q 640 500 520 480
    Q 440 460 380 440
    Q 300 420 180 440
    Z
  " fill="url(#armorPlate)" stroke="#ff477e" stroke-width="2" stroke-opacity="0.3"/>

  <!-- Upper Ridge Chiseled Carapace Plates -->
  <path d="M 340 280 Q 480 260 640 320 L 610 350 Q 460 300 330 320 Z" fill="#2d1246"/>
  <path d="M 480 290 Q 640 340 760 420 L 730 440 Q 620 370 470 320 Z" fill="#381754"/>
  <line x1="320" y1="280" x2="820" y2="450" stroke="url(#chiseledRidge)" stroke-width="4"/>

  <!-- Lower Jaw Structure (Massive hinged jaw) -->
  <path d="
    M 340 600
    Q 400 660 480 700
    Q 580 730 720 710
    L 780 680
    Q 680 620 580 580
    L 460 560
    Q 390 570 340 600
    Z
  " fill="url(#armorPlate)" stroke="#ff477e" stroke-width="2.5" stroke-opacity="0.4"/>
  <path d="M 460 660 Q 580 710 740 690 L 720 710 Q 580 730 450 680 Z" fill="#381754"/>

  <!-- PRIMARY SWEEPING ANCIENT HORN (Foreground Horn) -->
  <path d="
    M 420 300
    Q 500 180 620 100
    Q 720 40 860 60
    Q 920 80 960 140
    Q 910 120 840 120
    Q 730 130 640 200
    Q 540 280 470 370
    Z
  " fill="url(#hornSheen)" stroke="#ff477e" stroke-width="3" stroke-opacity="0.75" filter="url(#crimsonGlow)"/>

  <!-- Horn Carved Ring Ridges & Glowing Conduit Filigree -->
  <g stroke="#ff4fa3" stroke-width="4.5" stroke-linecap="round" opacity="0.8">
    <path d="M 520 220 Q 560 190 600 230"/>
    <path d="M 590 170 Q 640 140 670 180"/>
    <path d="M 670 120 Q 720 90 760 130"/>
    <path d="M 750 80 Q 800 60 840 90"/>
    <path d="M 830 65 Q 870 60 900 80"/>
  </g>
  <circle cx="956" cy="138" r="6" fill="#ffffff" filter="url(#intenseEyeGlow)"/>
  <circle cx="956" cy="138" r="14" fill="#ff2a6d" opacity="0.5"/>

  <!-- JAW TEETH / CRYSTALLINE FANGS (Razor Sharp, Multi-layered, Painterly) -->
  <!-- Upper Fangs (Hanging downward) -->
  <!-- Fang 1 (Rear small) -->
  <polygon points="530,480 550,483 542,530" fill="url(#fangUpper)"/>
  <!-- Fang 2 (Mid-rear) -->
  <polygon points="580,490 610,494 598,565" fill="url(#fangUpper)"/>
  <line x1="583" y1="492" x2="598" y2="565" stroke="#ffffff" stroke-width="2"/>
  <!-- Fang 3 (Major Carnassial Saber Fang) -->
  <polygon points="650,505 695,512 675,615" fill="url(#fangUpper)"/>
  <polygon points="653,507 675,510 675,615" fill="url(#fangShine)"/>
  <line x1="654" y1="507" x2="675" y2="615" stroke="#ffffff" stroke-width="3"/>
  <!-- Fang 4 (Sub-canine) -->
  <polygon points="720,518 755,522 742,590" fill="url(#fangUpper)"/>
  <line x1="722" y1="520" x2="742" y2="590" stroke="#ffffff" stroke-width="2"/>
  <!-- Fang 5 (Front Tip Dagger) -->
  <polygon points="785,526 820,528 812,580" fill="url(#fangUpper)"/>
  <line x1="787" y1="527" x2="812" y2="580" stroke="#ffffff" stroke-width="2"/>

  <!-- Lower Fangs (Pointing upward, interlocking) -->
  <!-- Lower Fang 1 (Front spike) -->
  <polygon points="750,670 775,665 765,600" fill="url(#fangLower)"/>
  <line x1="752" y1="668" x2="765" y2="600" stroke="#ffffff" stroke-width="2"/>
  <!-- Lower Fang 2 (Major lower saber tusk) -->
  <polygon points="685,635 720,630 705,530" fill="url(#fangLower)"/>
  <polygon points="688,634 705,632 705,530" fill="url(#fangShine)"/>
  <line x1="688" y1="634" x2="705" y2="530" stroke="#ffffff" stroke-width="2.5"/>
  <!-- Lower Fang 3 (Mid-lower) -->
  <polygon points="615,595 645,590 632,530" fill="url(#fangLower)"/>
  <line x1="617" y1="594" x2="632" y2="530" stroke="#ffffff" stroke-width="2"/>
  <!-- Lower Fang 4 (Rear lower) -->
  <polygon points="545,575 570,570 560,525" fill="url(#fangLower)"/>

  <!-- CELESTIAL EYES (High-Definition Radiant Geometry) -->
  <!-- Primary Colossal Burning Eye -->
  <g filter="url(#intenseEyeGlow)">
    <!-- Outer Eye Socket Frame (Chiseled bone orbit) -->
    <path d="M 610 400 Q 680 360 760 390 Q 780 430 750 460 Q 670 480 610 440 Z" fill="#050009" stroke="#ff2a6d" stroke-width="4"/>
    <!-- Glowing Sclera / Iris -->
    <ellipse cx="690" cy="425" rx="58" ry="42" fill="url(#eyePrimary)"/>
    <!-- Intense Inner Core -->
    <ellipse cx="692" cy="425" rx="34" ry="26" fill="#fff799"/>
    <!-- Vertical Slit Abyssal Pupil -->
    <ellipse cx="692" cy="425" rx="10" ry="34" fill="#050009"/>
    <!-- Specular Highlight Reflections -->
    <circle cx="678" cy="415" r="8" fill="#ffffff"/>
    <circle cx="704" cy="435" r="4.5" fill="#ffffff"/>
  </g>

  <!-- Secondary Watcher Eye 1 (Above brow) -->
  <g filter="url(#crimsonGlow)">
    <polygon points="540,320 575,305 605,325 570,340" fill="#050009" stroke="#ff2a6d" stroke-width="2"/>
    <ellipse cx="572" cy="322" rx="22" ry="14" fill="url(#eyeWatcher)"/>
    <ellipse cx="572" cy="322" rx="4" ry="12" fill="#000000"/>
    <circle cx="568" cy="318" r="3.5" fill="#ffffff"/>
  </g>

  <!-- Secondary Watcher Eye 2 (Upper temple) -->
  <g filter="url(#crimsonGlow)">
    <polygon points="450,290 480,278 505,296 475,308" fill="#050009" stroke="#ff2a6d" stroke-width="1.8"/>
    <ellipse cx="478" cy="293" rx="17" ry="11" fill="url(#eyeWatcher)"/>
    <circle cx="476" cy="290" r="3" fill="#ffffff"/>
  </g>

  <!-- Secondary Watcher Eye 3 (Jaw / Cheek line) -->
  <g filter="url(#crimsonGlow)">
    <polygon points="500,430 535,420 555,438 520,448" fill="#050009" stroke="#ff2a6d" stroke-width="1.8"/>
    <ellipse cx="528" cy="434" rx="18" ry="11" fill="url(#eyeWatcher)"/>
    <circle cx="525" cy="431" r="3" fill="#ffffff"/>
  </g>

  <!-- Glowing Abyssal Rune Inlays along the Cheek & Brow -->
  <path d="M 640 460 L 600 480 L 560 470 L 520 495" fill="none" stroke="#ff4fa3" stroke-width="3" stroke-linecap="round" opacity="0.8" filter="url(#crimsonGlow)"/>
  <circle cx="640" cy="460" r="3.5" fill="#ffffff"/>
  <circle cx="600" cy="480" r="3" fill="#ffffff"/>
  <circle cx="520" cy="495" r="3.5" fill="#ffffff"/>

  <!-- Ethereal Shadow Wisps curling off the Chin and Throat -->
  <path d="M 400 720 Q 360 780 320 840 Q 360 810 410 760 Z" fill="#ff2a6d" opacity="0.4"/>
  <path d="M 500 730 Q 480 820 440 900 Q 470 840 520 760 Z" fill="#ff2a6d" opacity="0.3"/>
</svg>"""

html_path = "/tmp/boss_hd.html"
png_tmp = "/tmp/boss_hd.png"
out_path = os.path.join(OUT_DIR, "boss_colossus.png")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ background: transparent; overflow: hidden; }}
  </style>
</head>
<body>
  {svg_boss_hd}
</body>
</html>""")

# Render at 1024x960
cmd = [
    "google-chrome",
    "--headless",
    "--disable-gpu",
    "--default-background-color=00000000",
    "--hide-scrollbars",
    "--window-size=1024,960",
    f"--screenshot={png_tmp}",
    f"file://{html_path}"
]
subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

im = Image.open(png_tmp)
im = im.crop((0, 0, 1024, 960))
# Save high-definition 1024x960 PNG with full RGBA fidelity
im.save(out_path, format="PNG", optimize=True)
print(f"Generated {out_path} ({im.size}, {os.path.getsize(out_path)} bytes)")

if os.path.exists(html_path): os.remove(html_path)
if os.path.exists(png_tmp): os.remove(png_tmp)
