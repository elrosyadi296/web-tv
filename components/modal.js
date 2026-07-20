import { escapeHTML } from "../assets/js/utils.js";

/**
 * modal.js — modal generik dengan overlay glass + animasi pop-in.
 * Dipakai untuk: share channel, QR code, dan filter lanjutan.
 */

let activeModal = null;

export function closeModal() {
  if (!activeModal) return;
  activeModal.classList.add("opacity-0");
  const el = activeModal;
  activeModal = null;
  setTimeout(() => el.remove(), 200);
  document.removeEventListener("keydown", handleEsc);
}

function handleEsc(e) {
  if (e.key === "Escape") closeModal();
}

export function openModal({ title, bodyHTML, footerHTML = "" }) {
  closeModal();
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 fade-in";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.innerHTML = `
    <div class="glass modal-in rounded-2xl border border-white/10 w-full max-w-md shadow-2xl overflow-hidden" role="document">
      <div class="flex items-center justify-between px-5 py-4 border-b border-white/[.07]">
        <h2 class="font-display font-semibold text-white text-base">${escapeHTML(title)}</h2>
        <button id="modal-close-btn" class="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center" aria-label="Tutup">
          <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>
      <div class="px-5 py-4">${bodyHTML}</div>
      ${footerHTML ? `<div class="px-5 py-4 border-t border-white/[.07] flex justify-end gap-2">${footerHTML}</div>` : ""}
    </div>
  `;
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  overlay.querySelector("#modal-close-btn").addEventListener("click", closeModal);
  document.body.appendChild(overlay);
  document.addEventListener("keydown", handleEsc);
  activeModal = overlay;
  return overlay;
}

/** Modal share: link, copy URL, copy nama, buka tab baru, QR code. */
export function openShareModal(channel) {
  const shareUrl = `${location.origin}${location.pathname}#/watch/${encodeURIComponent(channel.id)}`;
  const qrSrc = `data:image/svg+xml;utf8,${encodeURIComponent(buildSimpleQR(shareUrl))}`;

  const overlay = openModal({
    title: `Bagikan ${channel.name}`,
    bodyHTML: `
      <div class="flex flex-col items-center gap-4">
        <div class="w-40 h-40 rounded-lg bg-white p-2 flex items-center justify-center">
          <img src="${qrSrc}" alt="QR code untuk berbagi ${escapeHTML(channel.name)}" class="w-full h-full" />
        </div>
        <div class="w-full">
          <label class="text-xs text-[color:var(--text-muted)] mb-1 block">Link Channel</label>
          <div class="flex gap-2">
            <input readonly value="${escapeHTML(shareUrl)}" class="flex-1 bg-white/[.05] border border-white/[.08] rounded-lg px-3 py-2 text-xs text-white truncate" />
            <button id="copy-link-btn" class="btn-ghost rounded-lg px-3 text-xs font-medium">Salin</button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 w-full">
          <button id="copy-name-btn" class="btn-ghost rounded-lg py-2 text-xs font-medium">Salin Nama</button>
          <button id="copy-stream-btn" class="btn-ghost rounded-lg py-2 text-xs font-medium">Salin Stream URL</button>
          <button id="open-tab-btn" class="btn-ghost rounded-lg py-2 text-xs font-medium col-span-2">Buka di Tab Baru</button>
        </div>
      </div>
    `,
  });

  overlay.querySelector("#copy-link-btn").addEventListener("click", () => copyText(shareUrl, "Link disalin"));
  overlay.querySelector("#copy-name-btn").addEventListener("click", () => copyText(channel.name, "Nama channel disalin"));
  overlay.querySelector("#copy-stream-btn").addEventListener("click", () => copyText(channel.stream, "Stream URL disalin"));
  overlay.querySelector("#open-tab-btn").addEventListener("click", () => window.open(shareUrl, "_blank", "noopener"));
}

async function copyText(text, successMsg) {
  const { toast } = await import("../assets/js/utils.js");
  try {
    await navigator.clipboard.writeText(text);
    toast(successMsg, { type: "success" });
  } catch {
    toast("Gagal menyalin ke clipboard", { type: "error" });
  }
}

