import { CONFIG } from "./config.js";
import { escapeHTML, debounce, toast, onConnectivityChange, formatCount } from "./utils.js";
import {
  loadCatalog, buildCategoryIndex, buildCountryIndex,
  searchChannels, sortChannels, filterChannels, getChannelById,
} from "./store.js";
import {
  getFavorites, toggleFavorite, clearFavorites,
  getHistory, clearHistory, getContinueWatching, removeContinueWatching,
  getSettings, updateSettings,
} from "./storage.js";
import { renderSidebar, updateSidebarActive } from "../../components/sidebar.js";
import { renderHeader, renderSearchDropdown } from "../../components/header.js";
import { renderCard, renderListRow, spawnRipple } from "../../components/card.js";
import { skeletonGrid, skeletonRail, skeletonHero } from "../../components/skeleton.js";
import { openShareModal, openFilterModal } from "../../components/modal.js";

const appEl = document.getElementById("app");
let allChannels = [];
let activeFilters = {};
let currentSort = "";
let currentView = "grid"; // grid | list
let renderedCount = 0;
let currentListSource = [];

/* ============================= BOOTSTRAP ============================= */

async function boot() {
  document.getElementById("shell-sidebar").innerHTML = renderSidebar(location.hash || "#/");
  document.getElementById("shell-header").innerHTML = renderHeader() + renderSearchDropdown();

  bindGlobalEvents();
  onConnectivityChange(handleConnectivity);
  handleConnectivity(navigator.onLine);

  try {
    allChannels = await loadCatalog();
  } catch (err) {
    console.error(err);
    toast("Gagal memuat data channel. Periksa koneksi Anda.", { type: "error" });
    allChannels = [];
  }

  window.addEventListener("hashchange", route);
  route();

  registerServiceWorker();
}

function handleConnectivity(isOnline) {
  const el = document.getElementById("offline-indicator");
  if (!el) return;
  el.classList.toggle("hidden", isOnline);
  el.classList.toggle("flex", !isOnline);
  if (!isOnline) toast("Anda sedang offline. Beberapa fitur mungkin terbatas.", { type: "warn" });
}

/* ============================= ROUTER ============================= */

