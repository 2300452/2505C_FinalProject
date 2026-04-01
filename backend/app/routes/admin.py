from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Appointment, MedicalRecord, RecordNote, User
from ..api_schemas import (
    AppointmentRescheduleRequest,
    DoctorCreateRequest,
    ForceResetRequest,
    RecycleUserRequest,
    RestoreUserRequest,
    UserProfileUpdateRequest,
)
from ..security import hash_password

router = APIRouter(prefix="/admin", tags=["admin"])


def next_staff_id(db: Session, role: str) -> str:
    prefix = "ADM" if role == "Admin" else "DOC"
    seed = 2 if role == "Admin" else 11
    users = db.query(User).filter(User.role == role).all()
    nums = []
    for user in users:
        if user.generated_id and user.generated_id.startswith(prefix):
            try:
                nums.append(int(user.generated_id.replace(prefix, "")))
            except ValueError:
                pass
    return f"{prefix}{(max(nums) + 1) if nums else seed:02d}" if role == "Admin" else f"{prefix}{(max(nums) + 1) if nums else seed}"


def attach_reports_to(users: list[User], db: Session) -> None:
    report_ids = {user.reports_to_user_id for user in users if user.reports_to_user_id}
    reports = {}
    if report_ids:
        reports = {
            report.id: report
            for report in db.query(User).filter(User.id.in_(report_ids)).all()
        }
    for user in users:
        user._report_to_user = reports.get(user.reports_to_user_id)


def serialize_user(user: User) -> dict:
    report_to = getattr(user, "_report_to_user", None)
    return {
        "id": user.id,
        "generatedId": user.generated_id,
        "role": user.role,
        "name": user.name,
        "email": user.email,
        "phone": user.phone or "",
        "dob": user.dob.isoformat() if user.dob else "",
        "age": calculate_age(user.dob),
        "gender": user.gender or "",
        "allergies": user.allergies or "",
        "existingConditions": user.existing_conditions or "",
        "specialty": user.specialty or "",
        "designation": user.designation or "",
        "reportsToUserId": user.reports_to_user_id,
        "reportsToName": report_to.name if report_to else "",
        "reportsToGeneratedId": report_to.generated_id if report_to else "",
        "mustChangePassword": user.must_change_password,
        "isRootAdmin": user.is_root_admin,
        "isDeleted": user.is_deleted,
        "deletedAt": user.deleted_at.isoformat() if user.deleted_at else None,
    }


def calculate_age(dob) -> int | None:
    if not dob:
        return None
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def serialize_appointment(appointment: Appointment, users_by_id: dict[int, User]) -> dict:
    patient = users_by_id.get(appointment.patient_user_id)
    doctor = users_by_id.get(appointment.doctor_user_id) if appointment.doctor_user_id else None
    return {
        "id": appointment.id,
        "patientId": appointment.patient_user_id,
        "patientGeneratedId": patient.generated_id if patient else "",
        "patientName": patient.name if patient else "Unknown",
        "doctorId": appointment.doctor_user_id or "",
        "doctorGeneratedId": doctor.generated_id if doctor else "",
        "doctorName": doctor.name if doctor else "Unassigned",
        "date": appointment.appointment_date.isoformat(),
        "time": appointment.appointment_time.strftime("%H:%M"),
        "status": appointment.status,
        "createdAt": appointment.created_at.isoformat() if appointment.created_at else None,
    }


def serialize_note(note: RecordNote, doctor: User | None) -> dict:
    return {
        "id": note.id,
        "doctorId": note.doctor_user_id,
        "doctorGeneratedId": doctor.generated_id if doctor else "",
        "doctorName": doctor.name if doctor else "Unknown",
        "text": note.note_text,
        "createdAt": note.created_at.isoformat() if note.created_at else None,
    }


def serialize_record(
    record: MedicalRecord,
    users_by_id: dict[int, User],
    notes_by_record_id: dict[int, list[RecordNote]],
) -> dict:
    patient = users_by_id.get(record.patient_user_id)
    doctor = users_by_id.get(record.doctor_user_id) if record.doctor_user_id else None
    notes = notes_by_record_id.get(record.id, [])
    return {
        "id": record.id,
        "patientId": record.patient_user_id,
        "patientGeneratedId": patient.generated_id if patient else "",
        "patientName": patient.name if patient else "Unknown",
        "doctorId": record.doctor_user_id or "",
        "doctorGeneratedId": doctor.generated_id if doctor else "",
        "doctorName": doctor.name if doctor else "Not Assigned",
        "testType": record.test_type,
        "fileName": record.file_name or "",
        "result": record.result or "",
        "standTime": float(record.stand_time) if record.stand_time is not None else None,
        "walkTime": float(record.walk_time) if record.walk_time is not None else None,
        "sitTime": float(record.sit_time) if record.sit_time is not None else None,
        "createdAt": record.created_at.isoformat() if record.created_at else None,
        "notes": [
            serialize_note(note, users_by_id.get(note.doctor_user_id))
            for note in notes
        ],
    }


