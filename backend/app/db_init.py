from sqlalchemy import inspect, text
from .db import engine


def initialize_database() -> None:
    with engine.begin() as connection:
        inspector = inspect(connection)
        if "users" not in inspector.get_table_names():
            return

        columns = {column["name"] for column in inspector.get_columns("users")}
        required_columns = {
            "designation": "ALTER TABLE users ADD COLUMN designation VARCHAR(100)",
            "reports_to_user_id": "ALTER TABLE users ADD COLUMN reports_to_user_id INTEGER",
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
