import { CONFIG } from "../assets/js/config.js";
import { isSafeUrl, toast } from "../assets/js/utils.js";
import { getSettings, setContinueWatching } from "../assets/js/storage.js";

/**
 * player.js — pemutar video berbasis hls.js dengan kontrol kustom.
 * Mendukung: play/pause, volume/mute, fullscreen, PiP, kecepatan putar,
 * screenshot frame, refresh/reload stream, auto-recovery, dan sleep timer.
 */

export class ChannelPlayer {
  constructor(container, { onOffline } = {}) {
    this.container = container;
    this.onOffline = onOffline;
    this.hls = null;
    this.channel = null;
    this.retryCount = 0;
    this.retryTimer = null;
    this.sleepTimer = null;
    this.progressSaveInterval = null;
    this.controlsHideTimer = null;
    this._render();
    this._bindControls();
    this._bindKeyboard();
  }

  _render() {
    this.container.innerHTML = `
      <div class="relative w-full h-full bg-black group/player" id="player-shell" tabindex="0" aria-label="Pemutar video">
        <video id="video-el" class="w-full h-full object-contain bg-black" playsinline></video>

        <div id="player-offline" class="hidden absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/85 text-center px-6">
          <svg viewBox="0 0 24 24" class="w-12 h-12 text-amber-400" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3l18 18M8.5 16.5a7 7 0 0 1 7-7M5 12a11 11 0 0 1 3-2.2M12 20h.01M19 9.9A11 11 0 0 0 12 6"/></svg>
          <p class="text-white font-display text-lg">Channel sedang offline</p>
          <p class="text-sm text-[color:var(--text-muted)] max-w-xs">Stream tidak dapat dimuat. Periksa koneksi internet Anda atau coba lagi.</p>
          <button id="retry-btn" class="btn-primary rounded-full px-5 py-2 text-sm">Coba Lagi</button>
        </div>

        <div id="player-loading" class="absolute inset-0 flex items-center justify-center bg-black/40">
          <div class="w-10 h-10 border-2 border-white/20 border-t-[color:var(--accent-cyan)] rounded-full animate-spin"></div>
        </div>

        <div id="player-controls" class="player-controls absolute inset-x-0 bottom-0 pt-16 pb-3 px-3 md:px-5 opacity-100 transition-opacity duration-300">
          <div class="flex items-center gap-2 mb-2">
            <input id="seek-bar" type="range" min="0" max="100" value="0" class="progress-scrub w-full cursor-pointer" aria-label="Posisi video (live)" />
          </div>
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-1.5">
              <button id="play-btn" class="ctrl-btn" aria-label="Putar/Jeda">
                <svg id="icon-play" viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                <svg id="icon-pause" viewBox="0 0 24 24" class="w-5 h-5 hidden" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>
              </button>
              <button id="mute-btn" class="ctrl-btn" aria-label="Bisukan/Suara">
                <svg id="icon-vol" viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4z"/></svg>
                <svg id="icon-mute" viewBox="0 0 24 24" class="w-5 h-5 hidden" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4zm12.7-1.3-1.4 1.4 1.9 1.9-1.9 1.9 1.4 1.4 1.9-1.9 1.9 1.9 1.4-1.4-1.9-1.9 1.9-1.9-1.4-1.4-1.9 1.9z"/></svg>
              </button>
              <input id="volume-bar" type="range" min="0" max="100" value="80" class="w-20 progress-scrub cursor-pointer hidden sm:block" aria-label="Volume" />
              <span class="badge-live ml-1"><span class="live-dot"></span>LIVE</span>
            </div>
            <div class="flex items-center gap-1.5">
              <button id="speed-btn" class="ctrl-btn font-mono text-xs w-9" aria-label="Kecepatan putar">1x</button>
              <button id="screenshot-btn" class="ctrl-btn" aria-label="Screenshot frame" title="Screenshot">
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 8V6a2 2 0 0 1 2-2h2M20 8V6a2 2 0 0 0-2-2h-2M4 16v2a2 2 0 0 0 2 2h2M20 16v2a2 2 0 0 1-2 2h-2"/><circle cx="12" cy="12" r="3.2"/></svg>
              </button>
              <button id="refresh-btn" class="ctrl-btn" aria-label="Refresh stream" title="Refresh">
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a9 9 0 1 1-2.6-6.36M21 4v5h-5"/></svg>
              </button>
              <button id="sleep-btn" class="ctrl-btn" aria-label="Sleep timer" title="Sleep timer">
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8z"/></svg>
              </button>
              <button id="pip-btn" class="ctrl-btn" aria-label="Picture in Picture" title="Picture in Picture">
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><rect x="11" y="11" width="7" height="5" rx="1" fill="currentColor" stroke="none"/></svg>
              </button>
              <button id="fullscreen-btn" class="ctrl-btn" aria-label="Fullscreen" title="Fullscreen">
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 4H5a1 1 0 0 0-1 1v3M16 4h3a1 1 0 0 1 1 1v3M8 20H5a1 1 0 0 1-1-1v-3M16 20h3a1 1 0 0 0 1-1v-3"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>
        .ctrl-btn { width: 36px; height: 36px; border-radius: 10px; display:flex; align-items:center; justify-content:center; color:#fff; background:rgba(255,255,255,.06); transition: background .18s ease, transform .18s ease; }
        .ctrl-btn:hover { background: rgba(255,255,255,.14); transform: translateY(-1px); }
      </style>
    `;

    this.video = this.container.querySelector("#video-el");
    this.els = {
      shell: this.container.querySelector("#player-shell"),
      controls: this.container.querySelector("#player-controls"),
      offline: this.container.querySelector("#player-offline"),
      loading: this.container.querySelector("#player-loading"),
      seekBar: this.container.querySelector("#seek-bar"),
      volumeBar: this.container.querySelector("#volume-bar"),
      playBtn: this.container.querySelector("#play-btn"),
      iconPlay: this.container.querySelector("#icon-play"),
      iconPause: this.container.querySelector("#icon-pause"),
      muteBtn: this.container.querySelector("#mute-btn"),
      iconVol: this.container.querySelector("#icon-vol"),
      iconMute: this.container.querySelector("#icon-mute"),
      speedBtn: this.container.querySelector("#speed-btn"),
      screenshotBtn: this.container.querySelector("#screenshot-btn"),
      refreshBtn: this.container.querySelector("#refresh-btn"),
      sleepBtn: this.container.querySelector("#sleep-btn"),
      pipBtn: this.container.querySelector("#pip-btn"),
      fullscreenBtn: this.container.querySelector("#fullscreen-btn"),
      retryBtn: this.container.querySelector("#retry-btn"),
    };
  }

