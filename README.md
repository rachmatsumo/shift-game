# SHIFT: The Twilight Weaver

A puzzle-platformer created for **[GitHub Game Off 2026](https://itch.io/jam/game-off-2026)** (Theme: **SHIFT**).

> **Author & Creator:** [github.com/rachmatsumo](https://github.com/rachmatsumo)  
> **Leaderboard:** Local High Scores & Hall of Fame (`src/leaderboard.js`)

---

## 🌟 Filosofi & Konsep ("What does it mean to SHIFT?")

*Terkadang, solusi dari kebuntuan bukanlah memaksa maju, melainkan menggeser sudut pandang dan membiarkan diri melayang sejenak.*

1. **Shift of Reality (Pergeseran Realitas & Sudut Pandang):**  
   Tembok buntu atau bahaya mematikan di satu dimensi hanyalah ilusi ketiadaan di dimensi lainnya. Saat kita menghadapi jalan buntu dalam hidup, kita tidak perlu memaksakan diri—kita hanya perlu menggeser cara pandang (*shift perspective*).
2. **Shift of Gravity & Time (Dualitas Beban Kehidupan):**  
   - **Siang:** Mewakili aksi, keduniawian, gravitasi yang berat, dan langkah cepat.  
   - **Malam:** Mewakili introspeksi, kelegaan tanpa bobot (*low gravity*), dan perlambatan waktu.  
   Keduanya saling melengkapi; kita membutuhkan gravitasi siang untuk melangkah maju, dan membutuhkan kelegaan malam untuk melompat lebih tinggi.
3. **The Shift Key (Integrasi Antarmuka):**  
   Tombol keyboard yang biasanya hanya digunakan untuk membesarkan huruf kini menjadi tuas pembelah semesta: satu klik kecil untuk lompatan realitas yang besar.

---

## 🎮 Kontrol Permainan

### Desktop Keyboard
- `A` / `D` atau `◀` / `▶` : Bergerak
- `SPACE` / `W` / `▲` : Melompat (*Jump*)
- `SHIFT` atau `E` / `K` : **SHIFT** (Tukar Dunia / Geser Rel Blok Ungu)
- `P` atau `ESC` : Jeda Permainan (*Pause*)
- `R` : Mengulang level secara cepat (*Quick Restart*)
- `X` : Keluar ke Layar Utama (*Quit to Main Menu* - saat Pause)
- `H` : Buka Dialog Filosofi & Kisah
- `B` : Leaderboard Info (`shift.webkuy.com`)
- `F` : Layar Penuh (*Fullscreen Mode*)
- `M` : Mengaktifkan / Mematikan Suara (*Mute*)

### Mobile & Touch Devices (PWA Ready)
- Tombol sentuh virtual **secara cerdas tersembunyi di Desktop** (agar tampilan bersih dan tidak mengganggu), dan **otomatis aktif di perangkat layar sentuh/HP**:
  - **Jempol Kiri:** D-Pad virtual horizontal (`◀` / `▶`).
  - **Jempol Kanan:** Tombol aksi bercahaya untuk `JUMP` dan `SHIFT`.
  - **Bar Navigasi Atas:** Akses cepat satu ketukan untuk Main Menu (`🏠`), Restart (`↺`), Fullscreen (`⛶`), dan Suara (`🔊`).

---

## 🏆 Leaderboard System (`src/leaderboard.js`)

Papan peringkat (*Leaderboard / Hall of Fame*) kini berjalan secara lokal di server/browser menggunakan modul [src/leaderboard.js](file:///var/www/html/shift-game/src/leaderboard.js):
- **Otomatis Mencatat Skor:** Setiap kali pemain menyelesaikan level, nama, level tertinggi, total waktu (*time*), jumlah kematian (*deaths*), dan bintang (*stars*) disimpan secara persisten (`localStorage`).
- **Skor Default Hall of Fame:** Dilengkapi dengan entri awal (*TwilightWeaver, RachmatSumo, dll.*) sehingga leaderboard langsung terlihat hidup dan interaktif sejak awal.
- **Akses Langsung:** Dapat dibuka dari Menu Utama dengan menekan tombol `B` di keyboard atau mengklik menu *"Leaderboard (High Scores)"*.

---

## 🛠 Tech Stack
- **Zero External Dependencies:** 100% Vanilla ES6 JavaScript + Canvas 2D API (`1920x1080` native resolution).
- **Procedural Modern Audio Engine:** Real-time polyphonic synthesis, chord progressions, Lydian/Dorian harmonies, and boss tension pulse.
- **PWA & Offline Capable:** Service Worker caching (`sw.js`), web app manifest (`manifest.json`), dan overlay proteksi orientasi landscape.
- **Headless BFS Solver:** Built-in verification suite (`node tools/verify-levels.js`) memvalidasi 50/50 level 100% solvable.

---

## 🚀 Rilis ke Itch.io
1. Kompres berkas:
   ```bash
   zip -r shift-game.zip index.html manifest.json sw.js assets/ src/
   ```
2. Unggah `shift-game.zip` ke halaman proyek itch.io sebagai **HTML5 Game** dengan opsi *"Playable in browser"*.
