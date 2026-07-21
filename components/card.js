import { escapeHTML, initials, hueFromString, isSafeUrl, toast } from "../assets/js/utils.js";
import { isFavorite, toggleFavorite } from "../assets/js/storage.js";

/**
 * card.js — kartu channel dipakai di rail, grid, dan list view.
 * Render sebagai string HTML (lebih aman dari sisi performa untuk daftar besar)
 * lalu di-hydrate lewat data-attribute + event delegation di main.js.
 */

function logoMarkup(channel) {
  const hue = hueFromString(channel.id);
  const safeLogo = channel.logo && isSafeUrl(channel.logo) ? channel.logo : "";
  if (safeLogo) {
    return `
      <img
        src="${escapeHTML(safeLogo)}"
        alt=""
        loading="lazy"
        class="w-full h-full object-cover"
        onerror="this.replaceWith(Object.assign(document.createElement('div'), {className:'chan-logo-fallback w-full h-full text-lg', textContent:'${escapeHTML(initials(channel.name))}'}))"
      />`;
  }
  return `
    <div class="chan-logo-fallback w-full h-full text-lg" style="background:hsl(${hue} 70% 55%)">
      ${escapeHTML(initials(channel.name))}
    </div>`;
}

/** Kartu grid standar (digunakan di rail & grid channel). */
export function renderCard(channel, { index = 0 } = {}) {
  const fav = isFavorite(channel.id);
  const statusBadge = channel.status === "live"
    ? `<span class="badge-live"><span class="live-dot"></span>LIVE</span>`
    : `<span class="badge-offline">OFFLINE</span>`;

  return `
    <article
      class="chan-card ripple pop-in stagger group cursor-pointer"
      style="--d:${index}"
      data-channel-id="${escapeHTML(channel.id)}"
      role="button"
      tabindex="0"
      aria-label="Putar ${escapeHTML(channel.name)}"
    >
      <div class="relative aspect-video w-full overflow-hidden bg-[#15151f]">
        ${logoMarkup(channel)}
        <div class="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div class="absolute top-2 left-2">${statusBadge}</div>
        ${channel.resolution ? `<div class="absolute top-2 right-2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/50 text-white/80 border border-white/10">${escapeHTML(channel.resolution)}</div>` : ""}
        <button
          class="fav-btn absolute bottom-2 right-2 w-8 h-8 rounded-full glass flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          data-channel-id="${escapeHTML(channel.id)}"
          aria-pressed="${fav}"
          aria-label="${fav ? "Hapus dari favorit" : "Tambah ke favorit"}"
        >
          <svg viewBox="0 0 24 24" class="w-4 h-4" fill="${fav ? "#ff4d5e" : "none"}" stroke="${fav ? "#ff4d5e" : "currentColor"}" stroke-width="2">
            <path d="M12 21s-6.7-4.35-9.3-8.1C.86 10.02 1.6 6.6 4.6 5.3c2.2-.96 4.4.02 5.9 2.02C11.9 5.32 14.1 4.34 16.3 5.3c3 1.3 3.74 4.72 1.9 7.6C18.7 16.65 12 21 12 21z"/>
          </svg>
        </button>
      </div>
      <div class="p-2.5">
        <h3 class="text-sm font-medium text-white line-clamp-1">${escapeHTML(channel.name)}</h3>
        <p class="text-xs text-[color:var(--text-muted)] mt-0.5 line-clamp-1">${escapeHTML(channel.country)} · ${escapeHTML(channel.category)}</p>
      </div>
    </article>
  `;
}

/** Baris list-view (dipakai saat user memilih tampilan List di halaman Semua Channel). */
export function renderListRow(channel, { index = 0 } = {}) {
  const fav = isFavorite(channel.id);
  const statusBadge = channel.status === "live"
    ? `<span class="badge-live"><span class="live-dot"></span>LIVE</span>`
    : `<span class="badge-offline">OFFLINE</span>`;

  return `
    <div
      class="pop-in stagger flex items-center gap-3 p-2.5 rounded-lg glass glass-hover cursor-pointer transition-colors"
      style="--d:${index}"
      data-channel-id="${escapeHTML(channel.id)}"
      role="button"
      tabindex="0"
      aria-label="Putar ${escapeHTML(channel.name)}"
    >
      <div class="w-16 h-10 sm:w-20 sm:h-12 rounded-md overflow-hidden flex-shrink-0 bg-[#15151f]">${logoMarkup(channel)}</div>
      <div class="min-w-0 flex-1">
        <h3 class="text-sm font-medium text-white line-clamp-1">${escapeHTML(channel.name)}</h3>
        <p class="text-xs text-[color:var(--text-muted)] line-clamp-1">${escapeHTML(channel.country)} · ${escapeHTML(channel.category)} · ${escapeHTML(channel.language)}</p>
      </div>
      <div class="hidden sm:block">${statusBadge}</div>
      <button
        class="fav-btn w-8 h-8 rounded-full glass flex items-center justify-center flex-shrink-0"
        data-channel-id="${escapeHTML(channel.id)}"
        aria-pressed="${fav}"
        aria-label="${fav ? "Hapus dari favorit" : "Tambah ke favorit"}"
      >
        <svg viewBox="0 0 24 24" class="w-4 h-4" fill="${fav ? "#ff4d5e" : "none"}" stroke="${fav ? "#ff4d5e" : "currentColor"}" stroke-width="2">
          <path d="M12 21s-6.7-4.35-9.3-8.1C.86 10.02 1.6 6.6 4.6 5.3c2.2-.96 4.4.02 5.9 2.02C11.9 5.32 14.1 4.34 16.3 5.3c3 1.3 3.74 4.72 1.9 7.6C18.7 16.65 12 21 12 21z"/>
        </svg>
      </button>
    </div>
  `;
}

/**
 * bindCardEvents — event delegation untuk kartu channel (grid, list, rail,
 * maupun hasil pencarian). Dipakai bersama oleh main.js (index.html) dan
 * player-page.js (player.html) supaya perilakunya konsisten di semua halaman:
 * klik kartu -> buka player.html?id=..., klik tombol hati -> toggle favorit.
 */
export function bindCardEvents(root) {
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

/** Attach ripple effect ke elemen kartu (dipanggil setelah render, lewat event delegation). */
export function spawnRipple(e, target) {
  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ripple = document.createElement("span");
  ripple.className = "ripple-el";
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${(e.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2}px`;
  ripple.style.top = `${(e.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2}px`;
  target.appendChild(ripple);
  setTimeout(() => ripple.remove(), 650);
}