function route() {
  const hash = location.hash || "#/";
  updateSidebarActive(document.getElementById("shell-sidebar"), hash);
  window.scrollTo({ top: 0, behavior: "instant" in document.documentElement.style ? "instant" : "auto" });

  const [, path, param] = hash.match(/^#\/?([^/]*)\/?(.*)$/) || [];

  if (!path) return renderHome();
  if (path === "all") return renderAllChannels();
  if (path === "category" && !param) return renderCategoryIndex();
  if (path === "category" && param) return renderChannelListPage({ category: decodeURIComponent(param) }, `Kategori: ${decodeURIComponent(param)}`);
  if (path === "country" && !param) return renderCountryIndex();
  if (path === "country" && param) return renderChannelListPage({ country: decodeURIComponent(param) }, `Negara: ${decodeURIComponent(param)}`);
  if (path === "favorites") return renderFavorites();
  if (path === "history") return renderHistory();
  if (path === "settings") return renderSettings();
  if (path === "watch" && param) return renderWatch(decodeURIComponent(param));

  render404();
}

/* ============================= SHARED PIECES ============================= */

function layout(contentHTML) {
  appEl.innerHTML = `<div class="fade-in">${contentHTML}</div>`;
}

function pageHeader(title, subtitle = "") {
  return `
    <div class="mb-5 md:mb-6">
      <h1 class="font-display text-xl md:text-2xl font-bold text-white">${escapeHTML(title)}</h1>
      ${subtitle ? `<p class="text-sm text-[color:var(--text-muted)] mt-1">${escapeHTML(subtitle)}</p>` : ""}
    </div>
  `;
}

function emptyState(message, actionHTML = "") {
  return `
    <div class="flex flex-col items-center justify-center text-center py-20 px-6">
      <div class="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" class="w-7 h-7 text-[color:var(--text-muted)]" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
      </div>
      <p class="text-[color:var(--text-secondary)] max-w-sm">${escapeHTML(message)}</p>
      ${actionHTML}
    </div>
  `;
}

/* ============================= HOME ============================= */

function renderHome() {
  layout(`
    <section class="mb-8">${skeletonHero()}</section>
    <section class="mb-8"><div class="skeleton h-6 w-40 rounded mb-3"></div>${skeletonRail()}</section>
    <section class="mb-8"><div class="skeleton h-6 w-40 rounded mb-3"></div>${skeletonRail()}</section>
  `);

  const live = allChannels.filter((c) => c.status === "live");
  const trending = live.slice(0, 10);
  const recentIds = getHistory().slice(0, 10).map((h) => h.id);
  const recentlyWatched = recentIds.map((id) => getChannelById(allChannels, id)).filter(Boolean);
  const continueList = getContinueWatching()
    .map((c) => ({ ...c, channel: getChannelById(allChannels, c.id) }))
    .filter((c) => c.channel);
  const favIds = getFavorites();
  const favChannels = favIds.map((id) => getChannelById(allChannels, id)).filter(Boolean);
  const categories = buildCategoryIndex(allChannels);
  const countries = buildCountryIndex(allChannels);
  const newest = [...allChannels].slice(-10).reverse();

  const hero = live[Math.floor(Math.random() * Math.max(live.length, 1))] || allChannels[0];

  layout(`
    ${hero ? heroBanner(hero) : ""}
    ${tickerStrip(live)}

    ${statsStrip({ total: allChannels.length, live: live.length, categories: categories.length, countries: countries.length })}

    ${continueList.length ? railSection("Continue Watching", continueList.map((c) => c.channel)) : ""}
    ${trending.length ? railSection("Trending Channel", trending) : ""}
    ${recentlyWatched.length ? railSection("Recently Watched", recentlyWatched) : ""}
    ${favChannels.length ? railSection("Channel Favorit", favChannels) : ""}
    ${newest.length ? railSection("Channel Terbaru", newest) : ""}

    <section class="mb-8">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-display text-lg font-semibold text-white">Kategori Populer</h2>
        <a href="#/category" class="text-xs text-[color:var(--accent-cyan)] hover:underline">Lihat semua</a>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        ${categories.slice(0, 12).map(([name, count]) => categoryTile(name, count)).join("")}
      </div>
    </section>

    <section class="mb-8">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-display text-lg font-semibold text-white">Negara Populer</h2>
        <a href="#/country" class="text-xs text-[color:var(--accent-cyan)] hover:underline">Lihat semua</a>
      </div>
      <div class="flex flex-wrap gap-2">
        ${countries.slice(0, 14).map(([name, count]) => countryChip(name, count)).join("")}
      </div>
    </section>
  `);

  bindCardEvents(appEl);
}

function heroBanner(channel) {
  return `
    <section class="relative rounded-2xl overflow-hidden mb-6 h-[280px] md:h-[380px] glass pop-in">
      <div class="absolute inset-0 bg-gradient-to-br from-[#7c5cff]/20 via-transparent to-[#22d3ee]/10"></div>
      <div class="absolute inset-0 flex flex-col justify-end p-6 md:p-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
        <span class="badge-live w-fit mb-3"><span class="live-dot"></span>SEDANG TAYANG</span>
        <h2 class="font-display text-2xl md:text-4xl font-bold text-white max-w-lg">${escapeHTML(channel.name)}</h2>
        <p class="text-sm text-[color:var(--text-secondary)] mt-2">${escapeHTML(channel.category)} · ${escapeHTML(channel.country)} ${channel.resolution ? "· " + escapeHTML(channel.resolution) : ""}</p>
        <div class="flex gap-3 mt-5">
          <a href="#/watch/${encodeURIComponent(channel.id)}" class="btn-primary rounded-full px-6 py-2.5 text-sm flex items-center gap-2">
            <svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Putar Sekarang
          </a>
          <a href="#/all" class="btn-ghost rounded-full px-6 py-2.5 text-sm">Jelajahi Semua</a>
        </div>
      </div>
    </section>
  `;
}

function tickerStrip(liveChannels) {
  if (!liveChannels.length) return "";
  const names = liveChannels.slice(0, 12).map((c) => `<span class="font-mono text-xs text-[color:var(--text-secondary)]"><span class="live-dot inline-block mr-1.5 align-middle"></span>${escapeHTML(c.name)}</span>`);
  const loop = [...names, ...names].join("");
  return `
    <div class="ticker-wrap glass border border-white/[.06] rounded-full px-4 py-2 mb-8 overflow-hidden">
      <div class="ticker-track">${loop}</div>
    </div>
  `;
}

function statsStrip({ total, live, categories, countries }) {
  const stat = (label, value) => `
    <div class="glass rounded-xl px-4 py-3 flex-1 min-w-[120px]">
      <p class="font-display text-xl font-bold text-white">${formatCount(value)}</p>
      <p class="text-xs text-[color:var(--text-muted)] mt-0.5">${escapeHTML(label)}</p>
    </div>`;
  return `<div class="flex flex-wrap gap-3 mb-8">${stat("Total Channel", total)}${stat("Sedang Live", live)}${stat("Kategori", categories)}${stat("Negara", countries)}</div>`;
}

function railSection(title, channels) {
  return `
    <section class="mb-8">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-display text-lg font-semibold text-white">${escapeHTML(title)}</h2>
      </div>
      <div class="rail flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-1">
        ${channels.map((c, i) => `<div class="w-40 sm:w-48 flex-shrink-0">${renderCard(c, { index: i })}</div>`).join("")}
      </div>
    </section>
  `;
}

function categoryTile(name, count) {
  return `
    <a href="#/category/${encodeURIComponent(name)}" class="glass glass-hover rounded-xl p-4 pop-in transition-colors">
      <p class="font-display font-semibold text-white text-sm">${escapeHTML(name)}</p>
      <p class="text-xs text-[color:var(--text-muted)] mt-1">${formatCount(count)} channel</p>
    </a>`;
}

function countryChip(name, count) {
  return `
    <a href="#/country/${encodeURIComponent(name)}" class="glass glass-hover rounded-full px-4 py-2 text-xs text-white pop-in transition-colors">
      ${escapeHTML(name)} <span class="text-[color:var(--text-muted)]">· ${formatCount(count)}</span>
    </a>`;
}

/* ============================= ALL CHANNELS ============================= */

function renderAllChannels() {
  activeFilters = {};
  currentSort = "";
  renderList(allChannels, "Semua Channel", `${allChannels.length} channel tersedia`);
}

function renderChannelListPage(filters, title) {
  activeFilters = filters;
  currentSort = "";
  const filtered = filterChannels(allChannels, filters);
  renderList(filtered, title, `${filtered.length} channel ditemukan`);
}

function renderList(baseList, title, subtitle) {
  currentListSource = baseList;
  renderedCount = 0;

  layout(`
    ${pageHeader(title, subtitle)}
    <div class="flex flex-wrap items-center gap-2 mb-5">
      <div class="relative flex-1 min-w-[180px]">
        <input id="page-search" type="text" placeholder="Cari di daftar ini..." class="w-full bg-white/[.04] border border-white/[.08] rounded-lg pl-3 pr-3 py-2 text-sm text-white placeholder:text-[color:var(--text-muted)] outline-none focus:border-[color:var(--accent-violet)]" />
      </div>
      <select id="sort-select" class="bg-white/[.05] border border-white/[.08] rounded-lg px-3 py-2 text-sm text-white">
        <option value="">Urutkan</option>
        <option value="name-asc">Nama A-Z</option>
        <option value="name-desc">Nama Z-A</option>
        <option value="country">Negara</option>
        <option value="category">Kategori</option>
        <option value="newest">Terbaru</option>
      </select>
      <button id="open-filter-btn" class="btn-ghost rounded-lg px-3 py-2 text-sm flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h16M7 12h10M10 18h4"/></svg> Filter
      </button>
      <div class="flex rounded-lg overflow-hidden border border-white/[.08]">
        <button id="view-grid-btn" class="px-3 py-2 text-sm ${currentView === "grid" ? "bg-white/10" : ""}" aria-label="Tampilan grid">
          <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/></svg>
        </button>
        <button id="view-list-btn" class="px-3 py-2 text-sm ${currentView === "list" ? "bg-white/10" : ""}" aria-label="Tampilan list">
          <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </div>
    <div id="list-container"></div>
    <div id="list-sentinel" class="h-10"></div>
  `);

  const pageSearch = document.getElementById("page-search");
  pageSearch.addEventListener("input", debounce((e) => renderListChunk(true, e.target.value), CONFIG.ui.searchDebounceMs));

  document.getElementById("sort-select").addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderListChunk(true, pageSearch.value);
  });

  document.getElementById("view-grid-btn").addEventListener("click", () => { currentView = "grid"; renderListChunk(true, pageSearch.value); });
  document.getElementById("view-list-btn").addEventListener("click", () => { currentView = "list"; renderListChunk(true, pageSearch.value); });

  document.getElementById("open-filter-btn").addEventListener("click", () => {
    openFilterModal({
      categories: [...new Set(allChannels.map((c) => c.category))].sort(),
      countries: [...new Set(allChannels.map((c) => c.country))].sort(),
      languages: [...new Set(allChannels.map((c) => c.language))].sort(),
      resolutions: [...new Set(allChannels.map((c) => c.resolution).filter(Boolean))].sort(),
      current: activeFilters,
      onApply: (filters) => {
        activeFilters = filters;
        currentListSource = filterChannels(allChannels, filters);
        renderListChunk(true, pageSearch.value);
      },
    });
  });

  renderListChunk(true, "");
  bindInfiniteScroll();
}

