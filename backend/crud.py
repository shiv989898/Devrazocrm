from sqlalchemy.orm import Session
import models, schemas

# Leads CRUD
def get_lead(db: Session, lead_id: int):
    return db.query(models.Lead).filter(models.Lead.id == lead_id).first()

def get_leads(db: Session, skip: int = 0, limit: int = 500):
    return db.query(models.Lead).order_by(models.Lead.created_at.desc()).offset(skip).limit(limit).all()

def create_lead(db: Session, lead: schemas.LeadCreate):
    db_lead = models.Lead(**lead.model_dump())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead

def update_lead(db: Session, lead_id: int, lead: schemas.LeadUpdate):
    db_lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if db_lead:
        update_data = lead.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_lead, key, value)
        db.commit()
        db.refresh(db_lead)
    return db_lead

def delete_lead(db: Session, lead_id: int):
    db_lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if db_lead:
        db.delete(db_lead)
        db.commit()
    return db_lead

# Website Analysis CRUD
def get_analysis_by_lead(db: Session, lead_id: int):
    return db.query(models.WebsiteAnalysis).filter(models.WebsiteAnalysis.lead_id == lead_id).first()

def create_analysis(db: Session, analysis: schemas.WebsiteAnalysisCreate):
    db_analysis = models.WebsiteAnalysis(**analysis.model_dump())
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    return db_analysis

# Outreach CRUD
def get_pending_outreaches(db: Session):
    return db.query(models.Outreach).filter(models.Outreach.status == "Draft").all()

def get_outreach(db: Session, outreach_id: int):
    return db.query(models.Outreach).filter(models.Outreach.id == outreach_id).first()

def update_outreach_status(db: Session, outreach_id: int, status: str):
    db_outreach = get_outreach(db, outreach_id)
    if db_outreach:
        db_outreach.status = status
        db.commit()
        db.refresh(db_outreach)
    return db_outreach

