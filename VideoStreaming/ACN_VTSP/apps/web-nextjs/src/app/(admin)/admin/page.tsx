"use client";

import React from "react";
import { usePlatformRole } from "../../../../lib/role-context";

const ALL_SCOPES = [
  "video:read",
  "video:upload",
  "stream:live",
  "ai:gpu_enrichment",
  "mcp:headless",
];

const PLATFORM_SERVICES = [
  { name: "acn-postgres (PostgreSQL 16)", port: ":5432", status: "HEALTHY", detail: "10 tables + RBAC roles & moderation_logs" },
  { name: "acn-redis (Redis 7.4 Timeline & Pub/Sub)", port: ":6379", status: "HEALTHY", detail: "ZSET feeds (<20ms) + Yjs snapshots" },
  { name: "acn-qdrant (Qdrant Vector DB)", port: ":6333", status: "HEALTHY", detail: "transcript_chunks, merchant_products, video_embeddings" },
  { name: "acn-clickhouse (ClickHouse Telemetry)", port: ":8123", status: "HEALTHY", detail: "watch_events + mv_video_engagement_stats" },
  { name: "acn-kafka (Apache Kafka KRaft)", port: ":9092", status: "HEALTHY", detail: "4 event topics (ingest, transcode, ai)" },
  { name: "acn-r2-storage (SeaweedFS S3/R2)", port: ":9001", status: "HEALTHY", detail: "Zero-egress CMAF .m4s & WebP sprite storage" },
  { name: "mcp-server (TypeScript HTTP/SSE)", port: ":8084", status: "HEALTHY", detail: "4 AI Agent MCP tools exposed" },
  { name: "whiteboard-yjs-sync (CRDT WebSocket)", port: ":8082", status: "HEALTHY", detail: "<5 kbps Uint8Array vector delta sync" },
];

export default function AdminControlPlanePage() {
  const { role, setRole, clients, toggleClientScope, updateClientStatus, promoteUserToRole } = usePlatformRole();

  return (
    <div style={{ padding: 24, background: "#080c14", color: "#f8fafc", minHeight: "92vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>🛡️ Admin Control Plane • Clients, Access Permissions &amp; Platform Services</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
            Manage Users &amp; Client Channels, toggle granular API/GPU/Live access scopes, and monitor all 8 polyglot infrastructure services.
          </p>
        </div>
        {role !== "ADMIN" && (
          <button
            onClick={() => setRole("ADMIN")}
            style={{ padding: "8px 14px", background: "#fbbf24", color: "#080c14", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
          >
            Switch Active Role to ADMIN to Edit
          </button>
        )}
      </div>

      {/* Section 1: Client & User Access Permission Matrix */}
      <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, padding: 18, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>1. Client Channels &amp; User Access Permissions (`users` &amp; `channels` RBAC)</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #334155", textAlign: "left", color: "#94a3b8" }}>
                <th style={{ padding: 10 }}>User / Email</th>
                <th style={{ padding: 10 }}>Channel Handle</th>
                <th style={{ padding: 10 }}>Role</th>
                <th style={{ padding: 10 }}>Account Status</th>
                <th style={{ padding: 10 }}>Granted Access Scopes (Click to Toggle)</th>
                <th style={{ padding: 10 }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.clientId} style={{ borderBottom: "1px solid #1e293b" }}>
                  <td style={{ padding: 10 }}>
                    <strong>{c.email}</strong>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>ID: {c.userId}</div>
                  </td>
                  <td style={{ padding: 10, color: "#38bdf8", fontFamily: "monospace" }}>{c.channelHandle}</td>
                  <td style={{ padding: 10 }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        background: c.role === "CLIENT" ? "rgba(56,189,248,0.15)" : "rgba(148,163,184,0.15)",
                        color: c.role === "CLIENT" ? "#38bdf8" : "#cbd5e1",
                      }}
                    >
                      {c.role}
                    </span>
                  </td>
                  <td style={{ padding: 10 }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        background:
                          c.status === "ACTIVE"
                            ? "rgba(52,211,153,0.15)"
                            : c.status === "SUSPENDED"
                            ? "rgba(251,113,133,0.15)"
                            : "rgba(251,191,36,0.15)",
                        color: c.status === "ACTIVE" ? "#34d399" : c.status === "SUSPENDED" ? "#fb7185" : "#fbbf24",
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: 10 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {ALL_SCOPES.map((sc) => {
                        const active = c.scopes.includes(sc);
                        return (
                          <button
                            key={sc}
                            onClick={() => toggleClientScope(c.clientId, sc)}
                            style={{
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              cursor: "pointer",
                              border: active ? "1px solid #34d399" : "1px solid #334155",
                              background: active ? "rgba(52,211,153,0.15)" : "#090d16",
                              color: active ? "#34d399" : "#64748b",
                            }}
                          >
                            {active ? "✓ " : "+ "}
                            {sc}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td style={{ padding: 10 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {c.role === "USER" ? (
                        <button
                          onClick={() => promoteUserToRole(c.clientId, "CLIENT")}
                          style={{ padding: "5px 10px", background: "#38bdf8", color: "#080c14", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          Promote to CLIENT
                        </button>
                      ) : (
                        <button
                          onClick={() => promoteUserToRole(c.clientId, "USER")}
                          style={{ padding: "5px 10px", background: "#1e293b", color: "#cbd5e1", border: "1px solid #334155", borderRadius: 6, fontSize: 11, cursor: "pointer" }}
                        >
                          Demote to USER
                        </button>
                      )}
                      <button
                        onClick={() => updateClientStatus(c.clientId, c.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                        style={{
                          padding: "5px 10px",
                          background: c.status === "ACTIVE" ? "rgba(251,113,133,0.2)" : "rgba(52,211,153,0.2)",
                          color: c.status === "ACTIVE" ? "#fb7185" : "#34d399",
                          border: "1px solid #334155",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {c.status === "ACTIVE" ? "Suspend" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Platform Services & KEDA Spot Worker Governance */}
      <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, padding: 18 }}>
        <h3 style={{ marginTop: 0 }}>2. Platform Microservices &amp; KEDA Spot Autoscaler Health</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 12 }}>
          {PLATFORM_SERVICES.map((svc) => (
            <div key={svc.name} style={{ padding: 12, background: "#090d16", border: "1px solid #1e293b", borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: 13 }}>{svc.name}</strong>
                <span style={{ fontSize: 11, color: "#34d399", fontFamily: "monospace" }}>● {svc.status} ({svc.port})</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>{svc.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