def attach_role_specific_fields(user: User, payload: UserProfileUpdateRequest, db: Session) -> None:
    user.name = payload.name.strip() if payload.name is not None else user.name
    user.email = payload.email if payload.email is not None else user.email
    user.phone = payload.phone if payload.phone is not None else user.phone
    if payload.gender is not None:
        user.gender = payload.gender.strip() or None
    if payload.allergies is not None:
        user.allergies = payload.allergies.strip() or None
    if payload.existing_conditions is not None:
        user.existing_conditions = payload.existing_conditions.strip() or None

    if user.role == "Patient":
        if payload.dob is not None:
            user.dob = payload.dob
        user.specialty = None
        user.designation = None
        user.reports_to_user_id = None
        return

    if payload.specialty is not None:
        user.specialty = payload.specialty.strip() if user.role == "Doctor" else None
    elif user.role != "Doctor":
        user.specialty = None

    if payload.designation is not None:
        designation = payload.designation.strip()
        user.designation = designation or None

    if payload.reports_to_user_id is not None:
        if payload.reports_to_user_id == user.id:
            raise HTTPException(status_code=400, detail="A user cannot report to themselves.")
        if payload.reports_to_user_id:
            report_to = db.query(User).filter(
                User.id == payload.reports_to_user_id,
                User.is_deleted.is_(False),
                User.role.in_(["Admin", "Doctor"]),
            ).first()
            if not report_to:
                raise HTTPException(status_code=404, detail="Reporting manager not found.")
        user.reports_to_user_id = payload.reports_to_user_id

    if user.role == "Admin":
        user.specialty = None


def validate_appointment_slot(slot_time) -> None:
    if slot_time.minute not in {0, 30} or slot_time.second != 0:
        raise HTTPException(
            status_code=400,
            detail="Appointments must be booked in 30-minute intervals.",
        )


def ensure_slot_is_available(db: Session, appointment_date, appointment_time, exclude_appointment_id: int | None = None) -> None:
    query = db.query(Appointment).filter(
        Appointment.appointment_date == appointment_date,
        Appointment.appointment_time == appointment_time,
        Appointment.status.in_(["Booked", "Rescheduled"]),
    )
    if exclude_appointment_id is not None:
        query = query.filter(Appointment.id != exclude_appointment_id)
    if query.first():
        raise HTTPException(
            status_code=400,
            detail="This appointment slot is already taken. Please choose another 30-minute slot.",
        )


