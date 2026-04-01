import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.config import settings
from app.models.assessment import Assessment, TestType, AssessmentStatus
from app.models.patient import Patient
from app.schemas.assessment import AssessmentUploadResponse, AssessmentDetail
from app.utils.video import validate_video_extension, get_video_metadata
from app.services.processing_task import run_analysis_task

router = APIRouter(prefix="/assessments", tags=["assessments"])


@router.post("/upload", response_model=AssessmentUploadResponse)
async def upload_video(
    background_tasks: BackgroundTasks,
    test_type: TestType = Form(...),
    file: UploadFile = File(...),
    patient_uuid: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    if not validate_video_extension(file.filename):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Allowed: .mp4, .mov, .avi, .webm",
        )

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum size of {settings.max_upload_size_mb}MB",
        )

    assessment_uuid = str(uuid.uuid4())
    upload_folder = Path(settings.upload_dir) / assessment_uuid
    upload_folder.mkdir(parents=True, exist_ok=True)

    suffix = Path(file.filename).suffix.lower()
    dest_path = upload_folder / f"original{suffix}"
    dest_path.write_bytes(content)

    metadata = get_video_metadata(str(dest_path))

    # Resolve optional patient link
    patient_id = None
    if patient_uuid:
        pr = await db.execute(select(Patient).where(Patient.uuid == patient_uuid))
        p = pr.scalar_one_or_none()
        if p:
            patient_id = p.id

    assessment = Assessment(
        uuid=assessment_uuid,
        test_type=test_type,
        original_filename=file.filename,
        video_path=str(dest_path),
        status=AssessmentStatus.UPLOADED,
        duration_seconds=metadata["duration_seconds"],
        fps=metadata["fps"],
        resolution=metadata["resolution"],
        patient_id=patient_id,
    )
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)

    background_tasks.add_task(run_analysis_task, assessment_uuid)

    return assessment


@router.get("/status/{assessment_uuid}")
async def get_status(assessment_uuid: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Assessment.status, Assessment.results)
        .where(Assessment.uuid == assessment_uuid)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return {"status": row.status, "results": row.results}


@router.get("/flagged", response_model=list[AssessmentDetail])
async def get_flagged_assessments(db: AsyncSession = Depends(get_db)):
    """Return all completed assessments where risk is concern or high_risk."""
    stmt = (
        select(Assessment)
        .where(
            Assessment.status == AssessmentStatus.COMPLETED,
            func.json_extract(Assessment.results, "$.analysis.risk_category").in_(
                ["concern", "high_risk"]
            ),
        )
        .options(selectinload(Assessment.patient))
        .order_by(Assessment.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{assessment_uuid}", response_model=AssessmentDetail)
async def get_assessment(assessment_uuid: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Assessment)
        .where(Assessment.uuid == assessment_uuid)
        .options(selectinload(Assessment.patient))
    )
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment


@router.get("/", response_model=list[AssessmentDetail])
async def list_assessments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Assessment).order_by(Assessment.created_at.desc())
    )
    return result.scalars().all()
