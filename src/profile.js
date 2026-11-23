// Player Profile System: Manages Player Name, Avatar, and Country
// Saved persistently in localStorage for Leaderboard entry and customization.

const PlayerProfile = (() => {
  const STORAGE_KEY = "shift_player_profile";

  const AVATARS = [
    { id: "weaver", name: "Weaver", icon: "bi-person-fill", symbol: "✦", color: "#00cec9" },
    { id: "solar",  name: "Solar",  icon: "bi-sun-fill",    symbol: "☼", color: "#f39c12" },
    { id: "lunar",  name: "Lunar",  icon: "bi-moon-stars",  symbol: "☽", color: "#a29bfe" },
    { id: "cosmic", name: "Cosmic", icon: "bi-stars",       symbol: "★", color: "#ff7675" },
    { id: "knight", name: "Shield", icon: "bi-shield-fill", symbol: "◈", color: "#55efc4" }
  ];

  let profile = {
    name: "Traveler",
    avatar: "weaver",
    country: "ID",
    countryName: "Indonesia",
    customCountry: false,
    initialized: false
  };

  function load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        Object.assign(profile, JSON.parse(data));
      }
    } catch {}
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  }

  load();

  return {
    get name() { return profile.name || "Traveler"; },
    set name(val) {
      profile.name = (val || "Traveler").slice(0, 14);
      profile.initialized = true;
      save();
    },

    get avatar() { return profile.avatar || "weaver"; },
    get avatarObj() {
      return AVATARS.find(a => a.id === profile.avatar) || AVATARS[0];
    },
    set avatar(id) {
      if (AVATARS.some(a => a.id === id)) {
        profile.avatar = id;
        save();
      }
    },

    get country() { return profile.country || "ID"; },
    get countryName() { return profile.countryName || "Indonesia"; },
    hasCustomCountry() { return profile.customCountry; },
    setCountry(code, name, isUserAction = false) {
      profile.country = code.toUpperCase();
      if (name) profile.countryName = name;
      if (isUserAction) profile.customCountry = true;
      save();
    },

    get isConfigured() { return profile.initialized; },
    get avatars() { return AVATARS; },
    save
  };
})();

if (typeof module !== "undefined") module.exports = PlayerProfile;