  _bindControls() {
    const { els, video } = this;
    els.playBtn.addEventListener("click", () => this.togglePlay());
    els.muteBtn.addEventListener("click", () => this.toggleMute());
    els.volumeBar.addEventListener("input", (e) => {
      video.volume = e.target.value / 100;
      video.muted = false;
      this._syncMuteIcon();
    });
    els.speedBtn.addEventListener("click", () => this._cycleSpeed());
    els.screenshotBtn.addEventListener("click", () => this._screenshot());
    els.refreshBtn.addEventListener("click", () => this.reload());
    els.sleepBtn.addEventListener("click", () => this._promptSleepTimer());
    els.pipBtn.addEventListener("click", () => this._togglePiP());
    els.fullscreenBtn.addEventListener("click", () => this._toggleFullscreen());
    els.retryBtn.addEventListener("click", () => this.reload());

    video.addEventListener("play", () => this._syncPlayIcon());
    video.addEventListener("pause", () => this._syncPlayIcon());
    video.addEventListener("volumechange", () => this._syncMuteIcon());
    video.addEventListener("waiting", () => els.loading.classList.remove("hidden"));
    video.addEventListener("playing", () => els.loading.classList.add("hidden"));
    video.addEventListener("error", () => this._handleFatalError());

    // Auto-hide kontrol setelah idle
    const showControls = () => {
      els.controls.style.opacity = "1";
      clearTimeout(this.controlsHideTimer);
      this.controlsHideTimer = setTimeout(() => {
        if (!video.paused) els.controls.style.opacity = "0";
      }, 3200);
    };
    els.shell.addEventListener("mousemove", showControls);
    els.shell.addEventListener("touchstart", showControls, { passive: true });
    showControls();
  }

  _bindKeyboard() {
    this._keyHandler = (e) => {
      if (!this.container.contains(document.activeElement) && document.activeElement !== document.body) return;
      switch (e.key.toLowerCase()) {
        case " ": e.preventDefault(); this.togglePlay(); break;
        case "m": this.toggleMute(); break;
        case "f": this._toggleFullscreen(); break;
        case "arrowup": this.video.volume = Math.min(1, this.video.volume + 0.1); break;
        case "arrowdown": this.video.volume = Math.max(0, this.video.volume - 0.1); break;
      }
    };
    document.addEventListener("keydown", this._keyHandler);
  }

