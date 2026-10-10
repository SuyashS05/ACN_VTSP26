# ACN_VTSP26

This repository contains three independent project areas: a Vehicle-to-Vehicle (V2V) safety concept, camera-based human-action applications, and a video-streaming platform design.

| Project | What is here | Status |
|---|---|---|
| [V2V](#1-v2v-vehicle-to-vehicle-safety) | AIS-230 research, architecture and business documents, plus interactive HTML simulations | Research and demos |
| [HumanBody_Actions](#2-human-body-actions) | MoveNet pose tracking, a motion-controlled flight game, and a workout tracker | Runnable Python prototypes |
| [VideoStreaming](#3-video-streaming-platform) | Platform architecture and implementation documentation | Design documentation; application code is not in this repository yet |

## 1. V2V: Vehicle-to-Vehicle Safety

The V2V project explores how connected vehicles could exchange safety messages and warn drivers about hazards such as hard braking or hidden intersection traffic. Its documents focus on India's proposed AIS-230 direction; regulatory dates, requirements, market sizes, and cost figures should be checked against current primary sources before being treated as final.

### Documents

- [Policy, proposed mandate, use cases, and India-specific challenges](V2V/details.md)
- [Technical architecture: C-V2X/PC5, vehicle hardware, messages, and security](V2V/system_architecture.md)
- [Business and startup opportunity map](V2V/businessways.md)
- [Product concepts, costs, market sizing, and go-to-market proposal](V2V/product_business_analysis.md)
- [Reference links](V2V/Information.md)

### Interactive simulations

The simulations are standalone HTML pages. To play them from a local checkout, start a small web server from the repository root:

```bash
python -m http.server 8000
```

Then open these pages in a browser:

- [Blind Crossing](http://localhost:8000/V2V/blind_crossing.html) - compare a blind-intersection scenario with V2V switched on or off.
- [Chain Brake](http://localhost:8000/V2V/blind_braking.html) - explore how a hard-braking warning can propagate through following traffic.
- [Signal Path](http://localhost:8000/V2V/signal_path.html) - follow a safety message through vehicle components in both directions.

The first two simulations load Three.js from a CDN; the pages also load fonts remotely. An internet connection is needed for those external assets. GitHub README pages do not execute embedded JavaScript, so the simulations cannot play inline here; use the links above with the local server.

## 2. Human Body Actions

These Python prototypes use MoveNet single-person pose estimation to interpret webcam or video frames.

### Motion-controlled flight game

[`HumanBody_Actions/actions_track_play.py`](HumanBody_Actions/actions_track_play.py) is a 2D flight game controlled by body pose:

- Hold both arms out to take off and fly.
- Lean your torso to steer left or right.
- Raise or lower your arms to climb or descend.
- Pass altitude gates, manage stamina, and fold your arms near a runway to land.
- Keyboard backup: arrow keys or WASD, Space, L, R, and Q.

### Workout tracker

[`HumanBody_Actions/work_out_track.py`](HumanBody_Actions/work_out_track.py) counts push-ups, pull-ups, jumping jacks, squats, and jumps. It displays rep and form estimates, pose confidence, pace, estimated energy use, and a pace-based fatigue indicator. At the end of a session it saves a detailed CSV trace and a summary under `HumanBody_Actions/workout_logs/`.

### Run the prototypes

Install Python dependencies in your environment:

```bash
python -m pip install opencv-python numpy tensorflow tensorflow-hub
```

Run the flight game:

```bash
python HumanBody_Actions/actions_track_play.py
```

Run the workout tracker with automatic exercise selection:

```bash
python HumanBody_Actions/work_out_track.py
```

Choose an exercise or a video file as input:

```bash
python HumanBody_Actions/work_out_track.py --exercise pushup
python HumanBody_Actions/work_out_track.py --source "path/to/workout.mp4" --exercise squat
```

The first run downloads the MoveNet model from TensorFlow Hub. Keep your full body visible for best tracking. Rep counting, pull-up detection, form scoring, calories, and fatigue are estimates from 2D pose landmarks, not a medical assessment. The workout tracker also supports `--help` for its available options.

## 3. Video Streaming Platform

The `VideoStreaming` folder currently contains project documentation, not a runnable web application:

- [Platform overview and full technical documentation](VideoStreaming/info.md)
- [Video Streaming Platform documentation (DOCX)](VideoStreaming/Video_Streaming_Platform_Documentation.docx)

The design describes a cloud-native upload, transcoding, and adaptive HLS streaming service. Its proposed stack includes a React/Next.js frontend, a Node.js/NestJS API, PostgreSQL, Redis/BullMQ, FFmpeg, and S3-compatible storage such as MinIO or Cloudflare R2. These are design specifications; the application, deployment setup, and services are not present in this repository.

## Repository layout

```text
ACN_VTSP26/
|-- V2V/                 # V2V research, architecture, business analysis, HTML demos
|-- HumanBody_Actions/   # Pose-tracking game and workout prototypes
|-- VideoStreaming/      # Video-platform design documents
|-- LICENSE
`-- README.md
```