function renderListChunk(reset, query) {
  const container = document.getElementById("list-container");
  if (!container) return;

  let list = searchChannels(currentListSource, query || "");
  if (currentSort) list = sortChannels(list, currentSort);

  if (reset) renderedCount = 0;

  const nextCount = Math.min(list.length, renderedCount + CONFIG.pagination.itemsPerPage);
  const chunk = list.slice(renderedCount, nextCount);
  renderedCount = nextCount;

  if (reset) {
    container.innerHTML = "";
    document.getElementById("view-grid-btn").classList.toggle("bg-white/10", currentView === "grid");
    document.getElementById("view-list-btn").classList.toggle("bg-white/10", currentView === "list");
  }

  if (!list.length) {
    container.innerHTML = emptyState("Tidak ada channel yang cocok dengan pencarian atau filter Anda.");
    return;
  }

  if (reset) {
    container.className = currentView === "grid"
      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
      : "flex flex-col gap-2";
  }

  const html = chunk.map((c, i) => currentView === "grid" ? renderCard(c, { index: i }) : renderListRow(c, { index: i })).join("");
  container.insertAdjacentHTML("beforeend", html);
  bindCardEvents(container);
}

function bindInfiniteScroll() {
  window.onscroll = debounce(() => {
    if (!CONFIG.pagination.infiniteScroll) return;
    const nearBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - CONFIG.pagination.scrollThresholdPx;
    if (nearBottom) renderListChunk(false, document.getElementById("page-search")?.value || "");
  }, 150);
}

