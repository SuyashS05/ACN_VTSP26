"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  usePlatformRole,
  type ContentType,
  type ContentVisibility,
} from "../../../lib/role-context";

const BANNER_THEMES = [
  { label: "Ocean Cyan", value: "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)" },
  { label: "Nebula Purple", value: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)" },
  { label: "Amber Gold", value: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)" },
  { label: "Midnight Slate", value: "linear-gradient(135deg, #0f172a 0%, #334155 100%)" },
];

export default function UserProfilePage() {
  const {
    user,
    role,
    channelHandle,
    updateUserProfile,
    becomeClient,
    logout,
    contentItems,
    updateContentVisibility,
    deleteContentItem,
  } = usePlatformRole();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"ALL" | ContentType | "SETTINGS">("ALL");
  const [editName, setEditName] = useState(user.name || "");
  const [editHandle, setEditHandle] = useState(channelHandle || `@${(user.email || "user").split("@")[0]}_channel`);
  const [editBio, setEditBio] = useState(user.bio || "");
  const [editBanner, setEditBanner] = useState(user.bannerColor || BANNER_THEMES[0].value);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  if (!user.isAuthenticated) {
    return (
      <div style={{ padding: 36, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "82vh" }}>
        <div style={{ maxWidth: 460, background: "#0f172a", border: "1px solid #334155", borderRadius: 16, padding: 28, textAlign: "center" }}>
          <h2 style={{ marginTop: 0 }}>👤 Sign In to View Your Profile</h2>
          <p style={{ fontSize: 13.5, color: "#94a3b8" }}>
            Sign in or create an account to customize your profile, manage your Creator Channel, and control your uploaded Videos, Reels, Live Streams, and Posts.
          </p>
          <Link
            href="/login"
            style={{ display: "inline-block", marginTop: 12, padding: "10px 18px", borderRadius: 8, background: "#38bdf8", color: "#080c14", fontWeight: 700, textDecoration: "none", fontSize: 13 }}
          >
            Sign In / Create Account
          </Link>
        </div>
      </div>
    );
  }

  const myContent = contentItems.filter(
    (it) =>
      it.ownerEmail.toLowerCase() === user.email.toLowerCase() ||
      (channelHandle && it.channelHandle.toLowerCase() === channelHandle.toLowerCase()) ||
      role === "ADMIN"
  );

  const filteredContent =
    activeTab === "ALL" || activeTab === "SETTINGS"
      ? myContent
      : myContent.filter((it) => it.type === activeTab);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": file.type || "image/png",
          "x-file-name": file.name,
        },
        body: buf,
      });
      if (res.ok) {
        const data = await res.json();
        updateUserProfile({ avatarUrl: data.url });
        setSavedToast("✓ Profile picture updated!");
        setTimeout(() => setSavedToast(null), 2500);
        return;
      }
    } catch {}
    const fallbackUrl = URL.createObjectURL(file);
    updateUserProfile({ avatarUrl: fallbackUrl });
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    updateUserProfile({
      name: editName.trim() || user.name,
      channelHandle: editHandle.trim() || channelHandle || undefined,
      bio: editBio.trim(),
      bannerColor: editBanner,
    });
    setSavedToast("✓ Profile & Channel settings saved!");
    setTimeout(() => setSavedToast(null), 2500);
  }

  return (
    <div style={{ background: "#080c14", color: "#f8fafc", minHeight: "92vh", paddingBottom: 48 }}>
      {/* Channel Banner */}
      <div
        style={{
          height: 165,
          background: user.bannerColor || BANNER_THEMES[0].value,
          position: "relative",
          borderBottom: "1px solid #1e293b",
        }}
      />

      {/* Profile Header Section */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 16,
            marginTop: -42,
            marginBottom: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18, flexWrap: "wrap" }}>
            {/* Avatar with Upload Overlay */}
            <div style={{ position: "relative" }}>
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "4px solid #080c14",
                    background: "#0f172a",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    background: "#38bdf8",
                    color: "#080c14",
                    fontSize: 36,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "4px solid #080c14",
                  }}
                >
                  {(user.name || user.email || "U").charAt(0).toUpperCase()}
                </div>
              )}

              <label
                title="Upload Profile Photo from Device"
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "#0f172a",
                  border: "1px solid #38bdf8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                📷
                <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />
              </label>
            </div>

            <div style={{ paddingBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: 24 }}>{user.name || user.email.split("@")[0]}</h1>
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
                  {role}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                <strong style={{ color: "#38bdf8" }}>{channelHandle || "(No Channel Yet)"}</strong> • {user.email} • {myContent.length} Published Items
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#cbd5e1", maxWidth: 620 }}>
                {user.bio || "Creator & Viewer on ACN-VTSP Cloud-Native Streaming Platform."}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {role === "USER" ? (
              <button
                type="button"
                onClick={() => becomeClient(`@${user.email.split("@")[0]}_channel`)}
                style={{ padding: "9px 15px", borderRadius: 999, background: "#34d399", color: "#080c14", border: "none", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}
              >
                🚀 Become a Client (Create Channel)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/studio/upload")}
                style={{ padding: "9px 15px", borderRadius: 999, background: "#38bdf8", color: "#080c14", border: "none", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}
              >
                ➕ Upload in Creator Studio
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setEditName(user.name || "");
                setEditHandle(channelHandle || `@${user.email.split("@")[0]}_channel`);
                setEditBio(user.bio || "");
                setEditBanner(user.bannerColor || BANNER_THEMES[0].value);
                setActiveTab("SETTINGS");
              }}
              style={{ padding: "9px 15px", borderRadius: 999, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}
            >
              ✏️ Customize Profile
            </button>

            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              style={{ padding: "9px 15px", borderRadius: 999, background: "rgba(251, 113, 133, 0.16)", color: "#fb7185", border: "1px solid #fb7185", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}
            >
              Logout
            </button>
          </div>
        </div>

        {savedToast && (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(52, 211, 153, 0.16)", border: "1px solid #34d399", color: "#a7f3d0", fontSize: 12.5 }}>
            {savedToast}
          </div>
        )}

        {/* Profile Navigation Tabs */}
        <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #1e293b", paddingBottom: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {(
            [
              { id: "ALL", label: `All Content (${myContent.length})` },
              { id: "VIDEO", label: "🎬 16:9 Videos" },
              { id: "REEL", label: "📱 9:16 Reels" },
              { id: "LIVE", label: "🔴 Live Streams" },
              { id: "POST", label: "🖼️ Image Posts" },
              { id: "SETTINGS", label: "⚙️ Edit Profile & Channel" },
            ] as const
          ).map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: active ? "1px solid #38bdf8" : "1px solid transparent",
                  background: active ? "rgba(56, 189, 248, 0.16)" : "#0f172a",
                  color: active ? "#38bdf8" : "#cbd5e1",
                  fontWeight: active ? 700 : 500,
                  fontSize: 12.5,
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab View: Edit Profile & Channel Settings */}
        {activeTab === "SETTINGS" ? (
          <form
            onSubmit={handleSaveProfile}
            style={{ maxWidth: 560, background: "#0f172a", border: "1px solid #334155", borderRadius: 14, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}
          >
            <h3 style={{ margin: 0 }}>✏️ Edit Profile &amp; Creator Channel Settings</h3>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 5 }}>Display Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 5 }}>Channel Handle</label>
              <input
                type="text"
                value={editHandle}
                onChange={(e) => setEditHandle(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 5 }}>Channel Bio / About</label>
              <textarea
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", fontFamily: "inherit" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>Channel Banner Theme</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {BANNER_THEMES.map((theme) => (
                  <button
                    key={theme.label}
                    type="button"
                    onClick={() => setEditBanner(theme.value)}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      background: theme.value,
                      color: "#fff",
                      border: editBanner === theme.value ? "2px solid #fff" : "1px solid #334155",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                      textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                    }}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              style={{ padding: "11px 16px", borderRadius: 8, background: "#38bdf8", color: "#080c14", border: "none", fontWeight: 700, cursor: "pointer", marginTop: 4 }}
            >
              Save Profile Changes
            </button>
          </form>
        ) : (
          /* Tab View: User's Videos, Reels, Live Streams & Posts Grid */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
            {filteredContent.map((item) => (
              <div
                key={item.id}
                style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 8, overflow: "hidden", background: "#000" }}>
                  {item.type === "POST" ? (
                    <img
                      src={item.postImageUrl || item.posterUrl}
                      alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <video
                      src={item.streamUrl}
                      poster={item.posterUrl}
                      muted
                      loop
                      playsInline
                      controls
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </div>

                <div>
                  <strong style={{ fontSize: 13.5 }}>{item.title}</strong>
                  <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 3 }}>
                    {item.type} • {item.views} • {item.uploadedAt}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: "auto" }}>
                  <select
                    value={item.visibility}
                    onChange={(e) => updateContentVisibility(item.id, e.target.value as ContentVisibility)}
                    style={{ padding: "5px 8px", borderRadius: 6, background: "#090d16", color: "#38bdf8", border: "1px solid #334155", fontSize: 11.5, fontWeight: 700 }}
                  >
                    <option value="PUBLIC">🌍 Public</option>
                    <option value="MEMBERS_ONLY">⭐ Members Only</option>
                    <option value="PRIVATE">🔒 Private</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => deleteContentItem(item.id)}
                    style={{ padding: "5px 10px", borderRadius: 6, background: "rgba(251, 113, 133, 0.16)", color: "#fb7185", border: "1px solid #fb7185", fontSize: 11, cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

