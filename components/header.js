import { CONFIG } from "../assets/js/config.js";
import { escapeHTML } from "../assets/js/utils.js";

/**
 * header.js — search bar realtime + status koneksi.
 */

export function renderHeader() {
  return `
    <header class="fixed top-0 right-0 left-[76px] lg:left-[220px] h-[68px] z-30 glass border-b border-white/[.06] flex items-center gap-3 px-4 md:px-6">
      <button id="mobile-menu-btn" class="lg:hidden w-9 h-9 rounded-lg glass glass-hover flex items-center justify-center flex-shrink-0" aria-label="Buka menu">
        <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>

      <div class="relative flex-1 max-w-xl">
        <svg viewBox="0 0 24 24" class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          id="global-search"
          type="search"
          placeholder="Cari channel, kategori, negara, atau bahasa..."
          class="w-full bg-white/[.04] border border-white/[.08] focus:border-[color:var(--accent-violet)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[color:var(--text-muted)] outline-none transition-colors"
          autocomplete="off"
          aria-label="Cari channel"
        />
      </div>

      <div id="offline-indicator" class="hidden items-center gap-1.5 text-xs text-amber-300 font-mono bg-amber-400/10 border border-amber-400/25 rounded-full px-2.5 py-1">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> OFFLINE
      </div>

      <a href="#/settings" class="w-9 h-9 rounded-full glass glass-hover flex items-center justify-center flex-shrink-0" aria-label="Pengaturan">
        <svg viewBox="0 0 24 24" class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V19a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1H4a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10a1.7 1.7 0 0 0 1-1.56V4a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V10a1.7 1.7 0 0 0 1.56 1H20a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1z"/></svg>
      </a>
    </header>
  `;
}

/** Panel hasil pencarian mengambang di bawah search bar. */
export function renderSearchDropdown() {
  return `
    <div id="search-dropdown" class="hidden fixed top-[68px] left-0 right-0 lg:left-[220px] z-30 px-4 md:px-6 pt-3">
      <div class="glass rounded-xl border border-white/[.08] shadow-2xl max-w-xl ml-0 max-h-[70vh] overflow-y-auto p-2" id="search-results"></div>
    </div>
  `;
}
