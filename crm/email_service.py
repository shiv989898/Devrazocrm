import smtplib
from email.message import EmailMessage
import os

def create_email_draft(to_email: str, subject: str, body: str):
    """
    Creates an email draft. In a real system, we'd use the Gmail API to create a draft in the user's inbox.
    For standard SMTP, we can only send. The requirement says "Never automatically send emails. Generate drafts."
    So we'll mock creating a draft locally or returning the mailto link.
    """
    
    draft = {
        "to": to_email,
        "subject": subject,
        "body": body,
        "status": "Draft"
    }
    
    print(f"Created Email Draft to {to_email}")
    return draft

def get_mailto_link(to_email: str, subject: str, body: str):
    import urllib.parse
    subject_encoded = urllib.parse.quote(subject)
    body_encoded = urllib.parse.quote(body)
    return f"mailto:{to_email}?subject={subject_encoded}&body={body_encoded}"
