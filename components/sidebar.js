import { CONFIG } from "../assets/js/config.js";
import { escapeHTML } from "../assets/js/utils.js";

/**
 * sidebar.js — navigasi utama sisi kiri (ikon saja di mobile, icon+label di desktop).
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
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V19a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1H4a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10a1.7 1.7 0 0 0 1-1.56V4a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V10a1.7 1.7 0 0 0 1.56 1H20a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1z"/>',
};

export function renderSidebar(activeRoute = "#/") {
  const items = NAV_ITEMS.map((item) => {
    const isActive = activeRoute === item.route || (item.route !== "#/" && activeRoute.startsWith(item.route));
    return `
      <a
        href="${item.route}"
        class="nav-item ${isActive ? "active" : "text-[color:var(--text-secondary)]"} flex items-center gap-3 px-4 md:px-5 py-3 rounded-lg mx-2 hover:text-white transition-colors"
        data-route="${item.route}"
        aria-current="${isActive ? "page" : "false"}"
      >
        <svg viewBox="0 0 24 24" class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          ${ICONS[item.icon]}
        </svg>
        <span class="hidden lg:inline text-sm font-medium">${escapeHTML(item.label)}</span>
      </a>`;
  }).join("");

  return `
    <aside class="fixed left-0 top-0 bottom-0 w-[76px] lg:w-[220px] glass border-r border-white/[.06] z-40 flex flex-col py-4 transition-all">
      <a href="#/" class="flex items-center gap-2.5 px-4 lg:px-5 mb-6 group" aria-label="${escapeHTML(CONFIG.site.name)} — Beranda">
        <span class="w-9 h-9 rounded-lg bg-[image:var(--accent-gradient)] flex items-center justify-center font-display font-bold text-[#0a0a12] text-sm flex-shrink-0">296</span>
        <span class="hidden lg:flex flex-col leading-none">
          <span class="font-display font-bold text-sm text-white">LIVE TV</span>
          <span class="text-[10px] text-[color:var(--text-muted)] mt-0.5">by 296 Studios</span>
        </span>
      </a>
      <nav class="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar" aria-label="Navigasi utama">
        ${items}
      </nav>
      <div class="hidden lg:block px-5 pt-3 mt-3 border-t border-white/[.06]">
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
