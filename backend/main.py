import sys
import asyncio
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models, schemas, crud
from database import engine, get_db

# We don't call Base.metadata.create_all(bind=engine) here because we'll use Alembic.

app = FastAPI(title="Devrazo LeadOS API")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Devrazo LeadOS API"}

from scraper.google_maps import scrape_google_maps
from analyzer.website import analyze_website
from ai.generator import generate_outreach_drafts_batch
from pydantic import BaseModel
import asyncio

class ScrapeRequest(BaseModel):
    category: str
    location: str
    platform: str = "google-maps"

@app.post("/leads/scrape")
async def run_scraper(req: ScrapeRequest, db: Session = Depends(get_db)):
    # 0. Get existing leads to prevent fetching duplicates
    existing_leads = db.query(models.Lead.name).all()
    exclude_names = [lead[0] for lead in existing_leads]
    
    # 1. Scrape Leads
    raw_leads = await scrape_google_maps(req.category, req.location, max_results=30, exclude_names=exclude_names)
    
    # 2. Analyze Websites concurrently
    async def analyze_if_needed(raw):
        if raw.get("website"):
            return await analyze_website(raw["website"])
        return None
        
    analysis_results = await asyncio.gather(*(analyze_if_needed(raw) for raw in raw_leads))
    
    # 2.5 Filter leads (Keep only if they have phone or email) and remove duplicates
    valid_leads = []
    for raw, analysis in zip(raw_leads, analysis_results):
        # Skip duplicates
        existing_lead = db.query(models.Lead).filter(models.Lead.name == raw.get("name", "Unknown")).first()
        if existing_lead:
            continue
            
        email = analysis.get("email") if analysis else None
        phone = raw.get("phone")
        if email or phone:
            valid_leads.append((raw, analysis, email, phone))
            
    # 3. Generate Drafts in Batch (Only for those with an email)
    batch_input = []
    for raw, analysis, email, phone in valid_leads:
        if email and analysis:
            problems = analysis.get("problems", "needs modernizing")
            if not problems:
                problems = "could use some conversion rate optimization"
            batch_input.append({
                "name": raw.get("name", "Unknown"),
                "category": req.category,
                "website": raw.get("website", "No website"),
                "problems": problems
            })
            
    batch_drafts = await asyncio.to_thread(generate_outreach_drafts_batch, batch_input) if batch_input else {}
    
    # 4. Save to Database sequentially (avoids SQLAlchemy thread issues)
    saved_leads = []
    for raw, analysis, email, phone in valid_leads:
        lead_data = schemas.LeadCreate(
            name=raw.get("name", "Unknown"),
            category=req.category,
            website=raw.get("website"),
            phone=phone,
            email=email,
            city=raw.get("city"),
            state=raw.get("state"),
            google_rating=raw.get("google_rating"),
            status="In Queue" if email else "Sent to Sheets"
        )
        db_lead = crud.create_lead(db, lead_data)
        saved_leads.append(db_lead)
        
        if analysis:
            analysis_create = schemas.WebsiteAnalysisCreate(
                lead_id=db_lead.id,
                **analysis
            )
            crud.create_analysis(db, analysis_create)
            
        if email:
            # Has email -> Create Outreach AI draft
            draft = batch_drafts.get(raw.get("name", "Unknown"))
            if draft:
                outreach_create = schemas.OutreachCreate(
                    lead_id=db_lead.id,
                    platform="Email",
                    content=draft,
                    status="Draft"
                )
                db_outreach = models.Outreach(**outreach_create.dict())
                db.add(db_outreach)
        if phone:
            # Has phone -> Trigger n8n sheets webhook
            now = datetime.now()
            sheet_payload = {
                "action": "sheet",
                "Name": raw.get("name", "Unknown"),
                "Category": req.category,
                "Phone": phone,
                "City": raw.get("city", "Unknown"),
                "Date": now.strftime("%Y-%m-%d"),
                "Time": now.strftime("%H:%M:%S")
            }
            try:
                requests.post("http://localhost:5678/webhook/process-lead", json=sheet_payload, timeout=3)
                import time
                time.sleep(1.5)  # Add delay to prevent Google Sheets API rate limit in n8n
            except Exception as e:
                print(f"Failed to trigger n8n sheet webhook: {e}")
            
    db.commit()
            
    return {"message": f"Successfully scraped {len(saved_leads)} leads", "count": len(saved_leads)}



# Leads Endpoints
@app.post("/leads/", response_model=schemas.LeadResponse)
def create_lead(lead: schemas.LeadCreate, db: Session = Depends(get_db)):
    return crud.create_lead(db=db, lead=lead)

