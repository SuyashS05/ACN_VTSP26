import React from "react";

export const metadata = {
  title: "ACN-VTSP • Cloud-Native Video Transcoding & Streaming Platform",
  description: "Zero-Egress R2 • KEDA Spot CMAF (.m4s) • Spot GPU AI • Sub-300ms WebRTC & Yjs • <5ms ONNX Chat • Headless MCP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#080c14", color: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 24px",
            background: "#0f172a",
            borderBottom: "1px solid #334155",
          }}
        >
          <strong>ACN-VTSP • Next.js 15 App Router Platform</strong>
          <nav style={{ display: "flex", gap: 14, fontSize: 13 }}>
            <a href="/" style={{ color: "#38bdf8" }}>Home Feed</a>
            <a href="/watch/vid_8842" style={{ color: "#38bdf8" }}>16:9 Watch + AI</a>
            <a href="/shorts" style={{ color: "#38bdf8" }}>9:16 Shorts</a>
            <a href="/live/live_room_01" style={{ color: "#38bdf8" }}>Live + Yjs Board</a>
            <a href="/studio/upload" style={{ color: "#34d399" }}>Studio Upload</a>
            <a href="/studio/catalog" style={{ color: "#34d399" }}>Product Catalog</a>
            <a href="/studio/developers" style={{ color: "#c084fc" }}>MCP &amp; API Keys</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

