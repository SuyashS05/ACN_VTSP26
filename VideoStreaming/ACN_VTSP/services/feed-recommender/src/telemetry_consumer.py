#!/usr/bin/env python3
"""
ACN-VTSP ClickHouse Telemetry Consumer (`services/feed-recommender/src/telemetry_consumer.py`)
Streams player heartbeats (watch_time_sec, completion_ratio, skipped_flag, TTFF) into ClickHouse `watch_events`.
"""

import urllib.request
from dataclasses import dataclass


@dataclass
class WatchHeartbeatEvent:
    user_id: str
    video_id: str
    channel_id: str
    aspect_ratio: str
    watch_time_sec: float
    video_duration_sec: float
    completion_ratio: float
    skipped_flag: int
    abr_rung_initial: str
    ttff_ms: int


def insert_watch_event_clickhouse(ev: WatchHeartbeatEvent, clickhouse_url: str = "http://localhost:8123/") -> bool:
    sql = (
        "INSERT INTO acn_telemetry.watch_events "
        "(user_id, video_id, channel_id, aspect_ratio, watch_time_sec, video_duration_sec, "
        "completion_ratio, skipped_flag, abr_rung_initial, ttff_ms) VALUES "
        f"('{ev.user_id}', '{ev.video_id}', '{ev.channel_id}', '{ev.aspect_ratio}', "
        f"{ev.watch_time_sec}, {ev.video_duration_sec}, {ev.completion_ratio}, "
        f"{ev.skipped_flag}, '{ev.abr_rung_initial}', {ev.ttff_ms})"
    )
    req = urllib.request.Request(clickhouse_url, data=sql.encode("utf-8"), method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status == 200
    except Exception:
        return False

