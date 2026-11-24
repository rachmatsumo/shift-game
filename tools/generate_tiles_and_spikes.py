import os
import subprocess
from PIL import Image

OUT_DIR = "assets"
os.makedirs(OUT_DIR, exist_ok=True)

# 1. Day Ground Platform Tile (256x256)
svg_ground_day = """<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="skyHighlight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f6e58d" stop-opacity="0.9"/>
      <stop offset="30%" stop-color="#badc58" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#6ab04c" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="stoneBase" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a3328"/>
      <stop offset="35%" stop-color="#3b261b"/>
      <stop offset="70%" stop-color="#2c1a11"/>
      <stop offset="100%" stop-color="#1f110a"/>
    </linearGradient>
    <linearGradient id="brick1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5c4033"/>
      <stop offset="100%" stop-color="#3d271c"/>
    </linearGradient>
    <linearGradient id="brick2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6e4d3d"/>
      <stop offset="100%" stop-color="#462c20"/>
    </linearGradient>
    <linearGradient id="mossGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f9ca24"/>
      <stop offset="40%" stop-color="#6ab04c"/>
      <stop offset="100%" stop-color="#27ae60"/>
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Deep Earth / Stone Foundation -->
  <rect x="0" y="0" width="256" height="256" fill="url(#stoneBase)"/>

  <!-- Ancient Carved Masonry Brick Layers (Seamless horizontal seams at 0 and 256) -->
  <!-- Layer 1: Upper blocks -->
  <rect x="2" y="38" width="124" height="60" rx="3" fill="url(#brick1)"/>
  <rect x="130" y="38" width="124" height="60" rx="3" fill="url(#brick2)"/>
  <line x1="2" y1="39" x2="126" y2="39" stroke="#7d5945" stroke-width="1.5" stroke-opacity="0.6"/>
  <line x1="130" y1="39" x2="254" y2="39" stroke="#8d654f" stroke-width="1.5" stroke-opacity="0.6"/>

  <!-- Layer 2: Mid staggered blocks -->
  <rect x="0" y="102" width="60" height="68" rx="3" fill="url(#brick2)"/>
  <rect x="64" y="102" width="128" height="68" rx="3" fill="url(#brick1)"/>
  <rect x="196" y="102" width="60" height="68" rx="3" fill="url(#brick2)"/>
  <line x1="64" y1="103" x2="192" y2="103" stroke="#7d5945" stroke-width="1.5" stroke-opacity="0.6"/>

  <!-- Layer 3: Bottom foundation blocks -->
  <rect x="4" y="174" width="122" height="78" rx="3" fill="url(#brick1)"/>
  <rect x="130" y="174" width="122" height="78" rx="3" fill="url(#brick2)"/>

  <!-- Weathering Fissures & Cracks -->
  <path d="M45,45 Q55,65 50,82 Q45,95 52,110" stroke="#1f110a" stroke-width="2" fill="none" opacity="0.75"/>
  <path d="M46,46 Q56,66 51,83" stroke="#8d654f" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M170,115 Q180,135 174,155 Q178,170 172,185" stroke="#1f110a" stroke-width="2" fill="none" opacity="0.75"/>
  <path d="M210,50 Q218,68 214,88" stroke="#1f110a" stroke-width="1.5" fill="none" opacity="0.6"/>

  <!-- Subtle Mortar & Ambient Occlusion Shading -->
  <rect x="0" y="98" width="256" height="4" fill="#180c07" opacity="0.6"/>
  <rect x="0" y="170" width="256" height="4" fill="#180c07" opacity="0.6"/>
  <rect x="126" y="38" width="4" height="60" fill="#180c07" opacity="0.5"/>
  <rect x="60" y="102" width="4" height="68" fill="#180c07" opacity="0.5"/>
  <rect x="192" y="102" width="4" height="68" fill="#180c07" opacity="0.5"/>
  <rect x="126" y="174" width="4" height="78" fill="#180c07" opacity="0.5"/>

  <!-- Overgrown Moss & Lichen Patches on the stone -->
  <path d="M80,48 Q95,42 110,49 Q120,58 112,68 Q95,72 82,62 Z" fill="#487eb0" opacity="0.25"/>
  <path d="M80,48 Q95,42 110,49 Q120,58 112,68 Q95,72 82,62 Z" fill="#6ab04c" opacity="0.35"/>
  <path d="M140,118 Q160,112 175,122 Q182,136 170,144 Q150,146 138,134 Z" fill="#27ae60" opacity="0.3"/>

  <!-- Top Organic Verge: Lush Grass, Golden Autumn Moss & Wildflower Overhang -->
  <rect x="0" y="0" width="256" height="34" fill="#2d1c12"/>
  <!-- Primary Grass/Moss Mass -->
  <path d="M0,0 L256,0 L256,24 Q240,32 225,22 Q210,14 195,26 Q180,34 165,22 Q150,12 135,26 Q120,34 105,20 Q90,12 75,25 Q60,33 45,22 Q30,14 15,26 Q5,30 0,25 Z" fill="url(#mossGrad)"/>

  <!-- Highlight Grass Tufts & Overhanging Blades (Seamless wrapping 0 to 256) -->
  <path d="M0,22 Q8,36 12,24 Q20,38 28,23 Q38,40 46,24 Q56,37 64,22 Q76,41 84,24 Q96,38 106,23 Q118,40 128,24 Q138,38 148,22 Q158,39 168,23 Q180,41 190,24 Q202,38 212,22 Q224,40 234,23 Q246,38 256,22 L256,0 L0,0 Z" fill="#78e08f"/>
  <path d="M4,16 Q10,30 16,18 Q26,32 34,18 Q44,34 52,18 Q62,31 70,18 Q82,34 90,18 Q102,32 112,18 Q124,35 134,18 Q144,32 154,18 Q164,33 174,18 Q186,34 196,18 Q208,32 218,18 Q230,34 240,18 Q250,30 256,18 L256,0 L0,0 Z" fill="#badc58"/>
  <path d="M0,8 L256,8 L256,18 Q230,22 200,14 Q160,22 130,13 Q90,22 60,14 Q30,22 0,16 Z" fill="#f6e58d" opacity="0.75"/>

  <!-- Golden Wildflower Buds & Sun Droplets -->
  <circle cx="28" cy="24" r="2.5" fill="#f9ca24" filter="url(#softGlow)"/>
  <circle cx="28" cy="24" r="1.2" fill="#ffffff"/>
  <circle cx="92" cy="22" r="2.5" fill="#f9ca24" filter="url(#softGlow)"/>
  <circle cx="92" cy="22" r="1.2" fill="#ffffff"/>
  <circle cx="166" cy="23" r="2.8" fill="#f0932b" filter="url(#softGlow)"/>
  <circle cx="166" cy="23" r="1.3" fill="#ffffff"/>
  <circle cx="228" cy="22" r="2.5" fill="#f9ca24" filter="url(#softGlow)"/>
  <circle cx="228" cy="22" r="1.2" fill="#ffffff"/>

  <!-- Top Sunlight Crest Highlight -->
  <line x1="0" y1="1.5" x2="256" y2="1.5" stroke="#f9ca24" stroke-width="3" stroke-opacity="0.85"/>
  <line x1="0" y1="3" x2="256" y2="3" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.9"/>
</svg>"""

