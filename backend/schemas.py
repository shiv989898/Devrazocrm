from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Lead Schemas
class LeadBase(BaseModel):
    name: str
    category: str
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    
    google_rating: Optional[float] = None
    review_count: Optional[int] = None
    maps_link: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photos_json: Optional[str] = None
    
    status: str = "New"
    priority: str = "Medium"
    notes: Optional[str] = None
    reminder_date: Optional[datetime] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(LeadBase):
    name: Optional[str] = None
    category: Optional[str] = None

class LeadResponse(LeadBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Website Analysis Schemas
class WebsiteAnalysisBase(BaseModel):
    score: Optional[int] = None
    has_ssl: bool = False
    has_contact_form: bool = False
    has_whatsapp: bool = False
    has_booking: bool = False
    mobile_friendly: bool = False
    page_size_kb: Optional[int] = None
    tech_stack_json: Optional[str] = None
    summary: Optional[str] = None
    problems: Optional[str] = None
    recommendations: Optional[str] = None
    opportunities: Optional[str] = None

class WebsiteAnalysisCreate(WebsiteAnalysisBase):
    lead_id: int

class WebsiteAnalysisResponse(WebsiteAnalysisBase):
    id: int
    lead_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Outreach Schemas
class OutreachBase(BaseModel):
    platform: str
    content: str
    status: str = "Draft"

class OutreachCreate(OutreachBase):
    lead_id: int

class OutreachUpdate(BaseModel):
    status: Optional[str] = None
    content: Optional[str] = None

class OutreachResponse(OutreachBase):
    id: int
    lead_id: int
    created_at: datetime

    class Config:
        from_attributes = True
