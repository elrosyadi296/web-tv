/**
 * config.js
 * Satu-satunya tempat pengaturan situs. Ubah di sini, bukan di file lain.
 */
export const CONFIG = {
  site: {
    name: "296 LIVE TV",
    shortName: "296LIVE",
    tagline: "Siaran Langsung, Tanpa Batas.",
    brand: "296 Studios",
    logoIcon: "assets/icons/icon-192.svg",
    themeColor: "#0a0a12",
  },

  // Setiap entri = satu file JSON di /data. Tambah baris baru untuk playlist baru
  // TANPA mengubah kode lain di seluruh proyek.
  dataSources: [
    { id: "all", label: "Semua Channel", file: "data/all.json" },
    { id: "animation", label: "Animation", file: "data/animation.json" },
    { id: "kids", label: "Kids", file: "data/kids.json" },
    { id: "movies", label: "Movies", file: "data/movies.json" },
    { id: "sports", label: "Sports", file: "data/sports.json" },
    { id: "indonesia", label: "Indonesia", file: "data/indonesia.json" },
  ],

  // Sumber tunggal kebenaran katalog (dipakai untuk search/filter/kategori/negara)
  masterSource: "data/all.json",

  pagination: {
    itemsPerPage: 24,
    infiniteScroll: true,
    scrollThresholdPx: 400,
  },

  player: {
    autoPlay: true,
    autoFullscreen: false,
    defaultVolume: 0.8,
    retryIntervalMs: 4000,
    maxAutoRetry: 5,
  },

  storageKeys: {
    favorites: "296live_favorites",
    history: "296live_history",
    continueWatching: "296live_continue",
    settings: "296live_settings",
  },

  defaultSettings: {
    darkMode: true,
    autoPlay: true,
    autoFullscreen: false,
    defaultVolume: 0.8,
    quality: "auto",
  },

  ui: {
    heroRotateMs: 6000,
    toastDurationMs: 3200,
    skeletonCount: 12,
    searchDebounceMs: 250,
  },
};