# 2. Night Ground Platform Tile (256x256)
svg_ground_night = """<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="nightBase" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#181530"/>
      <stop offset="35%" stop-color="#120e24"/>
      <stop offset="70%" stop-color="#0a0817"/>
      <stop offset="100%" stop-color="#05040d"/>
    </linearGradient>
    <linearGradient id="nBrick1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#241f47"/>
      <stop offset="100%" stop-color="#15122b"/>
    </linearGradient>
    <linearGradient id="nBrick2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2d2657"/>
      <stop offset="100%" stop-color="#181433"/>
    </linearGradient>
    <linearGradient id="lunarMoss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#00cec9"/>
      <stop offset="40%" stop-color="#6c5ce7"/>
      <stop offset="100%" stop-color="#341f97"/>
    </linearGradient>
    <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3.5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Deep Obsidian Midnight Foundation -->
  <rect x="0" y="0" width="256" height="256" fill="url(#nightBase)"/>

  <!-- Ancient Twilight Masonry Blocks (Seamless horizontal seams) -->
  <rect x="2" y="38" width="124" height="60" rx="3" fill="url(#nBrick1)"/>
  <rect x="130" y="38" width="124" height="60" rx="3" fill="url(#nBrick2)"/>
  <line x1="2" y1="39" x2="126" y2="39" stroke="#574b90" stroke-width="1.5" stroke-opacity="0.6"/>
  <line x1="130" y1="39" x2="254" y2="39" stroke="#6c5ce7" stroke-width="1.5" stroke-opacity="0.6"/>

  <rect x="0" y="102" width="60" height="68" rx="3" fill="url(#nBrick2)"/>
  <rect x="64" y="102" width="128" height="68" rx="3" fill="url(#nBrick1)"/>
  <rect x="196" y="102" width="60" height="68" rx="3" fill="url(#nBrick2)"/>
  <line x1="64" y1="103" x2="192" y2="103" stroke="#574b90" stroke-width="1.5" stroke-opacity="0.6"/>

  <rect x="4" y="174" width="122" height="78" rx="3" fill="url(#nBrick1)"/>
  <rect x="130" y="174" width="122" height="78" rx="3" fill="url(#nBrick2)"/>

  <!-- Bioluminescent Cyan Crystal Veins in the rock -->
  <path d="M48,46 Q58,68 53,86 Q46,102 54,116" stroke="#00cec9" stroke-width="1.8" fill="none" opacity="0.8" filter="url(#cyanGlow)"/>
  <path d="M50,48 Q60,70 55,88" stroke="#ffffff" stroke-width="0.8" fill="none" opacity="0.9"/>
  <path d="M172,118 Q182,138 176,158 Q180,172 174,188" stroke="#a29bfe" stroke-width="1.8" fill="none" opacity="0.75" filter="url(#cyanGlow)"/>
  <path d="M173,120 Q183,140 177,160" stroke="#ffffff" stroke-width="0.7" fill="none" opacity="0.8"/>

  <!-- Mortar seams -->
  <rect x="0" y="98" width="256" height="4" fill="#06040d" opacity="0.7"/>
  <rect x="0" y="170" width="256" height="4" fill="#06040d" opacity="0.7"/>
  <rect x="126" y="38" width="4" height="60" fill="#06040d" opacity="0.6"/>
  <rect x="60" y="102" width="4" height="68" fill="#06040d" opacity="0.6"/>
  <rect x="192" y="102" width="4" height="68" fill="#06040d" opacity="0.6"/>
  <rect x="126" y="174" width="4" height="78" fill="#06040d" opacity="0.6"/>

  <!-- Bioluminescent Moss Fringe & Overhang -->
  <rect x="0" y="0" width="256" height="34" fill="#0d0a1c"/>
  <path d="M0,0 L256,0 L256,24 Q240,32 225,22 Q210,14 195,26 Q180,34 165,22 Q150,12 135,26 Q120,34 105,20 Q90,12 75,25 Q60,33 45,22 Q30,14 15,26 Q5,30 0,25 Z" fill="url(#lunarMoss)"/>

  <!-- Glowing tendrils & crystal spores (Seamless horizontal) -->
  <path d="M0,22 Q8,36 12,24 Q20,38 28,23 Q38,40 46,24 Q56,37 64,22 Q76,41 84,24 Q96,38 106,23 Q118,40 128,24 Q138,38 148,22 Q158,39 168,23 Q180,41 190,24 Q202,38 212,22 Q224,40 234,23 Q246,38 256,22 L256,0 L0,0 Z" fill="#81ecec" opacity="0.9"/>
  <path d="M4,16 Q10,30 16,18 Q26,32 34,18 Q44,34 52,18 Q62,31 70,18 Q82,34 90,18 Q102,32 112,18 Q124,35 134,18 Q144,32 154,18 Q164,33 174,18 Q186,34 196,18 Q208,32 218,18 Q230,34 240,18 Q250,30 256,18 L256,0 L0,0 Z" fill="#a29bfe"/>

  <!-- Glowing Astral Spores -->
  <circle cx="32" cy="24" r="2.5" fill="#00cec9" filter="url(#cyanGlow)"/>
  <circle cx="32" cy="24" r="1.2" fill="#ffffff"/>
  <circle cx="96" cy="22" r="2.5" fill="#81ecec" filter="url(#cyanGlow)"/>
  <circle cx="96" cy="22" r="1.2" fill="#ffffff"/>
  <circle cx="170" cy="23" r="2.8" fill="#e056fd" filter="url(#cyanGlow)"/>
  <circle cx="170" cy="23" r="1.3" fill="#ffffff"/>
  <circle cx="232" cy="22" r="2.5" fill="#00cec9" filter="url(#cyanGlow)"/>
  <circle cx="232" cy="22" r="1.2" fill="#ffffff"/>

  <!-- Ethereal Starlight Crest -->
  <line x1="0" y1="1.5" x2="256" y2="1.5" stroke="#00cec9" stroke-width="3" stroke-opacity="0.9"/>
  <line x1="0" y1="3" x2="256" y2="3" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.95"/>
</svg>"""

