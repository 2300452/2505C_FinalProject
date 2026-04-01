from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional, Any


class PatientCreate(BaseModel):
    name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    notes: Optional[str] = None


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    notes: Optional[str] = None


class PatientSummary(BaseModel):
    id: int
    uuid: str
    name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    assessment_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class PatientAssessmentItem(BaseModel):
    """Compact assessment row used inside PatientDetail."""
    uuid: str
    test_type: str
    status: str
    results: Optional[Any] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PatientDetail(BaseModel):
    id: int
    uuid: str
    name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    assessments: list[PatientAssessmentItem] = []

    model_config = ConfigDict(from_attributes=True)
