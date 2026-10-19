"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { LiveKitStage } from "../../../../components/live-collab/LiveKitStage";
import { YjsWhiteboardCanvas } from "../../../../components/live-collab/YjsWhiteboardCanvas";
import { ModeratedLiveChat } from "../../../../components/live-collab/ModeratedLiveChat";
import { usePlatformRole, type LiveViewerPermissions } from "../../../../lib/role-context";

export default function LiveRoomPage() {
  const params = useParams();
  const roomId = (params?.roomId as string) || "live_room_01";
  const { user, role, contentItems, updateLivePermissions } = usePlatformRole();
  const [handRaised, setHandRaised] = useState(false);

  const liveItem = contentItems.find((c) => c.type === "LIVE" && (c.id === roomId || c.watchId === roomId)) || contentItems.find((c) => c.type === "LIVE");
  const perms: LiveViewerPermissions = liveItem?.livePermissions || {
    chatMode: "EVERYONE",
    whiteboardMode: "ALL_VIEWERS",
    allowMicRaiseHand: true,
    allowShoppableOverlay: true,
    allowRecordingDvr: true,
  };

  const isHostOrAdmin = user.isAuthenticated && (role === "CLIENT" || role === "ADMIN");
  const canViewerDraw =
    isHostOrAdmin || perms.whiteboardMode === "ALL_VIEWERS";

  function handlePermChange(next: Partial<LiveViewerPermissions>) {
    if (!liveItem) return;
    updateLivePermissions(liveItem.id, { ...perms, ...next });
  }

  return (
    <div style={{ padding: 24, background: "#080c14", color: "#f8fafc", minHeight: "92vh" }}>
      {/* Live Room Header + Active Viewer Permissions Banner */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          padding: 14,
          marginBottom: 18,
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ padding: "3px 9px", borderRadius: 999, background: "rgba(239, 68, 68, 0.2)", color: "#fb7185", border: "1px solid #ef4444", fontSize: 11, fontWeight: 700 }}>
              ● LIVE WEBRTC SFU
            </span>
            <strong style={{ fontSize: 16 }}>{liveItem?.title || `Live Classroom (${roomId})`}</strong>
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span>💬 Chat Permission: <strong style={{ color: "#38bdf8" }}>{perms.chatMode}</strong></span>
            <span>✏️ Whiteboard Permission: <strong style={{ color: "#c084fc" }}>{perms.whiteboardMode}</strong></span>
            <span>🎙️ Viewer Stage Mic: <strong style={{ color: perms.allowMicRaiseHand ? "#34d399" : "#fb7185" }}>{perms.allowMicRaiseHand ? "Allowed" : "Disabled"}</strong></span>
          </div>
        </div>

        {/* Viewer Raise Hand Button OR Host Live Permission Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {perms.allowMicRaiseHand && (
            <button
              type="button"
              onClick={() => setHandRaised((prev) => !prev)}
              style={{
                padding: "7px 13px",
                borderRadius: 8,
                background: handRaised ? "#fbbf24" : "#1e293b",
                color: handRaised ? "#080c14" : "#f8fafc",
                border: "1px solid #fbbf24",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {handRaised ? "✋ Hand Raised (Waiting for Host)" : "✋ Raise Hand to Speak"}
            </button>
          )}

          {isHostOrAdmin && liveItem && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#090d16", padding: "6px 10px", borderRadius: 8, border: "1px solid #334155" }}>
              <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>🛡️ Host Controls:</span>
              <select
                value={perms.chatMode}
                onChange={(e) => handlePermChange({ chatMode: e.target.value as LiveViewerPermissions["chatMode"] })}
                style={{ padding: "4px 8px", borderRadius: 6, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", fontSize: 11.5 }}
              >
                <option value="EVERYONE">Chat: Everyone</option>
                <option value="MEMBERS_ONLY">Chat: Members Only</option>
                <option value="SLOW_MODE_5S">Chat: 5s Slow Mode</option>
                <option value="DISABLED">Chat: Disabled</option>
              </select>

              <select
                value={perms.whiteboardMode}
                onChange={(e) => handlePermChange({ whiteboardMode: e.target.value as LiveViewerPermissions["whiteboardMode"] })}
                style={{ padding: "4px 8px", borderRadius: 6, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", fontSize: 11.5 }}
              >
                <option value="HOST_ONLY">Board: Host Only</option>
                <option value="CO_HOSTS">Board: Co-Hosts</option>
                <option value="ALL_VIEWERS">Board: All Viewers</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Live Stage + Whiteboard + Moderated Chat */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(300px, 1fr)", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <LiveKitStage roomId={roomId} />
          <div style={{ position: "relative" }}>
            <YjsWhiteboardCanvas roomId={roomId} />
            {!canViewerDraw && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(8, 12, 20, 0.55)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 12,
                }}
              >
                <span style={{ padding: "8px 14px", borderRadius: 8, background: "#0f172a", border: "1px solid #fbbf24", color: "#fbbf24", fontSize: 12.5, fontWeight: 700 }}>
                  🔒 Whiteboard is currently in {perms.whiteboardMode} mode (View-Only for Viewers)
                </span>
              </div>
            )}
          </div>
        </div>

        <div>
          {perms.chatMode === "DISABLED" ? (
            <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              🔇 Live Chat has been disabled by the stream host.
            </div>
          ) : perms.chatMode === "MEMBERS_ONLY" && !user.isAuthenticated ? (
            <div style={{ background: "#0f172a", border: "1px solid #fbbf24", borderRadius: 12, padding: 20, textAlign: "center", color: "#fbbf24", fontSize: 13 }}>
              ⭐ Live Chat is in <strong>Members Only</strong> mode. Please sign in to participate.
            </div>
          ) : (
            <ModeratedLiveChat roomId={roomId} />
          )}
        </div>
      </div>
    </div>
  );
}