@router.post("/users")
def create_staff_user(payload: DoctorCreateRequest, db: Session = Depends(get_db)):
    role = payload.role.strip().title()
    if role not in {"Doctor", "Admin"}:
        raise HTTPException(status_code=400, detail="Only Doctor or Admin accounts can be created here.")

    existing = db.query(User).filter(User.email == payload.email, User.is_deleted.is_(False)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    recycled = db.query(User).filter(User.email == payload.email, User.is_deleted.is_(True)).first()
    if recycled:
        raise HTTPException(status_code=400, detail="This email belongs to a recycled account. Restore it instead.")

    report_to = None
    if payload.reports_to_user_id:
        report_to = db.query(User).filter(
            User.id == payload.reports_to_user_id,
            User.is_deleted.is_(False),
        ).first()
        if not report_to:
            raise HTTPException(status_code=404, detail="Reporting manager not found.")

    designation = (payload.designation or "").strip()
    if not designation:
        designation = "Medical Officer" if role == "Doctor" else "Operations Admin"

    user = User(
        generated_id=next_staff_id(db, role),
        role=role,
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        phone=payload.phone,
        specialty=payload.specialty if role == "Doctor" else None,
        designation=designation,
        reports_to_user_id=payload.reports_to_user_id,
        must_change_password=False,
        is_root_admin=False,
        is_deleted=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    user._report_to_user = report_to
    return serialize_user(user)


@router.get("/users")
def list_users(include_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(User)
    if not include_deleted:
        query = query.filter(User.is_deleted.is_(False))
    users = query.filter(
        User.role.in_(["Admin", "Doctor", "Patient"]),
        User.is_root_admin.is_(False),
    ).order_by(User.created_at.desc()).all()
    attach_reports_to(users, db)
    return [serialize_user(user) for user in users]


@router.get("/users/{user_id}/profile")
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_deleted.is_(False)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    attach_reports_to([user], db)

    if user.role == "Doctor":
        appointments = (
            db.query(Appointment)
            .filter(Appointment.doctor_user_id == user.id)
            .order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
            .all()
        )
        records = (
            db.query(MedicalRecord)
            .filter(MedicalRecord.doctor_user_id == user.id)
            .order_by(MedicalRecord.created_at.desc())
            .all()
        )
    elif user.role == "Patient":
        appointments = (
            db.query(Appointment)
            .filter(Appointment.patient_user_id == user.id)
            .order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
            .all()
        )
        records = (
            db.query(MedicalRecord)
            .filter(MedicalRecord.patient_user_id == user.id)
            .order_by(MedicalRecord.created_at.desc())
            .all()
        )
    else:
        appointments = []
        records = []

    appointment_user_ids = {
        appointment.patient_user_id for appointment in appointments
    } | {
        appointment.doctor_user_id for appointment in appointments if appointment.doctor_user_id
    }
    appointment_users = {
        item.id: item for item in db.query(User).filter(User.id.in_(appointment_user_ids)).all()
    } if appointment_user_ids else {}

    record_user_ids = {record.patient_user_id for record in records} | {
        record.doctor_user_id for record in records if record.doctor_user_id
    }
    record_users = {
        item.id: item for item in db.query(User).filter(User.id.in_(record_user_ids)).all()
    } if record_user_ids else {}

    record_ids = [record.id for record in records]
    notes = (
        db.query(RecordNote)
        .filter(RecordNote.medical_record_id.in_(record_ids))
        .order_by(RecordNote.created_at.asc())
        .all()
    ) if record_ids else []
    notes_by_record_id: dict[int, list[RecordNote]] = {}
    for note in notes:
        notes_by_record_id.setdefault(note.medical_record_id, []).append(note)

    return {
        "user": serialize_user(user),
        "appointments": [serialize_appointment(item, appointment_users) for item in appointments],
        "records": [serialize_record(item, record_users, notes_by_record_id) for item in records],
    }


@router.patch("/users/{user_id}")
def update_user_profile(user_id: int, payload: UserProfileUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_deleted.is_(False)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.is_root_admin:
        raise HTTPException(status_code=403, detail="Root admin cannot be edited here.")

    if payload.email and payload.email != user.email:
        existing = db.query(User).filter(
            User.email == payload.email,
            User.id != user_id,
            User.is_deleted.is_(False),
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="A user with this email already exists.")

    attach_role_specific_fields(user, payload, db)
    db.commit()
    db.refresh(user)
    attach_reports_to([user], db)
    return serialize_user(user)


@router.post("/force-reset")
def force_reset(payload: ForceResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id, User.is_deleted.is_(False)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(payload.temporary_password)
    user.must_change_password = True
    db.commit()

    return {
        "id": user.id,
        "name": user.name,
        "temporaryPassword": payload.temporary_password,
    }


@router.post("/users/recycle")
def recycle_user(payload: RecycleUserRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id, User.is_deleted.is_(False)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_root_admin:
        raise HTTPException(status_code=403, detail="Root admin cannot be recycled.")

    user.is_deleted = True
    user.deleted_at = datetime.now(timezone.utc)

    appointments = db.query(Appointment).filter(Appointment.doctor_user_id == user.id).all()
    for appointment in appointments:
        appointment.doctor_user_id = None

    db.commit()
    return {"message": "User moved to archived accounts."}


@router.post("/users/restore")
def restore_user(payload: RestoreUserRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id, User.is_deleted.is_(True)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_deleted = False
    user.deleted_at = None
    db.commit()
    return {"message": "User restored successfully."}


@router.delete("/users/{user_id}")
def permanently_delete_user(user_id: int, actor_user_id: int, db: Session = Depends(get_db)):
    actor = db.query(User).filter(User.id == actor_user_id, User.is_deleted.is_(False)).first()
    if not actor or not actor.is_root_admin:
        raise HTTPException(status_code=403, detail="Only the root admin can permanently delete users.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_root_admin:
        raise HTTPException(status_code=403, detail="Root admin cannot be permanently deleted.")

    appointments = db.query(Appointment).filter(Appointment.doctor_user_id == user.id).all()
    for appointment in appointments:
        appointment.doctor_user_id = None

    patient_appointments = db.query(Appointment).filter(Appointment.patient_user_id == user.id).count()
    doctor_records = db.query(MedicalRecord).filter(MedicalRecord.doctor_user_id == user.id).count()
    patient_records = db.query(MedicalRecord).filter(MedicalRecord.patient_user_id == user.id).count()
    doctor_notes = db.query(RecordNote).filter(RecordNote.doctor_user_id == user.id).count()
    if patient_appointments or doctor_records or patient_records or doctor_notes:
        raise HTTPException(
            status_code=400,
            detail="This user still has linked appointments or records and cannot be permanently deleted.",
        )

    db.delete(user)
    db.commit()
    return {"message": "User permanently deleted."}


@router.post("/appointments/reschedule")
def reschedule_appointment(payload: AppointmentRescheduleRequest, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.id == payload.appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    validate_appointment_slot(payload.appointment_time)
    ensure_slot_is_available(
        db,
        payload.appointment_date,
        payload.appointment_time,
        exclude_appointment_id=appointment.id,
    )

    appointment.appointment_date = payload.appointment_date
    appointment.appointment_time = payload.appointment_time
    appointment.status = "Rescheduled"
    db.commit()

    return {"message": "Appointment rescheduled"}
