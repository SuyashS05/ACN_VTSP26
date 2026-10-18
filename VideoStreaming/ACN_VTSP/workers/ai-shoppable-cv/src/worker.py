#!/usr/bin/env python3
"""
ACN-VTSP Phase 5.3: Spot GPU Computer Vision Shoppable Product Detector
Pipeline C (Track 3):
  1. Extracts 1 keyframe per second (`ffmpeg -i input.mp4 -vf fps=1`)
  2. Runs YOLOv11 object detector to locate fashion / electronics / merchandise bounding boxes
  3. Extracts 512-dim CLIP / SigLIP visual embeddings for each cropped bounding box
  4. Queries the creator's Merchant Product Catalog in Qdrant (`merchant_products`)
  5. Compiles matches with `cosine_similarity >= 0.85` into `metadata/products_overlay.json`
"""

import json
import os
from pathlib import Path
from typing import List, Dict


def compile_temporal_product_detections(
    raw_frame_hits: List[Dict], similarity_threshold: float = 0.85, max_gap_sec: float = 2.0
) -> List[Dict]:
    """
    Merges consecutive 1-FPS frame detections of the same product into smooth
    [timestamp_start, timestamp_end] intervals for the player's `timeupdate` overlay.
    """
    filtered = [h for h in raw_frame_hits if h["similarity"] >= similarity_threshold]
    filtered.sort(key=lambda x: (x["product_id"], x["frame_sec"]))

    merged: List[Dict] = []
    for hit in filtered:
        if (
            merged
            and merged[-1]["product_id"] == hit["product_id"]
            and hit["frame_sec"] - merged[-1]["timestamp_end"] <= max_gap_sec
        ):
            merged[-1]["timestamp_end"] = float(hit["frame_sec"] + 1.0)
            merged[-1]["similarity_score"] = round(
                max(merged[-1]["similarity_score"], hit["similarity"]), 4
            )
        else:
            merged.append(
                {
                    "timestamp_start": float(hit["frame_sec"]),
                    "timestamp_end": float(hit["frame_sec"] + 1.5),
                    "product_id": hit["product_id"],
                    "title": hit["title"],
                    "price": hit["price"],
                    "similarity_score": round(hit["similarity"], 4),
                    "bbox": hit["bbox"],  # Normalized [x, y, width, height] in 0..1
                    "checkout_url": hit["checkout_url"],
                }
            )

    merged.sort(key=lambda x: x["timestamp_start"])
    return merged


def run_shoppable_cv_pipeline(video_id: str, out_root: Path) -> List[Dict]:
    # Simulated 1-FPS YOLOv11 + CLIP Qdrant catalog matches
    sample_hits = [
        {
            "frame_sec": 42,
            "product_id": "prod_991",
            "title": "Wireless Noise-Canceling Headphones",
            "price": "$129",
            "similarity": 0.91,
            "bbox": [0.62, 0.31, 0.15, 0.22],
            "checkout_url": "https://store.example.com/item/991",
        },
        {
            "frame_sec": 43,
            "product_id": "prod_991",
            "title": "Wireless Noise-Canceling Headphones",
            "price": "$129",
            "similarity": 0.93,
            "bbox": [0.62, 0.31, 0.15, 0.22],
            "checkout_url": "https://store.example.com/item/991",
        },
        {
            "frame_sec": 46,
            "product_id": "prod_991",
            "title": "Wireless Noise-Canceling Headphones",
            "price": "$129",
            "similarity": 0.89,
            "bbox": [0.62, 0.31, 0.15, 0.22],
            "checkout_url": "https://store.example.com/item/991",
        },
        {
            "frame_sec": 115,
            "product_id": "prod_404",
            "title": "Mechanical Developer Keyboard 75%",
            "price": "$169",
            "similarity": 0.88,
            "bbox": [0.28, 0.68, 0.24, 0.14],
            "checkout_url": "https://store.example.com/item/404",
        },
    ]

    overlays = compile_temporal_product_detections(sample_hits, similarity_threshold=0.85)
    meta_dir = out_root / "videos" / video_id / "metadata"
    meta_dir.mkdir(parents=True, exist_ok=True)
    overlay_path = meta_dir / "products_overlay.json"
    overlay_path.write_text(json.dumps(overlays, indent=2), encoding="utf-8")
    return overlays


if __name__ == "__main__":
    out = Path(os.getenv("OUT_DIR", "./out_cmaf"))
    overlays = run_shoppable_cv_pipeline("vid_8842", out)
    print("🛒 [Spot GPU YOLOv11 + CLIP Shoppable Video Worker] Compiled products_overlay.json:")
    print(json.dumps(overlays, indent=2))

