from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, Time
from sqlalchemy.sql import func
from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    generated_id = Column(String(20), unique=True, nullable=False, index=True)
    role = Column(String(20), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(30), nullable=True)
    dob = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    allergies = Column(Text, nullable=True)
    existing_conditions = Column(Text, nullable=True)
    specialty = Column(String(100), nullable=True)
    designation = Column(String(100), nullable=True)
    reports_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    must_change_password = Column(Boolean, default=False)
    is_root_admin = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(Time, nullable=False)
    status = Column(String(50), default="Booked")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    test_type = Column(String(50), nullable=False)
    file_name = Column(String(255), nullable=True)
    result = Column(String(20), nullable=True)
    stand_time = Column(Numeric(5, 2), nullable=True)
    walk_time = Column(Numeric(5, 2), nullable=True)
    sit_time = Column(Numeric(5, 2), nullable=True)
    video_path = Column(Text, nullable=True)
    duration_seconds = Column(Numeric(8, 2), nullable=True)
    fps = Column(Numeric(8, 2), nullable=True)
    resolution = Column(String(50), nullable=True)
    analysis_json = Column(Text, nullable=True)
    alert_status = Column(String(50), nullable=True)
    follow_up_action = Column(String(100), nullable=True)
    follow_up_due_date = Column(Date, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RecordNote(Base):
    __tablename__ = "record_notes"

    id = Column(Integer, primary_key=True, index=True)
    medical_record_id = Column(Integer, ForeignKey("medical_records.id"), nullable=False)
    doctor_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False, unique=True)
    patient_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    medical_record_id = Column(Integer, ForeignKey("medical_records.id"), nullable=True)
    symptoms = Column(Text, nullable=True)
    duration = Column(String(100), nullable=True)
    pain_level = Column(Integer, nullable=True)
    patient_complaints = Column(Text, nullable=True)
    blood_pressure = Column(String(50), nullable=True)
    heart_rate = Column(String(50), nullable=True)
    physical_findings = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)
    condition_severity = Column(String(50), nullable=True)
    assessment_notes = Column(Text, nullable=True)
    medications_json = Column(Text, nullable=True)
    follow_up_date = Column(Date, nullable=True)
    priority = Column(String(20), nullable=True)
    notes_to_patient = Column(Text, nullable=True)
    alert_flags_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
