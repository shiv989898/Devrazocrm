@echo off
echo Starting Devrazo LeadOS...

echo Starting Docker Services (Postgres & n8n)...
docker compose up -d

echo Starting FastAPI Backend...
start cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"

echo Starting Next.js Frontend...
start cmd /k "cd frontend && npm run dev"

echo ========================================================
echo Devrazo LeadOS is booting up!
echo - Frontend UI: http://localhost:3000
echo - Backend API: http://localhost:8000/docs
echo - n8n Automations: http://localhost:5678
echo ========================================================
pause
