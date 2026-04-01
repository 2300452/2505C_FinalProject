"""
Five-times Sit to Stand (5xSTS) analysis service.

Loads pose_landmarks.json and uses a state machine on the hip_knee_dy signal
to count sit→stand→sit repetition cycles and time each one.

Expected signal pattern (5 reps):
  initial_sit  |  rep1  |  rep2  |  rep3  |  rep4  |  rep5  |  final_sit
  hk_dy ≈ 0       peak      peak      peak      peak      peak      ≈ 0

Total time: from first rising (rep 1 start) to final seated (rep 5 complete).

Primary signal — hip_knee_dy (knee_y − hip_y, normalised image coords):
  ≈ 0.00–0.06  sitting   (legs horizontal)
  ≈ 0.14–0.22  standing  (legs vertical)
"""

import json
import logging
from dataclasses import dataclass, field

import numpy as np

logger = logging.getLogger(__name__)

# ── Thresholds ────────────────────────────────────────────────────────────────
SITTING_THRESHOLD  = 0.08
STANDING_THRESHOLD = 0.14
SMOOTH_WINDOW      = 7      # ~0.28 s at 25 fps
MIN_PHASE_FRAMES   = 6      # suppress noise shorter than this
EXPECTED_REPS      = 5

# ── Age-norm benchmarks (seconds) ─────────────────────────────────────────────
# Sources: Bohannon 2006; Csuka & McCarty 1985; CDC STEADI
NORMS = [
    {"max": 12.0, "category": "normal",    "label": "Normal (<=12 s)"},
    {"max": 16.0, "category": "concern",   "label": "Borderline - monitor (12-16 s)"},
    {"max": 999,  "category": "high_risk", "label": "Impaired mobility - refer (>16 s)"},
]


# ── Data classes ──────────────────────────────────────────────────────────────
@dataclass
class Repetition:
    rep_number: int
    rise_start_ms: int    # sit → stand transition
    stand_peak_ms: int    # peak hk_dy within the standing phase
    sit_complete_ms: int  # stand → sit transition (next sitting confirmed)
    duration_s: float


