#!/usr/bin/env python3
"""
ACN-VTSP Phase 2: Qdrant Vector Database Collection Initializer
Creates and indexes the 3 production vector collections:
  1. transcript_chunks  (768-dim Cosine) -> Timestamped 60s windows for RAG Q&A & MCP Semantic Search
  2. merchant_products  (512-dim Cosine) -> CLIP/SigLIP visual embeddings for Shoppable Video Pop-Ups
  3. video_embeddings   (256-dim Dot)    -> Two-Tower candidate vectors for Sub-20ms Personalized Feed
"""

import json
import os
import urllib.request
import urllib.error

QDRANT_URL = os.getenv("QDRANT_HTTP_URL", "http://localhost:6333")

COLLECTIONS = {
    "transcript_chunks": {
        "vectors": {"size": 768, "distance": "Cosine"},
        "payload_indexes": ["video_id", "channel_id", "lang_code"],
    },
    "merchant_products": {
        "vectors": {"size": 512, "distance": "Cosine"},
        "payload_indexes": ["channel_id", "product_id"],
    },
    "video_embeddings": {
        "vectors": {"size": 256, "distance": "Dot"},
        "payload_indexes": ["aspect_ratio", "channel_id"],
    },
}


def qdrant_request(method: str, path: str, payload: dict | None = None) -> dict:
    url = f"{QDRANT_URL}{path}"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(
        url, data=data, method=method, headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        if e.code == 409:
            return {"status": "already_exists", "detail": body}
        raise RuntimeError(f"Qdrant HTTP {e.code} on {path}: {body}") from e


def main() -> None:
    import sys
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print(f"🔗 Connecting to Qdrant Vector DB at {QDRANT_URL} ...")
    for name, spec in COLLECTIONS.items():
        res = qdrant_request("PUT", f"/collections/{name}", {"vectors": spec["vectors"]})
        print(f"  ✅ Collection '{name}' ({spec['vectors']['size']}-dim {spec['vectors']['distance']}): {res.get('status', 'ok')}")
        for field in spec["payload_indexes"]:
            qdrant_request(
                "PUT",
                f"/collections/{name}/index",
                {"field_name": field, "field_schema": "keyword"},
            )
            print(f"     ↳ Indexed payload keyword field: {field}")

    # Seed a demo transcript chunk for vid_8842 so RAG Q&A works out-of-the-box
    demo_vector = [0.035] * 768
    qdrant_request(
        "PUT",
        "/collections/transcript_chunks/points?wait=true",
        {
            "points": [
                {
                    "id": "88420001-0000-0000-0000-000000000001",
                    "vector": demo_vector,
                    "payload": {
                        "video_id": "88428842-8842-8842-8842-884288428842",
                        "channel_id": "22222222-2222-2222-2222-222222222222",
                        "lang_code": "en",
                        "start_time": 0.0,
                        "end_time": 60.0,
                        "timestamp_label": "00:42",
                        "text": (
                            "We use a single-decode FFmpeg filter_complex pipeline to output "
                            "2-second CMAF .m4s segments for 360p, 720p, and 1080p simultaneously, "
                            "eliminating duplicate HLS and DASH storage."
                        ),
                    },
                },
                {
                    "id": "88420002-0000-0000-0000-000000000002",
                    "vector": [0.042] * 768,
                    "payload": {
                        "video_id": "88428842-8842-8842-8842-884288428842",
                        "channel_id": "22222222-2222-2222-8842-222222222222",
                        "lang_code": "en",
                        "start_time": 180.0,
                        "end_time": 240.0,
                        "timestamp_label": "03:05",
                        "text": (
                            "Live chat messages pass through a 0.1ms Go Aho-Corasick Trie filter "
                            "and a 4ms in-memory quantized Int8 ONNX Detoxify model before Redis Pub/Sub broadcast."
                        ),
                    },
                },
            ]
        },
    )
    print("🎉 Qdrant collections & demo RAG chunks initialized successfully!")


if __name__ == "__main__":
    main()

