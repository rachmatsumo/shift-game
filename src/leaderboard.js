// Local Leaderboard Manager: stores and retrieves high scores locally (localStorage)
// Provides instant high-score tracking across all levels without external servers.

const Leaderboard = (() => {
  const STORAGE_KEY = "shift_leaderboard";

  // Initial default Hall of Fame entries
  const DEFAULT_SCORES = [
    { name: "TwilightWeaver", avatar: "weaver", country: "ID", level: 10, time: 78.4, deaths: 1, stars: 28, date: "2026-11-20" },
    { name: "SolarWalker",    avatar: "solar",  country: "JP", level: 7,  time: 52.1, deaths: 0, stars: 21, date: "2026-11-21" },
    { name: "MoonDancer",     avatar: "lunar",  country: "US", level: 5,  time: 39.8, deaths: 2, stars: 14, date: "2026-11-22" },
    { name: "RachmatSumo",    avatar: "cosmic", country: "ID", level: 5,  time: 42.6, deaths: 0, stars: 15, date: "2026-11-23" },
    { name: "CosmicDrifter",  avatar: "knight", country: "GB", level: 3,  time: 24.3, deaths: 0, stars: 9,  date: "2026-11-23" },
  ];

  function loadScores() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_SCORES.slice();
  }

  function saveScores(scores) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    } catch {}
  }

  return {
    getScores() {
      const scores = loadScores();
      // Sort by level descending, then stars descending, then time ascending
      return scores.sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        if (b.stars !== a.stars) return b.stars - a.stars;
        return a.time - b.time;
      });
    },

    submitScore(name, level, time, deaths, stars, avatar = "weaver", country = "ID") {
      if (!name) name = "Gamer";
      const scores = loadScores();
      const newEntry = {
        name: name.slice(0, 14),
        avatar,
        country: country.toUpperCase(),
        level,
        time: parseFloat(time.toFixed(1)),
        deaths,
        stars,
        date: new Date().toISOString().split("T")[0]
      };

      scores.push(newEntry);
      // Keep top 10 scores
      scores.sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        if (b.stars !== a.stars) return b.stars - a.stars;
        return a.time - b.time;
      });

      const top10 = scores.slice(0, 10);
      saveScores(top10);
      return top10;
    },

    clear() {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }
  };
})();

if (typeof module !== "undefined") {
  module.exports = Leaderboard;
}