# 3. Day Shift Relic Block ('D' block) - 256x256
svg_block_day = """<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldBorder" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffeaa7"/>
      <stop offset="35%" stop-color="#fdcb6e"/>
      <stop offset="70%" stop-color="#e17055"/>
      <stop offset="100%" stop-color="#d63031"/>
    </linearGradient>
    <linearGradient id="goldPlate" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f39c12"/>
      <stop offset="50%" stop-color="#e67e22"/>
      <stop offset="100%" stop-color="#b76008"/>
    </linearGradient>
    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="30%" stop-color="#ffeaa7"/>
      <stop offset="70%" stop-color="#fdcb6e"/>
      <stop offset="100%" stop-color="#e17055" stop-opacity="0"/>
    </radialGradient>
    <filter id="goldShine" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Outer Beveled Stone Casing -->
  <rect x="8" y="8" width="240" height="240" rx="20" fill="#2d1a0e"/>
  <rect x="12" y="12" width="232" height="232" rx="16" fill="url(#goldBorder)"/>
  <rect x="22" y="22" width="212" height="212" rx="12" fill="#522f13"/>
  <rect x="28" y="28" width="200" height="200" rx="8" fill="url(#goldPlate)"/>

  <!-- Ornate Corner Brackets -->
  <path d="M28,60 L28,28 L60,28 L48,48 L28,60 Z" fill="#ffeaa7"/>
  <path d="M228,60 L228,28 L196,28 L208,48 L228,60 Z" fill="#ffeaa7"/>
  <path d="M28,196 L28,228 L60,228 L48,208 L28,196 Z" fill="#d35400"/>
  <path d="M228,196 L228,228 L196,228 L208,208 L228,196 Z" fill="#d35400"/>

  <!-- Ancient Geometric Runic Grooves -->
  <rect x="42" y="42" width="172" height="172" rx="6" fill="none" stroke="#7e400c" stroke-width="3"/>
  <rect x="46" y="46" width="164" height="164" rx="4" fill="none" stroke="#fce38a" stroke-width="1.5" stroke-opacity="0.6"/>

  <!-- Outer Solar Core Glow -->
  <circle cx="128" cy="128" r="68" fill="url(#sunGlow)"/>

  <!-- Majestic Solar Wheel Rune -->
  <!-- 8 Radiant Beveled Sun Rays -->
  <g transform="translate(128,128)" filter="url(#goldShine)">
    <g id="sunRay">
      <polygon points="0,-72 8,-48 0,-42 -8,-48" fill="#ffeaa7"/>
      <polygon points="0,-72 0,-42 8,-48" fill="#ffffff"/>
      <polygon points="0,-72 0,-42 -8,-48" fill="#f39c12"/>
    </g>
    <use href="#sunRay" transform="rotate(45)"/>
    <use href="#sunRay" transform="rotate(90)"/>
    <use href="#sunRay" transform="rotate(135)"/>
    <use href="#sunRay" transform="rotate(180)"/>
    <use href="#sunRay" transform="rotate(225)"/>
    <use href="#sunRay" transform="rotate(270)"/>
    <use href="#sunRay" transform="rotate(315)"/>

    <!-- Concentric Celestial Rings -->
    <circle cx="0" cy="0" r="42" fill="#63340f" stroke="#ffeaa7" stroke-width="4"/>
    <circle cx="0" cy="0" r="34" fill="url(#goldPlate)" stroke="#f39c12" stroke-width="2"/>

    <!-- Center Radiant Diamond Core -->
    <polygon points="0,-24 24,0 0,24 -24,0" fill="#ffffff" filter="url(#goldShine)"/>
    <polygon points="0,-18 18,0 0,18 -18,0" fill="#f9ca24"/>
    <polygon points="0,-10 10,0 0,10 -10,0" fill="#ffffff"/>
  </g>

  <!-- Top Bevel Specular Sheen -->
  <line x1="28" y1="30" x2="228" y2="30" stroke="#ffffff" stroke-width="3" stroke-opacity="0.75" stroke-linecap="round"/>
</svg>"""

