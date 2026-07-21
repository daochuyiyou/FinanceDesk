# FinanceDesk V1 — 5-Minute Quick Start

> You should be able to go from `git clone` to a running system in under 5 minutes.

## Prerequisites

```bash
# Check versions
python3 --version   # Need 3.11+
node --version      # Need 20+
npm --version
```

## 1. Backend Setup (2 min)

```bash
cd backend
pip install -r requirements.txt
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## 2. Verify Backend (30 sec)

```bash
curl http://localhost:8000/api/v1/projects?page=1
# → {"items":[...],"total":0,"page":1,"page_size":20}
```

## 3. Frontend Build (2 min)

```bash
cd frontend
npm install
npx vite build
```

## 4. Restart & Access

```bash
# Backend serves the built frontend automatically
# Open in browser:
open http://localhost:8000
```

## 5. Load Demo Data (optional)

```bash
python3 demo-data/load.py
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Port 8000 in use` | `fuser -k 8000/tcp` or change port: `python main.py --port 8001` |
| `Module not found` | `pip install -r requirements.txt` — ensure you're in the `backend/` directory |
| Frontend not loading | Run `npx vite build` in `frontend/` and restart backend |
| `Permission denied` | Run `chmod -R o+w backend/FinanceDesk_Data` |
