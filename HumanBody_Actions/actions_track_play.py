"""Motion-controlled flight game powered by MoveNet pose tracking.

Start with ``python actions_track_play.py``. Hold both arms out like wings to
take off / accelerate, raise or lower them to climb or descend, and lean your
torso to steer. Land by reaching the runway with low altitude and folded wings.
Arrow keys, Space, and L provide keyboard controls for testing and accessibility.

MoveNet is a 2D single-person pose model. Keep the whole body in frame with a
clear background. Game controls are estimates; use the keyboard if pose tracking
is unreliable on your camera angle.
"""

import argparse
import random
import time

import cv2
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub


L_SHOULDER, R_SHOULDER = 5, 6
L_ELBOW, R_ELBOW = 7, 8
L_WRIST, R_WRIST = 9, 10
L_HIP, R_HIP = 11, 12
L_KNEE, R_KNEE = 13, 14
L_ANKLE, R_ANKLE = 15, 16
CONFIDENCE = 0.30
WIDTH, HEIGHT = 1120, 720


def load_pose_model():
    print("Loading MoveNet Lightning (first run may download model files)...")
    model = hub.load("https://tfhub.dev/google/movenet/singlepose/lightning/4")
    return model.signatures["serving_default"]


def infer_pose(frame, movenet):
    resized = cv2.resize(frame, (192, 192))
    tensor = tf.cast(np.expand_dims(resized, axis=0), dtype=tf.int32)
    return movenet(tensor)["output_0"].numpy()[0, 0]


def average_point(kps, first, second):
    points = [kps[i][:2] for i in (first, second) if kps[i][2] >= CONFIDENCE]
    return np.mean(points, axis=0) if points else None


def joint_angle(a, b, c):
    if any(p is None for p in (a, b, c)):
        return None
    ba, bc = np.asarray(a) - np.asarray(b), np.asarray(c) - np.asarray(b)
    denom = np.linalg.norm(ba) * np.linalg.norm(bc)
    if denom < 1e-7:
        return None
    return float(np.degrees(np.arccos(np.clip(np.dot(ba, bc) / denom, -1.0, 1.0))))


class PoseControls:
    """Convert normalized body landmarks to stable game inputs."""

    def __init__(self):
        self.filtered = {"steer": 0.0, "climb": 0.0}
        self.wings = False
        self.confidence = 0.0
        self.crouch = False
        self.jump_event = False
        self.previous_hip_y = None
        self.last_jump = 0.0

    def update(self, kps, now):
        needed = (L_SHOULDER, R_SHOULDER, L_ELBOW, R_ELBOW, L_WRIST, R_WRIST, L_HIP, R_HIP)
        self.confidence = float(np.mean([kps[i][2] for i in needed]))
        visible = all(kps[i][2] >= CONFIDENCE for i in needed)
        self.jump_event = False
        if not visible:
            self.wings = False
            self.filtered["steer"] *= 0.88
            self.filtered["climb"] *= 0.88
            return self.snapshot()

        ls, rs = kps[L_SHOULDER][:2], kps[R_SHOULDER][:2]
        le, re = kps[L_ELBOW][:2], kps[R_ELBOW][:2]
        lw, rw = kps[L_WRIST][:2], kps[R_WRIST][:2]
        lh, rh = kps[L_HIP][:2], kps[R_HIP][:2]
        shoulder_width = max(abs(float(rs[1] - ls[1])), 0.04)
        torso_height = max(abs(float((ls[0] + rs[0] - lh[0] - rh[0]) / 2)), 0.06)

        def arm_extended(shoulder, elbow, wrist):
            reach = abs(float(wrist[1] - shoulder[1])) / shoulder_width
            elbow_reach = abs(float(elbow[1] - shoulder[1])) / shoulder_width
            level = abs(float(wrist[0] - shoulder[0])) / shoulder_width
            return reach > 0.55 and elbow_reach > 0.25 and level < 0.68

        self.wings = arm_extended(ls, le, lw) and arm_extended(rs, re, rw)

        shoulder_mid_x = float((ls[1] + rs[1]) / 2)
        hip_mid_x = float((lh[1] + rh[1]) / 2)
        raw_steer = float(np.clip((shoulder_mid_x - hip_mid_x) / torso_height / 0.42, -1, 1))

        # Wrists above shoulder line = climb; below it = descend. Normalize to
        # body width so camera distance has less effect on control sensitivity.
        wrists_y = float((lw[0] + rw[0]) / 2)
        shoulders_y = float((ls[0] + rs[0]) / 2)
        raw_climb = float(np.clip((shoulders_y - wrists_y) / (shoulder_width * 0.48), -1, 1))
        for key, raw in (("steer", raw_steer), ("climb", raw_climb)):
            self.filtered[key] = 0.30 * raw + 0.70 * self.filtered[key]

        knees = []
        for hip_idx, knee_idx, ankle_idx in ((L_HIP, L_KNEE, L_ANKLE), (R_HIP, R_KNEE, R_ANKLE)):
            indices = (hip_idx, knee_idx, ankle_idx)
            if all(kps[i][2] >= CONFIDENCE for i in indices):
                knees.append(joint_angle(kps[hip_idx][:2], kps[knee_idx][:2], kps[ankle_idx][:2]))
        self.crouch = bool(knees and float(np.mean(knees)) < 125)

        hip_y = float((lh[0] + rh[0]) / 2)
        if self.previous_hip_y is not None and self.previous_hip_y - hip_y > 0.045 and now - self.last_jump > 0.8:
            self.jump_event = True
            self.last_jump = now
        self.previous_hip_y = hip_y
        return self.snapshot()

    def snapshot(self):
        return {"wings": self.wings, "steer": self.filtered["steer"],
                "climb": self.filtered["climb"], "confidence": self.confidence,
                "crouch": self.crouch, "jump": self.jump_event}