# 4. Night Shift Relic Block ('N' block) - 256x256
svg_block_night = """<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="silverBorder" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="30%" stop-color="#a29bfe"/>
      <stop offset="70%" stop-color="#6c5ce7"/>
      <stop offset="100%" stop-color="#1e134b"/>
    </linearGradient>
    <linearGradient id="nightPlate" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2c1a4d"/>
      <stop offset="50%" stop-color="#1a1033"/>
      <stop offset="100%" stop-color="#0c071a"/>
    </linearGradient>
    <radialGradient id="lunarGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#81ecec"/>
      <stop offset="70%" stop-color="#00cec9"/>
      <stop offset="100%" stop-color="#6c5ce7" stop-opacity="0"/>
    </radialGradient>
    <filter id="cyanShine" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="4.5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Outer Beveled Midnight Obsidian Casing -->
  <rect x="8" y="8" width="240" height="240" rx="20" fill="#05030a"/>
  <rect x="12" y="12" width="232" height="232" rx="16" fill="url(#silverBorder)"/>
  <rect x="22" y="22" width="212" height="212" rx="12" fill="#0d091f"/>
  <rect x="28" y="28" width="200" height="200" rx="8" fill="url(#nightPlate)"/>

  <!-- Ornate Astral Silver Corner Brackets -->
  <path d="M28,60 L28,28 L60,28 L48,48 L28,60 Z" fill="#dfe6e9"/>
  <path d="M228,60 L228,28 L196,28 L208,48 L228,60 Z" fill="#dfe6e9"/>
  <path d="M28,196 L28,228 L60,228 L48,208 L28,196 Z" fill="#574b90"/>
  <path d="M228,196 L228,228 L196,228 L208,208 L228,196 Z" fill="#574b90"/>

  <!-- Ancient Astral Grooves -->
  <rect x="42" y="42" width="172" height="172" rx="6" fill="none" stroke="#2c1a4d" stroke-width="3"/>
  <rect x="46" y="46" width="164" height="164" rx="4" fill="none" stroke="#a29bfe" stroke-width="1.5" stroke-opacity="0.6"/>

  <!-- Celestial Core Glow -->
  <circle cx="128" cy="128" r="70" fill="url(#lunarGlow)"/>

  <!-- Majestic Lunar Crescent & Astral Star Rune -->
  <g transform="translate(128,128)" filter="url(#cyanShine)">
    <!-- Ornate Crescent Moon -->
    <path d="M-6,-48 C24,-44 48,-20 48,16 C48,48 24,70 -8,66 C14,54 26,34 26,12 C26,-16 10,-38 -6,-48 Z" fill="#81ecec"/>
    <path d="M-6,-48 C24,-44 48,-20 48,16 C48,48 24,70 -8,66 C14,54 26,34 26,12 C26,-16 10,-38 -6,-48 Z" fill="#ffffff" opacity="0.6"/>

    <!-- Radiant 8-Pointed Celestial Star in Center -->
    <g transform="translate(-4, 8)">
      <polygon points="0,-34 7,-10 32,-3 10,6 20,30 0,14 -20,30 -10,6 -32,-3 -7,-10" fill="#00cec9"/>
      <polygon points="0,-34 7,-10 32,-3 10,6 20,30 0,14 -20,30 -10,6 -32,-3 -7,-10" fill="#ffffff" opacity="0.8" transform="scale(0.6)"/>
      <circle cx="0" cy="0" r="5" fill="#ffffff"/>
    </g>
  </g>

  <!-- Top Specular Sheen -->
  <line x1="28" y1="30" x2="228" y2="30" stroke="#ffffff" stroke-width="3" stroke-opacity="0.85" stroke-linecap="round"/>
</svg>"""