/* ============================= CATEGORY / COUNTRY INDEX ============================= */

function renderCategoryIndex() {
  const categories = buildCategoryIndex(allChannels);
  layout(`
    ${pageHeader("Kategori", `${categories.length} kategori tersedia`)}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      ${categories.map(([name, count]) => categoryTile(name, count)).join("")}
    </div>
  `);
}

function renderCountryIndex() {
  const countries = buildCountryIndex(allChannels);
  layout(`
    ${pageHeader("Negara", `${countries.length} negara tersedia`)}
    <div class="flex flex-wrap gap-2">
      ${countries.map(([name, count]) => countryChip(name, count)).join("")}
    </div>
  `);
}

/* ============================= FAVORITES / HISTORY ============================= */

function renderFavorites() {
  const favIds = getFavorites();
  const channels = favIds.map((id) => getChannelById(allChannels, id)).filter(Boolean);

  layout(`
    ${pageHeader("Favorit", `${channels.length} channel favorit`)}
    ${channels.length ? `
      <div class="flex justify-end mb-4">
        <button id="clear-fav-btn" class="btn-ghost rounded-lg px-3 py-1.5 text-xs">Hapus Semua Favorit</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        ${channels.map((c, i) => renderCard(c, { index: i })).join("")}
      </div>
    ` : emptyState("Belum ada channel favorit. Tambahkan lewat tombol hati pada kartu channel.")}
  `);

  bindCardEvents(appEl);
  document.getElementById("clear-fav-btn")?.addEventListener("click", () => {
    clearFavorites();
    toast("Semua favorit dihapus", { type: "success" });
    renderFavorites();
  });
}

