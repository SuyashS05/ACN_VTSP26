"use client";

import React, { useState } from "react";
import { initiateDirectMultipartUpload } from "../../../../lib/multipart-uploader";

export default function StudioUploadPage() {
  const [status, setStatus] = useState<string>("Ready to upload 10MB S3 Multipart chunks directly to Raw R2.");

  async function handleSimulateUpload() {
    const res = await initiateDirectMultipartUpload("sample-3.mp4", 15319652);
    setStatus(JSON.stringify(res, null, 2));
  }

  return (
    <div style={{ padding: 24, background: "#080c14", color: "#f8fafc" }}>
      <h2>Creator Studio • Resumable 10MB Chunked S3 Multipart Uploader</h2>
      <button onClick={handleSimulateUpload} style={{ padding: "10px 16px", background: "#38bdf8", border: "none", borderRadius: 8, fontWeight: 700 }}>
        Initialize Direct-to-R2 Multipart Upload (sample-3.mp4)
      </button>
      <pre style={{ marginTop: 16, padding: 14, background: "#0f172a", borderRadius: 8 }}>{status}</pre>
    </div>
  );
}

