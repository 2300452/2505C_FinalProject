import uuid
import json
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Appointment, MedicalRecord, RecordNote, User
from ..config import settings
from ..services.pose_estimation import run_pose_estimation
from ..services.tug_analysis import analyse_tug
from ..services.ftsst_analysis import analyse_ftsst
from ..utils.video import get_video_metadata
from ..api_schemas import (
    AppointmentCreateRequest,
    MedicalRecordCreateRequest,
    NoteCreateRequest,
    RecordAlertActionRequest,
    UserProfileUpdateRequest,
)

router = APIRouter(prefix="/data", tags=["data"])
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm", ".mkv"}


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
        "specialty": user.specialty or "",
        "designation": user.designation or "",
        "reportsToUserId": user.reports_to_user_id,
        "reportsToName": report_to.name if report_to else "",
        "reportsToGeneratedId": report_to.generated_id if report_to else "",
        "mustChangePassword": user.must_change_password,
        "isRootAdmin": user.is_root_admin,
        "isDeleted": user.is_deleted,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }


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
    analysis = None
    if record.analysis_json:
        try:
            analysis = json.loads(record.analysis_json)
        except json.JSONDecodeError:
            analysis = None

    video_url = None
    if record.video_path:
        try:
            rel_path = Path(record.video_path).relative_to(get_upload_root()).as_posix()
            video_url = f"/uploads/{rel_path}"
        except ValueError:
            video_url = None

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
        "videoUrl": video_url,
        "durationSeconds": float(record.duration_seconds) if record.duration_seconds is not None else None,
        "fps": float(record.fps) if record.fps is not None else None,
        "resolution": record.resolution or "",
        "analysis": analysis,
        "alertStatus": record.alert_status or "",
        "followUpAction": record.follow_up_action or "",
        "followUpDueDate": record.follow_up_due_date.isoformat() if record.follow_up_due_date else None,
        "reviewedAt": record.reviewed_at.isoformat() if record.reviewed_at else None,
        "createdAt": record.created_at.isoformat() if record.created_at else None,
        "notes": [
            serialize_note(note, users_by_id.get(note.doctor_user_id))
            for note in notes
        ],
    }


def decimal_or_none(value: float | None) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(value))


def get_upload_root() -> Path:
    return Path(__file__).resolve().parents[2] / settings.upload_dir


def to_decimal(value: float | None) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(round(value, 2)))


def analyse_uploaded_video(video_path: Path, test_type: str) -> dict:
    pose_summary = run_pose_estimation(str(video_path), str(video_path.parent))

    if test_type == "TUG":
        analysis = analyse_tug(pose_summary["pose_data_path"]).to_dict()
        phases = {phase["name"]: phase["duration_s"] for phase in analysis["phases"]}
        stand_time = phases.get("rising")
        walk_time = round(
            (phases.get("walk_forward") or 0)
            + (phases.get("turn") or 0)
            + (phases.get("walk_back") or 0),
            2,
        )
        sit_time = phases.get("sit_down")
        result = "Pass" if analysis["risk_category"] == "normal" else "Fail"
        return {
            "stand_time": stand_time,
            "walk_time": walk_time,
            "sit_time": sit_time,
            "result": result,
            "results": {
                "pose_summary": {
                    "total_frames": pose_summary["total_frames"],
                    "detected_frames": pose_summary["detected_frames"],
                    "detection_rate": pose_summary["detection_rate"],
                },
                "analysis": analysis,
            },
        }

    if test_type == "5xSTS":
        analysis = analyse_ftsst(pose_summary["pose_data_path"]).to_dict()
        repetitions = analysis["repetitions"]
        stand_time = round(
            sum((rep["stand_peak_ms"] - rep["rise_start_ms"]) / 1000 for rep in repetitions),
            2,
        ) if repetitions else None
        sit_time = round(
            sum((rep["sit_complete_ms"] - rep["stand_peak_ms"]) / 1000 for rep in repetitions),
            2,
        ) if repetitions else None
        result = "Pass" if analysis["risk_category"] == "normal" else "Fail"
        return {
            "stand_time": stand_time,
            "walk_time": None,
            "sit_time": sit_time,
            "result": result,
            "results": {
                "pose_summary": {
                    "total_frames": pose_summary["total_frames"],
                    "detected_frames": pose_summary["detected_frames"],
                    "detection_rate": pose_summary["detection_rate"],
                },
                "analysis": analysis,
            },
        }

    raise HTTPException(status_code=400, detail="Unsupported test type.")


