"""
Pose estimation service using MediaPipe Tasks PoseLandmarker.

Processes a video file frame-by-frame and extracts normalised body landmarks.
Saves results to <upload_dir>/<uuid>/pose_landmarks.json.

Landmark index reference (MediaPipe 33-point skeleton):
  0  nose          11 left_shoulder   12 right_shoulder
  23 left_hip      24 right_hip
  25 left_knee     26 right_knee
  27 left_ankle    28 right_ankle
  29 left_heel     30 right_heel
"""

import json
import logging
from pathlib import Path

import cv2
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import (
    PoseLandmarker,
    PoseLandmarkerOptions,
    RunningMode,
)

logger = logging.getLogger(__name__)

# Only the landmarks relevant to mobility assessment — keeps the JSON lean.
TRACKED_LANDMARKS = {
    0:  "nose",
    11: "left_shoulder",
    12: "right_shoulder",
    23: "left_hip",
    24: "right_hip",
    25: "left_knee",
    26: "right_knee",
    27: "left_ankle",
    28: "right_ankle",
    29: "left_heel",
    30: "right_heel",
}

_MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "pose_landmarker_full.task"


def _build_options() -> PoseLandmarkerOptions:
    return PoseLandmarkerOptions(
        base_options=BaseOptions(
            model_asset_path=str(_MODEL_PATH),
            delegate=BaseOptions.Delegate.CPU,
        ),
        running_mode=RunningMode.VIDEO,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )


def _extract_tracked_landmarks(raw_landmarks) -> dict:
    return {
        name: {
            "x": round(raw_landmarks[idx].x, 4),
            "y": round(raw_landmarks[idx].y, 4),
            "z": round(raw_landmarks[idx].z, 4),
            "visibility": round(getattr(raw_landmarks[idx], "visibility", 0.0) or 0.0, 4),
        }
        for idx, name in TRACKED_LANDMARKS.items()
    }


def _run_pose_landmarker(frame_iter, fps: float) -> tuple[list[dict], int]:
    frames_data = []
    detected_frames = 0

    with PoseLandmarker.create_from_options(_build_options()) as landmarker:
        for frame_idx, frame in frame_iter:
            timestamp_ms = int((frame_idx / fps) * 1000)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            result = landmarker.detect_for_video(mp_image, timestamp_ms)

            landmarks = None
            if result.pose_landmarks:
                detected_frames += 1
                landmarks = _extract_tracked_landmarks(result.pose_landmarks[0])

            frames_data.append({
                "frame_idx": frame_idx,
                "timestamp_ms": timestamp_ms,
                "landmarks": landmarks,
            })

    return frames_data, detected_frames


def _run_pose_solution(frame_iter, fps: float) -> tuple[list[dict], int]:
    frames_data = []
    detected_frames = 0
    pose_module = mp.solutions.pose

    with pose_module.Pose(
        static_image_mode=False,
        model_complexity=1,
        enable_segmentation=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as pose:
        for frame_idx, frame in frame_iter:
            timestamp_ms = int((frame_idx / fps) * 1000)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = pose.process(rgb)

            landmarks = None
            if result.pose_landmarks:
                detected_frames += 1
                landmarks = _extract_tracked_landmarks(result.pose_landmarks.landmark)

            frames_data.append({
                "frame_idx": frame_idx,
                "timestamp_ms": timestamp_ms,
                "landmarks": landmarks,
            })

    return frames_data, detected_frames


def run_pose_estimation(video_path: str, output_dir: str) -> dict:
    """
    Process *video_path* and write pose_landmarks.json to *output_dir*.

    Returns a summary dict:
      {
        "pose_data_path": str,
        "total_frames": int,
        "detected_frames": int,
        "detection_rate": float,
        "fps": float,
      }
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames_expected = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    all_frames = []
    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        all_frames.append((frame_idx, frame))
        frame_idx += 1

    cap.release()

    try:
        frames_data, detected_frames = _run_pose_landmarker(all_frames, fps)
    except RuntimeError as exc:
        logger.warning("PoseLandmarker failed, falling back to MediaPipe Pose: %s", exc)
        frames_data, detected_frames = _run_pose_solution(all_frames, fps)

    output_path = Path(output_dir) / "pose_landmarks.json"
    pose_doc = {
        "fps": fps,
        "total_frames": frame_idx,
        "detected_frames": detected_frames,
        "detection_rate": round(detected_frames / frame_idx, 4) if frame_idx else 0,
        "frames": frames_data,
    }
    output_path.write_text(json.dumps(pose_doc, separators=(",", ":")))

    logger.info(
        "Pose estimation complete: %d/%d frames detected (%.0f%%) → %s",
        detected_frames, frame_idx,
        100 * detected_frames / frame_idx if frame_idx else 0,
        output_path,
    )

    return {
        "pose_data_path": str(output_path),
        "total_frames": frame_idx,
        "detected_frames": detected_frames,
        "detection_rate": pose_doc["detection_rate"],
        "fps": fps,
    }
