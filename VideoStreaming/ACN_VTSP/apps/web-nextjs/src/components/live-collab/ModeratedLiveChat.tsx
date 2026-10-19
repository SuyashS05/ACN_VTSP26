"use client";

import React, { useState } from "react";

export function ModeratedLiveChat({ roomId }: { roomId: string }) {
  const [message, setMessage] = useState("Awesome low-latency CMAF stream!");
  const [result, setResult] = useState<string>("Click Send or a preset below to test 0.1ms Go Trie + 4ms Int8 ONNX moderation.");

  async function sendChat(customMsg?: string) {
    const text = customMsg ?? message;
    if (customMsg) setMessage(customMsg);
    try {
      const res = await fetch("http://localhost:8080/api/v1/chat/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId, message: text }),
      });
      setResult(JSON.stringify(await res.json(), null, 2));
    } catch (e) {
      setResult(String(e));
    }
  }

  return (
    <div style={{ padding: 16, background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}>
      <h4 style={{ margin: "0 0 8px 0" }}>Sub-5ms NLP Live Chat Moderation (0.1ms Go Trie + 4ms Int8 ONNX)</h4>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ flex: 1, padding: 8, borderRadius: 6, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
        />
        <button
          onClick={() => sendChat()}
          style={{ padding: "8px 12px", background: "#38bdf8", color: "#080c14", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
        >
          Send
        </button>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        <button onClick={() => sendChat("Awesome low-latency WebRTC stream!")} style={{ fontSize: 11, padding: "5px 8px", borderRadius: 6, background: "#1e293b", color: "#34d399", border: "1px solid #334155", cursor: "pointer" }}>
          Test Clean
        </button>
        <button onClick={() => sendChat("You are a stupid idiot")} style={{ fontSize: 11, padding: "5px 8px", borderRadius: 6, background: "#1e293b", color: "#fb7185", border: "1px solid #334155", cursor: "pointer" }}>
          Test Toxic (ONNX 4ms)
        </button>
        <button onClick={() => sendChat("Click free-crypto-airdrop scamlink")} style={{ fontSize: 11, padding: "5px 8px", borderRadius: 6, background: "#1e293b", color: "#fbbf24", border: "1px solid #334155", cursor: "pointer" }}>
          Test Phishing (Trie 0.1ms)
        </button>
      </div>
      <pre style={{ marginTop: 10, fontSize: 11.5, background: "#060911", padding: 12, borderRadius: 8, color: "#cbd5e1", overflowX: "auto" }}>
        {result}
      </pre>
    </div>
  );
}
