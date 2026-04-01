from sqlalchemy import Column, Integer, String, Date, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id         = Column(Integer, primary_key=True, index=True)
    uuid       = Column(String, unique=True, nullable=False, index=True)
    name       = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender     = Column(String, nullable=True)   # male | female | other | prefer_not_to_say
    notes      = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    assessments = relationship("Assessment", back_populates="patient")
