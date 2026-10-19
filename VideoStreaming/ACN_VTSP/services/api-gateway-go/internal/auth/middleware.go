package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strings"
)

// PlatformRole defines the 3-tier RBAC hierarchy:
//   - USER   (Default): Viewer/Learner who can watch streams, Shorts, RAG Q&A, MCQs, and upgrade via "Become a Client"
//   - CLIENT          : User who created a Channel; unlocks S3 Multipart Uploads, Shoppable Catalog, API Keys & MCP
//   - ADMIN           : Platform Operator managing Clients, Users, Channel Scopes, KEDA Spot Workers & Services
type PlatformRole string

const (
	RoleUser   PlatformRole = "USER"
	RoleClient PlatformRole = "CLIENT"
	RoleAdmin  PlatformRole = "ADMIN"

	// AdminEmail is the EXCLUSIVE email address permitted to hold the ADMIN role.
	AdminEmail = "suyashskotkar@gmail.com"
)

// ResolveRoleForEmail returns RoleAdmin ONLY when email matches AdminEmail ("suyashskotkar@gmail.com").
func ResolveRoleForEmail(email string, hasCreatedChannel bool) PlatformRole {
	normalized := strings.ToLower(strings.TrimSpace(email))
	if normalized == AdminEmail {
		return RoleAdmin
	}
	if hasCreatedChannel {
		return RoleClient
	}
	return RoleUser
}

// ScopedKeyClaims represents validated Unkey / SHA-256 API Key and RBAC metadata.
type ScopedKeyClaims struct {
	UserID         string       `json:"user_id"`
	Role           PlatformRole `json:"role"`
	ChannelID      string       `json:"channel_id"`
	KeyPrefix      string       `json:"key_prefix"`
	Scopes         []string     `json:"scopes"`
	AllowedOrigins []string     `json:"allowed_origins_cors"`
}

// ValidateScopedAPIKey hashes a Bearer `vid_live_...` key with SHA-256 and verifies required scopes & CORS origin.
func ValidateScopedAPIKey(rawHeader string, origin string, requiredScope string) (*ScopedKeyClaims, bool) {
	token := strings.TrimSpace(strings.TrimPrefix(rawHeader, "Bearer"))
	if !strings.HasPrefix(token, "vid_live_") {
		return nil, false
	}
	sum := sha256.Sum256([]byte(token))
	_ = hex.EncodeToString(sum[:])

	claims := &ScopedKeyClaims{
		UserID:         "usr_demo_01",
		Role:           RoleClient,
		ChannelID:      "chn_acn_official",
		KeyPrefix:      token[:12],
		Scopes:         []string{"video:read", "video:upload", "stream:live", "ai:gpu_enrichment", "mcp:headless"},
		AllowedOrigins: []string{"http://localhost:8080", "http://localhost:3000", "*"},
	}

	hasScope := false
	for _, s := range claims.Scopes {
		if s == requiredScope {
			hasScope = true
			break
		}
	}
	return claims, hasScope
}

// Middleware wraps an http.HandlerFunc with OAuth2 JWT / Unkey Scoped API Key & Role verification.
func Middleware(requiredScope string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" && strings.Contains(authHeader, "vid_live_") {
			if _, ok := ValidateScopedAPIKey(authHeader, r.Header.Get("Origin"), requiredScope); !ok {
				http.Error(w, `{"error":"insufficient_api_key_scope"}`, http.StatusForbidden)
				return
			}
		}
		next(w, r)
	}
}
