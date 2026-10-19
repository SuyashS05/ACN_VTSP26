"use client";

import React, { useState } from "react";

export default function StudioDevelopersPage() {
  const [mcpOutput, setMcpOutput] = useState<string>(
    "Click any MCP tool button below to execute a live JSON-RPC call against http://localhost:8084/mcp/call ..."
  );

  async function callMcpTool(name: string, args: Record<string, unknown>) {
    setMcpOutput(`Calling http://localhost:8084/mcp/call -> tool="${name}" ...`);
    try {
      const res = await fetch("http://localhost:8084/mcp/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, arguments: args }),
      });
      const data = await res.json();
      setMcpOutput(JSON.stringify(data, null, 2));
    } catch (e) {
      setMcpOutput(`Error calling MCP server on :8084: ${String(e)}`);
    }
  }

  return (
    <div style={{ padding: 24, background: "#080c14", color: "#f8fafc", minHeight: "90vh" }}>
      <h2>Creator Studio • Scoped API Keys, HMAC Webhooks &amp; Headless MCP Inspector</h2>
      <div style={{ padding: 16, background: "#0f172a", border: "1px solid #334155", borderRadius: 12, marginBottom: 20 }}>
        <p style={{ margin: "0 0 6px 0" }}>
          Active Unkey Prefix: <code>vid_live_acn992</code> • Scopes: <code>video:read, video:upload, stream:live</code>
        </p>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
          MCP Server Endpoint (SSE &amp; JSON-RPC): <code>http://localhost:8084/mcp/call</code>
        </p>
      </div>

      <div style={{ padding: 16, background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}>
        <h3 style={{ marginTop: 0 }}>Live Model Context Protocol (MCP) Tool Console (:8084)</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <button
            onClick={() =>
              callMcpTool("upload_video_from_url", {
                source_url: "http://localhost:8080/sample-3.mp4",
                title: "sample-3.mp4 Cloud Stream",
              })
            }
            style={{ padding: "8px 12px", background: "#38bdf8", color: "#080c14", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
          >
            1. upload_video_from_url
          </button>
          <button
            onClick={() => callMcpTool("search_channel_videos", { query: "CMAF single decode and ONNX chat", limit: 3 })}
            style={{ padding: "8px 12px", background: "#38bdf8", color: "#080c14", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
          >
            2. search_channel_videos
          </button>
          <button
            onClick={() => callMcpTool("get_video_summary_and_mcqs", { video_id: "vid_8842" })}
            style={{ padding: "8px 12px", background: "#38bdf8", color: "#080c14", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
          >
            3. get_video_summary_and_mcqs
          </button>
          <button
            onClick={() =>
              callMcpTool("generate_signed_playback_url", {
                video_id: "vid_8842",
                allowed_origin: "http://localhost:3000",
              })
            }
            style={{ padding: "8px 12px", background: "#38bdf8", color: "#080c14", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
          >
            4. generate_signed_playback_url
          </button>
        </div>
        <pre style={{ padding: 14, background: "#060911", border: "1px solid #334155", borderRadius: 8, fontSize: 12, color: "#cbd5e1", overflowX: "auto" }}>
          {mcpOutput}
        </pre>
      </div>
    </div>
  );
}
