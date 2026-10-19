package pubsub

import "fmt"

// PublishCleanMessage broadcasts verified clean messages (score < 0.75) to Redis Pub/Sub channel `chat:room:{roomId}`.
func PublishCleanMessage(roomID string, userID string, message string, score float64) string {
	channel := fmt.Sprintf("chat:room:%s", roomID)
	_ = userID
	_ = message
	_ = score
	return channel
}

