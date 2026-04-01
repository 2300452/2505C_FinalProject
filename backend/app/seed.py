from sqlalchemy.orm import Session
from .models import User
from .security import hash_password


def seed_admin(db: Session):
    existing = db.query(User).filter(User.email == "admin@patientbuddy.com").first()
    if existing:
        existing.is_root_admin = True
        existing.role = "Admin"
        existing.is_deleted = False
        existing.deleted_at = None
        if not existing.generated_id:
            existing.generated_id = "ADM01"
        db.commit()
        return

    admin = User(
        generated_id="ADM01",
        role="Admin",
        name="System Admin",
        email="admin@patientbuddy.com",
        password_hash=hash_password("Admin123!"),
        must_change_password=False,
        designation="Root Admin",
        is_root_admin=True,
        is_deleted=False,
    )
    db.add(admin)
    db.commit()
