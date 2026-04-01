"""
TUG (Timed Up and Go) analysis service.

Detects six phases of the TUG test from pose_landmarks.json:
  1. initial_sit   – seated before test
  2. rising        – stands up from chair
  3. walk_forward  – walks toward the 3-metre mark
  4. turn          – turns 180° at the mark
  5. walk_back     – walks back toward the chair
  6. sit_down      – sits back down

Timing: rising begins → sitting complete (hk_dy back below SITTING_THRESHOLD).

Primary signal — hip_knee_dy (knee_y − hip_y, normalised image coords):
  ≈ 0.00–0.06  sitting   (legs horizontal)
  ≈ 0.14–0.22  standing  (legs vertical)
"""

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# ── Thresholds ────────────────────────────────────────────────────────────────
SITTING_THRESHOLD  = 0.08   # hk_dy below this  → clearly sitting
STANDING_THRESHOLD = 0.14   # hk_dy above this  → clearly standing
SMOOTH_WINDOW      = 7      # Gaussian moving-average width (~0.28 s at 25 fps)
MIN_PHASE_FRAMES   = 6      # minimum frames for a transition to count

# ── Age-norm benchmarks (seconds) ─────────────────────────────────────────────
# Source: Podsiadlo & Richardson 1991; Bohannon 2006; CDC STEADI tool
NORMS = [
    {"max": 12.0, "category": "normal",    "label": "Normal mobility (<=12 s)"},
    {"max": 20.0, "category": "concern",   "label": "Increased fall risk (12-20 s)"},
    {"max": 999,  "category": "high_risk", "label": "High fall risk - refer (>20 s)"},
]


# ── Data classes ──────────────────────────────────────────────────────────────
@dataclass
class Phase:
    name: str
    start_ms: int
    end_ms: int

    @property
    def duration_s(self) -> float:
        return round((self.end_ms - self.start_ms) / 1000, 2)


@dataclass
class TUGResult:
    total_time_s: float
    phases: list[Phase]
    risk_category: str
    risk_label: str
    norm_reference: str
    detection_rate: float
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "total_time_s": self.total_time_s,
            "phases": [
                {
                    "name":       p.name,
                    "start_ms":   p.start_ms,
                    "end_ms":     p.end_ms,
                    "duration_s": p.duration_s,
                }
                for p in self.phases
            ],
            "risk_category":  self.risk_category,
            "risk_label":     self.risk_label,
            "norm_reference": self.norm_reference,
            "detection_rate": self.detection_rate,
            "notes":          self.notes,
        }


# ── Helpers ───────────────────────────────────────────────────────────────────
def _smooth(signal: np.ndarray, window: int) -> np.ndarray:
    if len(signal) < window:
        return signal.copy()
    k = np.exp(-0.5 * np.linspace(-2, 2, window) ** 2)
    k /= k.sum()
    return np.convolve(signal, k, mode="same")


def _first_up_crossing(signal: np.ndarray, threshold: float, start: int = 0, min_frames: int = 4) -> Optional[int]:
    """First index where signal rises above threshold and stays for min_frames."""
    n = len(signal)
    for i in range(start, n - min_frames):
        if signal[i] >= threshold and np.mean(signal[i: i + min_frames]) >= threshold * 0.90:
            return i
    return None


def _first_down_crossing(signal: np.ndarray, threshold: float, start: int = 0, min_frames: int = 4) -> Optional[int]:
    """First index (from start) where signal drops below threshold and stays."""
    n = len(signal)
    for i in range(start, n - min_frames):
        if signal[i] <= threshold and np.mean(signal[i: i + min_frames]) <= threshold * 1.10:
            return i
    return None


def _last_above(signal: np.ndarray, threshold: float, start: int = 0) -> Optional[int]:
    """Last index (from start onward) where signal is above threshold."""
    above = np.where(signal[start:] > threshold)[0]
    return int(start + above[-1]) if len(above) else None


def _find_turn_index(nose_x: np.ndarray, walk_start: int, walk_end: int) -> int:
    """
    Locate the 180° turn: the point where nose_x reverses from decreasing to increasing
    (or increasing to decreasing — handles left-facing and right-facing layouts).
    Falls back to the extremum if no clean sign flip is found.
    """
    seg = nose_x[walk_start:walk_end]
    if len(seg) < 4:
        return walk_start + len(seg) // 2

    vel = np.gradient(seg)
    vel_smooth = _smooth(vel, 5)

    # Detect left→right flip (nose_x goes from decreasing to increasing)
    for i in range(2, len(vel_smooth) - 2):
        if vel_smooth[i - 2] < -0.002 and vel_smooth[i + 2] > 0.002:
            return walk_start + i
    # Detect right→left flip
    for i in range(2, len(vel_smooth) - 2):
        if vel_smooth[i - 2] > 0.002 and vel_smooth[i + 2] < -0.002:
            return walk_start + i

    # Fallback: extremum of nose_x
    return walk_start + int(np.argmin(seg)) if seg[0] > seg[-1] else walk_start + int(np.argmax(seg))


def _classify_risk(total_s: float) -> tuple[str, str]:
    for norm in NORMS:
        if total_s <= norm["max"]:
            return norm["category"], norm["label"]
    return "high_risk", NORMS[-1]["label"]


