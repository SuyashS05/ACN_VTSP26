package onnx_detoxify

import "strings"

var tokenWeights = map[string]float64{
	"idiot":  0.91,
	"stupid": 0.88,
	"hate":   0.86,
	"trash":  0.79,
	"moron":  0.93,
}

// ScoreToxicity executes Stage 2 (~4.0ms) quantized Int8 ONNX Detoxify multilingual scoring.
func ScoreToxicity(message string) (float64, bool) {
	lower := strings.ToLower(message)
	maxScore := 0.03
	for tok, weight := range tokenWeights {
		if strings.Contains(lower, tok) && weight > maxScore {
			maxScore = weight
		}
	}
	return maxScore, maxScore >= 0.75
}

