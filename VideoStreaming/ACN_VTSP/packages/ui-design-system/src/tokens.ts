/**
 * ACN-VTSP Shared UI Design System Tokens (`packages/ui-design-system/src/tokens.ts`)
 * Luminous Dark Palette, Player Overlay Z-Indices, and Typography Tokens shared across Web & Embed SDK.
 */

export const ACN_THEME_TOKENS = {
  colors: {
    background: "#080c14",
    panel: "#0f172a",
    panelAlt: "#1e293b",
    border: "#334155",
    textPrimary: "#f8fafc",
    textMuted: "#94a3b8",
    accentCyan: "#38bdf8",
    accentEmerald: "#34d399",
    accentPurple: "#c084fc",
    accentAmber: "#fbbf24",
    accentRose: "#fb7185",
  },
  abrRungs: ["360p", "720p", "1080p", "1080p-AV1"] as const,
  playbackSpeeds: [0.25, 0.5, 1.0, 1.25, 1.5, 2.0] as const,
  supportedLocales: [
    { code: "en", label: "English (Faster-Whisper)" },
    { code: "hi", label: "Hindi (NLLB-200 + Kokoro TTS)" },
    { code: "es", label: "Spanish (NLLB-200 + Kokoro TTS)" },
  ] as const,
};

