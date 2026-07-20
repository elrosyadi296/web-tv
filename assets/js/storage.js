import { CONFIG } from "./config.js";

/**
 * storage.js — satu titik akses ke LocalStorage.
 * Tidak ada login: semua state bersifat per-browser.
 */

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("Gagal menyimpan ke LocalStorage:", err);
  }
}

const K = CONFIG.storageKeys;

/* ---------------- Favorites ---------------- */
export function getFavorites() {
  return readJSON(K.favorites, []);
}
export function isFavorite(id) {
  return getFavorites().includes(id);
}
export function toggleFavorite(id) {
  const list = getFavorites();
  const idx = list.indexOf(id);
  if (idx >= 0) list.splice(idx, 1);
  else list.unshift(id);
  writeJSON(K.favorites, list);
  return list.includes(id);
}
export function clearFavorites() {
  writeJSON(K.favorites, []);
}

/* ---------------- History / Continue Watching ---------------- */
export function getHistory() {
  return readJSON(K.history, []); // [{id, watchedAt}]
}
export function pushHistory(id) {
  const list = getHistory().filter((h) => h.id !== id);
  list.unshift({ id, watchedAt: Date.now() });
  writeJSON(K.history, list.slice(0, 60));
}
export function clearHistory() {
  writeJSON(K.history, []);
  writeJSON(K.continueWatching, []);
}

export function getContinueWatching() {
  return readJSON(K.continueWatching, []); // [{id, positionSec, updatedAt}]
}
export function setContinueWatching(id, positionSec) {
  const list = getContinueWatching().filter((c) => c.id !== id);
  list.unshift({ id, positionSec, updatedAt: Date.now() });
  writeJSON(K.continueWatching, list.slice(0, 20));
}
export function removeContinueWatching(id) {
  writeJSON(K.continueWatching, getContinueWatching().filter((c) => c.id !== id));
}

/* ---------------- Settings ---------------- */
export function getSettings() {
  return { ...CONFIG.defaultSettings, ...readJSON(K.settings, {}) };
}
export function updateSettings(patch) {
  const next = { ...getSettings(), ...patch };
  writeJSON(K.settings, next);
  return next;
}