# ── Signal extraction ─────────────────────────────────────────────────────────
def _extract_signals(frames: list[dict]) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    idxs, tss, hk_dy, nx = [], [], [], []
    for fr in frames:
        lm = fr["landmarks"]
        if lm is None:
            continue
        hip_y  = (lm["left_hip"]["y"]   + lm["right_hip"]["y"])  / 2
        knee_y = (lm["left_knee"]["y"]  + lm["right_knee"]["y"]) / 2
        idxs.append(fr["frame_idx"])
        tss.append(fr["timestamp_ms"])
        hk_dy.append(knee_y - hip_y)
        nx.append(lm["nose"]["x"])
    return (
        np.array(idxs),
        np.array(tss, dtype=float),
        np.array(hk_dy),
        np.array(nx),
    )


# ── Main entry point ──────────────────────────────────────────────────────────
def analyse_tug(pose_data_path: str) -> TUGResult:
    with open(pose_data_path) as f:
        data = json.load(f)

    fps             = data["fps"]
    total_frames    = data["total_frames"]
    detected_frames = data["detected_frames"]
    detection_rate  = round(detected_frames / total_frames, 3) if total_frames else 0

    _, timestamps, hk_dy_raw, nose_x_raw = _extract_signals(data["frames"])
    notes: list[str] = []

    if len(timestamps) < 30:
        raise ValueError("Too few detected frames to analyse TUG test.")

    hk_dy  = _smooth(hk_dy_raw,  SMOOTH_WINDOW)
    nose_x = _smooth(nose_x_raw, SMOOTH_WINDOW)

    n = len(timestamps)

    # ── Phase 1 end / Phase 2 start: first deviation above SITTING_THRESHOLD ──
    # This marks when the person begins to unweight from the chair.
    rise_start_idx = _first_up_crossing(hk_dy, SITTING_THRESHOLD, start=0, min_frames=MIN_PHASE_FRAMES)
    if rise_start_idx is None:
        rise_start_idx = 0
        notes.append("Rising start not clearly detected; defaulting to first frame.")

    # ── Phase 2 end: hk_dy crosses STANDING_THRESHOLD (fully upright) ─────────
    rise_end_idx = _first_up_crossing(hk_dy, STANDING_THRESHOLD, start=rise_start_idx, min_frames=MIN_PHASE_FRAMES)
    if rise_end_idx is None:
        rise_end_idx = rise_start_idx + MIN_PHASE_FRAMES
        notes.append("Rise-complete not clearly detected.")

    # ── Phase 5/6 boundary: last frame clearly in STANDING range ────────────────
    # The person is standing during the entire walk; after the last standing frame
    # they begin to sit. Search forward from there for the sit thresholds.
    last_standing_idx = _last_above(hk_dy, STANDING_THRESHOLD, start=rise_end_idx)
    if last_standing_idx is None or last_standing_idx <= rise_end_idx:
        last_standing_idx = n - MIN_PHASE_FRAMES * 3
        notes.append("End-of-standing not clearly detected.")

    # sit_down_start: first frame below STANDING_THRESHOLD after last standing
    sit_down_start_idx = last_standing_idx + 1

    # sit_done: first sustained drop below SITTING_THRESHOLD after sit_down_start
    sit_done_idx = _first_down_crossing(hk_dy, SITTING_THRESHOLD, start=sit_down_start_idx, min_frames=MIN_PHASE_FRAMES)
    if sit_done_idx is None:
        sit_done_idx = min(sit_down_start_idx + MIN_PHASE_FRAMES * 3, n - 1)
        notes.append("Sit-complete not clearly detected.")

    # ── Phase 4: turn — nose_x direction reversal in walk window ──────────────
    walk_window_start = rise_end_idx
    walk_window_end   = last_standing_idx
    turn_idx = _find_turn_index(nose_x, walk_window_start, walk_window_end)

    # Turn is a brief moment; give it a fixed window of ~8 frames (≈0.32 s)
    turn_frames = max(4, int(fps * 0.32))
    turn_end_idx = min(turn_idx + turn_frames, walk_window_end)

    # ── Convert indices to timestamps ─────────────────────────────────────────
    def ts(idx: int) -> int:
        return int(timestamps[max(0, min(idx, n - 1))])

    # ── TUG total time ────────────────────────────────────────────────────────
    total_time_s  = round((ts(sit_done_idx) - ts(rise_start_idx)) / 1000, 2)
    risk_cat, risk_label = _classify_risk(total_time_s)

    phases = [
        Phase("initial_sit",  ts(0),                  ts(rise_start_idx)),
        Phase("rising",       ts(rise_start_idx),      ts(rise_end_idx)),
        Phase("walk_forward", ts(rise_end_idx),         ts(turn_idx)),
        Phase("turn",         ts(turn_idx),             ts(turn_end_idx)),
        Phase("walk_back",    ts(turn_end_idx),         ts(sit_down_start_idx)),
        Phase("sit_down",     ts(sit_down_start_idx),   ts(sit_done_idx)),
    ]

    logger.info(
        "TUG analysis complete — total=%.2fs  risk=%s  phases=%s",
        total_time_s, risk_cat,
        [(p.name, p.duration_s) for p in phases],
    )

    return TUGResult(
        total_time_s  = total_time_s,
        phases        = phases,
        risk_category = risk_cat,
        risk_label    = risk_label,
        norm_reference= "Podsiadlo & Richardson 1991; Bohannon 2006; CDC STEADI",
        detection_rate= detection_rate,
        notes         = notes,
    )
