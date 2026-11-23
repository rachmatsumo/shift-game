// Internationalization (i18n) & Geo-detection for SHIFT: The Twilight Weaver
// Supports Indonesian (id) & English (en) with automatic country/IP and browser detection.

const I18N = (() => {
  let currentLang = "en"; // default fallback

  const DICT = {
    en: {
      langName: "English",
      flag: "EN",
      play: "Play Game",
      levelSelect: "Level Select",
      comicStory: "About The Game",
      leaderboard: "Leaderboard",
      soundOn: "Sound: on",
      soundOff: "Sound: off",
      swapWorld: "swap world",
      jump: "jump",
      move: "move",
      fullscreen: "Fullscreen",
      themeJam: "Game Off 2026 - theme: SHIFT",
      authorCredit: "Crafted by github.com/rachmatsumo",
      paused: "PAUSED",
      resume: "Resume Game",
      restart: "Restart Level",
      quitMenu: "Quit to Main Menu",
      allCleared: "ALL LEVELS CLEARED!",
      levelClear: "LEVEL CLEAR!",
      nextLevel: "SPACE: next level",
      titleScreen: "SPACE: title screen",
      deaths: "Deaths",
      time: "Time",
      shifts: "Shifts",
      shards: "Shards",
      portalAwakened: "Portal Awakened!",
      shardGathered: "Shard",
      portalSealed: "Portal Sealed! Gather all Shards",
      bossEscape: "BOSS ESCAPE",
      caughtByBoss: "Caught by",
      dayName: "DAY  (NORMAL GRAVITY)",
      nightName: "NIGHT  (LOW GRAVITY)",
      profileTitle: "TRAVELER PROFILE",
      profilePrompt: "Enter your name to join the global leaderboard:",
      chooseAvatar: "Choose Avatar:",
      countryLabel: "Country:",
      saveAndPlay: "Save & Start Journey",
      comicTitle: "CHRONICLES OF THE TWILIGHT WEAVER",
      prevPage: "◀ Prev",
      nextPage: "Next ▶",
      skipComic: "Skip / Close (ESC)",
      comicPages: [
        {
          title: "I. The Split Realm",
          text: "Since the dawn of the cosmos, Siang and Malam coexisted as one. Then the Great Shift occurred, cleaving the world into two fractured realities of blazing sun and frozen twilight."
        },
        {
          title: "II. The Twilight Weaver",
          text: "Endowed with the Silk Scarf of Duality, a lone traveler steps forth. Obstacles are not destroyed, but shifted: deadly spikes of the day dissolve into crystalline pathways in the starry night."
        },
        {
          title: "III. The Void Colossus",
          text: "From the abyss, the Void Colossus awakens to consume both dimensions! Only by weaving between heavy gravity and weightless flight can the traveler outrun the darkness."
        },
        {
          title: "IV. Philosophy: Shift of Reality",
          text: "A dead-end wall or mortal hazard in one dimension is merely an illusion of absence in another. When facing an impasse in life, do not force your way through—simply shift your perspective."
        },
        {
          title: "V. Philosophy: Shift of Gravity & Time",
          text: "Day embodies worldly action, heavy gravity, and swift steps. Night embodies contemplation, weightless relief, and slowed time. We need day's gravity to move forward, and night's lightness to soar higher."
        }
      ]
    },
    id: {
      langName: "Bahasa Indonesia",
      flag: "ID",
      play: "Mulai Bermain",
      levelSelect: "Pilih Level",
      comicStory: "Tentang Game",
      leaderboard: "Papan Skor",
      soundOn: "Suara: Aktif",
      soundOff: "Suara: Senyap",
      swapWorld: "tukar dunia",
      jump: "lompat",
      move: "gerak",
      fullscreen: "Layar Penuh",
      themeJam: "Game Off 2026 - tema: SHIFT",
      authorCredit: "Karya github.com/rachmatsumo",
      paused: "JEDA",
      resume: "Lanjut Bermain",
      restart: "Ulangi Level",
      quitMenu: "Keluar ke Menu Utama",
      allCleared: "SEMUA LEVEL SELESAI!",
      levelClear: "LEVEL SELESAI!",
      nextLevel: "SPASI: level berikutnya",
      titleScreen: "SPASI: layar utama",
      deaths: "Kematian",
      time: "Waktu",
      shifts: "Shift",
      shards: "Shard",
      portalAwakened: "Gerbang Runic Terbuka!",
      shardGathered: "Pecahan Shard",
      portalSealed: "Gerbang Tersegel! Kumpulkan semua Shard",
      bossEscape: "JARAK DARI BOSS",
      caughtByBoss: "Tertangkap oleh",
      dayName: "SIANG  (GRAVITASI NORMAL)",
      nightName: "MALAM  (GRAVITASI RENDAH)",
      profileTitle: "PROFIL PENJELAJAH",
      profilePrompt: "Masukkan nama Anda untuk tercatat di papan skor:",
      chooseAvatar: "Pilih Avatar:",
      countryLabel: "Negara:",
      saveAndPlay: "Simpan & Mulai Petualangan",
      comicTitle: "KRONIK SANG PENENUN SENJA",
      prevPage: "◀ Sebelumnya",
      nextPage: "Berikutnya ▶",
      skipComic: "Lewati / Tutup (ESC)",
      comicPages: [
        {
          title: "I. Dunia yang Terbelah",
          text: "Sejak awal mula kosmos, Siang dan Malam hidup berdampingan. Hingga Pergeseran Agung (The Shift) membelah realitas menjadi dua dunia: terik surya yang berat dan senja abadi yang membeku."
        },
        {
          title: "II. Sang Penenun Senja",
          text: "Diberkahi Selendang Sutra Dualitas, seorang pengembara melangkah maju. Rintangan dihadapi bukan dengan kekerasan, melainkan menggeser perspektif: duri mematikan di siang hari berubah jadi jembatan kristal di malam hari."
        },
        {
          title: "III. Raksasa Kehampaan (Void Colossus)",
          text: "Dari jurang terdalam, Void Colossus bangkit menelan semesta! Hanya dengan menyeimbangkan gravitasi siang dan kelegaan melayang di malam hari, sang pengembara dapat meloloskan diri."
        },
        {
          title: "IV. Filosofi: Shift of Reality (Pergeseran Realitas)",
          text: "Tembok buntu atau bahaya mematikan di satu dimensi hanyalah ilusi ketiadaan di dimensi lainnya. Saat kita menghadapi jalan buntu dalam hidup, kita tidak perlu memaksakan diri—kita hanya perlu menggeser cara pandang (shift perspective)."
        },
        {
          title: "V. Filosofi: Shift of Gravity & Time (Dualitas Kehidupan)",
          text: "Siang mewakili aksi, keduniawian, gravitasi yang berat, dan langkah cepat. Malam mewakili introspeksi, kelegaan tanpa bobot (low gravity), dan perlambatan waktu. Kita butuh gravitasi siang untuk melangkah maju, dan kelegaan malam untuk melompat lebih tinggi."
        }
      ]
    }
  };

  function init() {
    // 1. Try saved language
    try {
      const saved = localStorage.getItem("shift_lang");
      if (saved && DICT[saved]) {
        currentLang = saved;
        return;
      }
    } catch {}

    // 2. Try browser language (e.g. "id-ID", "id" -> Indonesian, else English)
    if (typeof navigator !== "undefined") {
      const navLang = (navigator.language || navigator.userLanguage || "").toLowerCase();
      if (navLang.startsWith("id")) {
        currentLang = "id";
      } else {
        currentLang = "en";
      }
    }

    // 3. Optional async IP geo-lookup (silently refines without blocking game load)
    if (typeof fetch !== "undefined") {
      fetch("https://ipapi.co/json/")
        .then(res => res.json())
        .then(data => {
          if (data && data.country_code) {
            const country = data.country_code.toUpperCase();
            if (country === "ID") {
              setLang("id");
            }
            if (typeof PlayerProfile !== "undefined" && !PlayerProfile.hasCustomCountry()) {
              PlayerProfile.setCountry(country, data.country_name);
            }
          }
        })
        .catch(() => {});
    }
  }

  function setLang(lang) {
    if (DICT[lang]) {
      currentLang = lang;
      try { localStorage.setItem("shift_lang", lang); } catch {}
    }
  }

  function toggleLang() {
    setLang(currentLang === "en" ? "id" : "en");
    return currentLang;
  }

  function t(key) {
    return DICT[currentLang][key] || DICT.en[key] || key;
  }

  return {
    init,
    setLang,
    toggleLang,
    t,
    get lang() { return currentLang; },
    get pages() { return DICT[currentLang].comicPages; },
    get flag() { return DICT[currentLang].flag; }
  };
})();

if (typeof module !== "undefined") module.exports = I18N;

