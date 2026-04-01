from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException
from datetime import date
from ..db import get_db
from ..models import User
from ..api_schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    PatientSignupRequest,
)
from ..security import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def next_patient_id(db: Session) -> str:
    patients = db.query(User).filter(User.role == "Patient").all()
    nums = []
    for patient in patients:
        if patient.generated_id and patient.generated_id.startswith("PAT"):
            try:
                nums.append(int(patient.generated_id.replace("PAT", "")))
            except ValueError:
                pass
    return f"PAT{(max(nums) + 1) if nums else 1001}"


def serialize_user(user: User) -> dict:
    reports_to = None
    if user.reports_to_user_id:
        reports_to = get_report_to_user(user)
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
        "reportsToName": reports_to.name if reports_to else "",
        "reportsToGeneratedId": reports_to.generated_id if reports_to else "",
        "mustChangePassword": user.must_change_password,
        "isRootAdmin": user.is_root_admin,
        "isDeleted": user.is_deleted,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
}


def calculate_age(dob) -> int | None:
    if not dob:
        return None
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def get_report_to_user(user: User) -> User | None:
    return getattr(user, "_report_to_user", None)


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


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    portal = payload.portal.strip().lower()
    query = db.query(User).filter(User.email == payload.email, User.is_deleted.is_(False))
    if portal == "staff":
        user = query.filter(User.role.in_(["Admin", "Doctor"])).first()
    elif portal == "patient":
        user = query.filter(User.role == "Patient").first()
    else:
        raise HTTPException(status_code=400, detail="Invalid login portal.")

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    attach_reports_to([user], db)
    return serialize_user(user)


@router.post("/signup")
def signup(payload: PatientSignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        detail = "This email belongs to a recycled account. Restore it instead of creating a new one." if existing.is_deleted else "A user with this email already exists."
        raise HTTPException(status_code=400, detail=detail)

    patient = User(
        generated_id=next_patient_id(db),
        role="Patient",
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        dob=payload.dob,
        gender=(payload.gender or "").strip() or None,
        phone=payload.phone,
        allergies=(payload.allergies or "").strip() or None,
        existing_conditions=(payload.existing_conditions or "").strip() or None,
        must_change_password=False,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    attach_reports_to([patient], db)
    return serialize_user(patient)


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    portal = payload.portal.strip().lower()
    query = db.query(User).filter(User.email == payload.email, User.is_deleted.is_(False))
    if portal == "staff":
        user = query.filter(User.role.in_(["Admin", "Doctor"])).first()
    elif portal == "patient":
        user = query.filter(User.role == "Patient").first()
    else:
        raise HTTPException(status_code=400, detail="Invalid reset portal.")

    if not user:
        raise HTTPException(status_code=404, detail="No matching account found.")

    temporary_password = "Temp1234!"
    user.password_hash = hash_password(temporary_password)
    user.must_change_password = True
    db.commit()
    db.refresh(user)
    attach_reports_to([user], db)

    return {
        "user": serialize_user(user),
        "tempPassword": temporary_password,
    }


@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.password_hash = hash_password(payload.new_password)
    user.must_change_password = False
    db.commit()
    db.refresh(user)
    attach_reports_to([user], db)
    return serialize_user(user)
