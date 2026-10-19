"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ADMIN_EMAIL, usePlatformRole } from "../lib/role-context";

export function RoleNavigationHeader() {
  const { user, role, channelHandle, becomeClient, logout } = usePlatformRole();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [newHandle, setNewHandle] = useState("");

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
    logout();
    router.push("/login");
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" style={{ color: "#f8fafc", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
            ACN-VTSP
          </Link>
          {user.isAuthenticated ? (
            <span
              style={{
                padding: "3px 10px",
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
              {user.email} • {role} {channelHandle ? `(${channelHandle})` : ""}
            </span>
          ) : (
            <span
              style={{
                padding: "3px 9px",
                borderRadius: 999,
                fontSize: 11,
                fontFamily: "monospace",
                background: "#1e293b",
                color: "#94a3b8",
                border: "1px solid #334155",
              }}
            >
              Guest Viewer
            </span>
          )}
        </div>

        <nav style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, fontSize: 13 }}>
          {/* Public Viewer Routes */}
          <Link href="/" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}>Home Feed</Link>
          <Link href="/watch/vid_8842" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}>16:9 Watch + AI</Link>
          <Link href="/shorts" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}>9:16 Shorts</Link>
          <Link href="/live/live_room_01" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}>Live + Yjs Board</Link>

          {/* USER -> CLIENT Upgrade CTA (Shown to signed-in USER accounts) */}
          {user.isAuthenticated && role === "USER" && (
            <button
              onClick={handleOpenBecomeClient}
              style={{
                padding: "5px 12px",
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
          {user.isAuthenticated && (role === "CLIENT" || role === "ADMIN") && (
            <>
              <Link href="/studio/upload" style={{ color: "#34d399", textDecoration: "none", fontWeight: 600 }}>Studio Upload</Link>
              <Link href="/studio/catalog" style={{ color: "#34d399", textDecoration: "none", fontWeight: 600 }}>Product Catalog</Link>
              <Link href="/studio/developers" style={{ color: "#c084fc", textDecoration: "none", fontWeight: 600 }}>MCP &amp; API Keys</Link>
            </>
          )}

          {/* ADMIN Control Plane Route (Only unlocked when signed in as suyashskotkar@gmail.com) */}
          {user.isAuthenticated && role === "ADMIN" && user.email.toLowerCase() === ADMIN_EMAIL && (
            <Link
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
            </Link>
          )}

          {/* Auth Buttons: Sign In / Sign Up when logged out, or Logout when logged in */}
          {!user.isAuthenticated ? (
            <Link
              href="/login"
              style={{
                padding: "6px 13px",
                borderRadius: 8,
                background: "#38bdf8",
                color: "#080c14",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Sign In / Sign Up
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                background: "#1e293b",
                border: "1px solid #475569",
                color: "#f8fafc",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          )}
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
              Creating a channel permanently upgrades <strong>{user.email}</strong> from <code>USER</code> to <code>CLIENT</code>. Whenever you sign in with <strong>{user.email}</strong> in the future, your <code>CLIENT</code> channel and studio tools will be loaded automatically.
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
    </>
  );
}
