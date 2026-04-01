from pathlib import Path
from sqlalchemy import inspect, text
from .db import engine
from .utils.video import create_browser_playable_video


def initialize_database() -> None:
    with engine.begin() as connection:
        inspector = inspect(connection)
        if "users" not in inspector.get_table_names():
            return

        columns = {column["name"] for column in inspector.get_columns("users")}
        required_columns = {
            "designation": "ALTER TABLE users ADD COLUMN designation VARCHAR(100)",
            "reports_to_user_id": "ALTER TABLE users ADD COLUMN reports_to_user_id INTEGER",
            "gender": "ALTER TABLE users ADD COLUMN gender VARCHAR(20)",
            "allergies": "ALTER TABLE users ADD COLUMN allergies TEXT",
            "existing_conditions": "ALTER TABLE users ADD COLUMN existing_conditions TEXT",
            "is_root_admin": "ALTER TABLE users ADD COLUMN is_root_admin BOOLEAN DEFAULT 0",
            "is_deleted": "ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT 0",
            "deleted_at": "ALTER TABLE users ADD COLUMN deleted_at DATETIME",
        }
        for column_name, statement in required_columns.items():
            if column_name not in columns:
                connection.execute(text(statement))

        if "medical_records" in inspector.get_table_names():
            medical_columns = {column["name"] for column in inspector.get_columns("medical_records")}
            medical_required_columns = {
                "video_path": "ALTER TABLE medical_records ADD COLUMN video_path TEXT",
                "duration_seconds": "ALTER TABLE medical_records ADD COLUMN duration_seconds NUMERIC(8, 2)",
                "fps": "ALTER TABLE medical_records ADD COLUMN fps NUMERIC(8, 2)",
                "resolution": "ALTER TABLE medical_records ADD COLUMN resolution VARCHAR(50)",
                "analysis_json": "ALTER TABLE medical_records ADD COLUMN analysis_json TEXT",
                "alert_status": "ALTER TABLE medical_records ADD COLUMN alert_status VARCHAR(50)",
                "follow_up_action": "ALTER TABLE medical_records ADD COLUMN follow_up_action VARCHAR(100)",
                "follow_up_due_date": "ALTER TABLE medical_records ADD COLUMN follow_up_due_date DATE",
                "reviewed_at": "ALTER TABLE medical_records ADD COLUMN reviewed_at DATETIME",
            }
            for column_name, statement in medical_required_columns.items():
                if column_name not in medical_columns:
                    connection.execute(text(statement))

            broken_record_ids = [
                row[0]
                for row in connection.execute(
                    text(
                        """
                        SELECT id
                        FROM medical_records
                        WHERE file_name IS NOT NULL
                          AND (
                            video_path IS NULL
                            OR analysis_json IS NULL
                            OR result IS NULL
                            OR result = ''
                            OR result = 'Pending'
                          )
                        """
                    )
                ).fetchall()
            ]
            if broken_record_ids:
                id_list = ",".join(str(record_id) for record_id in broken_record_ids)
                connection.execute(text(f"DELETE FROM record_notes WHERE medical_record_id IN ({id_list})"))
                connection.execute(text(f"DELETE FROM medical_records WHERE id IN ({id_list})"))

            existing_videos = connection.execute(
                text(
                    """
                    SELECT id, video_path
                    FROM medical_records
                    WHERE video_path IS NOT NULL
                    """
                )
            ).fetchall()
            for record_id, video_path in existing_videos:
                if not video_path:
                    continue
                source = Path(video_path)
                if not source.exists():
                    continue
                playable = source.parent / "playable.mp4"
                if not playable.exists():
                    try:
                        create_browser_playable_video(str(source), str(playable))
                    except Exception:
                        continue
                connection.execute(
                    text("UPDATE medical_records SET video_path = :video_path WHERE id = :record_id"),
                    {"video_path": str(playable), "record_id": record_id},
                )

        if "consultations" in inspector.get_table_names() and "appointments" in inspector.get_table_names():
            completed_without_consultation = connection.execute(
                text(
                    """
                    SELECT appointments.id, appointments.patient_user_id, appointments.doctor_user_id
                    FROM appointments
                    LEFT JOIN consultations ON consultations.appointment_id = appointments.id
                    WHERE appointments.status = 'Completed'
                      AND consultations.id IS NULL
                      AND appointments.doctor_user_id IS NOT NULL
                    """
                )
            ).fetchall()

            for appointment_id, patient_user_id, doctor_user_id in completed_without_consultation:
                result = connection.execute(
                    text(
                        """
                        INSERT INTO medical_records (
                          patient_user_id,
                          doctor_user_id,
                          test_type,
                          result
                        ) VALUES (
                          :patient_user_id,
                          :doctor_user_id,
                          'Consultation',
                          'Completed'
                        )
                        RETURNING id
                        """
                    ),
                    {
                        "patient_user_id": patient_user_id,
                        "doctor_user_id": doctor_user_id,
                    },
                ).fetchone()
                if not result:
                    continue

                medical_record_id = result[0]
                connection.execute(
                    text(
                        """
                        INSERT INTO consultations (
                          appointment_id,
                          patient_user_id,
                          doctor_user_id,
                          medical_record_id,
                          priority,
                          medications_json,
                          alert_flags_json
                        ) VALUES (
                          :appointment_id,
                          :patient_user_id,
                          :doctor_user_id,
                          :medical_record_id,
                          'Normal',
                          '[]',
                          '[]'
                        )
                        """
                    ),
                    {
                        "appointment_id": appointment_id,
                        "patient_user_id": patient_user_id,
                        "doctor_user_id": doctor_user_id,
                        "medical_record_id": medical_record_id,
                    },
                )