# 5. Floor Spikes Day - 512x256 (Seamless cluster of 4 razor-sharp crystalline/ironwood spikes)
svg_spikes_day = """<svg width="512" height="256" viewBox="0 0 512 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="spkGrad1" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#4a1015"/>
      <stop offset="40%" stop-color="#991520"/>
      <stop offset="85%" stop-color="#e74c3c"/>
      <stop offset="100%" stop-color="#ff7675"/>
    </linearGradient>
    <linearGradient id="spkFacetDark" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#2d0508"/>
      <stop offset="60%" stop-color="#6d0d15"/>
      <stop offset="100%" stop-color="#c0392b"/>
    </linearGradient>
    <linearGradient id="amberGlint" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#ffeaa7"/>
      <stop offset="100%" stop-color="#e17055"/>
    </linearGradient>
    <filter id="hazardGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Rocky Low Base Bar -->
  <path d="M0,256 L0,236 Q64,228 128,236 Q192,244 256,236 Q320,228 384,236 Q448,244 512,236 L512,256 Z" fill="#2d1410"/>
  <line x1="0" y1="236" x2="512" y2="236" stroke="#c0392b" stroke-width="2" opacity="0.6"/>

  <!-- 4 Primary Deadly Spikes (Each 128px wide block = 2 spikes -> 4 per 256px tile) -->
  <!-- Spike 1: Left tall spike -->
  <g>
    <!-- Dark Facet (left) -->
    <polygon points="64,20 18,242 64,242" fill="url(#spkFacetDark)"/>
    <!-- Light Facet (right) -->
    <polygon points="64,20 64,242 110,242" fill="url(#spkGrad1)"/>
    <!-- Center Spine & Razor Edge -->
    <line x1="64" y1="20" x2="64" y2="242" stroke="#ffffff" stroke-width="2" stroke-opacity="0.85"/>
    <!-- Sharp Glint Tip -->
    <polygon points="64,16 68,36 64,30 60,36" fill="#ffffff" filter="url(#hazardGlow)"/>
    <circle cx="64" cy="20" r="3" fill="#ffffff" filter="url(#hazardGlow)"/>
  </g>

  <!-- Spike 2: Mid-left secondary spike -->
  <g>
    <polygon points="192,35 150,242 192,242" fill="url(#spkFacetDark)"/>
    <polygon points="192,35 192,242 234,242" fill="url(#spkGrad1)"/>
    <line x1="192" y1="35" x2="192" y2="242" stroke="#ffffff" stroke-width="1.8" stroke-opacity="0.85"/>
    <circle cx="192" cy="35" r="2.8" fill="#ffffff" filter="url(#hazardGlow)"/>
  </g>

  <!-- Spike 3: Mid-right primary spike -->
  <g>
    <polygon points="320,20 274,242 320,242" fill="url(#spkFacetDark)"/>
    <polygon points="320,20 320,242 366,242" fill="url(#spkGrad1)"/>
    <line x1="320" y1="20" x2="320" y2="242" stroke="#ffffff" stroke-width="2" stroke-opacity="0.85"/>
    <circle cx="320" cy="20" r="3" fill="#ffffff" filter="url(#hazardGlow)"/>
  </g>

  <!-- Spike 4: Right secondary spike -->
  <g>
    <polygon points="448,35 406,242 448,242" fill="url(#spkFacetDark)"/>
    <polygon points="448,35 448,242 490,242" fill="url(#spkGrad1)"/>
    <line x1="448" y1="35" x2="448" y2="242" stroke="#ffffff" stroke-width="1.8" stroke-opacity="0.85"/>
    <circle cx="448" cy="35" r="2.8" fill="#ffffff" filter="url(#hazardGlow)"/>
  </g>

  <!-- Foreground Needle Splinters for dense organic menace -->
  <polygon points="128,90 114,242 142,242" fill="url(#spkGrad1)" opacity="0.95"/>
  <line x1="128" y1="90" x2="128" y2="242" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.7"/>
  <polygon points="256,90 242,242 270,242" fill="url(#spkGrad1)" opacity="0.95"/>
  <line x1="256" y1="90" x2="256" y2="242" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.7"/>
  <polygon points="384,90 370,242 398,242" fill="url(#spkGrad1)" opacity="0.95"/>
  <line x1="384" y1="90" x2="384" y2="242" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.7"/>
</svg>"""

