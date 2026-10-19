/**
 * ACN-VTSP Parallel S3 Presigned Part Uploader (`apps/web-nextjs/src/lib/multipart-uploader.ts`)
 * Splits large raw video files into 10MB chunks and uploads directly to Raw Cloudflare R2 (`acn-vtsp-raw`).
 */

export async function initiateDirectMultipartUpload(filename: string, sizeBytes: number, apiBaseUrl = "http://localhost:8080") {
  const res = await fetch(`${apiBaseUrl}/api/v1/uploads/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, size_bytes: sizeBytes }),
  });
  return res.json();
}