function renderHistory() {
  const history = getHistory();
  const channels = history.map((h) => ({ ...getChannelById(allChannels, h.id), watchedAt: h.watchedAt })).filter((c) => c.id);

  layout(`
    ${pageHeader("Riwayat Tontonan", `${channels.length} channel dalam riwayat`)}
    ${channels.length ? `
      <div class="flex justify-end mb-4">
        <button id="clear-history-btn" class="btn-ghost rounded-lg px-3 py-1.5 text-xs">Hapus Riwayat</button>
      </div>
      <div class="flex flex-col gap-2">
        ${channels.map((c, i) => renderListRow(c, { index: i })).join("")}
      </div>
    ` : emptyState("Belum ada riwayat tontonan.")}
  `);

  bindCardEvents(appEl);
  document.getElementById("clear-history-btn")?.addEventListener("click", () => {
    clearHistory();
    toast("Riwayat dihapus", { type: "success" });
    renderHistory();
  });
}

/* ============================= SETTINGS ============================= */

function renderSettings() {
  const s = getSettings();
  layout(`
    ${pageHeader("Pengaturan")}
    <div class="max-w-lg space-y-4">
      ${settingsToggle("dark-mode-toggle", "Dark Mode", "Tema gelap premium (selalu aktif)", true, true)}
      ${settingsToggle("autoplay-toggle", "Auto Play", "Putar otomatis saat membuka channel", s.autoPlay)}
      ${settingsToggle("autofullscreen-toggle", "Auto Fullscreen", "Masuk fullscreen otomatis saat memutar", s.autoFullscreen)}

      <div class="glass rounded-xl p-4">
        <label class="text-sm text-white font-medium block mb-2">Volume Default</label>
        <input id="volume-setting" type="range" min="0" max="100" value="${Math.round(s.defaultVolume * 100)}" class="w-full progress-scrub" />
      </div>

      <div class="glass rounded-xl p-4">
        <label class="text-sm text-white font-medium block mb-2">Kualitas Player</label>
        <select id="quality-setting" class="w-full bg-white/[.05] border border-white/[.08] rounded-lg px-3 py-2 text-white text-sm">
          <option value="auto" ${s.quality === "auto" ? "selected" : ""}>Auto (disarankan)</option>
          <option value="high" ${s.quality === "high" ? "selected" : ""}>Tinggi</option>
          <option value="low" ${s.quality === "low" ? "selected" : ""}>Rendah (hemat data)</option>
        </select>
      </div>

      <div class="glass rounded-xl p-4 flex items-center justify-between gap-4">
        <div>
          <p class="text-sm text-white font-medium">Clear History</p>
          <p class="text-xs text-[color:var(--text-muted)]">Hapus seluruh riwayat tontonan</p>
        </div>
        <button id="settings-clear-history" class="btn-ghost rounded-lg px-3 py-1.5 text-xs">Hapus</button>
      </div>
      <div class="glass rounded-xl p-4 flex items-center justify-between gap-4">
        <div>
          <p class="text-sm text-white font-medium">Clear Favorite</p>
          <p class="text-xs text-[color:var(--text-muted)]">Hapus seluruh channel favorit</p>
        </div>
        <button id="settings-clear-fav" class="btn-ghost rounded-lg px-3 py-1.5 text-xs">Hapus</button>
      </div>
    </div>
  `);

  document.getElementById("autoplay-toggle").addEventListener("change", (e) => updateSettings({ autoPlay: e.target.checked }));
  document.getElementById("autofullscreen-toggle").addEventListener("change", (e) => updateSettings({ autoFullscreen: e.target.checked }));
  document.getElementById("volume-setting").addEventListener("change", (e) => updateSettings({ defaultVolume: e.target.value / 100 }));
  document.getElementById("quality-setting").addEventListener("change", (e) => updateSettings({ quality: e.target.value }));
  document.getElementById("settings-clear-history").addEventListener("click", () => { clearHistory(); toast("Riwayat dihapus", { type: "success" }); });
  document.getElementById("settings-clear-fav").addEventListener("click", () => { clearFavorites(); toast("Favorit dihapus", { type: "success" }); });
}