# 6. Floor Spikes Night - 512x256 (Abyssal Twilight Crystals on transparent background)
svg_spikes_night = """<svg width="512" height="256" viewBox="0 0 512 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="nSpkGrad1" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#120826"/>
      <stop offset="40%" stop-color="#341f97"/>
      <stop offset="85%" stop-color="#8c7ae6"/>
      <stop offset="100%" stop-color="#00cec9"/>
    </linearGradient>
    <linearGradient id="nSpkFacetDark" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#07030f"/>
      <stop offset="60%" stop-color="#1e0f47"/>
      <stop offset="100%" stop-color="#5f27cd"/>
    </linearGradient>
    <filter id="nightHazardGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3.5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Rocky Low Base Bar -->
  <path d="M0,256 L0,236 Q64,228 128,236 Q192,244 256,236 Q320,228 384,236 Q448,244 512,236 L512,256 Z" fill="#0d081a"/>
  <line x1="0" y1="236" x2="512" y2="236" stroke="#00cec9" stroke-width="2" opacity="0.6"/>

  <!-- 4 Primary Deadly Abyssal Spikes -->
  <g>
    <polygon points="64,20 18,242 64,242" fill="url(#nSpkFacetDark)"/>
    <polygon points="64,20 64,242 110,242" fill="url(#nSpkGrad1)"/>
    <line x1="64" y1="20" x2="64" y2="242" stroke="#81ecec" stroke-width="2" stroke-opacity="0.9"/>
    <circle cx="64" cy="20" r="3.2" fill="#ffffff" filter="url(#nightHazardGlow)"/>
  </g>

  <g>
    <polygon points="192,35 150,242 192,242" fill="url(#nSpkFacetDark)"/>
    <polygon points="192,35 192,242 234,242" fill="url(#nSpkGrad1)"/>
    <line x1="192" y1="35" x2="192" y2="242" stroke="#81ecec" stroke-width="1.8" stroke-opacity="0.9"/>
    <circle cx="192" cy="35" r="2.8" fill="#ffffff" filter="url(#nightHazardGlow)"/>
  </g>

  <g>
    <polygon points="320,20 274,242 320,242" fill="url(#nSpkFacetDark)"/>
    <polygon points="320,20 320,242 366,242" fill="url(#nSpkGrad1)"/>
    <line x1="320" y1="20" x2="320" y2="242" stroke="#81ecec" stroke-width="2" stroke-opacity="0.9"/>
    <circle cx="320" cy="20" r="3.2" fill="#ffffff" filter="url(#nightHazardGlow)"/>
  </g>

  <g>
    <polygon points="448,35 406,242 448,242" fill="url(#nSpkFacetDark)"/>
    <polygon points="448,35 448,242 490,242" fill="url(#nSpkGrad1)"/>
    <line x1="448" y1="35" x2="448" y2="242" stroke="#81ecec" stroke-width="1.8" stroke-opacity="0.9"/>
    <circle cx="448" cy="35" r="2.8" fill="#ffffff" filter="url(#nightHazardGlow)"/>
  </g>

  <!-- Secondary Splinters -->
  <polygon points="128,90 114,242 142,242" fill="url(#nSpkGrad1)" opacity="0.95"/>
  <line x1="128" y1="90" x2="128" y2="242" stroke="#00cec9" stroke-width="1.2" stroke-opacity="0.75"/>
  <polygon points="256,90 242,242 270,242" fill="url(#nSpkGrad1)" opacity="0.95"/>
  <line x1="256" y1="90" x2="256" y2="242" stroke="#00cec9" stroke-width="1.2" stroke-opacity="0.75"/>
  <polygon points="384,90 370,242 398,242" fill="url(#nSpkGrad1)" opacity="0.95"/>
  <line x1="384" y1="90" x2="384" y2="242" stroke="#00cec9" stroke-width="1.2" stroke-opacity="0.75"/>
</svg>"""

