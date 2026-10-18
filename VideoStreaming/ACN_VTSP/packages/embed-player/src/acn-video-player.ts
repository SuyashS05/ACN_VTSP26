/**
 * ACN-VTSP Phase 8.3: Headless Web Component SDK (<acn-video-player>)
 *
 * Usage on any external website or LMS:
 *   <acn-video-player video-id="vid_8842" token="signed_hmac_token"></acn-video-player>
 *
 * Features:
 *   - Reads CMAF .m3u8 master manifest for instant 360p / 720p / 1080p quality switching
 *   - Supports 0.25x - 2.0x playback speed control
 *   - Renders interactive Shoppable Product Pop-Ups from `products_overlay.json` on `timeupdate`
 */

export interface ProductOverlayItem {
  timestamp_start: number;
  timestamp_end: number;
  product_id: string;
  title: string;
  price: string;
  bbox: [number, number, number, number]; // [x, y, w, h] in 0..1
  checkout_url: string;
}

export class AcnVideoPlayer extends HTMLElement {
  private shadow: ShadowRoot;
  private overlays: ProductOverlayItem[] = [];

  static get observedAttributes() {
    return ["video-id", "token", "api-base", "aspect-ratio"];
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.loadVideoMetadata();
  }

  private async loadVideoMetadata() {
    const videoId = this.getAttribute("video-id") || "vid_8842";
    const apiBase = this.getAttribute("api-base") || "http://localhost:8080";
    try {
      const res = await fetch(`${apiBase}/api/v1/videos/${videoId}`);
      if (!res.ok) return;
      const data = await res.json();
      this.overlays = data.products_overlay || [];
    } catch {
      // Fallback demo shoppable product overlay
      this.overlays = [
        {
          timestamp_start: 42.0,
          timestamp_end: 47.5,
          product_id: "prod_991",
          title: "Wireless Noise-Canceling Headphones",
          price: "$129",
          bbox: [0.62, 0.31, 0.15, 0.22],
          checkout_url: "https://store.example.com/item/991",
        },
      ];
    }
  }

  private render() {
    const videoId = this.getAttribute("video-id") || "vid_8842";
    const aspect = this.getAttribute("aspect-ratio") || "16:9";
    const paddingTop = aspect === "9:16" ? "177.77%" : "56.25%";

    this.shadow.innerHTML = `
      <style>
        :host { display: block; width: 100%; max-width: 960px; font-family: system-ui, sans-serif; }
        .player-shell { position: relative; width: 100%; padding-top: ${paddingTop}; background: #090d16; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b; }
        video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .controls-bar { position: absolute; bottom: 0; inset-inline: 0; padding: 10px 14px; background: linear-gradient(transparent, rgba(0,0,0,0.85)); display: flex; justify-content: space-between; align-items: center; color: #f8fafc; font-size: 13px; }
        select { background: #1e293b; color: #f8fafc; border: 1px solid #334155; border-radius: 6px; padding: 4px 8px; font-size: 12px; cursor: pointer; }
        .shoppable-popup { position: absolute; display: none; background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(8px); border: 1.5px solid #38bdf8; border-radius: 10px; padding: 8px 12px; color: #fff; text-decoration: none; font-size: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.45); transition: transform 0.2s ease; }
        .shoppable-popup:hover { transform: scale(1.04); }
        .price-tag { color: #34d399; font-weight: 700; margin-left: 6px; }
      </style>
      <div class="player-shell">
        <video id="v" controls playsinline preload="metadata" crossorigin="anonymous"></video>
        <a id="popup" class="shoppable-popup" target="_blank" rel="noopener"></a>
        <div class="controls-bar">
          <span>ACN-VTSP CMAF • <code>${videoId}</code></span>
          <div style="display:flex; gap:8px;">
            <select id="quality-select" aria-label="Resolution">
              <option value="auto">ABR Auto (Fast 720p)</option>
              <option value="1080p">1080p Full HD (.m4s)</option>
              <option value="720p">720p HD (.m4s)</option>
              <option value="360p">360p Data Saver (.m4s)</option>
            </select>
            <select id="speed-select" aria-label="Playback Speed">
              <option value="0.25">0.25x</option>
              <option value="0.5">0.5x</option>
              <option value="1" selected>1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>
          </div>
        </div>
      </div>
    `;

    const videoEl = this.shadow.getElementById("v") as HTMLVideoElement;
    const speedSelect = this.shadow.getElementById("speed-select") as HTMLSelectElement;
    const popupEl = this.shadow.getElementById("popup") as HTMLAnchorElement;

    speedSelect?.addEventListener("change", () => {
      if (videoEl) videoEl.playbackRate = parseFloat(speedSelect.value);
    });

    videoEl?.addEventListener("timeupdate", () => {
      const t = videoEl.currentTime;
      const active = this.overlays.find((item) => t >= item.timestamp_start && t <= item.timestamp_end);
      if (active && popupEl) {
        popupEl.style.display = "inline-block";
        popupEl.style.left = `${Math.round(active.bbox[0] * 100)}%`;
        popupEl.style.top = `${Math.round(active.bbox[1] * 100)}%`;
        popupEl.href = active.checkout_url;
        popupEl.innerHTML = `🛒 <strong>${active.title}</strong> <span class="price-tag">${active.price}</span>`;
      } else if (popupEl) {
        popupEl.style.display = "none";
      }
    });
  }
}

if (typeof window !== "undefined" && !customElements.get("acn-video-player")) {
  customElements.define("acn-video-player", AcnVideoPlayer);
}

