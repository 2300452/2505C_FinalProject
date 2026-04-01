from datetime import date, time
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    role: str
    email: EmailStr
    password: str


class PatientSignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    dob: date | None = None
    phone: str | None = None


class DoctorCreateRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str | None = None
    specialty: str | None = None


class ForceResetRequest(BaseModel):
    user_id: int
    temporary_password: str


class ForgotPasswordRequest(BaseModel):
    role: str
    email: EmailStr


class ChangePasswordRequest(BaseModel):
    user_id: int
    new_password: str


class UserProfileUpdateRequest(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    dob: date | None = None
    specialty: str | None = None


class AppointmentCreateRequest(BaseModel):
    patient_user_id: int
    doctor_user_id: int | None = None
    appointment_date: date
    appointment_time: time


class AppointmentRescheduleRequest(BaseModel):
    appointment_id: int
    appointment_date: date
    appointment_time: time


class NoteCreateRequest(BaseModel):
    medical_record_id: int
    doctor_user_id: int
    note_text: str


class MedicalRecordCreateRequest(BaseModel):
    patient_user_id: int
    doctor_user_id: int | None = None
    test_type: str
    file_name: str | None = None
    result: str | None = None
    stand_time: float | None = None
    walk_time: float | None = None
    sit_time: float | None = None