function settingsToggle(id, title, desc, checked, disabled = false) {
  return `
    <div class="glass rounded-xl p-4 flex items-center justify-between gap-4">
      <div>
        <p class="text-sm text-white font-medium">${escapeHTML(title)}</p>
        <p class="text-xs text-[color:var(--text-muted)]">${escapeHTML(desc)}</p>
      </div>
      <label class="relative inline-flex items-center cursor-pointer ${disabled ? "opacity-50 pointer-events-none" : ""}">
        <input id="${id}" type="checkbox" class="sr-only peer" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} />
        <div class="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-[color:var(--accent-violet)] transition-colors"></div>
        <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
      </label>
    </div>`;
}

/* ============================= WATCH / PLAYER PAGE ============================= */

function renderWatch(id) {
  location.href = `player.html?id=${encodeURIComponent(id)}`;
}

/* ============================= 404 ============================= */

function render404() {
  layout(emptyState("Halaman tidak ditemukan.", `<a href="#/" class="btn-primary rounded-full px-5 py-2 text-sm mt-4 inline-block">Kembali ke Beranda</a>`));
}

/* ============================= EVENT DELEGATION ============================= */

function bindCardEvents(root) {
  root.querySelectorAll("[data-channel-id]").forEach((card) => {
    if (card.dataset.bound) return;
    card.dataset.bound = "1";

    card.addEventListener("click", (e) => {
      if (e.target.closest(".fav-btn")) return;
      spawnRipple(e, card);
      const id = card.dataset.channelId;
      setTimeout(() => { location.href = `player.html?id=${encodeURIComponent(id)}`; }, 120);
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        location.href = `player.html?id=${encodeURIComponent(card.dataset.channelId)}`;
      }
    });
  });

  root.querySelectorAll(".fav-btn").forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.channelId;
      const isFav = toggleFavorite(id);
      toast(isFav ? "Ditambahkan ke favorit" : "Dihapus dari favorit", { type: "success" });
      btn.setAttribute("aria-pressed", String(isFav));
      const svg = btn.querySelector("svg");
      svg.setAttribute("fill", isFav ? "#ff4d5e" : "none");
      svg.setAttribute("stroke", isFav ? "#ff4d5e" : "currentColor");
    });
  });
}

/* ============================= GLOBAL SEARCH ============================= */

function bindGlobalEvents() {
  const input = document.getElementById("global-search");
  const dropdown = document.getElementById("search-dropdown");
  const results = document.getElementById("search-results");

  const runSearch = debounce((q) => {
    if (!q.trim()) { dropdown.classList.add("hidden"); return; }
    const matches = searchChannels(allChannels, q).slice(0, 8);
    results.innerHTML = matches.length
      ? matches.map((c, i) => renderListRow(c, { index: i })).join("")
      : emptyState("Tidak ditemukan channel yang cocok.");
    dropdown.classList.remove("hidden");
    bindCardEvents(results);
  }, CONFIG.ui.searchDebounceMs);

  input.addEventListener("input", (e) => runSearch(e.target.value));
  input.addEventListener("focus", (e) => { if (e.target.value.trim()) dropdown.classList.remove("hidden"); });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#global-search") && !e.target.closest("#search-dropdown")) {
      dropdown.classList.add("hidden");
    }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") dropdown.classList.add("hidden"); });

  document.getElementById("mobile-menu-btn")?.addEventListener("click", () => {
    document.getElementById("shell-sidebar").classList.toggle("!w-[220px]");
  });

  // Back to top button
  const backToTop = document.createElement("button");
  backToTop.id = "back-to-top";
  backToTop.setAttribute("aria-label", "Kembali ke atas");
  backToTop.className = "hidden fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full btn-primary shadow-lg items-center justify-center";
  backToTop.innerHTML = `<svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.body.appendChild(backToTop);
  window.addEventListener("scroll", debounce(() => {
    const show = window.scrollY > 600;
    backToTop.classList.toggle("hidden", !show);
    backToTop.classList.toggle("flex", show);
  }, 100));
}

/* ============================= PWA ============================= */

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch((err) => {
        console.warn("Service worker gagal didaftarkan:", err);
      });
    });
  }
}

boot();
