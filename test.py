import cv2
import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
import time
from collections import deque

# Load the MoveNet model from TensorFlow Hub.
model = hub.load("https://tfhub.dev/google/movenet/singlepose/lightning/4")
movenet = model.signatures['serving_default']

# MoveNet / COCO keypoint indices. Each keypoint is stored as [y, x, score].
NOSE = 0
L_EYE, R_EYE = 1, 2
L_EAR, R_EAR = 3, 4
L_SHOULDER, R_SHOULDER = 5, 6
L_ELBOW, R_ELBOW = 7, 8
L_WRIST, R_WRIST = 9, 10
L_HIP, R_HIP = 11, 12
L_KNEE, R_KNEE = 13, 14
L_ANKLE, R_ANKLE = 15, 16

CONF_THRESHOLD = 0.3


def draw_all_keypoints(frame, keypoints):
    for y, x, score in keypoints:
        if score < CONF_THRESHOLD:
            continue
        px, py = int(x * frame.shape[1]), int(y * frame.shape[0])
        cv2.circle(frame, (px, py), 5, (0, 255, 0), -1)  # Draw green circles on keypoints
    return frame


def get_keypoints(frame):
    resized_frame = cv2.resize(frame, (192, 192))
    resized_frame = np.expand_dims(resized_frame, axis=0)
    resized_frame = tf.cast(resized_frame, dtype=tf.int32)

    outputs = movenet(resized_frame)
    keypoints = outputs['output_0'].numpy()[0, 0]  # shape (17, 3) -> [y, x, score]
    return keypoints


class GestureDetector:
    """Turns raw MoveNet keypoints into simple, game-friendly control events.

    All geometry is computed in normalized [0, 1] image space and scaled by
    the person's own body size (shoulder width / torso height), so it keeps
    working whether the player is close to or far from the camera.
    """

    def __init__(self):
        self.hip_baseline = deque(maxlen=30)
        self.jump_cooldown_until = 0.0
        self.JUMP_COOLDOWN_SECONDS = 0.6

        self.mode = "idle"  # "idle" or "flying"
        self.wings_since = None
        self.wings_lost_since = None
        self.WINGS_HOLD_SECONDS = 0.5
        self.WINGS_RELEASE_GRACE = 0.3

        self.turn = "none"  # "none", "left", "right"
        self.TURN_ENTER = 0.35
        self.TURN_EXIT = 0.20

    @staticmethod
    def _visible(kps, *idxs):
        return all(kps[i][2] >= CONF_THRESHOLD for i in idxs)

    def _wings_pose(self, kps):
        if not self._visible(kps, L_SHOULDER, R_SHOULDER, L_WRIST, R_WRIST):
            return False

        lsy, lsx, _ = kps[L_SHOULDER]
        rsy, rsx, _ = kps[R_SHOULDER]
        lwy, lwx, _ = kps[L_WRIST]
        rwy, rwx, _ = kps[R_WRIST]

        shoulder_width = abs(rsx - lsx)
        if shoulder_width < 1e-6:
            return False

        def side_extended(sx, sy, wx, wy):
            horizontal_reach = abs(wx - sx) / shoulder_width
            vertical_align = abs(wy - sy) / shoulder_width
            return horizontal_reach > 0.6 and vertical_align < 0.5

        return side_extended(lsx, lsy, lwx, lwy) and side_extended(rsx, rsy, rwx, rwy)

    def _detect_jump(self, kps, now):
        if not self._visible(kps, L_HIP, R_HIP):
            return False

        hip_y = (kps[L_HIP][0] + kps[R_HIP][0]) / 2.0

        baseline = np.median(self.hip_baseline) if self.hip_baseline else hip_y
        rise = baseline - hip_y  # positive = hips moved up (y shrinks upward)

        torso_scale = 1.0
        if self._visible(kps, L_SHOULDER, R_SHOULDER):
            shoulder_y = (kps[L_SHOULDER][0] + kps[R_SHOULDER][0]) / 2.0
            torso_scale = max(abs(hip_y - shoulder_y), 1e-3)

        jumped = False
        if rise / torso_scale > 0.35 and now >= self.jump_cooldown_until:
            jumped = True
            self.jump_cooldown_until = now + self.JUMP_COOLDOWN_SECONDS

        # Only fold calm (non-jumping) frames into the standing baseline.
        if rise / torso_scale < 0.15:
            self.hip_baseline.append(hip_y)

        return jumped

    def _detect_turn(self, kps):
        if not self._visible(kps, L_SHOULDER, R_SHOULDER, L_HIP, R_HIP):
            self.turn = "none"
            return self.turn

        shoulder_mid_x = (kps[L_SHOULDER][1] + kps[R_SHOULDER][1]) / 2.0
        shoulder_mid_y = (kps[L_SHOULDER][0] + kps[R_SHOULDER][0]) / 2.0
        hip_mid_x = (kps[L_HIP][1] + kps[R_HIP][1]) / 2.0
        hip_mid_y = (kps[L_HIP][0] + kps[R_HIP][0]) / 2.0

        torso_height = max(abs(shoulder_mid_y - hip_mid_y), 1e-3)
        lean = (shoulder_mid_x - hip_mid_x) / torso_height

        # Hysteresis so the state doesn't flicker around the threshold.
        if self.turn == "none":
            if lean > self.TURN_ENTER:
                self.turn = "right"
            elif lean < -self.TURN_ENTER:
                self.turn = "left"
        elif self.turn == "right" and lean < self.TURN_EXIT:
            self.turn = "none"
        elif self.turn == "left" and lean > -self.TURN_EXIT:
            self.turn = "none"

        return self.turn

    def _update_mode(self, wings_now, now):
        if wings_now:
            self.wings_lost_since = None
            if self.wings_since is None:
                self.wings_since = now
            if self.mode == "idle" and now - self.wings_since >= self.WINGS_HOLD_SECONDS:
                self.mode = "flying"
        else:
            self.wings_since = None
            if self.mode == "flying":
                if self.wings_lost_since is None:
                    self.wings_lost_since = now
                elif now - self.wings_lost_since >= self.WINGS_RELEASE_GRACE:
                    self.mode = "idle"
                    self.wings_lost_since = None

        return self.mode

    def update(self, kps):
        now = time.time()
        wings_now = self._wings_pose(kps)
        return {
            "jump": self._detect_jump(kps, now),
            "wings": wings_now,
            "mode": self._update_mode(wings_now, now),
            "turn": self._detect_turn(kps),
        }


def draw_overlay(frame, state):
    lines = [
        f"Mode: {state['mode']}",
        f"Turn: {state['turn']}",
        f"Wings: {state['wings']}",
        "JUMP!" if state["jump"] else "",
    ]
    y = 30
    for line in lines:
        if not line:
            continue
        cv2.putText(frame, line, (10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
        y += 30
    return frame


# For real time pass 0 or 1 according to camera and for video pass video address.
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    raise IOError("Could not open camera")

detector = GestureDetector()
prev_mode = detector.mode
prev_turn = detector.turn

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)  # mirror the feed so motion feels natural

    keypoints = get_keypoints(frame)
    state = detector.update(keypoints)

    if state["jump"]:
        print("Gesture: JUMP")
    if state["mode"] != prev_mode:
        print(f"Gesture: mode changed to '{state['mode']}'")
        prev_mode = state["mode"]
    if state["turn"] != prev_turn:
        print(f"Gesture: turn changed to '{state['turn']}'")
        prev_turn = state["turn"]

    frame = draw_all_keypoints(frame, keypoints)
    frame = draw_overlay(frame, state)

    cv2.imshow('Frame with Keypoints', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
