-- ============================================================================
-- ACN-VTSP Phase 2: PostgreSQL 16 Core Relational Schema & Seed Data
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    avatar_url TEXT,
    oauth_provider VARCHAR(50) NOT NULL DEFAULT 'clerk',
    oauth_subject VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'creator', -- viewer | creator | admin
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CHANNELS TABLE (Creator Studios & Webhook Configurations)
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    handle VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    webhook_url TEXT,
    webhook_secret_hmac VARCHAR(128),
    subscriber_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. VIDEOS TABLE (16:9 Horizontal VOD & 9:16 Vertical Shorts)
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    aspect_ratio VARCHAR(10) NOT NULL DEFAULT '16:9', -- '16:9' (VOD) or '9:16' (Vertical Shorts)
    duration_sec NUMERIC(10, 2) DEFAULT 0.0,
    status VARCHAR(32) NOT NULL DEFAULT 'UPLOADING',
    -- Status lifecycle: UPLOADING -> RAW_INGESTED -> STREAMABLE (360p ready) -> READY (1080p + AI done) -> FAILED
    raw_s3_key TEXT,
    master_m3u8_url TEXT,
    dash_mpd_url TEXT,
    poster_webp_url TEXT,
    spritesheet_webp_url TEXT,
    spritesheet_vtt_url TEXT,
    products_overlay_url TEXT,
    executive_summary TEXT,
    chapters_json JSONB DEFAULT '[]'::jsonb,
    aes128_key_hex VARCHAR(32),
    view_count BIGINT NOT NULL DEFAULT 0,
    av1_encoded BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_channel_status ON videos(channel_id, status);
CREATE INDEX IF NOT EXISTS idx_videos_aspect_ratio ON videos(aspect_ratio, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_av1_candidate ON videos(view_count) WHERE av1_encoded = FALSE;

-- 4. VIDEO RENDITIONS TABLE (360p, 720p, 1080p CMAF .m4s Tracks)
CREATE TABLE IF NOT EXISTS video_renditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    resolution VARCHAR(16) NOT NULL, -- '360p', '720p', '1080p'
    codec VARCHAR(16) NOT NULL DEFAULT 'h264', -- 'h264', 'hevc', 'av1'
    width INT NOT NULL,
    height INT NOT NULL,
    bitrate_kbps INT NOT NULL,
    playlist_m3u8_url TEXT NOT NULL,
    init_mp4_url TEXT NOT NULL,
    first_segment_url TEXT NOT NULL, -- Pre-fetched (~400KB) for next-2-videos in feed
    status VARCHAR(24) NOT NULL DEFAULT 'READY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(video_id, resolution, codec)
);

-- 5. MULTI-LANGUAGE AUDIO & SUBTITLE TRACKS (#EXT-X-MEDIA)
CREATE TABLE IF NOT EXISTS video_language_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    track_type VARCHAR(16) NOT NULL, -- 'AUDIO' (.m4a Kokoro/XTTS) or 'SUBTITLES' (.vtt Faster-Whisper/NLLB)
    lang_code VARCHAR(10) NOT NULL,  -- 'en', 'hi', 'es', 'zh', 'fr'
    lang_label VARCHAR(64) NOT NULL, -- 'English', 'Hindi', 'Spanish'
    uri_url TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(video_id, track_type, lang_code)
);

-- 6. AUTO-GENERATED VIDEO MCQ BANK (Structured LLM Assessment Quizzes)
CREATE TABLE IF NOT EXISTS video_mcqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    difficulty VARCHAR(16) NOT NULL DEFAULT 'MEDIUM', -- 'EASY', 'MEDIUM', 'HARD'
    question_text TEXT NOT NULL,
    options_json JSONB NOT NULL, -- Array of 4 option strings
    correct_option_index SMALLINT NOT NULL CHECK (correct_option_index BETWEEN 0 AND 3),
    explanation TEXT NOT NULL,
    explanation_timestamp_sec NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_mcqs_video_id ON video_mcqs(video_id);

-- 7. SCOPED API KEYS TABLE (Headless Distribution, Embed SDK & MCP Auth)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(24) NOT NULL, -- e.g. 'vid_live_99a8b7'
    key_sha256_hash VARCHAR(64) UNIQUE NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT ARRAY['video:read'], -- 'video:read', 'video:upload', 'stream:live', 'mcp:tools'
    allowed_origins_cors TEXT[] NOT NULL DEFAULT ARRAY['*'],
    rate_limit_per_min INT NOT NULL DEFAULT 600,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. MERCHANT PRODUCT CATALOG (Linked to CLIP Visual Embeddings in Qdrant)
