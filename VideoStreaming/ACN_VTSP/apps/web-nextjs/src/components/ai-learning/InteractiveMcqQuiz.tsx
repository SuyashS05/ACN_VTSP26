"use client";

import React, { useEffect, useState } from "react";

interface McqItem {
  difficulty: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
  explanation_timestamp_sec: number;
}

export function InteractiveMcqQuiz({
  videoId,
  onSeek,
}: {
  videoId: string;
  onSeek?: (seconds: number) => void;
}) {
  const [mcqs, setMcqs] = useState<McqItem[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    fetch(`http://localhost:8080/api/v1/videos/${videoId}/mcqs`)
      .then((r) => r.json())
      .then((d) => setMcqs(d.mcqs ?? []))
      .catch(() => {});
  }, [videoId]);

  function handleSelect(qIdx: number, optIdx: number, tsSec: number) {
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
    onSeek?.(tsSec);
  }

  return (
    <div style={{ padding: 16, background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}>
      <h4 style={{ margin: "0 0 10px 0" }}>Auto-Generated Video MCQ Assessment</h4>
      {mcqs.map((m, qIdx) => {
        const chosen = selectedAnswers[qIdx];
        return (
          <div key={qIdx} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid #1e293b" }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: "#c084fc", marginRight: 6 }}>[{m.difficulty}]</span>
              {m.question_text}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {m.options.map((opt, oIdx) => {
                const isSelected = chosen === oIdx;
                const isCorrect = oIdx === m.correct_option_index;
                let bg = "#090d16";
                let border = "#334155";
                if (isSelected) {
                  bg = isCorrect ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)";
                  border = isCorrect ? "#34d399" : "#fb7185";
                }
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelect(qIdx, oIdx, m.explanation_timestamp_sec)}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: bg,
                      border: `1px solid ${border}`,
                      color: "#f8fafc",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {oIdx + 1}. {opt}
                  </button>
                );
              })}
            </div>
            {chosen !== undefined && (
              <div style={{ marginTop: 6, fontSize: 11.5, color: "#34d399" }}>
                ✓ {m.explanation} (Jumped to {m.explanation_timestamp_sec}s)
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
