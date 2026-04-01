from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Any
from app.models.assessment import TestType, AssessmentStatus


class PatientBasic(BaseModel):
    uuid: str
    name: str
    model_config = ConfigDict(from_attributes=True)


class AssessmentUploadResponse(BaseModel):
    id: int
    uuid: str
    test_type: TestType
    original_filename: str
    status: AssessmentStatus
    duration_seconds: Optional[float]
    fps: Optional[float]
    resolution: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssessmentDetail(AssessmentUploadResponse):
    pose_data_path: Optional[str] = None
    results: Optional[Any] = None
    updated_at: Optional[datetime] = None
    patient: Optional[PatientBasic] = None
