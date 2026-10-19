package audit

import "time"

type ModerationAuditEntry struct {
	RoomID        string    `json:"room_id"`
	UserID        string    `json:"user_id"`
	MessageText   string    `json:"message_text"`
	FilterStage   string    `json:"filter_stage"`
	ToxicityScore float64   `json:"toxicity_score"`
	ActionTaken   string    `json:"action_taken"`
	CreatedAt     time.Time `json:"created_at"`
}

// BuildAuditLog constructs an asynchronous PostgreSQL `moderation_logs` record for shadow-banned messages.
func BuildAuditLog(roomID, userID, message, stage string, score float64) ModerationAuditEntry {
	return ModerationAuditEntry{
		RoomID:        roomID,
		UserID:        userID,
		MessageText:   message,
		FilterStage:   stage,
		ToxicityScore: score,
		ActionTaken:   "SHADOW_BAN",
		CreatedAt:     time.Now().UTC(),
	}
}

