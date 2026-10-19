"use client";

import React, { useState } from "react";

export function TimestampRagChat({ videoId }: { videoId: string }) {
  const [question, setQuestion] = useState("How does CMAF and ONNX chat moderation work?");
  const [answer, setAnswer] = useState<string>("");

  async function askRag() {
    const res = await fetch(`http://localhost:8080/api/v1/videos/${videoId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setAnswer(data.answer ?? "");
  }

  return (
    <div style={{ padding: 16, background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}>
      <h4>Timestamped Video RAG Q&amp;A (Qdrant 60s Chunks)</h4>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6 }} />
        <button onClick={askRag} style={{ padding: "8px 12px", background: "#38bdf8", border: "none", borderRadius: 6, fontWeight: 700 }}>
          Ask AI
        </button>
      </div>
      {answer && <p style={{ marginTop: 10, fontSize: 13, color: "#e2e8f0" }}>{answer}</p>}
    </div>
  );
}