  /** Muat channel baru ke dalam player. */
  load(channel) {
    this.channel = channel;
    this.retryCount = 0;
    this.els.offline.classList.add("hidden");
    this.els.loading.classList.remove("hidden");

    if (!isSafeUrl(channel.stream)) {
      toast("URL stream tidak valid", { type: "error" });
      this._showOffline();
      return;
    }

    this._destroyHls();

    const settings = getSettings();
    this.video.volume = settings.defaultVolume ?? 0.8;
    this.els.volumeBar.value = Math.round(this.video.volume * 100);

    if (channel.status === "offline") {
      this._showOffline();
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      this.hls = new window.Hls({ maxBufferLength: 30, enableWorker: true });
      this.hls.loadSource(channel.stream);
      this.hls.attachMedia(this.video);
      this.hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        this.els.loading.classList.add("hidden");
        if (settings.autoPlay) this.video.play().catch(() => {});
      });
      this.hls.on(window.Hls.Events.ERROR, (_evt, data) => {
        if (!data.fatal) return;
        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) this._scheduleRetry();
        else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) this.hls.recoverMediaError();
        else this._handleFatalError();
      });
    } else if (this.video.canPlayType("application/vnd.apple.mpegurl")) {
      this.video.src = channel.stream;
      this.video.addEventListener("loadedmetadata", () => {
        this.els.loading.classList.add("hidden");
        if (settings.autoPlay) this.video.play().catch(() => {});
      }, { once: true });
    } else {
      toast("Browser tidak mendukung pemutaran HLS", { type: "error" });
      this._showOffline();
      return;
    }

    if (settings.autoFullscreen) this._toggleFullscreen(true);

    // Simpan posisi tonton berkala (untuk Continue Watching)
    clearInterval(this.progressSaveInterval);
    this.progressSaveInterval = setInterval(() => {
      if (this.channel && !this.video.paused) {
        setContinueWatching(this.channel.id, this.video.currentTime || 0);
      }
    }, 5000);
  }

  reload() {
    if (!this.channel) return;
    toast("Memuat ulang stream...", { type: "info", duration: 1500 });
    this.load(this.channel);
  }

  togglePlay() {
    if (this.video.paused) this.video.play().catch(() => {});
    else this.video.pause();
  }

  toggleMute() {
    this.video.muted = !this.video.muted;
  }

  destroy() {
    this._destroyHls();
    clearInterval(this.progressSaveInterval);
    clearTimeout(this.retryTimer);
    clearTimeout(this.sleepTimer);
    document.removeEventListener("keydown", this._keyHandler);
  }

  _destroyHls() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }

  _showOffline() {
    this.els.loading.classList.add("hidden");
    this.els.offline.classList.remove("hidden");
    this.onOffline?.(this.channel);
  }

  _handleFatalError() {
    this._scheduleRetry();
  }

  _scheduleRetry() {
    if (this.retryCount >= CONFIG.player.maxAutoRetry) {
      this._showOffline();
      return;
    }
    this.retryCount++;
    this.els.loading.classList.remove("hidden");
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      if (this.channel) this.load(this.channel);
    }, CONFIG.player.retryIntervalMs);
  }

  _syncPlayIcon() {
    const playing = !this.video.paused;
    this.els.iconPlay.classList.toggle("hidden", playing);
    this.els.iconPause.classList.toggle("hidden", !playing);
  }

  _syncMuteIcon() {
    const muted = this.video.muted || this.video.volume === 0;
    this.els.iconVol.classList.toggle("hidden", muted);
    this.els.iconMute.classList.toggle("hidden", !muted);
  }

  _cycleSpeed() {
    const speeds = [1, 1.25, 1.5, 2, 0.5, 0.75];
    const current = this.video.playbackRate;
    const idx = speeds.indexOf(current);
    const next = speeds[(idx + 1) % speeds.length];
    this.video.playbackRate = next;
    this.els.speedBtn.textContent = `${next}x`;
  }

  _screenshot() {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = this.video.videoWidth || 1280;
      canvas.height = this.video.videoHeight || 720;
      canvas.getContext("2d").drawImage(this.video, 0, 0, canvas.width, canvas.height);
      const link = document.createElement("a");
      link.download = `${(this.channel?.id || "296live")}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast("Screenshot disimpan", { type: "success" });
    } catch {
      toast("Gagal mengambil screenshot", { type: "error" });
    }
  }

  _promptSleepTimer() {
    clearTimeout(this.sleepTimer);
    const minutes = window.prompt("Hentikan pemutaran setelah berapa menit? (kosongkan untuk batal)", "30");
    if (!minutes) return;
    const ms = Number(minutes) * 60 * 1000;
    if (!ms || ms < 0) return;
    this.sleepTimer = setTimeout(() => {
      this.video.pause();
      toast("Sleep timer aktif — pemutaran dihentikan", { type: "info" });
    }, ms);
    toast(`Sleep timer diatur: ${minutes} menit`, { type: "success" });
  }

  async _togglePiP() {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await this.video.requestPictureInPicture();
      } else {
        toast("Picture in Picture tidak didukung browser ini", { type: "warn" });
      }
    } catch {
      toast("Gagal mengaktifkan Picture in Picture", { type: "error" });
    }
  }

  _toggleFullscreen(forceOn = false) {
    if (document.fullscreenElement) {
      if (!forceOn) document.exitFullscreen();
    } else {
      this.els.shell.requestFullscreen?.().catch(() => {});
    }
  }
}
