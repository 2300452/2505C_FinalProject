"""
Background task: runs pose estimation + test analysis after upload.
"""

import logging
from pathlib import Path

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.assessment import Assessment, AssessmentStatus, TestType
from app.services.pose_estimation import run_pose_estimation
from app.services.tug_analysis import analyse_tug
from app.services.ftsst_analysis import analyse_ftsst

logger = logging.getLogger(__name__)


async def run_analysis_task(assessment_uuid: str):
    """
    Status flow: uploaded → processing → completed / failed
    Steps:
      1. Pose estimation  — extract landmarks from all frames
      2. Test analysis    — detect phases and calculate timing (TUG or 5xSTS)
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Assessment).where(Assessment.uuid == assessment_uuid)
        )
        assessment = result.scalar_one_or_none()
        if not assessment:
            logger.error("Background task: assessment %s not found", assessment_uuid)
            return

        assessment.status = AssessmentStatus.PROCESSING
        await db.commit()

        try:
            upload_dir = str(Path(assessment.video_path).parent)

            # ── Step 1: pose estimation ───────────────────────────────────────
            pose_summary = run_pose_estimation(assessment.video_path, upload_dir)
            assessment.pose_data_path = pose_summary["pose_data_path"]

            # ── Step 2: test-specific analysis ───────────────────────────────
            analysis_result = None
            if assessment.test_type == TestType.TUG:
                tug = analyse_tug(pose_summary["pose_data_path"])
                analysis_result = tug.to_dict()
            elif assessment.test_type == TestType.FTSST:
                ftsst = analyse_ftsst(pose_summary["pose_data_path"])
                analysis_result = ftsst.to_dict()

            assessment.results = {
                "pose_summary": {
                    "total_frames":    pose_summary["total_frames"],
                    "detected_frames": pose_summary["detected_frames"],
                    "detection_rate":  pose_summary["detection_rate"],
                },
                "analysis": analysis_result,
            }
            assessment.status = AssessmentStatus.COMPLETED
            logger.info("Assessment %s completed (%s)", assessment_uuid, assessment.test_type)

        except Exception as exc:
            logger.exception("Analysis failed for %s: %s", assessment_uuid, exc)
            assessment.status = AssessmentStatus.FAILED
            assessment.results = {"error": str(exc)}

        await db.commit()
