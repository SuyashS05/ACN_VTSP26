"use client";

import React from "react";

export default function StudioDevelopersPage() {
  return (
    <div style={{ padding: 24, background: "#080c14", color: "#f8fafc" }}>
      <h2>Creator Studio • Scoped API Keys, HMAC Webhooks &amp; Headless MCP Inspector</h2>
      <p>Active Unkey Prefix: <code>vid_live_acn992</code> • Scopes: <code>video:read, video:upload, stream:live</code></p>
      <p>MCP Server Endpoint (SSE &amp; JSON-RPC): <code>http://localhost:8084/mcp/call</code></p>
    </div>
  );
}

