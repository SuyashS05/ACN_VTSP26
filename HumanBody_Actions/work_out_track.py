"""Camera-based workout rep counter and session logger.

Run with ``python work_out_track.py`` for a webcam, or pass a video path / camera
index: ``python work_out_track.py --source 0 --exercise auto``.

MoveNet provides 2D landmarks, so form, calories, and pull-up detections are
estimates. Use a side view for push-ups and jumps; use a front/side view that
shows shoulders, elbows, and wrists for arm exercises. This is not a medical
or safety assessment.
"""

import argparse
import csv
import os
import time
from collections import deque
from datetime import datetime

import cv2
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub


# MoveNet / COCO keypoint indices. Each point is [y, x, confidence].
NOSE = 0
L_SHOULDER, R_SHOULDER = 5, 6
L_ELBOW, R_ELBOW = 7, 8
L_WRIST, R_WRIST = 9, 10
L_HIP, R_HIP = 11, 12
L_KNEE, R_KNEE = 13, 14
L_ANKLE, R_ANKLE = 15, 16
CONF_THRESHOLD = 0.30
EXERCISES = ("auto", "pushup", "pullup", "jumping_jack", "squat", "jump")


def angle(a, b, c):
    """Angle ABC in degrees, or None when any landmark is missing."""
    if a is None or b is None or c is None:
        return None
    ba = np.asarray(a, dtype=float) - np.asarray(b, dtype=float)
    bc = np.asarray(c, dtype=float) - np.asarray(b, dtype=float)
    denom = np.linalg.norm(ba) * np.linalg.norm(bc)
    if denom < 1e-8:
        return None
    return float(np.degrees(np.arccos(np.clip(np.dot(ba, bc) / denom, -1.0, 1.0))))


def point(kps, idx):
    if kps[idx][2] < CONF_THRESHOLD:
        return None
    return np.asarray(kps[idx][:2], dtype=float)


def mean_point(kps, left_idx, right_idx):
    points = [point(kps, i) for i in (left_idx, right_idx)]
    visible = [p for p in points if p is not None]
    return np.mean(visible, axis=0) if visible else None


def point_confidence(kps, *idxs):
    values = [float(kps[i][2]) for i in idxs]
    return float(np.mean(values)) if values else 0.0


def load_pose_model():
    print("Loading MoveNet Lightning (first run may download model files)...")
    model = hub.load("https://tfhub.dev/google/movenet/singlepose/lightning/4")
    return model.signatures["serving_default"]


def get_keypoints(frame, movenet):
    image = cv2.resize(frame, (192, 192))
    image = tf.cast(np.expand_dims(image, axis=0), dtype=tf.int32)
    outputs = movenet(image)
    return outputs["output_0"].numpy()[0, 0]