class FlightGame:
    SKY = (235, 175, 100)  # BGR
    HORIZON = (155, 150, 105)
    WHITE = (248, 248, 242)
    DARK = (25, 32, 43)
    GOLD = (30, 220, 255)
    GREEN = (90, 225, 130)
    RED = (65, 75, 245)

    def __init__(self, seed=None):
        self.rng = random.Random(seed)
        self.state = "ready"
        self.last_time = time.time()
        self.distance = 0.0
        self.score = 0
        self.best_distance = 0.0
        self.altitude = 0.45  # 0 is ground, 1 is high altitude
        self.steer = 0.0
        self.speed = 0.0
        self.stamina = 100.0
        self.boost = 0.0
        self.lives = 3
        self.gates_passed = 0
        self.gates = []
        self.clouds = [(self.rng.randrange(WIDTH), self.rng.randrange(80, 430), self.rng.randrange(25, 65)) for _ in range(13)]
        self.land_timer = 0.0
        self.notice = "Hold both arms out like wings to take off"
        self.notice_until = self.last_time + 4

    def restart(self, now):
        best_distance = self.best_distance
        lives = self.lives if self.lives > 0 else 3
        self.__init__()
        self.best_distance = best_distance
        self.lives = lives
        self.last_time = now
        self.notice = "Arms out to take off!"
        self.notice_until = now + 3

    def _new_gate(self):
        runway_next = 1100 - (self.distance % 1100)
        ahead = max(260, runway_next - 150)
        if not self.gates or self.gates[-1]["x"] < WIDTH - 280:
            self.gates.append({"x": WIDTH + ahead, "altitude": self.rng.uniform(0.25, 0.77), "passed": False})

    def update(self, controls, now, keys=None):
        keys = keys or set()
        dt = min(max(now - self.last_time, 0.0), 0.06)
        self.last_time = now
        wings = controls["wings"] or "space" in keys
        steer = controls["steer"] + (1 if "right" in keys else 0) - (1 if "left" in keys else 0)
        climb = controls["climb"] + (1 if "up" in keys else 0) - (1 if "down" in keys else 0)
        steer = float(np.clip(steer, -1, 1))
        climb = float(np.clip(climb, -1, 1))
        self.steer = 0.7 * self.steer + 0.3 * steer

        if self.state in ("ready", "landed"):
            if wings:
                self.state = "flying"
                self.notice = "TAKEOFF! Lean to steer • raise/lower arms to climb/descend"
                self.notice_until = now + 3.5
            return
        if self.state == "crashed":
            if "r" in keys:
                self.restart(now)
            return

        runway_distance = self.distance % 1100
        runway_visible = runway_distance > 850
        runway_ahead = 1100 - runway_distance
        wants_land = (not wings) or controls["crouch"] or "l" in keys

        if self.state == "flying":
            target_speed = 150 if wings else 82
            self.speed += (target_speed - self.speed) * min(1.0, dt * 2.8)
            self.distance += self.speed * dt
            self.altitude = float(np.clip(self.altitude + climb * dt * 0.43, 0.035, 0.93))
            if wings:
                self.stamina = max(0.0, self.stamina - 7.0 * dt)
            else:
                self.stamina = min(100.0, self.stamina + 3.8 * dt)
            if controls["jump"]:
                self.boost = 0.75
            if self.boost > 0:
                self.boost = max(0, self.boost - dt)
                self.distance += 110 * dt
                self.score += int(8 * dt)
            if self.stamina <= 0:
                self.altitude = max(0.035, self.altitude - 0.12 * dt)
                self.notice = "Low stamina — fold wings briefly to recover"
                self.notice_until = now + 1.0

            self.steer = float(np.clip(self.steer, -1, 1))
            self._new_gate()
            for gate in self.gates:
                gate["x"] -= self.speed * dt
                if not gate["passed"] and gate["x"] < 500:
                    gate["passed"] = True
                    self.gates_passed += 1
                    if abs(self.altitude - gate["altitude"]) < 0.15:
                        self.score += 100
                        self.notice = "GATE PERFECT! +100"
                        self.notice_until = now + 1.2
                    else:
                        self.score += 20
                        self.notice = "Gate passed — line up closer next time"
                        self.notice_until = now + 1.2
            self.gates = [g for g in self.gates if g["x"] > 260]

            if runway_visible and runway_ahead < 220 and wants_land:
                self.state = "landing"
                self.land_timer = 0.0
                self.notice = "Landing approach: descend, slow down, hold wings folded"
                self.notice_until = now + 4
            elif wants_land and runway_ahead >= 220:
                self.notice = f"Runway is {int(runway_ahead)} m ahead — keep flying"
                self.notice_until = now + 1

        elif self.state == "landing":
            self.speed += (52 - self.speed) * min(1.0, dt * 1.5)
            self.distance += self.speed * dt
            self.altitude = max(0.0, self.altitude - max(0.06, -climb) * dt * 0.8)
            self.land_timer += dt
            if wings and self.land_timer > 0.35:
                self.state = "flying"
                self.notice = "Go-around! Wings out — runway approach cancelled"
                self.notice_until = now + 2
            elif self.altitude < 0.09 and self.speed < 78 and self.land_timer > 0.8:
                self.state = "landed"
                self.score += 250
                self.notice = "SAFE LANDING! +250 • arms out when ready for next flight"
                self.notice_until = now + 5
            elif self.altitude < 0.04 and self.speed >= 78 and self.land_timer > 1.2:
                self._crash(now, "Hard landing — descend earlier and fold your wings")

        if self.state in ("flying", "landing") and self.altitude <= 0.04 and not runway_visible:
            self._crash(now, "Terrain impact — gain altitude before the next runway")

    def _crash(self, now, message):
        self.state = "crashed"
        self.lives -= 1
        self.best_distance = max(self.best_distance, self.distance)
        self.notice = message + " • Press R to restart"
        self.notice_until = now + 20

    def draw(self, controls):
        frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
        frame[:] = self.SKY
        horizon = int(HEIGHT * (0.58 - self.altitude * 0.18))
        # Distant mountain silhouettes and sun.
        cv2.circle(frame, (890, 145), 55, (150, 215, 255), -1, cv2.LINE_AA)
        cv2.fillPoly(frame, [np.array([[0, horizon + 65], [170, horizon - 65], [320, horizon + 35], [515, horizon - 105], [700, horizon + 35], [880, horizon - 50], [WIDTH, horizon + 20], [WIDTH, HEIGHT], [0, HEIGHT]])], (130, 128, 108))
        cv2.fillPoly(frame, [np.array([[0, horizon + 100], [180, horizon + 10], [390, horizon + 92], [610, horizon - 8], [850, horizon + 90], [WIDTH, horizon + 5], [WIDTH, HEIGHT], [0, HEIGHT]])], (110, 140, 106))

        # Parallax clouds move with forward travel.
        for i, (x, y, radius) in enumerate(self.clouds):
            x = int((x - self.distance * (0.08 + (i % 3) * 0.025)) % (WIDTH + 160) - 80)
            cv2.ellipse(frame, (x, y), (radius, max(12, radius // 2)), 0, 0, 360, (245, 220, 190), -1, cv2.LINE_AA)

        # Perspective terrain and a runway at each course checkpoint.
        ground_y = int(HEIGHT * 0.72)
        cv2.rectangle(frame, (0, ground_y), (WIDTH, HEIGHT), (75, 125, 68), -1)
        runway_phase = self.distance % 1100
        runway_visible = runway_phase > 850 or self.state in ("landing", "landed")
        if runway_visible:
            runway_x = int(WIDTH - (1100 - runway_phase) * 1.5)
            runway_x = max(470, min(WIDTH - 80, runway_x))
            cv2.fillPoly(frame, [np.array([[runway_x - 28, ground_y], [runway_x + 28, ground_y], [runway_x + 230, HEIGHT], [runway_x - 230, HEIGHT]])], (75, 78, 84))
            for j in range(5):
                yy = ground_y + 55 + j * 52
                half = 9 + j * 12
                cv2.rectangle(frame, (runway_x - half, yy), (runway_x + half, yy + 17 + j * 2), self.WHITE, -1)
            cv2.putText(frame, "RUNWAY", (runway_x - 60, ground_y - 14), cv2.FONT_HERSHEY_SIMPLEX, 0.7, self.WHITE, 2, cv2.LINE_AA)

        # Collectible altitude gates.
        for gate in self.gates:
            gx = int(gate["x"])
            gy = int(horizon + (0.5 - gate["altitude"]) * 320)
            color = self.GOLD
            cv2.ellipse(frame, (gx, gy), (44, 72), 0, 0, 360, color, 8, cv2.LINE_AA)
            cv2.ellipse(frame, (gx, gy), (28, 56), 0, 0, 360, (120, 235, 245), 2, cv2.LINE_AA)

        # Player aircraft: nose direction, bank, and height respond to body pose.
        px = int(WIDTH * (0.46 + self.steer * 0.24))
        py = int(HEIGHT * (0.70 - self.altitude * 0.47))
        bank = int(self.steer * 26)
        cv2.ellipse(frame, (px, py + 22), (66, 17), bank, 0, 360, (55, 72, 88), -1, cv2.LINE_AA)
        cv2.fillPoly(frame, [np.array([[px + 47, py], [px + 4, py - 12], [px - 31, py - 4], [px - 63, py + 2], [px - 30, py + 9], [px + 4, py + 12]])], (54, 210, 240), cv2.LINE_AA)
        cv2.fillPoly(frame, [np.array([[px - 5, py - 5], [px - 35, py - 34 - bank // 2], [px + 16, py - 10]])], (65, 175, 240), cv2.LINE_AA)
        cv2.fillPoly(frame, [np.array([[px - 7, py + 5], [px - 35, py + 31 + bank // 2], [px + 16, py + 10]])], (65, 175, 240), cv2.LINE_AA)
        cv2.circle(frame, (px + 13, py - 3), 5, (255, 250, 225), -1, cv2.LINE_AA)
        if self.boost > 0:
            cv2.circle(frame, (px - 67, py + 4), 12, (40, 150, 255), -1, cv2.LINE_AA)

        # HUD cards.
        cv2.rectangle(frame, (18, 17), (380, 164), self.DARK, -1)
        cv2.rectangle(frame, (WIDTH - 310, 17), (WIDTH - 18, 164), self.DARK, -1)
        cv2.putText(frame, f"FLIGHT  {self.state.upper()}", (34, 49), cv2.FONT_HERSHEY_DUPLEX, 0.78, self.WHITE, 2, cv2.LINE_AA)
        cv2.putText(frame, f"Score {self.score:05d}   Distance {int(self.distance)} m", (34, 83), cv2.FONT_HERSHEY_SIMPLEX, 0.59, self.WHITE, 1, cv2.LINE_AA)
        cv2.putText(frame, f"Altitude {int(self.altitude * 1000)} m   Speed {int(self.speed)} km/h", (34, 112), cv2.FONT_HERSHEY_SIMPLEX, 0.59, self.WHITE, 1, cv2.LINE_AA)
        cv2.putText(frame, f"Gates {self.gates_passed}   Lives {max(0, self.lives)}   Best {int(self.best_distance)} m", (34, 141), cv2.FONT_HERSHEY_SIMPLEX, 0.59, self.WHITE, 1, cv2.LINE_AA)
        cv2.putText(frame, "STAMINA", (WIDTH - 290, 49), cv2.FONT_HERSHEY_SIMPLEX, 0.62, self.WHITE, 1, cv2.LINE_AA)
        cv2.rectangle(frame, (WIDTH - 290, 65), (WIDTH - 38, 88), (75, 79, 83), -1)
        stamina_width = int(248 * self.stamina / 100)
        stamina_color = self.GREEN if self.stamina > 35 else self.GOLD if self.stamina > 15 else self.RED
        if stamina_width:
            cv2.rectangle(frame, (WIDTH - 290, 65), (WIDTH - 290 + stamina_width, 88), stamina_color, -1)
        cv2.putText(frame, "ALTITUDE", (WIDTH - 290, 119), cv2.FONT_HERSHEY_SIMPLEX, 0.56, self.WHITE, 1, cv2.LINE_AA)
        cv2.rectangle(frame, (WIDTH - 177, 105), (WIDTH - 37, 122), (75, 79, 83), -1)
        ay = 122 - int(17 * self.altitude)
        cv2.circle(frame, (WIDTH - 107, ay), 8, self.GOLD, -1, cv2.LINE_AA)

        # Small live control monitor for pose confidence and input direction.
        steer_label = "LEFT" if controls["steer"] < -0.2 else "RIGHT" if controls["steer"] > 0.2 else "LEVEL"
        vertical_label = "CLIMB" if controls["climb"] > 0.25 else "DESCEND" if controls["climb"] < -0.25 else "LEVEL"
        cv2.putText(frame, f"Body: {steer_label} / {vertical_label}   Pose {controls['confidence'] * 100:.0f}%", (24, HEIGHT - 26), cv2.FONT_HERSHEY_SIMPLEX, 0.58, self.WHITE, 2, cv2.LINE_AA)

        now = time.time()
        if self.notice and now < self.notice_until:
            (tw, _), _ = cv2.getTextSize(self.notice, cv2.FONT_HERSHEY_DUPLEX, 0.68, 2)
            x = max(15, (WIDTH - tw) // 2)
            cv2.rectangle(frame, (x - 14, HEIGHT - 92), (min(WIDTH - 10, x + tw + 14), HEIGHT - 49), self.DARK, -1)
            cv2.putText(frame, self.notice, (x, HEIGHT - 63), cv2.FONT_HERSHEY_DUPLEX, 0.68, self.GOLD, 2, cv2.LINE_AA)

        if self.state == "ready":
            self._center_message(frame, "WING RUNNER", "Stretch both arms out to start flying")
        elif self.state == "crashed":
            self._center_message(frame, "FLIGHT ENDED", f"Score {self.score}  •  Distance {int(self.distance)} m  •  Press R")
        elif self.state == "landed":
            self._center_message(frame, "LANDED!", "Arms out to launch the next flight")
        return frame

    @staticmethod
    def _center_message(frame, title, subtitle):
        cv2.rectangle(frame, (250, 255), (870, 385), (27, 36, 48), -1)
        (w, _), _ = cv2.getTextSize(title, cv2.FONT_HERSHEY_DUPLEX, 1.25, 3)
        cv2.putText(frame, title, ((WIDTH - w) // 2, 308), cv2.FONT_HERSHEY_DUPLEX, 1.25, (75, 225, 255), 3, cv2.LINE_AA)
        (w, _), _ = cv2.getTextSize(subtitle, cv2.FONT_HERSHEY_SIMPLEX, 0.66, 2)
        cv2.putText(frame, subtitle, ((WIDTH - w) // 2, 351), cv2.FONT_HERSHEY_SIMPLEX, 0.66, (245, 245, 242), 2, cv2.LINE_AA)


def draw_pose_preview(frame, kps):
    h, w = frame.shape[:2]
    links = ((5, 7), (7, 9), (6, 8), (8, 10), (5, 6), (5, 11), (6, 12),
             (11, 12), (11, 13), (13, 15), (12, 14), (14, 16))
    for a, b in links:
        if min(kps[a][2], kps[b][2]) >= CONFIDENCE:
            p1 = (int(kps[a][1] * w), int(kps[a][0] * h))
            p2 = (int(kps[b][1] * w), int(kps[b][0] * h))
            cv2.line(frame, p1, p2, (80, 230, 120), 2, cv2.LINE_AA)
    for y, x, confidence in kps:
        if confidence >= CONFIDENCE:
            cv2.circle(frame, (int(x * w), int(y * h)), 4, (30, 240, 255), -1, cv2.LINE_AA)
    return frame


def main():
    parser = argparse.ArgumentParser(description="Play a body-controlled flight game")
    parser.add_argument("--camera", type=int, default=0, help="camera index (default: 0)")
    parser.add_argument("--mirror", action="store_true", default=True, help="mirror the camera for natural steering")
    parser.add_argument("--no-mirror", dest="mirror", action="store_false", help="use the camera without mirroring")
    parser.add_argument("--show-camera", action="store_true", help="show a second window with the tracked skeleton")
    args = parser.parse_args()

    camera = cv2.VideoCapture(args.camera)
    if not camera.isOpened():
        raise IOError(f"Could not open camera {args.camera}")
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    movenet = load_pose_model()
    controls = PoseControls()
    game = FlightGame()
    print("WING RUNNER controls")
    print("Arms out: take off / fly | Lean: steer | Raise/lower arms: climb/descend")
    print("Fold arms near a runway to land | Jump: temporary boost")
    print("Keyboard backup: arrows steer/climb, Space flies, L lands, R restarts, Q quits")

    try:
        while True:
            ok, camera_frame = camera.read()
            if not ok:
                print("Camera frame could not be read; ending game.")
                break
            if args.mirror:
                camera_frame = cv2.flip(camera_frame, 1)
            now = time.time()
            keypoints = infer_pose(camera_frame, movenet)
            state = controls.update(keypoints, now)
            key = cv2.waitKey(1) & 0xFF
            if key in (ord("q"), 27):
                break
            pressed = set()
            if key in (ord("w"), 82):
                pressed.add("up")
            if key in (ord("s"), 84):
                pressed.add("down")
            if key in (ord("a"), 81):
                pressed.add("left")
            if key in (ord("d"), 83):
                pressed.add("right")
            if key == ord(" "):
                pressed.add("space")
            if key == ord("l"):
                pressed.add("l")
            if key == ord("r"):
                pressed.add("r")
            game.update(state, now, pressed)
            cv2.imshow("WING RUNNER | Motion Flight Game", game.draw(state))
            if args.show_camera:
                cv2.imshow("Pose Tracking", draw_pose_preview(camera_frame.copy(), keypoints))
    finally:
        camera.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
