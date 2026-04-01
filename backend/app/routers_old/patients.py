import uuid as _uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.patient import Patient
from app.models.assessment import Assessment
from app.schemas.patient import PatientCreate, PatientUpdate, PatientSummary, PatientDetail

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("/", response_model=PatientSummary, status_code=201)
async def create_patient(body: PatientCreate, db: AsyncSession = Depends(get_db)):
    patient = Patient(uuid=str(_uuid.uuid4()), **body.model_dump())
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    ps = PatientSummary.model_validate(patient)
    ps.assessment_count = 0
    return ps


@router.get("/", response_model=list[PatientSummary])
async def list_patients(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Patient, func.count(Assessment.id).label("cnt"))
        .outerjoin(Assessment, Assessment.patient_id == Patient.id)
        .group_by(Patient.id)
        .order_by(Patient.created_at.desc())
    )
    rows = (await db.execute(stmt)).all()
    result = []
    for patient, cnt in rows:
        ps = PatientSummary.model_validate(patient)
        ps.assessment_count = cnt
        result.append(ps)
    return result


@router.get("/{patient_uuid}", response_model=PatientDetail)
async def get_patient(patient_uuid: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Patient)
        .where(Patient.uuid == patient_uuid)
        .options(selectinload(Patient.assessments))
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    # Sort assessments newest-first (Python sort is fine at MVP scale)
    patient.assessments.sort(key=lambda a: a.created_at, reverse=True)
    return patient


@router.patch("/{patient_uuid}", response_model=PatientSummary)
async def update_patient(
    patient_uuid: str,
    body: PatientUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patient).where(Patient.uuid == patient_uuid))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    await db.commit()
    await db.refresh(patient)
    return PatientSummary.model_validate(patient)


@router.delete("/{patient_uuid}", status_code=204)
async def delete_patient(patient_uuid: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).where(Patient.uuid == patient_uuid))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    await db.delete(patient)
    await db.commit()
