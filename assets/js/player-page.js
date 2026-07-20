import { CONFIG } from "./config.js";
import { escapeHTML, toast } from "./utils.js";
import { loadCatalog, getChannelById } from "./store.js";
import { pushHistory, isFavorite, toggleFavorite } from "./storage.js";
import { renderSidebar, updateSidebarActive } from "../../components/sidebar.js";
import { renderHeader, renderSearchDropdown } from "../../components/header.js";
import { renderCard } from "../../components/card.js";
import { ChannelPlayer } from "../../components/player.js";
import { openShareModal } from "../../components/modal.js";

document.getElementById("shell-sidebar").innerHTML = renderSidebar("");
document.getElementById("shell-header").innerHTML = renderHeader() + renderSearchDropdown();

const params = new URLSearchParams(location.search);
const channelId = params.get("id");
const infoEl = document.getElementById("channel-info");
const relatedEl = document.getElementById("related-channels");
const playerContainer = document.getElementById("player-mount");

let player;

async function init() {
  if (!channelId) {
    infoEl.innerHTML = `<p class="text-[color:var(--text-secondary)]">Channel tidak ditemukan.</p>`;
    return;
  }

  let channels = [];
  try {
    channels = await loadCatalog();
  } catch {
    toast("Gagal memuat data channel", { type: "error" });
  }

  const channel = getChannelById(channels, channelId);
  if (!channel) {
    infoEl.innerHTML = `
      <p class="text-[color:var(--text-secondary)]">Channel tidak ditemukan atau ID tidak valid.</p>
      <a href="index.html#/all" class="btn-primary rounded-full px-5 py-2 text-sm mt-4 inline-block">Kembali ke Semua Channel</a>
    `;
    return;
  }

  document.title = `${channel.name} — 296 LIVE TV`;
  pushHistory(channel.id);

  player = new ChannelPlayer(playerContainer, {
    onOffline: () => toast(`${channel.name} sedang offline`, { type: "warn" }),
  });
  player.load(channel);

  renderInfo(channel);
  renderRelated(channels, channel);
}

function renderInfo(channel) {
  const fav = isFavorite(channel.id);
  infoEl.innerHTML = `
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div class="flex items-center gap-2 mb-1.5">
          ${channel.status === "live"
            ? `<span class="badge-live"><span class="live-dot"></span>LIVE</span>`
            : `<span class="badge-offline">OFFLINE</span>`}
          ${channel.resolution ? `<span class="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">${escapeHTML(channel.resolution)}</span>` : ""}
        </div>
        <h1 class="font-display text-xl md:text-2xl font-bold text-white">${escapeHTML(channel.name)}</h1>
        <p class="text-sm text-[color:var(--text-muted)] mt-1">${escapeHTML(channel.country)} · ${escapeHTML(channel.category)} · ${escapeHTML(channel.language)}</p>
      </div>
      <div class="flex items-center gap-2">
        <button id="fav-toggle-btn" class="btn-ghost rounded-full px-4 py-2 text-sm flex items-center gap-2">
          <svg viewBox="0 0 24 24" class="w-4 h-4" fill="${fav ? "#ff4d5e" : "none"}" stroke="${fav ? "#ff4d5e" : "currentColor"}" stroke-width="2"><path d="M12 21s-6.7-4.35-9.3-8.1C.86 10.02 1.6 6.6 4.6 5.3c2.2-.96 4.4.02 5.9 2.02C11.9 5.32 14.1 4.34 16.3 5.3c3 1.3 3.74 4.72 1.9 7.6C18.7 16.65 12 21 12 21z"/></svg>
          ${fav ? "Favorit" : "Tambah Favorit"}
        </button>
        <button id="share-btn" class="btn-ghost rounded-full px-4 py-2 text-sm flex items-center gap-2">
          <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>
          Bagikan
        </button>
      </div>
    </div>
  `;

  document.getElementById("fav-toggle-btn").addEventListener("click", () => {
    const isFav = toggleFavorite(channel.id);
    toast(isFav ? "Ditambahkan ke favorit" : "Dihapus dari favorit", { type: "success" });
    renderInfo(channel);
  });
  document.getElementById("share-btn").addEventListener("click", () => openShareModal(channel));
}

function renderRelated(channels, current) {
  const related = channels.filter((c) => c.id !== current.id && c.category === current.category).slice(0, 12);
  if (!related.length) { relatedEl.innerHTML = ""; return; }
  relatedEl.innerHTML = `
    <h2 class="font-display text-lg font-semibold text-white mb-3">Channel Serupa</h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
      ${related.map((c, i) => renderCard(c, { index: i })).join("")}
    </div>
  `;
  relatedEl.querySelectorAll("[data-channel-id]").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".fav-btn")) return;
      location.href = `player.html?id=${encodeURIComponent(card.dataset.channelId)}`;
    });
  });
  relatedEl.querySelectorAll(".fav-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isFav = toggleFavorite(btn.dataset.channelId);
      toast(isFav ? "Ditambahkan ke favorit" : "Dihapus dari favorit", { type: "success" });
      btn.setAttribute("aria-pressed", String(isFav));
      const svg = btn.querySelector("svg");
      svg.setAttribute("fill", isFav ? "#ff4d5e" : "none");
      svg.setAttribute("stroke", isFav ? "#ff4d5e" : "currentColor");
    });
  });
}

window.addEventListener("beforeunload", () => player?.destroy());

init();
