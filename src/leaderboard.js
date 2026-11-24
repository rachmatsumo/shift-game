// Local Leaderboard Manager: stores and retrieves high scores locally (localStorage)
// Provides instant high-score tracking across all levels without external servers.
// Supports both All-Time cumulative campaign records and per-level time/death records.

const Leaderboard = (() => {
  const STORAGE_KEY_ALLTIME = "shift_leaderboard_alltime";
  const STORAGE_KEY_LEVELS = "shift_leaderboard_levels";
  const LEGACY_STORAGE_KEY = "shift_leaderboard";

  // Initial default All-Time Hall of Fame entries
  const DEFAULT_ALLTIME = [
    { name: "TwilightWeaver", avatar: "weaver", country: "ID", level: 10, time: 78.4, deaths: 0, stars: 30, date: "2026-11-20" },
    { name: "SolarWalker",    avatar: "solar",  country: "JP", level: 10, time: 84.2, deaths: 1, stars: 28, date: "2026-11-21" },
    { name: "RachmatSumo",    avatar: "cosmic", country: "ID", level: 7,  time: 46.8, deaths: 0, stars: 21, date: "2026-11-23" },
    { name: "MoonDancer",     avatar: "lunar",  country: "US", level: 5,  time: 34.2, deaths: 0, stars: 15, date: "2026-11-22" },
    { name: "CosmicDrifter",  avatar: "knight", country: "GB", level: 5,  time: 39.5, deaths: 1, stars: 14, date: "2026-11-23" },
    { name: "StarlightRider", avatar: "weaver", country: "SG", level: 3,  time: 21.0, deaths: 0, stars: 9,  date: "2026-11-24" }
  ];

  // Initial default Per-Level records
  const DEFAULT_LEVELS = {
    1: [
      { name: "TwilightWeaver", avatar: "weaver", country: "ID", time: 2.8, deaths: 0, stars: 3, date: "2026-11-20" },
      { name: "RachmatSumo",    avatar: "cosmic", country: "ID", time: 3.1, deaths: 0, stars: 3, date: "2026-11-23" },
      { name: "MoonDancer",     avatar: "lunar",  country: "US", time: 3.5, deaths: 0, stars: 3, date: "2026-11-22" }
    ],
    5: [
      { name: "TwilightWeaver", avatar: "weaver", country: "ID", time: 8.4, deaths: 0, stars: 3, date: "2026-11-20" },
      { name: "SolarWalker",    avatar: "solar",  country: "JP", time: 9.1, deaths: 0, stars: 3, date: "2026-11-21" },
      { name: "RachmatSumo",    avatar: "cosmic", country: "ID", time: 9.8, deaths: 0, stars: 3, date: "2026-11-23" }
    ],
    10: [
      { name: "TwilightWeaver", avatar: "weaver", country: "ID", time: 9.6, deaths: 0, stars: 3, date: "2026-11-20" },
      { name: "SolarWalker",    avatar: "solar",  country: "JP", time: 10.4, deaths: 1, stars: 3, date: "2026-11-21" }
    ]
  };

  function loadAllTime() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ALLTIME) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_ALLTIME.slice();
  }

  function saveAllTime(scores) {
    try {
      localStorage.setItem(STORAGE_KEY_ALLTIME, JSON.stringify(scores));
    } catch {}
  }

  function loadLevelScores() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LEVELS);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch {}
    return JSON.parse(JSON.stringify(DEFAULT_LEVELS));
  }

  function saveLevelScores(map) {
    try {
      localStorage.setItem(STORAGE_KEY_LEVELS, JSON.stringify(map));
    } catch {}
  }

  function sortAllTime(scores) {
    // Rank by Level Reached desc, then least total Deaths asc, then least total Time asc, then Stars desc
    return scores.sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      if (a.deaths !== b.deaths) return a.deaths - b.deaths;
      if (a.time !== b.time) return a.time - b.time;
      return b.stars - a.stars;
    });
  }

  function sortLevelScores(scores) {
    // Rank by Stars desc, then least Deaths asc, then fastest Time asc
    return scores.sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      if (a.deaths !== b.deaths) return a.deaths - b.deaths;
      return a.time - b.time;
    });
  }

  return {
    getAllTimeScores() {
      return sortAllTime(loadAllTime());
    },

    getScores() {
      return this.getAllTimeScores();
    },

    getLevelScores(levelNum) {
      const map = loadLevelScores();
      const list = map[levelNum] || [];
      return sortLevelScores(list);
    },

    submitScore(name, level, totalTime, totalDeaths, totalStars, avatar = "weaver", country = "ID", levelTime = null, levelDeaths = 0, levelStars = 3) {
      if (!name) name = "Gamer";
      const cleanName = name.slice(0, 14);
      const cleanCountry = country.toUpperCase();
      const today = new Date().toISOString().split("T")[0];

      // 1. Update / Insert All-Time Cumulative Run
      const allTime = loadAllTime();
      const existingIdx = allTime.findIndex(s => s.name.toLowerCase() === cleanName.toLowerCase());

      const newAllTimeEntry = {
        name: cleanName,
        avatar,
        country: cleanCountry,
        level,
        time: parseFloat(totalTime.toFixed(1)),
        deaths: totalDeaths,
        stars: totalStars,
        date: today
      };

      if (existingIdx >= 0) {
        const old = allTime[existingIdx];
        // Upgrade if reached higher level, or same level with fewer deaths or faster time
        const isBetter = level > old.level ||
          (level === old.level && (totalDeaths < old.deaths || (totalDeaths === old.deaths && totalTime < old.time)));
        if (isBetter) {
          allTime[existingIdx] = newAllTimeEntry;
        }
      } else {
        allTime.push(newAllTimeEntry);
      }

      sortAllTime(allTime);
      saveAllTime(allTime.slice(0, 15));

      // 2. Update / Insert Per-Level Record
      if (levelTime !== null && levelTime !== undefined && levelTime > 0) {
        const levelMap = loadLevelScores();
        if (!levelMap[level]) levelMap[level] = [];

        const levelList = levelMap[level];
        const lvlExistingIdx = levelList.findIndex(s => s.name.toLowerCase() === cleanName.toLowerCase());

        const newLvlEntry = {
          name: cleanName,
          avatar,
          country: cleanCountry,
          time: parseFloat(levelTime.toFixed(1)),
          deaths: levelDeaths,
          stars: levelStars,
          date: today
        };

        if (lvlExistingIdx >= 0) {
          const old = levelList[lvlExistingIdx];
          const isLvlBetter = levelStars > old.stars ||
            (levelStars === old.stars && (levelDeaths < old.deaths || (levelDeaths === old.deaths && levelTime < old.time)));
          if (isLvlBetter) {
            levelList[lvlExistingIdx] = newLvlEntry;
          }
        } else {
          levelList.push(newLvlEntry);
        }

        sortLevelScores(levelList);
        levelMap[level] = levelList.slice(0, 10);
        saveLevelScores(levelMap);
      }

      return this.getAllTimeScores();
    },

    clear() {
      try {
        localStorage.removeItem(STORAGE_KEY_ALLTIME);
        localStorage.removeItem(STORAGE_KEY_LEVELS);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {}
    }
  };
})();

if (typeof module !== "undefined") {
  module.exports = Leaderboard;
}
