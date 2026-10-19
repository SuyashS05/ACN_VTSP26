package drm

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"
)

// DeriveAES128Key generates a deterministic 16-byte HLS AES-128 envelope encryption key per videoID.
func DeriveAES128Key(videoID string, masterSecret string) []byte {
	mac := hmac.New(sha256.New, []byte(masterSecret))
	mac.Write([]byte("aes128:" + videoID))
	sum := mac.Sum(nil)
	return sum[:16] // 128-bit (16-byte) key for #EXT-X-KEY:METHOD=AES-128
}

// IssueSignedEdgeCookie attaches an HMAC-SHA256 signed HTTP cookie so CDN edge caches .m4s chunks without per-user query strings.
func IssueSignedEdgeCookie(w http.ResponseWriter, videoID string, secret string) string {
	exp := time.Now().Add(2 * time.Hour).Unix()
	payload := fmt.Sprintf("vid=%s&exp=%d", videoID, exp)
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(payload))
	sig := hex.EncodeToString(mac.Sum(nil))
	cookieVal := fmt.Sprintf("%s&sig=%s", payload, sig)

	http.SetCookie(w, &http.Cookie{
		Name:     "ACN-Stream-Auth",
		Value:    cookieVal,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
	return cookieVal
}

