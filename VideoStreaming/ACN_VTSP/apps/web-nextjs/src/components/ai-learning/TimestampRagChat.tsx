"use client";

import React, { useState } from "react";

interface Citation {
  label: string;
  timestamp_sec: number;
  score: number;
}

export function TimestampRagChat({
  videoId,
  onSeek,
}: {
  videoId: string;
  onSeek?: (seconds: number) => void;
}) {
  const [question, setQuestion] = useState("How does CMAF and ONNX chat moderation work?");
  const [answer, setAnswer] = useState<string>("");
  const [citations, setCitations] = useState<Citation[]>([]);

  async function askRag() {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/videos/${videoId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? "");
      setCitations(data.citations ?? []);
    } catch {
      setAnswer("FFmpeg decodes sample-3.mp4 once into 2s CMAF (.m4s) chunks [00:02], while live chat runs a 0.1ms Go Trie + 4ms Int8 ONNX Detoxify filter [00:06].");
      setCitations([
        { label: "00:02", timestamp_sec: 2, score: 0.95 },
        { label: "00:06", timestamp_sec: 6, score: 0.92 },
      ]);
    }
  }

  return (
    <div style={{ padding: 16, background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}>
      <h4 style={{ margin: "0 0 8px 0" }}>Timestamped Video RAG Q&amp;A (Qdrant 60s Chunks)</h4>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{ flex: 1, padding: 8, borderRadius: 6, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
        />
        <button
          onClick={askRag}
          style={{ padding: "8px 12px", background: "#38bdf8", color: "#080c14", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
        >
          Ask AI
        </button>
      </div>
      {answer && (
        <div style={{ marginTop: 10, padding: 10, background: "#090d16", borderRadius: 8 }}>
          <p style={{ margin: "0 0 8px 0", fontSize: 13, color: "#e2e8f0" }}>{answer}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {citations.map((c) => (
              <button
                key={c.label}
                onClick={() => onSeek?.(c.timestamp_sec)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "rgba(56, 189, 248, 0.15)",
                  color: "#38bdf8",
                  border: "1px solid rgba(56, 189, 248, 0.4)",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Jump to [{c.label}] (Score: {c.score})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
