import { CONFIG } from "./config.js";

/**
 * store.js — memuat data JSON sekali, cache di memori (+ sessionStorage)
 * agar navigasi antar halaman tidak fetch ulang.
 */

let cache = null; // Promise<Channel[]>
const CACHE_KEY = "296live_catalog_cache_v1";

function validateChannel(raw) {
  if (!raw || typeof raw !== "object") return null;
  const required = ["id", "name", "stream"];
  for (const key of required) {
    if (!raw[key] || typeof raw[key] !== "string") return null;
  }
  return {
    id: String(raw.id),
    name: String(raw.name),
    logo: typeof raw.logo === "string" ? raw.logo : "",
    country: typeof raw.country === "string" ? raw.country : "N/A",
    language: typeof raw.language === "string" ? raw.language : "N/A",
    category: typeof raw.category === "string" ? raw.category : "Uncategorized",
    stream: String(raw.stream),
    website: typeof raw.website === "string" ? raw.website : "",
    resolution: typeof raw.resolution === "string" ? raw.resolution : "",
    status: raw.status === "offline" ? "offline" : "live",
  };
}

async function fetchJSON(path) {
  const res = await fetch(path, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Gagal memuat ${path}: HTTP ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json)) throw new Error(`${path} harus berupa array channel`);
  return json;
}

/** Memuat katalog utama (master source). Dipanggil sekali, hasil di-cache. */
export function loadCatalog() {
  if (cache) return cache;

  cache = (async () => {
    try {
      const sessionCached = sessionStorage.getItem(CACHE_KEY);
      if (sessionCached) return JSON.parse(sessionCached);
    } catch {
      /* abaikan, lanjut fetch */
    }

    const raw = await fetchJSON(CONFIG.masterSource);
    const channels = raw.map(validateChannel).filter(Boolean);
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(channels));
    } catch {
      /* kuota penuh, tidak fatal */
    }
    return channels;
  })();

  return cache;
}

/** Bangun daftar kategori unik + jumlah channel, otomatis dari data. */
export function buildCategoryIndex(channels) {
  const map = new Map();
  for (const c of channels) {
    map.set(c.category, (map.get(c.category) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

/** Bangun daftar negara unik + jumlah channel, otomatis dari data. */
export function buildCountryIndex(channels) {
  const map = new Map();
  for (const c of channels) {
    map.set(c.country, (map.get(c.country) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export function searchChannels(channels, query) {
  const q = query.trim().toLowerCase();
  if (!q) return channels;
  return channels.filter((c) =>
    [c.name, c.category, c.country, c.language]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );
}

export function sortChannels(channels, mode) {
  const list = [...channels];
  switch (mode) {
    case "name-asc": return list.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc": return list.sort((a, b) => b.name.localeCompare(a.name));
    case "country": return list.sort((a, b) => a.country.localeCompare(b.country));
    case "category": return list.sort((a, b) => a.category.localeCompare(b.category));
    case "newest": return list.reverse();
    default: return list;
  }
}

export function filterChannels(channels, { category, country, language, resolution, status, letter } = {}) {
  return channels.filter((c) => {
    if (category && c.category !== category) return false;
    if (country && c.country !== country) return false;
    if (language && c.language !== language) return false;
    if (resolution && c.resolution !== resolution) return false;
    if (status && c.status !== status) return false;
    if (letter && c.name[0]?.toUpperCase() !== letter) return false;
    return true;
  });
}

export function getChannelById(channels, id) {
  return channels.find((c) => c.id === id) || null;
}