@dataclass
class FTSSTResult:
    total_time_s: float
    reps_detected: int
    repetitions: list[Repetition]
    risk_category: str
    risk_label: str
    norm_reference: str
    detection_rate: float
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "total_time_s":  self.total_time_s,
            "reps_detected": self.reps_detected,
            "repetitions": [
                {
                    "rep_number":     r.rep_number,
                    "rise_start_ms":  r.rise_start_ms,
                    "stand_peak_ms":  r.stand_peak_ms,
                    "sit_complete_ms": r.sit_complete_ms,
                    "duration_s":     r.duration_s,
                }
                for r in self.repetitions
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


def _classify_risk(total_s: float, reps: int) -> tuple[str, str]:
    if reps < EXPECTED_REPS:
        return "inconclusive", f"Only {reps}/{EXPECTED_REPS} repetitions detected"
    for norm in NORMS:
        if total_s <= norm["max"]:
            return norm["category"], norm["label"]
    return "high_risk", NORMS[-1]["label"]


# ── State machine ─────────────────────────────────────────────────────────────
def _run_state_machine(
    hk: np.ndarray,
    timestamps: np.ndarray,
    min_frames: int,
) -> list[dict]:
    """
    Walk the smoothed hk_dy signal and emit state-change events.

    Returns a list of segments:
      {"state": "sitting"|"standing", "start_idx": int, "end_idx": int}
    """
    n = len(hk)
    # Determine initial state
    state = "sitting" if hk[0] < SITTING_THRESHOLD else "standing"
    state_start = 0
    segments = []

    i = 1
    while i < n:
        if state == "sitting":
            # Look for sustained rise above STANDING_THRESHOLD
            if hk[i] > STANDING_THRESHOLD:
                end = min(i + min_frames, n)
                if np.mean(hk[i:end]) > STANDING_THRESHOLD * 0.88:
                    segments.append({"state": "sitting", "start_idx": state_start, "end_idx": i})
                    state = "standing"
                    state_start = i
        else:  # standing
            # Look for sustained drop below SITTING_THRESHOLD
            if hk[i] < SITTING_THRESHOLD:
                end = min(i + min_frames, n)
                if np.mean(hk[i:end]) < SITTING_THRESHOLD * 1.12:
                    segments.append({"state": "standing", "start_idx": state_start, "end_idx": i})
                    state = "sitting"
                    state_start = i
        i += 1

    segments.append({"state": state, "start_idx": state_start, "end_idx": n - 1})
    return segments


# ── Signal extraction ─────────────────────────────────────────────────────────
def _extract_signals(frames: list[dict]) -> tuple[np.ndarray, np.ndarray]:
    tss, hk_dy = [], []
    for fr in frames:
        lm = fr["landmarks"]
        if lm is None:
            continue
        hip_y  = (lm["left_hip"]["y"]   + lm["right_hip"]["y"])  / 2
        knee_y = (lm["left_knee"]["y"]  + lm["right_knee"]["y"]) / 2
        tss.append(fr["timestamp_ms"])
        hk_dy.append(knee_y - hip_y)
    return np.array(tss, dtype=float), np.array(hk_dy)


# ── Main entry point ──────────────────────────────────────────────────────────
def analyse_ftsst(pose_data_path: str) -> FTSSTResult:
    with open(pose_data_path) as f:
        data = json.load(f)

    fps             = data["fps"]
    total_frames    = data["total_frames"]
    detected_frames = data["detected_frames"]
    detection_rate  = round(detected_frames / total_frames, 3) if total_frames else 0
    notes: list[str] = []

    timestamps, hk_raw = _extract_signals(data["frames"])

    if len(timestamps) < 30:
        raise ValueError("Too few detected frames to analyse 5xSTS test.")

    hk = _smooth(hk_raw, SMOOTH_WINDOW)
    n  = len(timestamps)

    def ts(idx: int) -> int:
        return int(timestamps[max(0, min(idx, n - 1))])

    # ── Run state machine ────────────────────────────────────────────────────
    segments = _run_state_machine(hk, timestamps, MIN_PHASE_FRAMES)

    stand_segs = [s for s in segments if s["state"] == "standing"]
    sit_segs   = [s for s in segments if s["state"] == "sitting"]

    reps_found = len(stand_segs)

    if reps_found == 0:
        raise ValueError("No standing phase detected. Check video orientation and visibility.")

    if reps_found != EXPECTED_REPS:
        notes.append(
            f"Expected {EXPECTED_REPS} repetitions, detected {reps_found}. "
            "Results may be incomplete."
        )

    # ── Build per-rep data ───────────────────────────────────────────────────
    # Each rep: rise_start = start of standing segment
    #           sit_complete = end of the *next* sitting segment
    repetitions: list[Repetition] = []

    for i, stand in enumerate(stand_segs):
        rise_start_idx  = stand["start_idx"]
        stand_end_idx   = stand["end_idx"]

        # Peak hk_dy within standing phase
        seg_hk = hk[rise_start_idx:stand_end_idx + 1]
        peak_offset = int(np.argmax(seg_hk)) if len(seg_hk) else 0
        stand_peak_idx = rise_start_idx + peak_offset

        # sit_complete = moment the person returns to sitting after this rep
        # = start_idx of the next sitting segment (the transition point itself)
        following_sits = [s for s in sit_segs if s["start_idx"] >= stand_end_idx]
        if following_sits:
            sit_complete_idx = following_sits[0]["start_idx"]
        else:
            sit_complete_idx = stand_end_idx  # fallback

        rise_start_ms   = ts(rise_start_idx)
        stand_peak_ms   = ts(stand_peak_idx)
        sit_complete_ms = ts(sit_complete_idx)
        duration_s      = round((sit_complete_ms - rise_start_ms) / 1000, 2)

        repetitions.append(Repetition(
            rep_number      = i + 1,
            rise_start_ms   = rise_start_ms,
            stand_peak_ms   = stand_peak_ms,
            sit_complete_ms = sit_complete_ms,
            duration_s      = duration_s,
        ))

    # ── Total time: rep1 rise_start → rep_last sit_complete ──────────────────
    reps_to_count = repetitions[:EXPECTED_REPS]
    total_start_ms = reps_to_count[0].rise_start_ms
    total_end_ms   = reps_to_count[-1].sit_complete_ms
    total_time_s   = round((total_end_ms - total_start_ms) / 1000, 2)

    risk_cat, risk_label = _classify_risk(total_time_s, reps_found)

    logger.info(
        "5xSTS analysis complete — reps=%d  total=%.2fs  risk=%s",
        reps_found, total_time_s, risk_cat,
    )

    return FTSSTResult(
        total_time_s  = total_time_s,
        reps_detected = reps_found,
        repetitions   = reps_to_count,
        risk_category = risk_cat,
        risk_label    = risk_label,
        norm_reference= "Bohannon 2006; Csuka & McCarty 1985; CDC STEADI",
        detection_rate= detection_rate,
        notes         = notes,
    )
