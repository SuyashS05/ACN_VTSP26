package filter_trie

import "strings"

var blockedPatterns = []string{
	"free-crypto-airdrop",
	"scamlink",
	"phishing-login",
	"malware-download",
}

// MatchTrie executes Stage 1 (~0.1ms) in-memory pattern matching for banned slurs & phishing links.
func MatchTrie(message string) (bool, string) {
	lower := strings.ToLower(message)
	for _, pat := range blockedPatterns {
		if strings.Contains(lower, pat) {
			return true, pat
		}
	}
	return false, ""
}