@app.get("/leads/", response_model=List[schemas.LeadResponse])
def read_leads(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_leads(db, skip=skip, limit=limit)

@app.get("/leads/{lead_id}", response_model=schemas.LeadResponse)
def read_lead(lead_id: int, db: Session = Depends(get_db)):
    db_lead = crud.get_lead(db, lead_id=lead_id)
    if db_lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return db_lead

@app.put("/leads/{lead_id}", response_model=schemas.LeadResponse)
def update_lead(lead_id: int, lead: schemas.LeadUpdate, db: Session = Depends(get_db)):
    db_lead = crud.update_lead(db, lead_id=lead_id, lead=lead)
    if db_lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return db_lead

@app.delete("/leads/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    db_lead = crud.delete_lead(db, lead_id=lead_id)
    if db_lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead deleted successfully"}

# Analysis Endpoints
@app.get("/leads/{lead_id}/analysis", response_model=schemas.WebsiteAnalysisResponse)
def read_analysis(lead_id: int, db: Session = Depends(get_db)):
    db_analysis = crud.get_analysis_by_lead(db, lead_id=lead_id)
    if db_analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return db_analysis

@app.post("/leads/{lead_id}/analysis", response_model=schemas.WebsiteAnalysisResponse)
def create_analysis_endpoint(lead_id: int, analysis: schemas.WebsiteAnalysisCreate, db: Session = Depends(get_db)):
    if analysis.lead_id != lead_id:
        raise HTTPException(status_code=400, detail="Lead ID mismatch")
    db_analysis = crud.get_analysis_by_lead(db, lead_id=lead_id)
    if db_analysis:
        raise HTTPException(status_code=400, detail="Analysis already exists for this lead")
    return crud.create_analysis(db=db, analysis=analysis)

# Outreach Endpoints
import requests

class OutreachQueueItem(BaseModel):
    id: int
    recipient: str
    platform: str
    reasoning: str
    subject: str
    body: str

@app.get("/outreaches/pending", response_model=List[OutreachQueueItem])
def get_pending_outreaches(db: Session = Depends(get_db)):
    outreaches = crud.get_pending_outreaches(db)
    result = []
    for outreach in outreaches:
        lead = crud.get_lead(db, outreach.lead_id)
        analysis = crud.get_analysis_by_lead(db, outreach.lead_id)
        
        content = outreach.content or ""
        subject = "N/A"
        body = content
        
        if content.lower().startswith("subject:"):
            parts = content.split("\n", 1)
            # Remove "Subject:" but keep case
            subject = parts[0][8:].strip() 
            body = parts[1].strip() if len(parts) > 1 else ""
            
        result.append({
            "id": outreach.id,
            "recipient": lead.name if lead else "Unknown",
            "platform": outreach.platform,
            "reasoning": analysis.summary if analysis else "No analysis available",
            "subject": subject,
            "body": body
        })
    return result

@app.post("/outreaches/{outreach_id}/send")
def send_outreach(outreach_id: int, db: Session = Depends(get_db)):
    db_outreach = crud.get_outreach(db, outreach_id)
    if not db_outreach:
        raise HTTPException(status_code=404, detail="Outreach not found")
        
    lead = crud.get_lead(db, db_outreach.lead_id)
    if db_outreach.platform == "Email" and (not lead or not lead.email):
        raise HTTPException(status_code=400, detail="Lead has no email address. Cannot send email.")
        
    db_outreach = crud.update_outreach_status(db, outreach_id, "Sent")
    
    # Trigger n8n webhook
    webhook_url = "http://localhost:5678/webhook/process-lead"
    try:
        # Get lead info to send to n8n
        lead = crud.get_lead(db, db_outreach.lead_id)
        payload = {
            "action": "email",
            "outreach_id": db_outreach.id,
            "platform": db_outreach.platform,
            "content": db_outreach.content,
            "recipient_email": lead.email if lead else None,
            "recipient_phone": lead.phone if lead else None,
            "recipient_name": lead.name if lead else None
        }
        
        requests.post(webhook_url, json=payload, timeout=5)
    except Exception as e:
        print(f"Failed to trigger n8n webhook: {e}")
        # We don't fail the API request if n8n is down, just print to logs
        
    lead.status = "Emailed"
    db.commit()
        
    return {"message": "Outreach approved and sent to n8n", "outreach": db_outreach}

@app.post("/outreaches/{outreach_id}/reject")
def reject_outreach(outreach_id: int, db: Session = Depends(get_db)):
    db_outreach = crud.update_outreach_status(db, outreach_id, "Rejected")
    if not db_outreach:
        raise HTTPException(status_code=404, detail="Outreach not found")
        
    lead = crud.get_lead(db, db_outreach.lead_id)
    if lead:
        lead.status = "Rejected"
        db.commit()
        
    return {"message": "Outreach rejected", "outreach": db_outreach}


