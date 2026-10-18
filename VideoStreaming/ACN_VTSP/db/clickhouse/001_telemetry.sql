-- ============================================================================
-- ACN-VTSP Phase 2: ClickHouse Real-Time Watch Telemetry & Feed Signal Schema
-- ============================================================================

CREATE DATABASE IF NOT EXISTS acn_telemetry;

-- 1. Raw Watch Events Table (High-Ingestion Heartbeats from Web/Mobile/Embed Players)
CREATE TABLE IF NOT EXISTS acn_telemetry.watch_events (
    event_id UUID DEFAULT generateUUIDv4(),
    user_id String,
    session_id String,
    video_id String,
    channel_id String,
    aspect_ratio LowCardinality(String), -- '16:9' or '9:16'
    watch_duration_sec Float32,
    video_duration_sec Float32,
    completion_ratio Float32,
    playback_speed Float32 DEFAULT 1.0,
    resolution LowCardinality(String),   -- '360p', '720p', '1080p'
    is_skipped UInt8 DEFAULT 0,
    product_popup_clicked UInt8 DEFAULT 0,
    country_code FixedString(2) DEFAULT 'US',
    event_timestamp DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_timestamp)
ORDER BY (video_id, user_id, event_timestamp);

-- 2. QoS (Quality of Service) Buffering & Startup Latency Telemetry Table
CREATE TABLE IF NOT EXISTS acn_telemetry.qos_metrics (
    metric_id UUID DEFAULT generateUUIDv4(),
    video_id String,
    user_id String,
    ttff_ms UInt32,                      -- Time to First Frame (Target: < 300ms)
    rebuffer_count UInt16,
    rebuffer_duration_ms UInt32,
    cdn_cache_status LowCardinality(String), -- 'HIT', 'MISS', 'EXPIRED'
    protocol LowCardinality(String),     -- 'HLS_CMAF', 'DASH_CMAF', 'LL_HLS', 'WEBRTC'
    recorded_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(recorded_at)
ORDER BY (video_id, recorded_at);

-- 3. Materialized View: Real-Time Video Engagement Aggregations (Feeds Two-Tower Ranker)
CREATE MATERIALIZED VIEW IF NOT EXISTS acn_telemetry.mv_video_engagement_stats
ENGINE = SummingMergeTree()
ORDER BY (video_id, channel_id)
AS SELECT
    video_id,
    channel_id,
    count() AS total_heartbeats,
    sum(watch_duration_sec) AS total_watch_sec,
    avg(completion_ratio) AS avg_completion_ratio,
    sum(is_skipped) AS total_skips,
    sum(product_popup_clicked) AS total_product_clicks
FROM acn_telemetry.watch_events
GROUP BY video_id, channel_id;