class WorkoutTracker:
    """Exercise-specific phase machines with rep quality and session metrics."""

    def __init__(self, exercise="auto", fps=30.0, body_weight_kg=70.0):
        self.exercise = exercise
        self.selected_exercise = exercise
        self.fps = fps if fps and fps > 1 else 30.0
        self.weight = max(30.0, float(body_weight_kg))
        self.started_at = time.time()
        self.last_frame_at = self.started_at
        self.elapsed = 0.0
        self.reps = 0
        self.good_reps = 0
        self.rep_scores = []
        self.trace = []
        self.phase = "waiting"
        self.last_rep_time = None
        self.rep_durations = deque(maxlen=20)
        self.baseline = deque(maxlen=90)
        self.smooth = {}
        self.last_values = {}
        self.last_rep_quality = "waiting for start position"
        self.rep_quality_detail = ""
        self.frame_confidence = 0.0
        self.visibility_sum = 0.0
        self.visibility_frames = 0
        self.good_form_frames = 0
        self.active_frames = 0
        self.form_score_sum = 0.0
        self.missing_frames = 0
        self.last_rep_angle = None
        self.last_rep_hip_deviation = None
        self.last_rep_range = 0.0
        self.rep_start = None
        self.rep_start_measure = None
        self.rep_start_hip = None
        self.rep_peak = None
        self.rep_peak_hip = None
        self._auto_candidate = None
        self._auto_count = 0
        self._auto_locked = exercise != "auto"
        self._jump_state = "ground"
        self._jack_state = "closed"

    @staticmethod
    def _smoothed(values, key, value, alpha=0.35):
        if value is None:
            return values.get(key)
        values[key] = value if key not in values else alpha * value + (1 - alpha) * values[key]
        return values[key]

    def _infer_auto(self, measurements):
        # Lock only after a few consistent frames to avoid a flickering label.
        if self._auto_locked:
            return
        candidate = None
        if measurements.get("wrists_over_head"):
            candidate = "jumping_jack" if measurements.get("feet_wide") else "pullup"
        elif measurements.get("elbow_angle") is not None:
            # Arm bends while the torso is near horizontal => likely push-up.
            if measurements.get("torso_horizontal"):
                candidate = "pushup"
            elif measurements.get("arm_overhead"):
                candidate = "pullup"
        elif measurements.get("knee_angle") is not None:
            candidate = "squat"
        if candidate == self._auto_candidate:
            self._auto_count += 1
        else:
            self._auto_candidate, self._auto_count = candidate, 1 if candidate else 0
        if candidate and self._auto_count >= 12:
            self.exercise = candidate
            self._auto_locked = True

    def _measure(self, kps):
        shoulder = mean_point(kps, L_SHOULDER, R_SHOULDER)
        elbow = mean_point(kps, L_ELBOW, R_ELBOW)
        wrist = mean_point(kps, L_WRIST, R_WRIST)
        hip = mean_point(kps, L_HIP, R_HIP)
        knee = mean_point(kps, L_KNEE, R_KNEE)
        ankle = mean_point(kps, L_ANKLE, R_ANKLE)
        elbow_angles = [angle(point(kps, s), point(kps, e), point(kps, w)) for s, e, w in (
            (L_SHOULDER, L_ELBOW, L_WRIST), (R_SHOULDER, R_ELBOW, R_WRIST))]
        knee_angles = [angle(point(kps, h), point(kps, kn), point(kps, a)) for h, kn, a in (
            (L_HIP, L_KNEE, L_ANKLE), (R_HIP, R_KNEE, R_ANKLE))]
        elbow_angle = float(np.mean([v for v in elbow_angles if v is not None])) if any(v is not None for v in elbow_angles) else None
        knee_angle = float(np.mean([v for v in knee_angles if v is not None])) if any(v is not None for v in knee_angles) else None
        hip_y = float(hip[0]) if hip is not None else None
        shoulder_width = None
        if point(kps, L_SHOULDER) is not None and point(kps, R_SHOULDER) is not None:
            shoulder_width = float(np.linalg.norm(point(kps, L_SHOULDER) - point(kps, R_SHOULDER)))
        feet_wide = False
        left_ankle, right_ankle = point(kps, L_ANKLE), point(kps, R_ANKLE)
        if left_ankle is not None and right_ankle is not None and shoulder_width:
            feet_wide = abs(float(left_ankle[1] - right_ankle[1])) > 1.25 * shoulder_width
        torso_horizontal = bool(shoulder is not None and hip is not None and abs(shoulder[0] - hip[0]) < 0.55 * max(abs(shoulder[1] - hip[1]), 0.06))
        wrists_over_head = bool(wrist is not None and shoulder is not None and wrist[0] < shoulder[0] - 0.12)
        arm_overhead = bool(wrists_over_head and not torso_horizontal)
        confidence = point_confidence(kps, L_SHOULDER, R_SHOULDER, L_ELBOW, R_ELBOW, L_WRIST, R_WRIST, L_HIP, R_HIP)
        return {
            "shoulder": shoulder, "elbow": elbow, "wrist": wrist, "hip": hip,
            "knee": knee, "ankle": ankle, "elbow_angle": elbow_angle,
            "knee_angle": knee_angle, "hip_y": hip_y, "torso_horizontal": torso_horizontal,
            "wrists_over_head": wrists_over_head, "arm_overhead": arm_overhead,
            "feet_wide": feet_wide, "confidence": confidence, "shoulder_width": shoulder_width,
        }

    def _start_rep(self, now, measure, value):
        self.rep_start = now
        self.rep_start_measure = value
        self.rep_start_hip = measure.get("hip_y")
        self.rep_peak = value
        self.rep_peak_hip = measure.get("hip_y")
        self.rep_quality_detail = ""

    def _finish_rep(self, now, measure, kind, full_range, extra_error=None):
        duration = max(0.1, now - (self.rep_start if self.rep_start is not None else now))
        self.reps += 1
        self.rep_durations.append(duration)
        score = 100.0
        reasons = []
        if not full_range:
            score -= 35
            reasons.append("short range")
        if duration < 0.65:
            score -= 15
            reasons.append("very fast")
        elif duration > 8.0:
            score -= 10
            reasons.append("very slow / pause")
        if self.frame_confidence < 0.45:
            score -= 20
            reasons.append("low landmark confidence")
        if extra_error:
            score -= 25
            reasons.append(extra_error)
        score = max(0.0, min(100.0, score))
        self.rep_scores.append(score)
        if score >= 70:
            self.good_reps += 1
            self.last_rep_quality = "good"
        else:
            self.last_rep_quality = "check form"
        self.rep_quality_detail = ", ".join(reasons) if reasons else "full range, controlled pace"
        self.last_rep_angle = measure.get("elbow_angle") if kind in ("pushup", "pullup") else measure.get("knee_angle")
        self.last_rep_hip_deviation = self._hip_deviation(measure.get("hip_y"))
        self.last_rep_range = float(abs((self.rep_start_measure or 0.0) - (self.rep_peak or 0.0)))
        self.last_rep_time = now
        self.trace.append({
            "event": "rep", "time_s": round(self.elapsed, 3), "exercise": self.exercise, "rep": self.reps,
            "duration_s": round(duration, 3), "quality_score": round(score, 1),
            "quality": self.last_rep_quality, "notes": self.rep_quality_detail,
            "range": round(self.last_rep_range, 4), "confidence": round(self.frame_confidence, 3),
        })
        self.rep_start = None

    def _hip_deviation(self, hip_y):
        if hip_y is None or self.rep_start_hip is None:
            return None
        return abs(float(hip_y) - float(self.rep_start_hip))

    def _count_pushup(self, m, now):
        value = self._smoothed(self.smooth, "elbow", m["elbow_angle"])
        if value is None or m["hip_y"] is None:
            self.missing_frames += 1
            return
        self.last_values["elbow_angle"] = value
        self.baseline.append(m["hip_y"])
        hip_dev = abs(m["hip_y"] - float(np.median(self.baseline))) if self.baseline else 0.0
        if self.phase in ("waiting", "up") and value > 145:
            self.phase = "up"
            if self.rep_start is None:
                self._start_rep(now, m, value)
            self.rep_peak = value
            if hip_dev < 0.08:
                self.good_form_frames += 1
        elif self.phase in ("waiting", "up") and value < 100 and self.rep_start is not None:
            self.phase = "down"
            self.rep_peak = value
            self.rep_peak_hip = m["hip_y"]
        elif self.phase == "down":
            self.rep_peak = min(self.rep_peak, value)
            if value > 145:
                full = self.rep_peak is not None and self.rep_peak < 105
                error = "hips sagging / piking" if hip_dev > 0.10 else None
                self._finish_rep(now, m, "pushup", full, error)
                self.phase = "up"
                self._start_rep(now, m, value)

    def _count_pullup(self, m, now):
        value = self._smoothed(self.smooth, "elbow", m["elbow_angle"])
        shoulder, wrist = m["shoulder"], m["wrist"]
        if value is None or shoulder is None or wrist is None:
            self.missing_frames += 1
            return
        self.last_values["elbow_angle"] = value
        hands_high = wrist[0] < shoulder[0] + 0.05
        if self.phase in ("waiting", "down") and value > 145:
            self.phase = "down"
            if self.rep_start is None:
                self._start_rep(now, m, value)
            self.rep_peak = value
        elif self.phase in ("waiting", "down") and value < 105 and hands_high and self.rep_start is not None:
            self.phase = "up"
            self.rep_peak = value
        elif self.phase == "up":
            self.rep_peak = min(self.rep_peak, value)
            if value > 145:
                full = self.rep_peak is not None and self.rep_peak < 110 and hands_high
                self._finish_rep(now, m, "pullup", full)
                self.phase = "down"
                self._start_rep(now, m, value)

    def _count_squat(self, m, now):
        value = self._smoothed(self.smooth, "knee", m["knee_angle"])
        if value is None:
            self.missing_frames += 1
            return
        self.last_values["knee_angle"] = value
        if self.phase in ("waiting", "up") and value > 155:
            self.phase = "up"
            if self.rep_start is None:
                self._start_rep(now, m, value)
        elif self.phase in ("waiting", "up") and value < 115 and self.rep_start is not None:
            self.phase = "down"
            self.rep_peak = value
        elif self.phase == "down":
            self.rep_peak = min(self.rep_peak, value)
            if value > 155:
                full = self.rep_peak is not None and self.rep_peak < 120
                self._finish_rep(now, m, "squat", full)
                self.phase = "up"
                self._start_rep(now, m, value)

    def _count_jump(self, m, now):
        hip_y = m["hip_y"]
        if hip_y is None:
            self.missing_frames += 1
            return
        baseline = float(np.median(self.baseline)) if self.baseline else hip_y
        scale = max(abs((m["shoulder"][0] - hip_y)) if m["shoulder"] is not None else 0.2, 0.1)
        rise = (baseline - hip_y) / scale
        if self._jump_state == "ground" and rise > 0.20:
            self._jump_state = "air"
            self.phase = "air"
            self._start_rep(now, m, rise)
        elif self._jump_state == "air" and rise < 0.08:
            self._finish_rep(now, m, "jump", True)
            self._jump_state = "ground"
            self.phase = "ground"
        if rise < 0.08:
            self.baseline.append(hip_y)

    def _count_jumping_jack(self, m, now):
        shoulder, wrist = m["shoulder"], m["wrist"]
        if shoulder is None or wrist is None:
            self.missing_frames += 1
            return
        open_pose = wrist[0] < shoulder[0] - 0.12
        if open_pose and self._jack_state == "closed":
            self._jack_state = "open"
            self.phase = "open"
            if self.rep_start is None:
                self._start_rep(now, m, 0.0)
        elif not open_pose and self._jack_state == "open":
            self._jack_state = "closed"
            self.phase = "closed"
            self._finish_rep(now, m, "jumping_jack", True)

    def update(self, kps, now=None):
        now = time.time() if now is None else now
        dt = max(0.0, min(now - self.last_frame_at, 1.0))
        self.last_frame_at = now
        self.elapsed = now - self.started_at
        m = self._measure(kps)
        self.frame_confidence = m["confidence"]
        self.visibility_sum += m["confidence"]
        self.visibility_frames += 1
        self._infer_auto(m)
        valid = m["confidence"] >= 0.35
        if valid:
            self.active_frames += 1
            self.form_score_sum += max(0.0, min(100.0, m["confidence"] * 100))
        if self.exercise == "pushup":
            self._count_pushup(m, now)
        elif self.exercise == "pullup":
            self._count_pullup(m, now)
        elif self.exercise == "squat":
            self._count_squat(m, now)
        elif self.exercise == "jump":
            self._count_jump(m, now)
        elif self.exercise == "jumping_jack":
            self._count_jumping_jack(m, now)
        self.trace.append({
            "event": "frame", "time_s": round(self.elapsed, 3), "exercise": self.exercise,
            "phase": self.phase, "rep_count": self.reps,
            "elbow_angle_deg": round(m["elbow_angle"], 1) if m["elbow_angle"] is not None else "",
            "knee_angle_deg": round(m["knee_angle"], 1) if m["knee_angle"] is not None else "",
            "hip_y_norm": round(m["hip_y"], 4) if m["hip_y"] is not None else "",
            "landmark_confidence": round(m["confidence"], 3),
            "rep_quality_accuracy_pct": round(self.accuracy, 1),
            "pace_efficiency_pct": round(self.efficiency, 1),
            "estimated_energy_kcal": round(self.energy_kcal, 3),
            "fatigue_pace_change_pct": round(self.fatigue_percent, 1),
        })
        self.last_values["fps"] = 1.0 / dt if dt > 0 else 0.0
        return m

    @property
    def accuracy(self):
        return float(np.mean(self.rep_scores)) if self.rep_scores else 0.0

    @property
    def efficiency(self):
        if self.elapsed <= 0:
            return 0.0
        # Repetitions per active minute normalized to a 20-rep/min reference.
        return min(100.0, (self.reps / max(self.elapsed / 60.0, 1e-6)) / 20.0 * 100.0)

    @property
    def energy_kcal(self):
        # Rough MET-based estimate: vigorous calisthenics 8 MET, jumps 9 MET.
        met = 9.0 if self.exercise in ("jump", "jumping_jack") else 8.0
        return met * 3.5 * self.weight / 200.0 * self.elapsed / 60.0

    @property
    def fatigue_percent(self):
        if len(self.rep_durations) < 4:
            return 0.0
        samples = list(self.rep_durations)
        early = float(np.mean(samples[:max(2, len(samples) // 2)]))
        recent = float(np.mean(samples[-max(2, len(samples) // 2):]))
        return max(0.0, min(100.0, (recent / max(early, 1e-3) - 1.0) * 100.0))

    def summary(self):
        mean_rep = float(np.mean(self.rep_durations)) if self.rep_durations else 0.0
        return {
            "exercise": self.exercise, "reps": self.reps, "good_reps": self.good_reps,
            "duration_s": round(self.elapsed, 2), "mean_rep_s": round(mean_rep, 2),
            "rep_quality_accuracy_pct": round(self.accuracy, 1),
            "pace_efficiency_pct": round(self.efficiency, 1),
            "estimated_energy_kcal": round(self.energy_kcal, 2),
            "fatigue_pace_change_pct": round(self.fatigue_percent, 1),
            "mean_landmark_visibility_pct": round(100 * self.visibility_sum / max(1, self.visibility_frames), 1),
            "good_form_rep_rate_pct": round(100 * self.good_reps / max(1, self.reps), 1),
        }


def draw_skeleton(frame, kps):
    links = ((5, 7), (7, 9), (6, 8), (8, 10), (5, 6), (5, 11), (6, 12),
             (11, 12), (11, 13), (13, 15), (12, 14), (14, 16))
    h, w = frame.shape[:2]
    for a, b in links:
        if kps[a][2] >= CONF_THRESHOLD and kps[b][2] >= CONF_THRESHOLD:
            p1 = (int(kps[a][1] * w), int(kps[a][0] * h))
            p2 = (int(kps[b][1] * w), int(kps[b][0] * h))
            cv2.line(frame, p1, p2, (70, 210, 110), 2, cv2.LINE_AA)
    for y, x, score in kps:
        if score >= CONF_THRESHOLD:
            cv2.circle(frame, (int(x * w), int(y * h)), 4, (20, 230, 255), -1)
    return frame


def draw_hud(frame, tracker, measures):
    h, w = frame.shape[:2]
    panel_w = min(430, w - 20)
    overlay = frame.copy()
    cv2.rectangle(overlay, (10, 10), (10 + panel_w, min(h - 10, 280)), (14, 20, 30), -1)
    cv2.addWeighted(overlay, 0.82, frame, 0.18, 0, frame)
    angle_value = tracker.last_values.get("elbow_angle")
    if angle_value is None:
        angle_value = tracker.last_values.get("knee_angle")
    rows = [
        (f"Exercise: {tracker.exercise.upper()}   Phase: {tracker.phase}", (80, 230, 255)),
        (f"Reps: {tracker.reps}   Good: {tracker.good_reps}   Last: {tracker.last_rep_quality}", (255, 255, 255)),
        (f"Form accuracy: {tracker.accuracy:.0f}%   Pace efficiency: {tracker.efficiency:.0f}%", (220, 240, 255)),
        (f"Energy est.: {tracker.energy_kcal:.1f} kcal   Fatigue: {tracker.fatigue_percent:.0f}%", (220, 240, 255)),
        (f"Pose confidence: {measures['confidence'] * 100:.0f}%   Angle: {angle_value:.0f} deg" if angle_value is not None else f"Pose confidence: {measures['confidence'] * 100:.0f}%   Angle: n/a", (210, 220, 230)),
        (f"Last rep: {tracker.rep_quality_detail[:42]}", (180, 210, 220)),
        ("Q quit | R reset | 1 push-up 2 pull-up 3 jack 4 squat 5 jump", (170, 185, 200)),
    ]
    y = 38
    for text, color in rows:
        cv2.putText(frame, text, (22, y), cv2.FONT_HERSHEY_SIMPLEX, 0.52, color, 1, cv2.LINE_AA)
        y += 34
    return frame


def write_session(tracker, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    trace_path = os.path.join(output_dir, f"workout_trace_{stamp}.csv")
    summary_path = os.path.join(output_dir, f"workout_summary_{stamp}.csv")
    rows = tracker.trace
    columns = sorted({key for row in rows for key in row})
    with open(trace_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)
    with open(summary_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(tracker.summary()))
        writer.writeheader()
        writer.writerow(tracker.summary())
    return trace_path, summary_path


def parse_source(value):
    try:
        return int(value)
    except ValueError:
        return value


def main():
    parser = argparse.ArgumentParser(description="MoveNet workout rep counter and detailed session logger")
    parser.add_argument("--source", default="0", help="camera index (0) or video file path")
    parser.add_argument("--exercise", choices=EXERCISES, default="auto", help="auto or a specific exercise")
    parser.add_argument("--weight-kg", type=float, default=70.0, help="body weight used for rough energy estimate")
    parser.add_argument("--output-dir", default=os.path.join(os.path.dirname(__file__), "workout_logs"))
    args = parser.parse_args()

    cap = cv2.VideoCapture(parse_source(args.source))
    if not cap.isOpened():
        raise IOError(f"Could not open video source: {args.source}")
    fps = cap.get(cv2.CAP_PROP_FPS)
    movenet = load_pose_model()
    # Start the clock after model initialization so download/load time is not
    # counted as workout duration or estimated energy expenditure.
    tracker = WorkoutTracker(args.exercise, fps, args.weight_kg)
    print("Workout tracker ready. Press Q to save and quit; R resets the session.")
    print("Tip: frame the full body. Side view works best for push-ups, squats, and jumps.")

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            frame = cv2.flip(frame, 1) if isinstance(parse_source(args.source), int) else frame
            kps = get_keypoints(frame, movenet)
            measures = tracker.update(kps)
            draw_skeleton(frame, kps)
            draw_hud(frame, tracker, measures)
            cv2.imshow("Workout Tracker", frame)
            key = cv2.waitKey(1) & 0xFF
            if key in (ord("q"), 27):
                break
            exercise_keys = {ord("1"): "pushup", ord("2"): "pullup", ord("3"): "jumping_jack", ord("4"): "squat", ord("5"): "jump"}
            if key in exercise_keys:
                tracker.exercise = exercise_keys[key]
                tracker._auto_locked = True
                tracker.phase = "waiting"
                tracker.rep_start = None
            elif key == ord("r"):
                tracker = WorkoutTracker(args.exercise, fps, args.weight_kg)
    finally:
        cap.release()
        cv2.destroyAllWindows()

    trace_path, summary_path = write_session(tracker, args.output_dir)
    print("\nWorkout session summary")
    for key, value in tracker.summary().items():
        print(f"{key}: {value}")
    print(f"Frame and rep trace: {trace_path}")
    print(f"Session summary: {summary_path}")


if __name__ == "__main__":
    main()
