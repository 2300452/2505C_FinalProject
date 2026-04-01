from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .db import Base, engine, SessionLocal
from .db_init import initialize_database
from .routes import admin, auth, data
from .seed import seed_admin

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
initialize_database()
uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)

db = SessionLocal()
try:
    seed_admin(db)
finally:
    db.close()

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(data.router)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.get("/")
def root():
    return {"message": "Patient Buddy backend is running"}
