"use client";

import React, { useEffect, useState } from "react";

interface McqItem {
  difficulty: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation_timestamp_sec: number;
}

export function InteractiveMcqQuiz({ videoId }: { videoId: string }) {
  const [mcqs, setMcqs] = useState<McqItem[]>([]);

  useEffect(() => {
    fetch(`http://localhost:8080/api/v1/videos/${videoId}/mcqs`)
      .then((r) => r.json())
      .then((d) => setMcqs(d.mcqs ?? []))
      .catch(() => {});
  }, [videoId]);

  return (
    <div style={{ padding: 16, background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}>
      <h4>Auto-Generated Video MCQ Assessment</h4>
      {mcqs.map((m, idx) => (
        <div key={idx} style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            [{m.difficulty}] {m.question_text}
          </div>
        </div>
      ))}
    </div>
  );
}