def validate_appointment_slot(slot_time: time) -> None:
    if slot_time.minute not in {0, 30} or slot_time.second != 0:
        raise HTTPException(
            status_code=400,
            detail="Appointments must be booked in 30-minute intervals.",
        )


def ensure_slot_is_available(
    db: Session,
    slot_date: date,
    slot_time: time,
    exclude_appointment_id: int | None = None,
) -> None:
    query = db.query(Appointment).filter(
        Appointment.appointment_date == slot_date,
        Appointment.appointment_time == slot_time,
        Appointment.status.in_(["Booked", "Rescheduled"]),
    )
    if exclude_appointment_id is not None:
        query = query.filter(Appointment.id != exclude_appointment_id)

    existing = query.first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="This appointment slot is already taken. Please choose another 30-minute slot.",
        )


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


@router.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_deleted.is_(False)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    attach_reports_to([user], db)
    return serialize_user(user)


@router.patch("/users/{user_id}")
def update_user(user_id: int, payload: UserProfileUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_deleted.is_(False)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if payload.email and payload.email != user.email:
        existing = db.query(User).filter(User.email == payload.email, User.id != user_id, User.is_deleted.is_(False)).first()
        if existing:
            raise HTTPException(status_code=400, detail="A user with this email already exists.")

    if payload.name is not None:
        user.name = payload.name.strip()
    if payload.email is not None:
        user.email = payload.email
    if payload.phone is not None:
        user.phone = payload.phone

    if user.role == "Patient":
        if payload.dob is not None:
            user.dob = payload.dob
        user.specialty = None
        user.designation = None
        user.reports_to_user_id = None
    elif user.role == "Doctor":
        if payload.specialty is not None:
            user.specialty = payload.specialty.strip()

    db.commit()
    db.refresh(user)
    attach_reports_to([user], db)
    return serialize_user(user)


@router.get("/doctors")
def get_doctors(db: Session = Depends(get_db)):
    users = db.query(User).filter(User.role == "Doctor", User.is_deleted.is_(False)).order_by(User.name.asc()).all()
    attach_reports_to(users, db)
    return [serialize_user(user) for user in users]


@router.get("/patients")
def get_patients(db: Session = Depends(get_db)):
    users = db.query(User).filter(User.role == "Patient", User.is_deleted.is_(False)).order_by(User.name.asc()).all()
    attach_reports_to(users, db)
    return [serialize_user(user) for user in users]


@router.get("/appointments")
def get_appointments(db: Session = Depends(get_db)):
    appointments = db.query(Appointment).order_by(Appointment.appointment_date.asc(), Appointment.appointment_time.asc()).all()
    user_ids = {
        appointment.patient_user_id
        for appointment in appointments
    } | {
        appointment.doctor_user_id
        for appointment in appointments
        if appointment.doctor_user_id
    }
    users_by_id = {
        user.id: user for user in db.query(User).filter(User.id.in_(user_ids)).all()
    } if user_ids else {}
    return [serialize_appointment(appointment, users_by_id) for appointment in appointments]


@router.post("/appointments")
def create_appointment(payload: AppointmentCreateRequest, db: Session = Depends(get_db)):
    patient = db.query(User).filter(
        User.id == payload.patient_user_id,
        User.role == "Patient",
        User.is_deleted.is_(False),
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    existing = (
        db.query(Appointment)
        .filter(
            Appointment.patient_user_id == payload.patient_user_id,
            Appointment.status.in_(["Booked", "Rescheduled"]),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Patient already has an active appointment.")

    validate_appointment_slot(payload.appointment_time)
    ensure_slot_is_available(db, payload.appointment_date, payload.appointment_time)

    appointment = Appointment(
        patient_user_id=payload.patient_user_id,
        doctor_user_id=None,
        appointment_date=payload.appointment_date,
        appointment_time=payload.appointment_time,
        status="Booked",
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    users_by_id = {patient.id: patient}
    return serialize_appointment(appointment, users_by_id)


@router.get("/appointments/patient/{patient_id}")
def get_patient_appointments(patient_id: int, db: Session = Depends(get_db)):
    appointments = (
        db.query(Appointment)
        .filter(Appointment.patient_user_id == patient_id)
        .order_by(Appointment.appointment_date.asc(), Appointment.appointment_time.asc())
        .all()
    )
    user_ids = {patient_id} | {
        appointment.doctor_user_id for appointment in appointments if appointment.doctor_user_id
    }
    users_by_id = {
        user.id: user for user in db.query(User).filter(User.id.in_(user_ids)).all()
    } if user_ids else {}
    return [serialize_appointment(appointment, users_by_id) for appointment in appointments]


@router.get("/appointments/doctor/{doctor_id}")
def get_doctor_appointments(doctor_id: int, db: Session = Depends(get_db)):
    appointments = (
        db.query(Appointment)
        .filter(Appointment.doctor_user_id == doctor_id)
        .order_by(Appointment.appointment_date.asc(), Appointment.appointment_time.asc())
        .all()
    )
    user_ids = {doctor_id} | {appointment.patient_user_id for appointment in appointments}
    users_by_id = {
        user.id: user for user in db.query(User).filter(User.id.in_(user_ids)).all()
    } if user_ids else {}
    return [serialize_appointment(appointment, users_by_id) for appointment in appointments]


@router.get("/records")
def get_records(db: Session = Depends(get_db)):
    records = db.query(MedicalRecord).order_by(MedicalRecord.created_at.desc()).all()
    return _serialize_records(db, records)


@router.get("/records/patient/{patient_id}")
def get_patient_records(patient_id: int, db: Session = Depends(get_db)):
    records = (
        db.query(MedicalRecord)
        .filter(MedicalRecord.patient_user_id == patient_id)
        .order_by(MedicalRecord.created_at.desc())
        .all()
    )
    return _serialize_records(db, records)


@router.get("/records/alerts/failed")
def get_failed_records(db: Session = Depends(get_db)):
    records = (
        db.query(MedicalRecord)
        .filter(MedicalRecord.result == "Fail")
        .order_by(MedicalRecord.created_at.desc())
        .all()
    )
    return _serialize_records(db, records)


@router.post("/records")
def create_record(payload: MedicalRecordCreateRequest, db: Session = Depends(get_db)):
    patient = db.query(User).filter(User.id == payload.patient_user_id, User.role == "Patient").first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    doctor = None
    if payload.doctor_user_id is not None:
        doctor = db.query(User).filter(User.id == payload.doctor_user_id, User.role == "Doctor").first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found.")

    record = MedicalRecord(
        patient_user_id=payload.patient_user_id,
        doctor_user_id=payload.doctor_user_id,
        test_type=payload.test_type,
        file_name=payload.file_name,
        result=payload.result,
        stand_time=decimal_or_none(payload.stand_time),
        walk_time=decimal_or_none(payload.walk_time),
        sit_time=decimal_or_none(payload.sit_time),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    users_by_id = {patient.id: patient}
    if doctor:
        users_by_id[doctor.id] = doctor
    return serialize_record(record, users_by_id, {})


@router.post("/records/upload")
async def upload_record_video(
    patient_user_id: int = Form(...),
    doctor_user_id: int | None = Form(None),
    test_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    patient = db.query(User).filter(User.id == patient_user_id, User.role == "Patient").first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    doctor = None
    if doctor_user_id is not None:
        doctor = db.query(User).filter(User.id == doctor_user_id, User.role == "Doctor").first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found.")

    if not file.filename:
        raise HTTPException(status_code=400, detail="Please choose a video file.")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Allowed: .mp4, .mov, .avi, .webm, .mkv",
        )

    content = await file.read()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum size of {settings.max_upload_size_mb}MB",
        )

    upload_dir = get_upload_root() / str(uuid.uuid4())
    upload_dir.mkdir(parents=True, exist_ok=True)
    dest_path = upload_dir / f"original{suffix}"
    dest_path.write_bytes(content)

    try:
        analysis = analyse_uploaded_video(dest_path, test_type)
        metadata = get_video_metadata(str(dest_path))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Video analysis failed: {exc}") from exc

    record = MedicalRecord(
        patient_user_id=patient_user_id,
        doctor_user_id=doctor_user_id,
        test_type=test_type,
        file_name=file.filename,
        result=analysis["result"],
        stand_time=to_decimal(analysis["stand_time"]),
        walk_time=to_decimal(analysis["walk_time"]),
        sit_time=to_decimal(analysis["sit_time"]),
        video_path=str(dest_path),
        duration_seconds=to_decimal(metadata["duration_seconds"]),
        fps=to_decimal(metadata["fps"]),
        resolution=metadata["resolution"],
        analysis_json=json.dumps(analysis["results"]),
        alert_status="Pending Review" if analysis["result"] == "Fail" else "",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    users_by_id = {patient.id: patient}
    if doctor:
        users_by_id[doctor.id] = doctor
    return serialize_record(record, users_by_id, {})


@router.post("/records/{record_id}/alert-action")
def update_alert_action(record_id: int, payload: RecordAlertActionRequest, db: Session = Depends(get_db)):
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found.")

    doctor = db.query(User).filter(
        User.id == payload.doctor_user_id,
        User.role == "Doctor",
        User.is_deleted.is_(False),
    ).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    action = payload.action.strip().lower()
    if action not in {"request_retake", "schedule_within_week", "monitor"}:
        raise HTTPException(status_code=400, detail="Invalid alert action.")

    record.doctor_user_id = doctor.id
    record.reviewed_at = datetime.now(timezone.utc)

    if action == "request_retake":
        record.alert_status = "Action Required"
        record.follow_up_action = "Please submit another video assessment."
        record.follow_up_due_date = None
    elif action == "schedule_within_week":
        record.alert_status = "Appointment Needed"
        record.follow_up_action = "Please schedule an appointment within 7 days."
        record.follow_up_due_date = date.today() + timedelta(days=7)
    else:
        record.alert_status = "Monitor"
        record.follow_up_action = "Monitor for now."
        record.follow_up_due_date = None

    db.commit()
    refreshed_record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    return _serialize_records(db, [refreshed_record])[0]


@router.post("/records/{record_id}/notes")
def add_record_note(record_id: int, payload: NoteCreateRequest, db: Session = Depends(get_db)):
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found.")

    doctor = db.query(User).filter(User.id == payload.doctor_user_id, User.role == "Doctor").first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    note_text = payload.note_text.strip()
    if not note_text:
        raise HTTPException(status_code=400, detail="Note cannot be empty.")

    note = RecordNote(
        medical_record_id=record_id,
        doctor_user_id=payload.doctor_user_id,
        note_text=note_text,
    )
    db.add(note)
    db.commit()

    refreshed_record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    return _serialize_records(db, [refreshed_record])[0]


def _serialize_records(db: Session, records: list[MedicalRecord]) -> list[dict]:
    if not records:
        return []

    user_ids = {record.patient_user_id for record in records} | {
        record.doctor_user_id for record in records if record.doctor_user_id
    }
    users_by_id = {
        user.id: user for user in db.query(User).filter(User.id.in_(user_ids)).all()
    }
    record_ids = [record.id for record in records]
    notes = (
        db.query(RecordNote)
        .filter(RecordNote.medical_record_id.in_(record_ids))
        .order_by(RecordNote.created_at.asc())
        .all()
    )
    notes_by_record_id: dict[int, list[RecordNote]] = {}
    for note in notes:
        notes_by_record_id.setdefault(note.medical_record_id, []).append(note)

    return [
        serialize_record(record, users_by_id, notes_by_record_id)
        for record in records
    ]
