/**
 * utils.js — helper murni, tanpa dependensi ke state aplikasi.
 */

/** Sanitasi string agar aman dimasukkan ke dalam HTML (cegah XSS dari data JSON). */
export function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** Validasi URL stream (hanya izinkan http/https untuk mencegah javascript: URI). */
export function isSafeUrl(url) {
  try {
    const u = new URL(url, window.location.href);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Ambil 1-2 huruf inisial untuk fallback logo channel. */
export function initials(name = "") {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

/** Warna deterministik dari string (untuk fallback avatar background variasi halus). */
export function hueFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

let toastContainer;
export function toast(message, { type = "info", duration = 3200 } = {}) {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center px-4 w-full sm:w-auto";
    toastContainer.setAttribute("role", "status");
    toastContainer.setAttribute("aria-live", "polite");
    document.body.appendChild(toastContainer);
  }
  const icon = { info: "ℹ", success: "✓", error: "!", warn: "⚠" }[type] ?? "ℹ";
  const colors = {
    info: "border-white/10",
    success: "border-emerald-400/40",
    error: "border-red-400/40",
    warn: "border-amber-400/40",
  };
  const el = document.createElement("div");
  el.className = `toast glass ${colors[type]} rounded-xl px-4 py-3 text-sm text-white shadow-lg flex items-center gap-2 max-w-sm`;
  el.innerHTML = `<span class="font-mono opacity-70">${icon}</span><span>${escapeHTML(message)}</span>`;
  toastContainer.appendChild(el);
  setTimeout(() => {
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 300);
  }, duration);
}

export function formatCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "rb";
  return String(n);
}

/** Deteksi status koneksi, dipakai untuk offline banner. */
export function onConnectivityChange(cb) {
  window.addEventListener("online", () => cb(true));
  window.addEventListener("offline", () => cb(false));
}