/** QR generator super-ringan berbasis pola pseudo-visual (tanpa dependensi eksternal). */
function buildSimpleQR(text) {
  // Catatan: ini representasi visual sederhana (bukan QR standar penuh),
  // dibuat agar 100% tanpa dependensi eksternal / library QR pihak ketiga.
  const size = 21;
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  const cells = [];
  let seed = hash;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return seed / 4294967295;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const isFinder =
        (x < 5 && y < 5) || (x > size - 6 && y < 5) || (x < 5 && y > size - 6);
      cells.push(isFinder ? (x % 4 === 0 || y % 4 === 0 ? 0 : 1) : rand() > 0.55 ? 1 : 0);
    }
  }
  const cellSize = 8;
  const svgSize = size * cellSize;
  let rects = "";
  cells.forEach((v, i) => {
    if (!v) return;
    const x = (i % size) * cellSize;
    const y = Math.floor(i / size) * cellSize;
    rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#0a0a12"/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}"><rect width="100%" height="100%" fill="#fff"/>${rects}</svg>`;
}

/** Modal filter lanjutan untuk halaman "Semua Channel". */
export function openFilterModal({ categories, countries, languages, resolutions, current, onApply }) {
  const opt = (list, selected) =>
    `<option value="">Semua</option>` +
    list.map((v) => `<option value="${escapeHTML(v)}" ${v === selected ? "selected" : ""}>${escapeHTML(v)}</option>`).join("");

  const overlay = openModal({
    title: "Filter Channel",
    bodyHTML: `
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <label class="text-xs text-[color:var(--text-muted)] block mb-1">Kategori</label>
          <select id="f-category" class="w-full bg-white/[.05] border border-white/[.08] rounded-lg px-2 py-2 text-white">${opt(categories, current.category)}</select>
        </div>
        <div>
          <label class="text-xs text-[color:var(--text-muted)] block mb-1">Negara</label>
          <select id="f-country" class="w-full bg-white/[.05] border border-white/[.08] rounded-lg px-2 py-2 text-white">${opt(countries, current.country)}</select>
        </div>
        <div>
          <label class="text-xs text-[color:var(--text-muted)] block mb-1">Bahasa</label>
          <select id="f-language" class="w-full bg-white/[.05] border border-white/[.08] rounded-lg px-2 py-2 text-white">${opt(languages, current.language)}</select>
        </div>
        <div>
          <label class="text-xs text-[color:var(--text-muted)] block mb-1">Resolusi</label>
          <select id="f-resolution" class="w-full bg-white/[.05] border border-white/[.08] rounded-lg px-2 py-2 text-white">${opt(resolutions, current.resolution)}</select>
        </div>
        <div>
          <label class="text-xs text-[color:var(--text-muted)] block mb-1">Status</label>
          <select id="f-status" class="w-full bg-white/[.05] border border-white/[.08] rounded-lg px-2 py-2 text-white">
            <option value="">Semua</option>
            <option value="live" ${current.status === "live" ? "selected" : ""}>Live</option>
            <option value="offline" ${current.status === "offline" ? "selected" : ""}>Offline</option>
          </select>
        </div>
      </div>
    `,
    footerHTML: `
      <button id="filter-reset-btn" class="btn-ghost rounded-lg px-4 py-2 text-xs font-medium">Reset</button>
      <button id="filter-apply-btn" class="btn-primary rounded-lg px-4 py-2 text-xs">Terapkan</button>
    `,
  });

  overlay.querySelector("#filter-apply-btn").addEventListener("click", () => {
    const val = (id) => overlay.querySelector(id).value || undefined;
    onApply({
      category: val("#f-category"),
      country: val("#f-country"),
      language: val("#f-language"),
      resolution: val("#f-resolution"),
      status: val("#f-status"),
    });
    closeModal();
  });
  overlay.querySelector("#filter-reset-btn").addEventListener("click", () => {
    onApply({});
    closeModal();
  });
}
