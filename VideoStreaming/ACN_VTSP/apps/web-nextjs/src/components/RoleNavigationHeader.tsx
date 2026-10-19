"use client";

import React, { useState } from "react";
import { usePlatformRole, type PlatformRole } from "../lib/role-context";

export function RoleNavigationHeader() {
  const { role, setRole, channelHandle, becomeClient } = usePlatformRole();
  const [showModal, setShowModal] = useState(false);
  const [newHandle, setNewHandle] = useState("@my_stream_channel");

  function handleCreateChannel() {
    becomeClient(newHandle || "@my_stream_channel");
    setShowModal(false);
  }

  return (
    <>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          padding: "12px 24px",
          background: "#0f172a",
          borderBottom: "1px solid #334155",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <strong style={{ fontSize: 15 }}>ACN-VTSP • Cloud-Native Video Platform</strong>
          <span
            style={{
              padding: "3px 9px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "monospace",
              background:
                role === "ADMIN"
                  ? "rgba(251, 191, 36, 0.2)"
                  : role === "CLIENT"
                  ? "rgba(52, 211, 153, 0.2)"
                  : "rgba(56, 189, 248, 0.2)",
              color: role === "ADMIN" ? "#fbbf24" : role === "CLIENT" ? "#34d399" : "#38bdf8",
              border: "1px solid #334155",
            }}
          >
            Active Role: {role} {channelHandle ? `(${channelHandle})` : ""}
          </span>
        </div>

        <nav style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, fontSize: 13 }}>
          {/* Public Viewer Routes (Available to USER, CLIENT, ADMIN) */}
          <a href="/" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}>Home Feed</a>
          <a href="/watch/vid_8842" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}>16:9 Watch + AI</a>
          <a href="/shorts" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}>9:16 Shorts</a>
          <a href="/live/live_room_01" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}>Live + Yjs Board</a>

          {/* USER -> CLIENT Upgrade CTA */}
          {role === "USER" && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: "5px 11px",
                borderRadius: 999,
                background: "#34d399",
                color: "#080c14",
                border: "none",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              🚀 Become a Client (Create Channel)
            </button>
          )}

          {/* CLIENT & ADMIN Creator Studio Routes */}
          {(role === "CLIENT" || role === "ADMIN") && (
            <>
              <a href="/studio/upload" style={{ color: "#34d399", textDecoration: "none", fontWeight: 600 }}>Studio Upload</a>
              <a href="/studio/catalog" style={{ color: "#34d399", textDecoration: "none", fontWeight: 600 }}>Product Catalog</a>
              <a href="/studio/developers" style={{ color: "#c084fc", textDecoration: "none", fontWeight: 600 }}>MCP &amp; API Keys</a>
            </>
          )}

          {/* ADMIN Control Plane Route */}
          {role === "ADMIN" && (
            <a
              href="/admin"
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                background: "rgba(251, 191, 36, 0.2)",
                border: "1px solid #fbbf24",
                color: "#fbbf24",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              🛡️ Admin Control Plane
            </a>
          )}

          {/* Developer Role Switcher Dropdown (Default: USER) */}
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", marginLeft: 6 }}>
            <span>Switch Role:</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as PlatformRole)}
              style={{
                background: "#1e293b",
                color: "#f8fafc",
                border: "1px solid #38bdf8",
                borderRadius: 8,
                padding: "5px 9px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <option value="USER">👤 USER (Default Viewer)</option>
              <option value="CLIENT">🎬 CLIENT (Channel Creator)</option>
              <option value="ADMIN">🛡️ ADMIN (Platform &amp; Access Manager)</option>
            </select>
          </label>
        </nav>
      </header>

      {/* Become a Client (Create Channel) Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(8, 12, 20, 0.82)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
          }}
        >
          <div style={{ width: 420, background: "#0f172a", border: "1px solid #34d399", borderRadius: 14, padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>🚀 Become a Client • Create Your Creator Channel</h3>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>
              Creating a channel upgrades your account from <code>USER</code> to <code>CLIENT</code>, unlocking 10MB S3 Multipart video uploads, YOLOv11+CLIP Shoppable Product Catalogs, Scoped API Keys, and Headless MCP tools.
            </p>
            <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Channel Handle:</label>
            <input
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              style={{ width: "100%", padding: 9, borderRadius: 8, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", marginBottom: 14 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: "8px 12px", borderRadius: 8, background: "#1e293b", color: "#cbd5e1", border: "1px solid #334155", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChannel}
                style={{ padding: "8px 14px", borderRadius: 8, background: "#34d399", color: "#080c14", border: "none", fontWeight: 700, cursor: "pointer" }}
              >
                Create Channel &amp; Switch to CLIENT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

