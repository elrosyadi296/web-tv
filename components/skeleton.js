/**
 * skeleton.js — placeholder shimmer saat data channel sedang dimuat.
 */

export function skeletonCard() {
  return `
    <div class="pop-in rounded-lg overflow-hidden border border-white/[.07] bg-white/[.03]">
      <div class="skeleton aspect-video w-full"></div>
      <div class="p-3 space-y-2">
        <div class="skeleton h-3 w-4/5 rounded"></div>
        <div class="skeleton h-2.5 w-2/5 rounded"></div>
      </div>
    </div>
  `;
}

export function skeletonGrid(count = 12) {
  return `
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
      ${Array.from({ length: count }, () => skeletonCard()).join("")}
    </div>
  `;
}

export function skeletonRail(count = 6) {
  return `
    <div class="flex gap-3 md:gap-4 overflow-hidden">
      ${Array.from({ length: count }, () => `<div class="w-40 sm:w-48 flex-shrink-0">${skeletonCard()}</div>`).join("")}
    </div>
  `;
}

export function skeletonHero() {
  return `
    <div class="skeleton rounded-2xl w-full h-[280px] md:h-[380px]"></div>
  `;
}
