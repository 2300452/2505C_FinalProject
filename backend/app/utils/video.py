import cv2
from pathlib import Path


ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm"}


def validate_video_extension(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


def get_video_metadata(video_path: str) -> dict:
    cap = cv2.VideoCapture(video_path)
    try:
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = total_frames / fps if fps > 0 else 0
        return {
            "fps": round(fps, 2),
            "duration_seconds": round(duration, 2),
            "resolution": f"{width}x{height}",
            "total_frames": int(total_frames),
        }
    finally:
        cap.release()
