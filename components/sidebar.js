import { CONFIG } from "../assets/js/config.js";
import { escapeHTML } from "../assets/js/utils.js";

/**
 * sidebar.js — navigasi utama sisi kiri (ikon saja di mobile, icon+label di desktop).
 * Bisa dipakai di index.html (SPA hash-router) maupun player.html (halaman terpisah)
 * lewat opsi `hrefPrefix`.
 */

const NAV_ITEMS = [
  { route: "#/", label: "Beranda", icon: "home" },
  { route: "#/all", label: "Semua Channel", icon: "grid" },
  { route: "#/category", label: "Kategori", icon: "tag" },
  { route: "#/country", label: "Negara", icon: "globe" },
  { route: "#/favorites", label: "Favorit", icon: "heart" },
  { route: "#/history", label: "Riwayat", icon: "clock" },
  { route: "#/settings", label: "Pengaturan", icon: "settings" },
];

const ICONS = {
  home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  tag: '<path d="M12.6 3.3 20 10.7a2 2 0 0 1 0 2.8l-6.5 6.5a2 2 0 0 1-2.8 0L3.3 12.6A2 2 0 0 1 2.7 11V5a2 2 0 0 1 2-2h6a2 2 0 0 1 1.9.6z"/><circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 4 5.3 4 8.5s-1.4 6.1-4 8.5c-2.6-2.4-4-5.3-4-8.5s1.4-6.1 4-8.5z"/>',
  heart: '<path d="M12 21s-6.7-4.35-9.3-8.1C.86 10.02 1.6 6.6 4.6 5.3c2.2-.96 4.4.02 5.9 2.02C11.9 5.32 14.1 4.34 16.3 5.3c3 1.3 3.74 4.72 1.9 7.6C18.7 16.65 12 21 12 21z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
};

const COLLAPSE_KEY = "296live_sidebar_collapsed";

/**
 * @param {string} activeRoute - hash aktif, mis. "#/all". Kosongkan ("") jika halaman ini
 *   bukan bagian dari SPA (mis. player.html) sehingga tidak ada item yang di-highlight.
 * @param {{hrefPrefix?: string}} opts - isi dengan "index.html" saat dipanggil dari
 *   halaman selain index.html, supaya link kembali ke SPA, bukan mengubah hash halaman saat ini.
 */
export function renderSidebar(activeRoute = "#/", { hrefPrefix = "" } = {}) {
  const items = NAV_ITEMS.map((item) => {
    const isActive = activeRoute === item.route || (item.route !== "#/" && activeRoute.startsWith(item.route));
    return `
      <a
        href="${hrefPrefix}${item.route}"
        class="nav-item ${isActive ? "active" : "text-[color:var(--text-secondary)]"} flex items-center gap-3 px-4 md:px-5 py-3 rounded-lg mx-2 hover:text-white transition-colors"
        data-route="${item.route}"
        aria-current="${isActive ? "page" : "false"}"
      >
        <svg viewBox="0 0 24 24" class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          ${ICONS[item.icon]}
        </svg>
        <span class="nav-label text-sm font-medium">${escapeHTML(item.label)}</span>
      </a>`;
  }).join("");

  return `
    <aside class="app-sidebar fixed left-0 top-0 bottom-0 glass border-r border-white/[.06] z-40 flex flex-col py-4" id="app-sidebar">
      <a href="${hrefPrefix}#/" class="flex items-center gap-2.5 px-4 lg:px-5 mb-6 group" aria-label="${escapeHTML(CONFIG.site.name)} — Beranda">
        <span class="w-9 h-9 rounded-lg bg-[image:var(--accent-gradient)] flex items-center justify-center font-display font-bold text-[#0a0a12] text-sm flex-shrink-0">296</span>
        <span class="brand-label flex-col leading-none">
          <span class="font-display font-bold text-sm text-white">LIVE TV</span>
          <span class="text-[10px] text-[color:var(--text-muted)] mt-0.5">by 296 Studios</span>
        </span>
      </a>
      <nav class="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar" aria-label="Navigasi utama">
        ${items}
      </nav>
      <button
        id="sidebar-collapse-btn"
        class="hidden lg:flex items-center gap-2.5 mx-2 my-1 px-4 py-2.5 rounded-lg text-[color:var(--text-secondary)] hover:text-white hover:bg-white/5 transition-colors"
        aria-pressed="false"
        aria-label="Perkecil sidebar"
        title="Perkecil / perbesar sidebar"
      >
        <svg id="sidebar-collapse-icon" viewBox="0 0 24 24" class="w-5 h-5 flex-shrink-0 transition-transform duration-200" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/>
        </svg>
        <span class="nav-label text-sm font-medium">Perkecil</span>
      </button>
      <div class="footer-label px-5 pt-3 mt-2 border-t border-white/[.06]">
        <p class="text-[11px] text-[color:var(--text-muted)]">© ${new Date().getFullYear()} 296 Studios</p>
      </div>
    </aside>
  `;
}

export function updateSidebarActive(root, activeRoute) {
  root.querySelectorAll(".nav-item").forEach((el) => {
    const route = el.dataset.route;
    const isActive = activeRoute === route || (route !== "#/" && activeRoute.startsWith(route));
    el.classList.toggle("active", isActive);
    el.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

/**
 * initSidebarInteractions — panggil sekali setelah renderSidebar() disisipkan ke DOM.
 * Menangani:
 *  - toggle minimize/maximize sidebar di layar besar (tersimpan di LocalStorage)
 *  - overlay sidebar di layar kecil lewat tombol menu di header
 */
export function initSidebarInteractions() {
  const collapsed = localStorage.getItem(COLLAPSE_KEY) === "1";
  document.documentElement.classList.toggle("sidebar-collapsed", collapsed);
  syncCollapseButton(collapsed);

  document.getElementById("sidebar-collapse-btn")?.addEventListener("click", () => {
    const next = !document.documentElement.classList.contains("sidebar-collapsed");
    document.documentElement.classList.toggle("sidebar-collapsed", next);
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    syncCollapseButton(next);
  });

  const aside = document.getElementById("app-sidebar");
  const menuBtn = document.getElementById("mobile-menu-btn");
  let backdrop = document.getElementById("sidebar-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "sidebar-backdrop";
    backdrop.className = "fixed inset-0 bg-black/50 z-30 hidden";
    document.body.appendChild(backdrop);
  }

  const closeMobileSidebar = () => {
    aside?.classList.remove("mobile-open");
    backdrop.classList.add("hidden");
  };
  const openMobileSidebar = () => {
    aside?.classList.add("mobile-open");
    backdrop.classList.remove("hidden");
  };

  menuBtn?.addEventListener("click", () => {
    if (aside?.classList.contains("mobile-open")) closeMobileSidebar();
    else openMobileSidebar();
  });
  backdrop.addEventListener("click", closeMobileSidebar);
  aside?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMobileSidebar));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMobileSidebar(); });
}

function syncCollapseButton(collapsed) {
  const btn = document.getElementById("sidebar-collapse-btn");
  if (!btn) return;
  const icon = document.getElementById("sidebar-collapse-icon");
  const label = btn.querySelector(".nav-label");
  btn.setAttribute("aria-pressed", String(collapsed));
  btn.setAttribute("aria-label", collapsed ? "Perbesar sidebar" : "Perkecil sidebar");
  icon?.classList.toggle("rotate-180", collapsed);
  if (label) label.textContent = collapsed ? "Perbesar" : "Perkecil";
}