CREATE TABLE IF NOT EXISTS merchant_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    sku VARCHAR(64) NOT NULL,
    title VARCHAR(200) NOT NULL,
    price_display VARCHAR(32) NOT NULL,
    price_cents INT NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'USD',
    image_url TEXT NOT NULL,
    checkout_url TEXT NOT NULL,
    qdrant_point_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SHOPPABLE VIDEO PRODUCT DETECTIONS (YOLOv11 + CLIP Matches >= 0.85)
CREATE TABLE IF NOT EXISTS product_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES merchant_products(id) ON DELETE CASCADE,
    timestamp_start_sec NUMERIC(10, 2) NOT NULL,
    timestamp_end_sec NUMERIC(10, 2) NOT NULL,
    similarity_score NUMERIC(5, 4) NOT NULL,
    bbox_normalized JSONB NOT NULL, -- [x, y, width, height] in 0.0..1.0 coordinates
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. LIVE CHAT NLP MODERATION AUDIT LOG (Go Trie + Int8 ONNX Detoxify)
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(128) NOT NULL,
    sender_user_id UUID,
    raw_message TEXT NOT NULL,
    filter_stage VARCHAR(32) NOT NULL, -- 'TRIE_REGEX_0.1MS' or 'ONNX_DETOXIFY_4MS'
    toxicity_score NUMERIC(5, 4) NOT NULL,
    action_taken VARCHAR(32) NOT NULL, -- 'DROPPED', 'SHADOW_BANNED', 'MASKED'
    inference_latency_ms NUMERIC(6, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SEED DEMO DATA (For Immediate Testing of API, Player, RAG, MCQs & MCP)
-- ============================================================================
INSERT INTO users (id, email, display_name, oauth_provider, oauth_subject, role)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'architect@acn-vtsp.io',
    'ACN Cloud Media Lab',
    'clerk',
    'user_demo_architect_001',
    'creator'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO channels (id, owner_id, handle, title, description, webhook_url, webhook_secret_hmac)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '@acn-systems',
    'ACN Systems Engineering & AI Stream',
    'Official channel demonstrating CMAF adaptive streaming, RAG Q&A, and Shoppable CV.',
    'http://localhost:8083/webhooks/demo-receiver',
    'whsec_acn_demo_hmac_sha256_secret_key'
) ON CONFLICT (handle) DO NOTHING;

INSERT INTO videos (
    id, channel_id, title, description, aspect_ratio, duration_sec, status,
    master_m3u8_url, dash_mpd_url, products_overlay_url, executive_summary, view_count
) VALUES (
    '88428842-8842-8842-8842-884288428842',
    '22222222-2222-2222-2222-222222222222',
    'Cloud-Native CMAF Transcoding & Zero-Egress Architecture Deep Dive',
    'Walkthrough of single-decode FFmpeg CMAF packaging, KEDA Spot scaling, and sub-5ms ONNX chat moderation.',
    '16:9',
    360.00,
    'READY',
    'http://localhost:9002/acn-vtsp-processed-media/videos/88428842-8842-8842-8842-884288428842/master.m3u8',
    'http://localhost:9002/acn-vtsp-processed-media/videos/88428842-8842-8842-8842-884288428842/manifest.mpd',
    'http://localhost:9002/acn-vtsp-processed-media/videos/88428842-8842-8842-8842-884288428842/metadata/products_overlay.json',
    'This session explains how single-decode FFmpeg CMAF packaging cuts transcoding compute by 75% while Cloudflare R2 eliminates CDN egress fees.',
    640
) ON CONFLICT (id) DO NOTHING;

INSERT INTO video_mcqs (video_id, difficulty, question_text, options_json, correct_option_index, explanation, explanation_timestamp_sec)
VALUES
(
    '88428842-8842-8842-8842-884288428842',
    'MEDIUM',
    'Why does the transcoding pipeline output fragmented MP4 (.m4s) CMAF segments instead of legacy .ts chunks?',
    '["To restrict playback to desktop browsers only", "So Apple HLS (.m3u8) and Android/Web MPEG-DASH (.mpd) share the exact same encoded media chunks", "To disable adaptive bitrate switching", "To increase S3 storage consumption"]',
    1,
    'CMAF (.m4s) allows both HLS and DASH manifests to point to identical byte segments, cutting storage and encoding work in half.',
    42.0
),
(
    '88428842-8842-8842-8842-884288428842',
    'HARD',
    'How does the live chat moderation gateway achieve under 5ms latency per message without external LLM API calls?',
    '["By waiting for human moderators to approve each message", "By running a 0.1ms Aho-Corasick Trie filter followed by a 4ms in-memory quantized Int8 ONNX Detoxify sidecar", "By disabling chat during peak hours", "By sending every chat message to a remote GPU cluster over HTTP/1.1"]',
    1,
    'Combining an in-memory Go Trie filter (0.1ms) with a quantized Int8 ONNX Runtime sidecar (4ms) filters toxicity in <5ms inside the WebSocket node.',
    185.5
);

