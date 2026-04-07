# Patient Buddy - How to Run

This project has 2 parts:
1. Frontend = React + Vite
2. Backend = FastAPI + SQLite

## Prerequisites

- Node.js 20 or newer
- Python 3.11 recommended
- Windows or macOS

## Project Folder Structure

- `jarvisbuddy-main/frontend`
- `jarvisbuddy-main/backend`

## Important Notes

- The backend already uses a local SQLite database file: `backend/patient_buddy.db`
- Uploaded videos will be stored in: `backend/uploads`
- Default root admin account:
  - Email: `admin@patientbuddy.com`
  - Password: `Admin123!`

---

## Step 1 - Start the Backend

Open Terminal, Command Prompt, or PowerShell inside `jarvisbuddy-main/backend`.

### Windows

```bash
python -m venv venv
venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app.main:app
```

If Python uses the launcher on your PC, you can use:

```bash
py -m venv venv
venv\Scripts\activate
py -m pip install --upgrade pip
pip install -r requirements.txt
py -m uvicorn app.main:app
```

### macOS

```bash
python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app.main:app
```

If it starts properly, the backend should run on: **http://localhost:8000**

Keep this terminal open.

---

## Step 2 - Start the Frontend

Open a SECOND terminal inside `jarvisbuddy-main/frontend`.

### Windows

```bash
npm install
npm run dev
```

### macOS

```bash
npm install
npm run dev -- --host 127.0.0.1
```

If it starts properly, the frontend should run on: **http://localhost:5173**

Open that frontend URL in the browser.

---

## Step 3 - Login

When the webpage opens:
- Choose **Staff** for admin/doctor login
- Choose **Patient** for patient login

Default root admin / breakglass account:
- Email: `admin@patientbuddy.com`
- Password: `Admin123!`

---

## Notes

- Do not delete `backend/patient_buddy.db` if you want to keep the current data.
- If you want a fresh empty database, delete `patient_buddy.db` and restart the backend.
- The frontend talks to the backend on `localhost:8000`.
- The upload page now sends the real video file to the backend.
- Supported video formats include: `.mp4`, `.mov`, `.avi`, `.webm`, `.mkv`

---

## Troubleshooting

### If frontend fails
- Make sure Node.js is installed
- Run `npm install` again in the frontend folder

### If backend fails
- Make sure Python is installed
- Make sure the virtual environment is activated
- Run `pip install -r requirements.txt` again
- If you previously created the virtual environment before the latest fixes, rerun:
  ```
  pip install -r requirements.txt
  ```

### If macOS says "command not found" for python
- Use `python3` instead of `python`

### If macOS blocks installation tools
- Install Xcode Command Line Tools with:
  ```
  xcode-select --install
  ```

### If login page opens but cannot connect
- Make sure backend is running first
- Check that `http://localhost:8000` is reachable

### If video upload fails
- Make sure the backend is running
- Make sure you selected a supported video file
- Check that the file is smaller than the backend upload limit

### Optional developer mode

If you want auto-reload later, you can try:
```bash
python -m uvicorn app.main:app --reload
```

If `--reload` gives an "Operation not permitted" error on your machine, use the non-reload command above.