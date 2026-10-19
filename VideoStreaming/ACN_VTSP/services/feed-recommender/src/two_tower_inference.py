#!/usr/bin/env python3
"""
ACN-VTSP Two-Tower Candidate Inference (`services/feed-recommender/src/two_tower_inference.py`)
Computes User Tower & Video Tower embeddings and queries the Qdrant `video_embeddings` ANN collection.
"""

import json
import math
import urllib.request
from typing import List


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a)) or 1.0
    norm_b = math.sqrt(sum(b * b for b in vec_b)) or 1.0
    return dot / (norm_a * norm_b)


def query_qdrant_video_candidates(user_vector: List[float], limit: int = 10, qdrant_url: str = "http://localhost:6333") -> list:
    url = f"{qdrant_url}/collections/video_embeddings/points/search"
    payload = json.dumps({"vector": user_vector, "limit": limit, "with_payload": True}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, method="POST", headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode("utf-8")).get("result", [])
    except Exception:
        return []

