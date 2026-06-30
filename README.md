# Devrazo LeadOS

A self-hosted, fully free AI-powered Lead Generation & CRM Platform for software agencies.

## Architecture

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI (Python), SQLAlchemy
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Scraping**: Playwright, BeautifulSoup
- **AI**: Google Gemini API

## Local Development

1. **Start Services** (Postgres, n8n):
   ```bash
   docker compose up -d
   ```

2. **Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
