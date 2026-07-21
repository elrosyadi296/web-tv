import { CONFIG } from "./config.js";
import { debounce } from "./utils.js";
import { searchChannels } from "./store.js";
import { renderListRow, bindCardEvents } from "../../components/card.js";

/**
 * global-search.js — logika search bar di header, dipakai bersama oleh
 * index.html (main.js) dan player.html (player-page.js).
 *
 * Sebelumnya logika ini hanya dipasang di main.js, sehingga search bar
 * yang tampil di player.html (lewat renderHeader()) tidak pernah
 * mendapat event listener -> input tidak berfungsi saat sedang menonton.
 *
 * @param {() => Array<object>} getChannels - fungsi yang mengembalikan
 *   daftar channel TERKINI. Pakai fungsi (bukan array langsung) supaya
 *   tetap valid walau catalog baru selesai di-load setelah fungsi ini
 *   dipanggil (mis. saat boot, sebelum loadCatalog() selesai).
 */
export function initGlobalSearch(getChannels) {
  const input = document.getElementById("global-search");
  const dropdown = document.getElementById("search-dropdown");
  const results = document.getElementById("search-results");
  if (!input || !dropdown || !results) return; // header belum dirender

  const runSearch = debounce((q) => {
    if (!q.trim()) {
      dropdown.classList.add("hidden");
      return;
    }
    const channels = getChannels() || [];
    const matches = searchChannels(channels, q).slice(0, 8);
    results.innerHTML = matches.length
      ? matches.map((c, i) => renderListRow(c, { index: i })).join("")
      : `<div class="p-4 text-center text-sm text-[color:var(--text-muted)]">Tidak ditemukan channel yang cocok.</div>`;
    dropdown.classList.remove("hidden");
    bindCardEvents(results);
  }, CONFIG.ui.searchDebounceMs);

  input.addEventListener("input", (e) => runSearch(e.target.value));
  input.addEventListener("focus", (e) => {
    if (e.target.value.trim()) dropdown.classList.remove("hidden");
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#global-search") && !e.target.closest("#search-dropdown")) {
      dropdown.classList.add("hidden");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") dropdown.classList.add("hidden");
  });
}
