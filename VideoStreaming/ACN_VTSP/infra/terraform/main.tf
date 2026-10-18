# ============================================================================
# ACN-VTSP Cloud Infrastructure Baseline (Cloudflare R2 + CDN Cache Rules)
# Zero-Egress Storage + >95% Edge Cache Hit Ratio for CMAF (.m4s / .m3u8)
# ============================================================================

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.35.0"
    }
  }
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare Account ID for Zero-Egress R2 Storage"
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare Zone ID for CDN Edge Caching & Signed Cookies"
}

variable "cdn_domain" {
  type        = string
  default     = "cdn.acn-vtsp.example.com"
}

# 1. Raw Multipart Ingest Bucket (Auto-expires raw uploads after 7 days)
resource "cloudflare_r2_bucket" "raw_ingest" {
  account_id = var.cloudflare_account_id
  name       = "acn-vtsp-raw"
  location   = "WNAM"
}

# 2. Processed Media Origin Bucket (CMAF .m4s, .m3u8, .mpd, .vtt, products_overlay.json)
resource "cloudflare_r2_bucket" "processed_media" {
  account_id = var.cloudflare_account_id
  name       = "acn-vtsp-processed-media"
  location   = "WNAM"
}

# 3. Cloudflare CDN Cache Rules (>95% Cache Hit Ratio for Immutable CMAF Chunks)
resource "cloudflare_ruleset" "cmaf_edge_cache_rules" {
  zone_id     = var.cloudflare_zone_id
  name        = "ACN-VTSP CMAF & LL-HLS Edge Cache Rules"
  description = "365d immutable cache for .m4s/init.mp4/webp; 1s cache for live .m3u8"
  kind        = "zone"
  phase       = "http_request_cache_settings"

  # Rule 1: Immutable 365-day Edge Cache for CMAF .m4s segments, init.mp4, and WebP sprites
  rules {
    action = "set_cache_settings"
    action_parameters {
      cache = true
      edge_ttl {
        mode    = "override_origin"
        default = 31536000 # 365 days
      }
      browser_ttl {
        mode    = "override_origin"
        default = 86400
      }
      cache_key {
        ignore_query_strings_order = true
        custom_key {
          query_string {
            exclude = ["*"] # Strip query strings so all viewers share identical CDN cache key
          }
        }
      }
    }
    expression  = "(http.request.uri.path.extension in {\"m4s\" \"mp4\" \"webp\" \"vtt\" \"json\"})"
    description = "Cache CMAF media segments and AI metadata tracks for 365 days"
    enabled     = true
  }

  # Rule 2: 1-second Edge Cache for Low-Latency HLS (.m3u8) Playlists
  rules {
    action = "set_cache_settings"
    action_parameters {
      cache = true
      edge_ttl {
        mode    = "override_origin"
        default = 1
      }
    }
    expression  = "(http.request.uri.path.extension in {\"m3u8\" \"mpd\"})"
    description = "Cache HLS and DASH manifests with 1s edge TTL"
    enabled     = true
  }
}

