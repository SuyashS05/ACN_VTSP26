"use client";

import React, { useState } from "react";

export function ModeratedLiveChat({ roomId }: { roomId: string }) {
  const [message, setMessage] = useState("Awesome low-latency CMAF stream!");
  const [result, setResult] = useState<string>("");

  async function sendChat() {
    const res = await fetch("http://localhost:8080/api/v1/chat/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_id: roomId, message }),
    });
    setResult(JSON.stringify(await res.json(), null, 2));
  }

  return (
    <div style={{ padding: 16, background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}>
      <h4>Sub-5ms NLP Live Chat Moderation (0.1ms Go Trie + 4ms Int8 ONNX)</h4>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={message} onChange={(e) => setMessage(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6 }} />
        <button onClick={sendChat} style={{ padding: "8px 12px", background: "#38bdf8", border: "none", borderRadius: 6, fontWeight: 700 }}>
          Send
        </button>
      </div>
      {result && <pre style={{ marginTop: 10, fontSize: 11, background: "#060911", padding: 10, borderRadius: 6 }}>{result}</pre>}
    </div>
  );
}