# 7. Ceiling Spikes - 512x256 (Stalactites hanging downwards on transparent background)
svg_spikes_ceiling = """<svg width="512" height="256" viewBox="0 0 512 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ceilGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a1015"/>
      <stop offset="40%" stop-color="#991520"/>
      <stop offset="85%" stop-color="#e74c3c"/>
      <stop offset="100%" stop-color="#ff7675"/>
    </linearGradient>
    <linearGradient id="ceilFacetDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2d0508"/>
      <stop offset="60%" stop-color="#6d0d15"/>
      <stop offset="100%" stop-color="#c0392b"/>
    </linearGradient>
    <filter id="ceilHazardGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Ceiling Stone Base Bar -->
  <path d="M0,0 L0,20 Q64,28 128,20 Q192,12 256,20 Q320,28 384,20 Q448,12 512,20 L512,0 Z" fill="#2d1410"/>
  <line x1="0" y1="20" x2="512" y2="20" stroke="#c0392b" stroke-width="2" opacity="0.6"/>

  <!-- 4 Hanging Stalactites -->
  <g>
    <polygon points="64,236 18,14 64,14" fill="url(#ceilFacetDark)"/>
    <polygon points="64,236 64,14 110,14" fill="url(#ceilGrad)"/>
    <line x1="64" y1="236" x2="64" y2="14" stroke="#ffffff" stroke-width="2" stroke-opacity="0.85"/>
    <circle cx="64" cy="236" r="3" fill="#ffffff" filter="url(#ceilHazardGlow)"/>
  </g>

  <g>
    <polygon points="192,221 150,14 192,14" fill="url(#ceilFacetDark)"/>
    <polygon points="192,221 192,14 234,14" fill="url(#ceilGrad)"/>
    <line x1="192" y1="221" x2="192" y2="14" stroke="#ffffff" stroke-width="1.8" stroke-opacity="0.85"/>
    <circle cx="192" cy="221" r="2.8" fill="#ffffff" filter="url(#ceilHazardGlow)"/>
  </g>

  <g>
    <polygon points="320,236 274,14 320,14" fill="url(#ceilFacetDark)"/>
    <polygon points="320,236 320,14 366,14" fill="url(#ceilGrad)"/>
    <line x1="320" y1="236" x2="320" y2="14" stroke="#ffffff" stroke-width="2" stroke-opacity="0.85"/>
    <circle cx="320" cy="236" r="3" fill="#ffffff" filter="url(#ceilHazardGlow)"/>
  </g>

  <g>
    <polygon points="448,221 406,14 448,14" fill="url(#ceilFacetDark)"/>
    <polygon points="448,221 448,14 490,14" fill="url(#ceilGrad)"/>
    <line x1="448" y1="221" x2="448" y2="14" stroke="#ffffff" stroke-width="1.8" stroke-opacity="0.85"/>
    <circle cx="448" cy="221" r="2.8" fill="#ffffff" filter="url(#ceilHazardGlow)"/>
  </g>

  <!-- Secondary Hanging Splinters -->
  <polygon points="128,166 114,14 142,14" fill="url(#ceilGrad)" opacity="0.95"/>
  <line x1="128" y1="166" x2="128" y2="14" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.7"/>
  <polygon points="256,166 242,14 270,14" fill="url(#ceilGrad)" opacity="0.95"/>
  <line x1="256" y1="166" x2="256" y2="14" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.7"/>
  <polygon points="384,166 370,14 398,14" fill="url(#ceilGrad)" opacity="0.95"/>
  <line x1="384" y1="166" x2="384" y2="14" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.7"/>
</svg>"""

