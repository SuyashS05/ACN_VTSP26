package main

import (
	"fmt"
	"sort"
)

// CandidateRank represents a Two-Tower + LightGBM ranked video candidate stored in Redis ZSET `user:feed:{aspect}:{userId}`.
type CandidateRank struct {
	VideoID          string  `json:"video_id"`
	Title            string  `json:"title"`
	StreamURL        string  `json:"stream_url"`
	Score            float64 `json:"score"`
	PrefetchInitMP4  string  `json:"prefetch_init_mp4"`
	PrefetchFirstM4S string  `json:"prefetch_first_m4s"`
}

func RankAndFormatZSET(userID string, aspectRatio string, candidates []CandidateRank) ([]string, []CandidateRank) {
	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].Score > candidates[j].Score
	})
	zsetKey := fmt.Sprintf("user:feed:%s:%s", aspectRatio, userID)
	commands := make([]string, 0, len(candidates))
	for _, c := range candidates {
		commands = append(commands, fmt.Sprintf("ZADD %s %.4f %s", zsetKey, c.Score, c.VideoID))
	}
	return commands, candidates
}

func main() {
	cmds, _ := RankAndFormatZSET("usr_demo_01", "9:16", []CandidateRank{
		{VideoID: "vid_8842", Title: "sample-3.mp4 CMAF Stream", StreamURL: "/sample-3.mp4", Score: 0.8033},
		{VideoID: "vid_9104", Title: "sd.mp4 Vertical Short", StreamURL: "/sd.mp4", Score: 0.7285},
	})
	for _, cmd := range cmds {
		fmt.Println(cmd)
	}
}

