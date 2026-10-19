package ingest

import (
	"fmt"
	"math"
	"time"
)

const DefaultChunkSizeBytes = 10 * 1024 * 1024 // 10 MB S3 Multipart Chunks

type PresignedPart struct {
	PartNumber   int    `json:"part_number"`
	PresignedURL string `json:"presigned_url"`
	MaxBytes     int    `json:"max_bytes"`
}

type MultipartInitResponse struct {
	VideoID       string          `json:"video_id"`
	UploadID      string          `json:"upload_id"`
	Bucket        string          `json:"bucket"`
	ObjectKey     string          `json:"object_key"`
	ChunkSizeMB   int             `json:"chunk_size_mb"`
	TotalParts    int             `json:"total_parts"`
	PresignedURLs []PresignedPart `json:"presigned_urls"`
	Status        string          `json:"status"`
}

// InitMultipartUpload computes 10MB S3 Multipart presigned URLs for direct client-to-R2 upload.
func InitMultipartUpload(videoID string, filename string, fileSizeBytes int64, r2Endpoint string) MultipartInitResponse {
	partsCount := int(math.Max(1, math.Ceil(float64(fileSizeBytes)/float64(DefaultChunkSizeBytes))))
	uploadID := fmt.Sprintf("mp_%s_%d", videoID, time.Now().Unix())
	objectKey := fmt.Sprintf("raw/%s/%s", videoID, filename)

	urls := make([]PresignedPart, 0, partsCount)
	for i := 1; i <= partsCount; i++ {
		urls = append(urls, PresignedPart{
			PartNumber:   i,
			PresignedURL: fmt.Sprintf("%s/buckets/acn-vtsp-raw/%s?partNumber=%d&uploadId=%s", r2Endpoint, objectKey, i, uploadID),
			MaxBytes:     DefaultChunkSizeBytes,
		})
	}

	return MultipartInitResponse{
		VideoID:       videoID,
		UploadID:      uploadID,
		Bucket:        "acn-vtsp-raw",
		ObjectKey:     objectKey,
		ChunkSizeMB:   10,
		TotalParts:    partsCount,
		PresignedURLs: urls,
		Status:        "UPLOADING",
	}
}

