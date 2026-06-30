# type: ignore
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime # type: ignore
from sqlalchemy.orm import relationship # type: ignore
from database import Base # type: ignore
import datetime

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    website = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, index=True, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    
    # Scraped data
    google_rating = Column(Float, nullable=True)
    review_count = Column(Integer, nullable=True)
    maps_link = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    photos_json = Column(Text, nullable=True) # Store URLs as JSON string
    
    # CRM data
    status = Column(String, default="New", index=True) # New, Contacted, Follow-up, Interested, Meeting Scheduled, Proposal Sent, Won, Lost
    priority = Column(String, default="Medium") # High, Medium, Low
    notes = Column(Text, nullable=True)
    reminder_date = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    analysis = relationship("WebsiteAnalysis", back_populates="lead", uselist=False)
    outreaches = relationship("Outreach", back_populates="lead")


class WebsiteAnalysis(Base):
    __tablename__ = "website_analyses"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    
    score = Column(Integer, nullable=True)
    has_ssl = Column(Boolean, default=False)
    has_contact_form = Column(Boolean, default=False)
    has_whatsapp = Column(Boolean, default=False)
    has_booking = Column(Boolean, default=False)
    mobile_friendly = Column(Boolean, default=False)
    page_size_kb = Column(Integer, nullable=True)
    tech_stack_json = Column(Text, nullable=True)
    
    # AI generated content
    summary = Column(Text, nullable=True)
    problems = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    opportunities = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    lead = relationship("Lead", back_populates="analysis")


class Outreach(Base):
    __tablename__ = "outreaches"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    
    platform = Column(String) # Email, WhatsApp, LinkedIn, Instagram, Call
    content = Column(Text)
    status = Column(String, default="Draft") # Draft, Sent
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    lead = relationship("Lead", back_populates="outreaches")
