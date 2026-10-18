-- ============================================================================
-- ACN-VTSP Phase 2: Redis Atomic Lua Scripts
-- 1. Sliding-Window Scoped API Key Rate Limiter
-- 2. Sub-20ms Personalized Feed Timeline Fetcher with Watch-Progress Hydration
-- ============================================================================

-- KEYS[1] = rate_limit:{api_key_prefix}
-- ARGV[1] = current_timestamp_ms
-- ARGV[2] = window_ms (e.g. 60000 for 1 minute)
-- ARGV[3] = max_requests_per_window (e.g. 600)
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local current_count = redis.call('ZCARD', key)

if current_count >= limit then
    return {0, current_count} -- Rejected (HTTP 429 Too Many Requests)
end

redis.call('ZADD', key, now, tostring(now) .. "-" .. tostring(math.random(100000, 999999)))
redis.call('PEXPIRE', key, window)
return {1, current_count + 1} -- Allowed