ITEMS = [
    ("tile_ground_day", svg_ground_day, 256, 256),
    ("tile_ground_night", svg_ground_night, 256, 256),
    ("tile_block_day", svg_block_day, 256, 256),
    ("tile_block_night", svg_block_night, 256, 256),
    ("spikes_floor_day", svg_spikes_day, 512, 256),
    ("spikes_floor_night", svg_spikes_night, 512, 256),
    ("spikes_ceiling", svg_spikes_ceiling, 512, 256),
]

for name, svg_content, w, h in ITEMS:
    html_path = f"/tmp/{name}.html"
    png_path = f"assets/{name}.png"
    
    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body {{ margin: 0; padding: 0; background: transparent; overflow: hidden; }}
svg {{ display: block; }}
</style>
</head>
<body>
{svg_content}
</body>
</html>"""
    with open(html_path, "w") as f:
        f.write(html)
        
    cmd = [
        "google-chrome",
        "--headless",
        "--disable-gpu",
        "--default-background-color=00000000",
        f"--window-size={w},{h}",
        f"--screenshot={png_path}",
        html_path
    ]
    subprocess.run(cmd, check=True)
    
    # Crop to exact dimensions if chrome added any offset
    im = Image.open(png_path)
    if im.size != (w, h):
        im = im.crop((0, 0, w, h))
        im.save(png_path)
    print(f"Generated {png_path}: {im.size}, mode={im.mode}")

print("All tile and spike sprites successfully created!")
