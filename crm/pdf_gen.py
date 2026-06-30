import os
from datetime import datetime

def generate_invoice_pdf(client_name: str, amount: float, items: list, output_path: str):
    """
    Generates a basic PDF invoice using ReportLab.
    """
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
    except ImportError:
        print("ReportLab is not installed. Mocking PDF generation.")
        with open(output_path, "w") as f:
            f.write(f"Mock Invoice for {client_name}\nAmount: ${amount}\n")
        return output_path

    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter

    # Header
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 50, "INVOICE")
    
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 80, "Devrazo LeadOS")
    c.drawString(50, height - 100, f"Date: {datetime.now().strftime('%Y-%m-%d')}")
    
    # Client Info
    c.drawString(50, height - 140, f"Bill To: {client_name}")
    
    # Items
    y = height - 180
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Description")
    c.drawString(400, y, "Amount")
    
    c.line(50, y - 5, 500, y - 5)
    
    y -= 25
    c.setFont("Helvetica", 12)
    for item in items:
        c.drawString(50, y, item['description'])
        c.drawString(400, y, f"${item['amount']:.2f}")
        y -= 20
        
    c.line(50, y, 500, y)
    y -= 20
    c.setFont("Helvetica-Bold", 12)
    c.drawString(300, y, "Total:")
    c.drawString(400, y, f"${amount:.2f}")

    c.save()
    return output_path

def generate_proposal_pdf(client_name: str, output_path: str):
    """
    Generates a PDF proposal.
    """
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
    except ImportError:
        with open(output_path, "w") as f:
            f.write(f"Mock Proposal for {client_name}\n")
        return output_path
        
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter

    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 50, "SERVICE PROPOSAL")
    
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 100, f"Prepared for: {client_name}")
    c.drawString(50, height - 120, "Prepared by: Devrazo Agency")
    
    c.drawString(50, height - 160, "Thank you for the opportunity to present this proposal...")
    
    c.save()
    return output_path
