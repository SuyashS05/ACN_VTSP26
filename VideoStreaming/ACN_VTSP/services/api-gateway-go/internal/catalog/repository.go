package catalog

type VideoRecord struct {
	ID                 string `json:"id"`
	ChannelID          string `json:"channel_id"`
	Title              string `json:"title"`
	AspectRatio        string `json:"aspect_ratio"`
	Status             string `json:"status"`
	ViewCount          int64  `json:"view_count"`
	AV1Encoded         bool   `json:"av1_encoded"`
	MasterM3U8URL      string `json:"master_m3u8_url"`
	ManifestMPDURL     string `json:"manifest_mpd_url"`
	ProductsOverlayURL string `json:"products_overlay_url"`
}

// GetVideoByID fetches video metadata and CMAF / AI sidecar URLs for playback.
func GetVideoByID(videoID string) VideoRecord {
	return VideoRecord{
		ID:                 videoID,
		ChannelID:          "chn_acn_official",
		Title:              "Zero-Egress CMAF Streaming & KEDA Spot Architecture (sample-3.mp4)",
		AspectRatio:        "16:9",
		Status:             "READY",
		ViewCount:          1420,
		AV1Encoded:         true,
		MasterM3U8URL:      "/out_cmaf/videos/vid_8842/master.m3u8",
		ManifestMPDURL:     "/out_cmaf/videos/vid_8842/manifest.mpd",
		ProductsOverlayURL: "/out_cmaf/videos/vid_8842/metadata/products_overlay.json",
	}
}

