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


def create_browser_playable_video(source_path: str, output_path: str | None = None) -> str:
    source = Path(source_path)
    target = Path(output_path) if output_path else source.with_name("playable.mp4")

    cap = cv2.VideoCapture(str(source))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video for transcoding: {source}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    writer = None
    chosen_codec = None
    try:
        for codec in ("avc1", "H264", "mp4v"):
            candidate = cv2.VideoWriter(
                str(target),
                cv2.VideoWriter_fourcc(*codec),
                fps,
                (width, height),
            )
            if candidate.isOpened():
                writer = candidate
                chosen_codec = codec
                break
            candidate.release()

        if writer is None:
            raise RuntimeError("Could not initialize a browser-playable video writer.")

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            writer.write(frame)
    finally:
        cap.release()
        if writer is not None:
            writer.release()

    if not target.exists() or target.stat().st_size == 0:
        raise RuntimeError("Browser-playable video could not be created.")

    return str(target)
