from datetime import date, time
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    portal: str


class PatientSignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    dob: date | None = None
    gender: str | None = None
    phone: str | None = None
    allergies: str | None = None
    existing_conditions: str | None = None


class DoctorCreateRequest(BaseModel):
    role: str = "Doctor"
    name: str
    email: EmailStr
    password: str
    phone: str | None = None
    specialty: str | None = None
    designation: str | None = None
    reports_to_user_id: int | None = None


class ForceResetRequest(BaseModel):
    user_id: int
    temporary_password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    portal: str


class ChangePasswordRequest(BaseModel):
    user_id: int
    new_password: str


class UserProfileUpdateRequest(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    dob: date | None = None
    gender: str | None = None
    allergies: str | None = None
    existing_conditions: str | None = None
    specialty: str | None = None
    designation: str | None = None
    reports_to_user_id: int | None = None


class AppointmentCreateRequest(BaseModel):
    patient_user_id: int
    doctor_user_id: int | None = None
    appointment_date: date
    appointment_time: time


class AppointmentRescheduleRequest(BaseModel):
    appointment_id: int
    appointment_date: date
    appointment_time: time


class AppointmentStatusUpdateRequest(BaseModel):
    appointment_id: int
    doctor_user_id: int
    status: str


class ConsultationMedicationItem(BaseModel):
    medication_name: str
    dosage: str | None = None
    frequency: str | None = None
    duration: str | None = None
    instructions: str | None = None


class ConsultationSaveRequest(BaseModel):
    doctor_user_id: int
    medical_record_id: int | None = None
    symptoms: str | None = None
    duration: str | None = None
    pain_level: int | None = None
    patient_complaints: str | None = None
    blood_pressure: str | None = None
    heart_rate: str | None = None
    physical_findings: str | None = None
    diagnosis: str | None = None
    condition_severity: str | None = None
    assessment_notes: str | None = None
    medications: list[ConsultationMedicationItem] = []
    follow_up_date: date | None = None
    priority: str | None = None
    notes_to_patient: str | None = None
    alert_flags: list[str] = []


class NoteCreateRequest(BaseModel):
    medical_record_id: int
    doctor_user_id: int
    note_text: str


class RecordAlertActionRequest(BaseModel):
    doctor_user_id: int
    action: str


class MedicalRecordCreateRequest(BaseModel):
    patient_user_id: int
    doctor_user_id: int | None = None
    test_type: str
    file_name: str | None = None
    result: str | None = None
    stand_time: float | None = None
    walk_time: float | None = None
    sit_time: float | None = None


class RecycleUserRequest(BaseModel):
    user_id: int


class RestoreUserRequest(BaseModel):
    user_id: int
