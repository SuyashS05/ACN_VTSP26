"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  usePlatformRole,
  type ContentType,
  type ContentVisibility,
  type LiveViewerPermissions,
} from "../../../../lib/role-context";

export default function StudioMultipartUploadPage() {
  const {
    user,
    role,
    channelHandle,
    becomeClient,
    contentItems,
    addContentItem,
    updateContentVisibility,
    updateLivePermissions,
    deleteContentItem,
  } = usePlatformRole();
  const router = useRouter();

  const [activeType, setActiveType] = useState<ContentType>("VIDEO");
  const [visibility, setVisibility] = useState<ContentVisibility>("PUBLIC");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("CMAF & Transcoding");
  const [defaultQuality, setDefaultQuality] = useState<"1080p" | "720p" | "360p">("1080p");

  // Device file upload states
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | null>(null);
  const [selectedThumbFile, setSelectedThumbFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string>("");
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Granular Live Viewer Permissions
  const [livePerms, setLivePerms] = useState<LiveViewerPermissions>({
    chatMode: "EVERYONE",
    whiteboardMode: "ALL_VIEWERS",
    allowMicRaiseHand: true,
    allowShoppableOverlay: true,
    allowRecordingDvr: true,
  });

  // Read ?type=VIDEO|REEL|LIVE|POST from URL if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("type") as ContentType | null;
      if (t && ["VIDEO", "REEL", "LIVE", "POST"].includes(t)) {
        setActiveType(t);
        if (t === "REEL") setCategory("9:16 Shorts");
        if (t === "LIVE") setCategory("Live WebRTC & Yjs");
        if (t === "POST") setCategory("Community Posts");
      }
    }
  }, []);

  function handleMediaFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedMediaFile(file);
    const localUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(localUrl);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  }

  function handleThumbFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedThumbFile(file);
    const localUrl = URL.createObjectURL(file);
    setThumbPreviewUrl(localUrl);
  }

  async function uploadFileToLocalServer(file: File): Promise<string> {
    try {
      const buf = await file.arrayBuffer();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "x-file-name": file.name,
        },
        body: buf,
      });
      if (res.ok) {
        const data = await res.json();
        return data.url as string;
      }
    } catch {}
    return URL.createObjectURL(file);
  }

  async function handlePublishContent(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(25);
    setStatusBanner(null);

    let finalStreamUrl =
      activeType === "REEL" ? "/sd.mp4" : "/sample-3.mp4";
    let finalPosterUrl =
      activeType === "REEL"
        ? "/out_cmaf/videos/vid_9104/thumbnails/poster.webp"
        : "/out_cmaf/videos/vid_8842/thumbnails/poster.webp";

    if (selectedMediaFile) {
      setUploadProgress(55);
      const uploadedUrl = await uploadFileToLocalServer(selectedMediaFile);
      finalStreamUrl = uploadedUrl;
      if (activeType === "POST") {
        finalPosterUrl = uploadedUrl;
      }
    }

    if (selectedThumbFile) {
      setUploadProgress(80);
      finalPosterUrl = await uploadFileToLocalServer(selectedThumbFile);
    }

    setUploadProgress(100);

    const created = addContentItem({
      watchId: activeType === "LIVE" ? "live_room_01" : activeType === "REEL" ? "vid_9104" : "vid_8842",
      type: activeType,
      visibility,
      title:
        title.trim() ||
        (activeType === "LIVE"
          ? "🔴 Live Interactive Session"
          : activeType === "POST"
          ? "Creator Community Image Post"
          : "New Studio Upload"),
      description:
        description.trim() ||
        `Published via Creator Studio (${activeType} • ${visibility})`,
      channelName: user.name || user.email.split("@")[0] || "Creator Studio",
      channelHandle: channelHandle || `@${(user.email || "creator").split("@")[0]}`,
      ownerEmail: user.email || "creator@acn-vtsp.io",
      avatarColor:
        activeType === "LIVE"
          ? "#fbbf24"
          : activeType === "REEL"
          ? "#c084fc"
          : activeType === "POST"
          ? "#34d399"
          : "#38bdf8",
      duration: activeType === "LIVE" ? "LIVE" : activeType === "POST" ? "POST" : "0:30",
      category,
      streamUrl: finalStreamUrl,
      posterUrl: finalPosterUrl,
      postImageUrl: activeType === "POST" ? finalPosterUrl : undefined,
      defaultQuality,
      aiBadges:
        activeType === "LIVE"
          ? [`Chat: ${livePerms.chatMode}`, `Board: ${livePerms.whiteboardMode}`]
          : activeType === "REEL"
          ? ["9:16 Reel", `${defaultQuality} CMAF`]
          : activeType === "POST"
          ? ["Image Post", visibility]
          : [`${defaultQuality} CMAF`, visibility, "Whisper AI"],
      livePermissions: activeType === "LIVE" ? livePerms : undefined,
    });

    setUploading(false);
    setStatusBanner(
      `✓ Published "${created.title}" (${created.type} • ${created.visibility}) to the Platform Feed!`
    );
    setTitle("");
    setDescription("");
    setSelectedMediaFile(null);
    setSelectedThumbFile(null);
  }

  // Guard: If Guest or USER without a channel, prompt them to sign in or upgrade to CLIENT
  if (!user.isAuthenticated) {
    return (
      <div style={{ padding: 32, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div style={{ maxWidth: 460, background: "#0f172a", border: "1px solid #334155", borderRadius: 16, padding: 26, textAlign: "center" }}>
          <h2 style={{ marginTop: 0 }}>🔐 Sign In to Access Creator Studio</h2>
          <p style={{ fontSize: 13.5, color: "#94a3b8" }}>
            Please sign in with your account and create a Creator Channel to upload Videos, 9:16 Reels, Live Streams, and Image Posts.
          </p>
          <Link
            href="/login"
            style={{ display: "inline-block", marginTop: 12, padding: "10px 18px", borderRadius: 8, background: "#38bdf8", color: "#080c14", fontWeight: 700, textDecoration: "none", fontSize: 13 }}
          >
            Go to Sign In / Sign Up
          </Link>
        </div>
      </div>
    );
  }

  if (role === "USER") {
    return (
      <div style={{ padding: 32, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div style={{ maxWidth: 480, background: "#0f172a", border: "1px solid #34d399", borderRadius: 16, padding: 26, textAlign: "center" }}>
          <h2 style={{ marginTop: 0 }}>🚀 Upgrade to Client Creator Studio</h2>
          <p style={{ fontSize: 13.5, color: "#94a3b8" }}>
            Your account (<strong>{user.email}</strong>) is currently a <code>USER</code> viewer. Click below to create your channel and unlock multi-format device uploads (Videos, Reels, Live Streams &amp; Image Posts).
          </p>
          <button
            type="button"
            onClick={() => becomeClient(`@${user.email.split("@")[0]}_channel`)}
            style={{ marginTop: 12, padding: "10px 18px", borderRadius: 8, background: "#34d399", color: "#080c14", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            🚀 Activate Creator Channel (@{user.email.split("@")[0]}_channel)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "22px 26px 48px", background: "#080c14", color: "#f8fafc", minHeight: "92vh" }}>
      {/* Studio Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>
            🎬 Creator Studio • Multi-Format Content &amp; Live Permission Hub
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
            Channel: <strong style={{ color: "#34d399" }}>{channelHandle || `@${user.email.split("@")[0]}`}</strong> • Upload from your device, set visibility (<code>Public</code> / <code>Members Only</code> / <code>Private</code>), and configure Live Viewer Permissions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/")}
          style={{ padding: "8px 14px", borderRadius: 8, background: "#1e293b", border: "1px solid #38bdf8", color: "#38bdf8", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}
        >
          🏠 View Live on Home Feed →
        </button>
      </div>

      {/* 4 Content Creation Mode Selector Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginBottom: 22 }}>
        {(
          [
            { id: "VIDEO", icon: "🎬", title: "16:9 Video (VOD)", sub: "Upload .mp4/.webm + 1080p CMAF", color: "#38bdf8" },
            { id: "REEL", icon: "📱", title: "9:16 Vertical Reel", sub: "Upload short clip for Reels feed", color: "#c084fc" },
            { id: "LIVE", icon: "🔴", title: "Live Stream + Permissions", sub: "WebRTC SFU + Chat/Board access", color: "#fbbf24" },
            { id: "POST", icon: "🖼️", title: "Community Image Post", sub: "Upload photo + caption from device", color: "#34d399" },
          ] as const
        ).map((tab) => {
          const active = activeType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveType(tab.id);
                setStatusBanner(null);
                if (tab.id === "REEL") setCategory("9:16 Shorts");
                else if (tab.id === "LIVE") setCategory("Live WebRTC & Yjs");
                else if (tab.id === "POST") setCategory("Community Posts");
                else setCategory("CMAF & Transcoding");
              }}
              style={{
                padding: 14,
                borderRadius: 12,
                background: active ? "rgba(56, 189, 248, 0.12)" : "#0f172a",
                border: active ? `2px solid ${tab.color}` : "1px solid #1e293b",
                color: "#f8fafc",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: active ? tab.color : "#f8fafc" }}>
                {tab.icon} {tab.title}
              </div>
              <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 4 }}>{tab.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Creation Form + Device File Picker + Visibility & Live Permissions */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(300px, 1fr)", gap: 20, marginBottom: 28 }}>
        <form
          onSubmit={handlePublishContent}
          style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}
        >
          <h3 style={{ margin: 0, fontSize: 16 }}>
            {activeType === "VIDEO" && "🎬 Upload 16:9 Video from Device"}
            {activeType === "REEL" && "📱 Upload 9:16 Vertical Reel from Device"}
            {activeType === "LIVE" && "🔴 Configure Live Stream & Viewer Permissions"}
            {activeType === "POST" && "🖼️ Upload Community Image Post from Device"}
          </h3>

          {/* Title & Description */}
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 5 }}>
              {activeType === "POST" ? "Post Headline / Title" : "Title"}
            </label>
            <input
              type="text"
              required
              placeholder={
                activeType === "VIDEO"
                  ? "e.g. Distributed Cloud Transcoding Deep Dive"
                  : activeType === "REEL"
                  ? "e.g. 60-Second System Design Breakdown #shorts"
                  : activeType === "LIVE"
                  ? "e.g. 🔴 Live System Architecture Q&A + Whiteboard"
                  : "e.g. Behind the scenes of our new GPU transcoding cluster!"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 8, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 5 }}>
              {activeType === "POST" ? "Post Caption & Details" : "Description"}
            </label>
            <textarea
              rows={3}
              placeholder="Add description, timestamps, or links..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 8, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", fontFamily: "inherit" }}
            />
          </div>

          {/* Visibility Control (Public / Members Only / Private) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {(
              [
                { id: "PUBLIC", label: "🌍 Public", desc: "Visible to everyone on Home Feed" },
                { id: "MEMBERS_ONLY", label: "⭐ Members Only", desc: "Only signed-in members can watch" },
                { id: "PRIVATE", label: "🔒 Private", desc: "Only visible to you & Admin" },
              ] as const
            ).map((vis) => {
              const selected = visibility === vis.id;
              return (
                <button
                  key={vis.id}
                  type="button"
                  onClick={() => setVisibility(vis.id)}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: selected ? "2px solid #34d399" : "1px solid #334155",
                    background: selected ? "rgba(52, 211, 153, 0.14)" : "#090d16",
                    color: "#f8fafc",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: selected ? "#34d399" : "#f8fafc" }}>{vis.label}</div>
                  <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>{vis.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Device File Upload Input for VIDEO, REEL, or POST */}
          <div style={{ display: "grid", gridTemplateColumns: activeType === "POST" ? "1fr" : "1fr 1fr", gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 10, background: "#090d16", border: "1px dashed #38bdf8" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#38bdf8", marginBottom: 6 }}>
                {activeType === "POST"
                  ? "📁 Select Image from Device (.png, .jpg, .webp)"
                  : activeType === "REEL"
                  ? "📁 Select 9:16 Video from Device (.mp4, .webm)"
                  : "📁 Select Video File from Device (.mp4, .webm, .mov)"}
              </label>
              <input
                type="file"
                accept={activeType === "POST" ? "image/*" : "video/*"}
                onChange={handleMediaFileChange}
                style={{ width: "100%", fontSize: 11.5 }}
              />
              {selectedMediaFile && (
                <div style={{ fontSize: 11, color: "#34d399", marginTop: 6 }}>
                  ✓ Selected: {selectedMediaFile.name} ({(selectedMediaFile.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              )}
            </div>

            {activeType !== "POST" && (
              <div style={{ padding: 12, borderRadius: 10, background: "#090d16", border: "1px dashed #94a3b8" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                  🖼️ Custom Thumbnail Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbFileChange}
                  style={{ width: "100%", fontSize: 11.5 }}
                />
                {selectedThumbFile && (
                  <div style={{ fontSize: 11, color: "#34d399", marginTop: 6 }}>
                    ✓ Thumbnail: {selectedThumbFile.name}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category & Default Quality Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 4 }}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: "100%", padding: 9, borderRadius: 8, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
              >
                <option value="CMAF & Transcoding">CMAF &amp; Transcoding</option>
                <option value="AI & Video RAG">AI &amp; Video RAG</option>
                <option value="Live WebRTC & Yjs">Live WebRTC &amp; Yjs</option>
                <option value="Shoppable Video">Shoppable Video</option>
                <option value="9:16 Shorts">9:16 Shorts</option>
                <option value="Community Posts">Community Posts</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 4 }}>Target CMAF Quality Rung</label>
              <select
                value={defaultQuality}
                onChange={(e) => setDefaultQuality(e.target.value as "1080p" | "720p" | "360p")}
                style={{ width: "100%", padding: 9, borderRadius: 8, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
              >
                <option value="1080p">1080p60 HD (AV1 / H.264)</option>
                <option value="720p">720p HD (2.4 Mbps)</option>
                <option value="360p">360p Data Saver</option>
              </select>
            </div>
          </div>

          {/* LIVE STREAMING VIEWER PERMISSION CONTROLS */}
          {activeType === "LIVE" && (
            <div style={{ padding: 14, borderRadius: 12, background: "#090d16", border: "1px solid #fbbf24", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#fbbf24" }}>
                🛡️ Live Stream Viewer Permission Management
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, color: "#94a3b8", marginBottom: 4 }}>
                    Live Chat Access
                  </label>
                  <select
                    value={livePerms.chatMode}
                    onChange={(e) =>
                      setLivePerms((prev) => ({
                        ...prev,
                        chatMode: e.target.value as LiveViewerPermissions["chatMode"],
                      }))
                    }
                    style={{ width: "100%", padding: 8, borderRadius: 8, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", fontSize: 12 }}
                  >
                    <option value="EVERYONE">Everyone (ONNX Moderated)</option>
                    <option value="MEMBERS_ONLY">Members Only</option>
                    <option value="SLOW_MODE_5S">Slow Mode (5s Cooldown)</option>
                    <option value="DISABLED">Chat Disabled</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11.5, color: "#94a3b8", marginBottom: 4 }}>
                    Yjs CRDT Whiteboard Drawing Permission
                  </label>
                  <select
                    value={livePerms.whiteboardMode}
                    onChange={(e) =>
                      setLivePerms((prev) => ({
                        ...prev,
                        whiteboardMode: e.target.value as LiveViewerPermissions["whiteboardMode"],
                      }))
                    }
                    style={{ width: "100%", padding: 8, borderRadius: 8, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", fontSize: 12 }}
                  >
                    <option value="HOST_ONLY">Host Only (Viewers Read-Only)</option>
                    <option value="CO_HOSTS">Host &amp; Approved Co-Hosts</option>
                    <option value="ALL_VIEWERS">All Viewers Can Draw Together</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12, marginTop: 4 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={livePerms.allowMicRaiseHand}
                    onChange={(e) => setLivePerms((prev) => ({ ...prev, allowMicRaiseHand: e.target.checked }))}
                  />
                  <span>Allow Viewers to Raise Hand / Request WebRTC Mic</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={livePerms.allowShoppableOverlay}
                    onChange={(e) => setLivePerms((prev) => ({ ...prev, allowShoppableOverlay: e.target.checked }))}
                  />
                  <span>Enable Shoppable Product Overlay</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={livePerms.allowRecordingDvr}
                    onChange={(e) => setLivePerms((prev) => ({ ...prev, allowRecordingDvr: e.target.checked }))}
                  />
                  <span>Enable Live DVR Replay</span>
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              background: "#38bdf8",
              color: "#080c14",
              border: "none",
              fontWeight: 800,
              fontSize: 13.5,
              cursor: "pointer",
            }}
          >
            {uploading
              ? `Uploading & Packaging (${uploadProgress}%)...`
              : `🚀 Publish ${activeType} (${visibility}) to Platform`}
          </button>

          {statusBanner && (
            <div style={{ padding: 11, borderRadius: 8, background: "rgba(52, 211, 153, 0.16)", border: "1px solid #34d399", color: "#a7f3d0", fontSize: 12.5 }}>
              {statusBanner}
            </div>
          )}
        </form>

        {/* Live Device Upload Preview Card */}
        <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>👁️ Live Studio Preview ({activeType} • {visibility})</h3>
          <div
            style={{
              width: activeType === "REEL" ? 210 : "100%",
              aspectRatio: activeType === "REEL" ? "9 / 16" : "16 / 9",
              margin: "0 auto",
              background: "#000",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #1e293b",
              position: "relative",
            }}
          >
            {activeType === "POST" ? (
              <img
                src={
                  mediaPreviewUrl ||
                  thumbPreviewUrl ||
                  "/out_cmaf/videos/vid_8842/thumbnails/poster_22s.webp"
                }
                alt="Post preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <video
                src={
                  mediaPreviewUrl ||
                  (activeType === "REEL" ? "/sd.mp4" : "/sample-3.mp4")
                }
                poster={
                  thumbPreviewUrl ||
                  (activeType === "REEL"
                    ? "/out_cmaf/videos/vid_9104/thumbnails/poster.webp"
                    : "/out_cmaf/videos/vid_8842/thumbnails/poster.webp")
                }
                controls
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </div>

          <div style={{ fontSize: 12.5, color: "#cbd5e1" }}>
            <div><strong>Title:</strong> {title || "(Untitled Content)"}</div>
            <div style={{ marginTop: 4 }}>
              <strong>Visibility:</strong>{" "}
              <span style={{ color: visibility === "PUBLIC" ? "#34d399" : visibility === "MEMBERS_ONLY" ? "#fbbf24" : "#fb7185", fontWeight: 700 }}>
                {visibility}
              </span>
            </div>
            {activeType === "LIVE" && (
              <div style={{ marginTop: 6, padding: 8, borderRadius: 8, background: "#090d16", fontSize: 11.5, color: "#94a3b8" }}>
                <div>• Chat: <strong style={{ color: "#38bdf8" }}>{livePerms.chatMode}</strong></div>
                <div>• Whiteboard: <strong style={{ color: "#c084fc" }}>{livePerms.whiteboardMode}</strong></div>
                <div>• Viewer Mic Raise Hand: <strong>{livePerms.allowMicRaiseHand ? "Allowed" : "Blocked"}</strong></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content & Visibility Manager Table (Public / Members Only / Private + Live Permissions) */}
      <div id="manager" style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 14, padding: 20 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>
          🗂️ Channel Content &amp; Visibility Manager ({contentItems.length} Items)
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #334155", textAlign: "left", color: "#94a3b8" }}>
                <th style={{ padding: 10 }}>Preview</th>
                <th style={{ padding: 10 }}>Title &amp; Channel</th>
                <th style={{ padding: 10 }}>Format</th>
                <th style={{ padding: 10 }}>Visibility (Public / Members / Private)</th>
                <th style={{ padding: 10 }}>Live Viewer Permissions</th>
                <th style={{ padding: 10 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contentItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #1e293b" }}>
                  <td style={{ padding: 10, width: 110 }}>
                    <img
                      src={item.postImageUrl || item.posterUrl}
                      alt={item.title}
                      style={{ width: 96, height: 54, objectFit: "cover", borderRadius: 6, border: "1px solid #334155" }}
                    />
                  </td>
                  <td style={{ padding: 10 }}>
                    <strong>{item.title}</strong>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      {item.channelHandle} • {item.views} • {item.uploadedAt}
                    </div>
                  </td>
                  <td style={{ padding: 10 }}>
                    <span style={{ padding: "3px 8px", borderRadius: 6, background: "#1e293b", fontWeight: 700, fontSize: 11 }}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ padding: 10 }}>
                    <select
                      value={item.visibility}
                      onChange={(e) => updateContentVisibility(item.id, e.target.value as ContentVisibility)}
                      style={{
                        padding: "5px 9px",
                        borderRadius: 6,
                        background: "#090d16",
                        color:
                          item.visibility === "PUBLIC"
                            ? "#34d399"
                            : item.visibility === "MEMBERS_ONLY"
                            ? "#fbbf24"
                            : "#fb7185",
                        border: "1px solid #334155",
                        fontWeight: 700,
                        fontSize: 11.5,
                        cursor: "pointer",
                      }}
                    >
                      <option value="PUBLIC">🌍 PUBLIC</option>
                      <option value="MEMBERS_ONLY">⭐ MEMBERS_ONLY</option>
                      <option value="PRIVATE">🔒 PRIVATE</option>
                    </select>
                  </td>
                  <td style={{ padding: 10 }}>
                    {item.type === "LIVE" && item.livePermissions ? (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <select
                          value={item.livePermissions.chatMode}
                          onChange={(e) =>
                            updateLivePermissions(item.id, {
                              ...item.livePermissions!,
                              chatMode: e.target.value as LiveViewerPermissions["chatMode"],
                            })
                          }
                          style={{ padding: "4px 7px", borderRadius: 6, background: "#090d16", color: "#38bdf8", border: "1px solid #334155", fontSize: 11 }}
                        >
                          <option value="EVERYONE">Chat: Everyone</option>
                          <option value="MEMBERS_ONLY">Chat: Members</option>
                          <option value="SLOW_MODE_5S">Chat: 5s Slow</option>
                          <option value="DISABLED">Chat: Off</option>
                        </select>
                        <select
                          value={item.livePermissions.whiteboardMode}
                          onChange={(e) =>
                            updateLivePermissions(item.id, {
                              ...item.livePermissions!,
                              whiteboardMode: e.target.value as LiveViewerPermissions["whiteboardMode"],
                            })
                          }
                          style={{ padding: "4px 7px", borderRadius: 6, background: "#090d16", color: "#c084fc", border: "1px solid #334155", fontSize: 11 }}
                        >
                          <option value="HOST_ONLY">Board: Host Only</option>
                          <option value="CO_HOSTS">Board: Co-Hosts</option>
                          <option value="ALL_VIEWERS">Board: All Viewers</option>
                        </select>
                      </div>
                    ) : (
                      <span style={{ color: "#64748b", fontSize: 11.5 }}>Standard VOD / Post</span>
                    )}
                  </td>
                  <td style={{ padding: 10 }}>
                    <button
                      type="button"
                      onClick={() => deleteContentItem(item.id)}
                      style={{ padding: "5px 10px", borderRadius: 6, background: "rgba(251, 113, 133, 0.16)", color: "#fb7185", border: "1px solid #fb7185", fontSize: 11, cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
