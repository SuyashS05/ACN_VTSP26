"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_EMAIL, usePlatformRole } from "../lib/role-context";

export function RoleNavigationHeader({ children }: { children?: React.ReactNode }) {
  const { user, role, channelHandle, sidebarOpen, setSidebarOpen, becomeClient, logout, contentItems } =
    usePlatformRole();
  const router = useRouter();
  const pathname = usePathname();

  const [showModal, setShowModal] = useState(false);
  const [newHandle, setNewHandle] = useState("");
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  function handleOpenBecomeClient() {
    if (!user.isAuthenticated) {
      router.push("/login");
      return;
    }
    const defaultHandle = `@${user.email.split("@")[0]}_channel`;
    setNewHandle(defaultHandle);
    setShowModal(true);
  }

  function handleCreateChannel() {
    const res = becomeClient(newHandle || `@${user.email.split("@")[0]}_channel`);
    if (res.ok) {
      setShowModal(false);
      router.push("/studio/upload");
    }
  }

  function handleLogout() {
    setProfileMenuOpen(false);
    logout();
    router.push("/login");
  }

  function jumpToStudioMode(mode: "VIDEO" | "REEL" | "LIVE" | "POST") {
    setCreateMenuOpen(false);
    if (!user.isAuthenticated) {
      router.push("/login");
      return;
    }
    if (role === "USER") {
      handleOpenBecomeClient();
      return;
    }
    router.push(`/studio/upload?type=${mode}`);
  }

  const navLinkStyle = (href: string) => {
    const active = pathname === href || (href !== "/" && pathname?.startsWith(href.split("?")[0]));
    return {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: sidebarOpen ? "9px 12px" : "10px 0",
      justifyContent: sidebarOpen ? "flex-start" : "center",
      borderRadius: 10,
      background: active ? "rgba(56, 189, 248, 0.16)" : "transparent",
      color: active ? "#38bdf8" : "#cbd5e1",
      textDecoration: "none",
      fontWeight: active ? 700 : 500,
      fontSize: 13,
      border: active ? "1px solid rgba(56, 189, 248, 0.35)" : "1px solid transparent",
      transition: "background 0.15s ease",
    } as React.CSSProperties;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#080c14", color: "#f8fafc" }}>
      {/* Top YouTube-Style Header Bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          padding: "10px 20px",
          background: "#0f172a",
          borderBottom: "1px solid #1e293b",
          position: "sticky",
          top: 0,
          zIndex: 60,
          height: 58,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            title="Toggle Sidebar"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#f8fafc",
              fontSize: 17,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ☰
          </button>

          <Link href="/" style={{ color: "#f8fafc", textDecoration: "none", fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
            <span>ACN-VTSP</span>
          </Link>
        </div>

        {/* Right Header Actions: + Create Menu, Become a Client, Profile Avatar Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
          {/* + Create Dropdown Button */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => {
                setCreateMenuOpen((prev) => !prev);
                setProfileMenuOpen(false);
              }}
              style={{
                padding: "6px 13px",
                borderRadius: 999,
                background: "#1e293b",
                border: "1px solid #38bdf8",
                color: "#f8fafc",
                fontWeight: 700,
                fontSize: 12.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>➕ Create</span>
              <span style={{ fontSize: 10 }}>▾</span>
            </button>

            {createMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: 42,
                  right: 0,
                  width: 230,
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 12,
                  padding: 8,
                  zIndex: 80,
                  boxShadow: "0 14px 32px rgba(0,0,0,0.65)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => jumpToStudioMode("VIDEO")}
                  style={{ padding: "8px 10px", borderRadius: 8, background: "transparent", border: "none", color: "#f8fafc", textAlign: "left", cursor: "pointer", fontSize: 12.5 }}
                >
                  🎬 Upload 16:9 Video
                </button>
                <button
                  type="button"
                  onClick={() => jumpToStudioMode("REEL")}
                  style={{ padding: "8px 10px", borderRadius: 8, background: "transparent", border: "none", color: "#f8fafc", textAlign: "left", cursor: "pointer", fontSize: 12.5 }}
                >
                  📱 Upload 9:16 Reel / Short
                </button>
                <button
                  type="button"
                  onClick={() => jumpToStudioMode("LIVE")}
                  style={{ padding: "8px 10px", borderRadius: 8, background: "transparent", border: "none", color: "#fbbf24", textAlign: "left", cursor: "pointer", fontSize: 12.5 }}
                >
                  🔴 Go Live &amp; Viewer Permissions
                </button>
                <button
                  type="button"
                  onClick={() => jumpToStudioMode("POST")}
                  style={{ padding: "8px 10px", borderRadius: 8, background: "transparent", border: "none", color: "#34d399", textAlign: "left", cursor: "pointer", fontSize: 12.5 }}
                >
                  🖼️ Create Image Post
                </button>
              </div>
            )}
          </div>

          {user.isAuthenticated && role === "USER" && (
            <button
              type="button"
              onClick={handleOpenBecomeClient}
              style={{
                padding: "6px 13px",
                borderRadius: 999,
                background: "#34d399",
                color: "#080c14",
                border: "none",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              🚀 Become a Client
            </button>
          )}

          {!user.isAuthenticated ? (
            <Link
              href="/login"
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                background: "#38bdf8",
                color: "#080c14",
                textDecoration: "none",
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              Sign In / Sign Up
            </Link>
          ) : (
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen((prev) => !prev);
                  setCreateMenuOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 10px 4px 5px",
                  borderRadius: 999,
                  background: "#1e293b",
                  border: "1px solid #334155",
                  color: "#f8fafc",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: role === "ADMIN" ? "#fbbf24" : role === "CLIENT" ? "#34d399" : "#38bdf8",
                      color: "#080c14",
                      fontWeight: 800,
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </span>
                )}
                <span style={{ fontWeight: 700 }}>{user.name || user.email.split("@")[0]}</span>
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    background: "rgba(56, 189, 248, 0.16)",
                    color: role === "ADMIN" ? "#fbbf24" : role === "CLIENT" ? "#34d399" : "#38bdf8",
                  }}
                >
                  {role}
                </span>
              </button>

              {profileMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: 42,
                    right: 0,
                    width: 245,
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 12,
                    padding: 10,
                    zIndex: 85,
                    boxShadow: "0 14px 32px rgba(0,0,0,0.7)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div style={{ padding: "6px 8px 8px", borderBottom: "1px solid #1e293b", marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{user.name || user.email}</div>
                    <div style={{ fontSize: 11.5, color: "#38bdf8" }}>{channelHandle || user.email}</div>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    style={{ padding: "8px 10px", borderRadius: 8, color: "#f8fafc", textDecoration: "none", fontSize: 12.5, fontWeight: 600 }}
                  >
                    👤 My Profile &amp; Channel
                  </Link>
                  {(role === "CLIENT" || role === "ADMIN") && (
                    <Link
                      href="/studio/upload"
                      onClick={() => setProfileMenuOpen(false)}
                      style={{ padding: "8px 10px", borderRadius: 8, color: "#34d399", textDecoration: "none", fontSize: 12.5, fontWeight: 600 }}
                    >
                      📤 Creator Studio
                    </Link>
                  )}
                  {role === "ADMIN" && user.email.toLowerCase() === ADMIN_EMAIL && (
                    <Link
                      href="/admin"
                      onClick={() => setProfileMenuOpen(false)}
                      style={{ padding: "8px 10px", borderRadius: 8, color: "#fbbf24", textDecoration: "none", fontSize: 12.5, fontWeight: 600 }}
                    >
                      🛡️ Admin Control Plane
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(251, 113, 133, 0.14)", border: "none", color: "#fb7185", textAlign: "left", cursor: "pointer", fontSize: 12.5, fontWeight: 600, marginTop: 4 }}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Body with Left Collapsible Sidebar + Content Viewport */}
      <div style={{ display: "flex", flex: 1, minHeight: "calc(100vh - 58px)" }}>
        <aside
          style={{
            width: sidebarOpen ? 245 : 68,
            flexShrink: 0,
            background: "#0b111e",
            borderRight: "1px solid #1e293b",
            padding: sidebarOpen ? "14px 12px" : "14px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            transition: "width 0.2s ease",
            overflowY: "auto",
          }}
        >
          {/* Section 1: Explore & Watch */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sidebarOpen && (
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", padding: "0 8px 4px", letterSpacing: 0.6 }}>
                EXPLORE &amp; WATCH
              </div>
            )}
            <Link href="/" style={navLinkStyle("/")}>
              <span>🏠</span>
              {sidebarOpen && <span>Home Feed ({contentItems.length})</span>}
            </Link>
            <Link href="/shorts" style={navLinkStyle("/shorts")}>
              <span>📱</span>
              {sidebarOpen && <span>9:16 Reels &amp; Shorts</span>}
            </Link>
            <Link href="/live/live_room_01" style={navLinkStyle("/live")}>
              <span>🔴</span>
              {sidebarOpen && <span>Live Stream + Yjs Board</span>}
            </Link>
            <Link href="/watch/vid_8842" style={navLinkStyle("/watch")}>
              <span>🎬</span>
              {sidebarOpen && <span>16:9 Watch + AI RAG</span>}
            </Link>
            <Link href="/profile" style={navLinkStyle("/profile")}>
              <span>👤</span>
              {sidebarOpen && <span>My Profile &amp; Channel</span>}
            </Link>
          </div>

          {/* Section 2: Creator Studio Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, borderTop: "1px solid #1e293b", paddingTop: 12 }}>
            {sidebarOpen && (
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#34d399", padding: "0 8px 4px", letterSpacing: 0.6 }}>
                CREATOR STUDIO {role === "CLIENT" || role === "ADMIN" ? "✓" : "(CLIENT)"}
              </div>
            )}

            {user.isAuthenticated && (role === "CLIENT" || role === "ADMIN") ? (
              <>
                <Link href="/studio/upload?type=VIDEO" style={navLinkStyle("/studio/upload")}>
                  <span>📤</span>
                  {sidebarOpen && <span>Studio Upload &amp; Manage</span>}
                </Link>
                {sidebarOpen && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "4px 4px 6px" }}>
                    <button
                      type="button"
                      onClick={() => jumpToStudioMode("VIDEO")}
                      style={{ padding: "6px 8px", borderRadius: 8, background: "#111927", border: "1px solid #1e293b", color: "#38bdf8", fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                    >
                      + 🎬 Video
                    </button>
                    <button
                      type="button"
                      onClick={() => jumpToStudioMode("REEL")}
                      style={{ padding: "6px 8px", borderRadius: 8, background: "#111927", border: "1px solid #1e293b", color: "#c084fc", fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                    >
                      + 📱 Reel
                    </button>
                    <button
                      type="button"
                      onClick={() => jumpToStudioMode("LIVE")}
                      style={{ padding: "6px 8px", borderRadius: 8, background: "#111927", border: "1px solid #1e293b", color: "#fbbf24", fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                    >
                      + 🔴 Live
                    </button>
                    <button
                      type="button"
                      onClick={() => jumpToStudioMode("POST")}
                      style={{ padding: "6px 8px", borderRadius: 8, background: "#111927", border: "1px solid #1e293b", color: "#34d399", fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                    >
                      + 🖼️ Post
                    </button>
                  </div>
                )}
                <Link href="/studio/catalog" style={navLinkStyle("/studio/catalog")}>
                  <span>🛒</span>
                  {sidebarOpen && <span>Shoppable Catalog</span>}
                </Link>
                <Link href="/studio/developers" style={navLinkStyle("/studio/developers")}>
                  <span>🔑</span>
                  {sidebarOpen && <span>MCP &amp; API Keys</span>}
                </Link>
              </>
            ) : (
              sidebarOpen && (
                <div style={{ padding: 10, borderRadius: 10, background: "#0f172a", border: "1px solid #1e293b", fontSize: 12 }}>
                  <div style={{ color: "#94a3b8", marginBottom: 8 }}>
                    Create a Channel to upload Videos, 9:16 Reels, Live Streams &amp; Image Posts from your device.
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenBecomeClient}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 8, background: "#34d399", color: "#080c14", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                  >
                    🚀 Become a Client
                  </button>
                </div>
              )
            )}
          </div>

          {/* Section 3: Platform Admin Control Plane (suyashskotkar@gmail.com) */}
          {user.isAuthenticated && role === "ADMIN" && user.email.toLowerCase() === ADMIN_EMAIL && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, borderTop: "1px solid #1e293b", paddingTop: 12 }}>
              {sidebarOpen && (
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#fbbf24", padding: "0 8px 4px", letterSpacing: 0.6 }}>
                  ADMINISTRATION
                </div>
              )}
              <Link href="/admin" style={navLinkStyle("/admin")}>
                <span>🛡️</span>
                {sidebarOpen && <span style={{ color: "#fbbf24", fontWeight: 700 }}>Admin Control Plane</span>}
              </Link>
            </div>
          )}
        </aside>

        {/* Main Route Content */}
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </div>

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
              Creating a channel permanently upgrades <strong>{user.email}</strong> from <code>USER</code> to <code>CLIENT</code>, unlocking Device Video/Reel/Post Uploads, Live Viewer Permission Controls, Shoppable Catalogs, and MCP API Keys.
            </p>
            <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Channel Handle:</label>
            <input
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              placeholder="@my_channel"
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
                Create Channel &amp; Upgrade to CLIENT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
