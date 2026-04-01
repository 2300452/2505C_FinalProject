from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class TestType(str, enum.Enum):
    TUG = "TUG"
    FTSST = "5xSTS"


class AssessmentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, nullable=False, index=True)
    test_type = Column(SAEnum(TestType), nullable=False)
    original_filename = Column(String, nullable=False)
    video_path = Column(String, nullable=False)
    status = Column(SAEnum(AssessmentStatus), default=AssessmentStatus.UPLOADED)
    duration_seconds = Column(Float, nullable=True)
    fps = Column(Float, nullable=True)
    resolution = Column(String, nullable=True)
    pose_data_path = Column(String, nullable=True)
    results        = Column(JSON, nullable=True)
    patient_id     = Column(Integer, ForeignKey("patients.id"), nullable=True, index=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="assessments")
