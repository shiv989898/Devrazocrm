import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import time

def analyze_website(url: str):
    """
    Analyzes a given website for basic SEO, tech stack, and speed heuristics.
    """
    if not url.startswith("http"):
        url = "https://" + url

    analysis = {
        "score": 0,
        "has_ssl": url.startswith("https"),
        "has_contact_form": False,
        "has_whatsapp": False,
        "has_booking": False,
        "mobile_friendly": False,
        "page_size_kb": 0,
        "tech_stack": [],
    }

    try:
        start_time = time.time()
        response = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        end_time = time.time()
        
        content = response.text
        soup = BeautifulSoup(content, 'html.parser')

        # Size in KB
        analysis["page_size_kb"] = len(content) // 1024

        # Mobile friendly (viewport meta tag)
        viewport = soup.find("meta", {"name": "viewport"})
        if viewport:
            analysis["mobile_friendly"] = True
            
        # Forms
        forms = soup.find_all("form")
        if forms:
            analysis["has_contact_form"] = True
            
        # WhatsApp links
        if "wa.me" in content or "api.whatsapp.com" in content:
            analysis["has_whatsapp"] = True
            
        # Booking heuristic
        booking_keywords = ["book", "reservation", "appointment", "schedule", "calendly"]
        if any(keyword in content.lower() for keyword in booking_keywords):
            analysis["has_booking"] = True
            
        # Tech Stack heuristics
        if "wp-content" in content:
            analysis["tech_stack"].append("WordPress")
        if "react" in content.lower():
            analysis["tech_stack"].append("React")
        if "shopify" in content.lower():
            analysis["tech_stack"].append("Shopify")
            
        # Basic scoring
        score = 50 # Base score if it loads
        if analysis["has_ssl"]: score += 10
        if analysis["mobile_friendly"]: score += 15
        if analysis["has_contact_form"]: score += 10
        if analysis["has_whatsapp"]: score += 5
        if analysis["has_booking"]: score += 10
        
        # Penalize for slow load
        if (end_time - start_time) > 3.0:
            score -= 10
            
        analysis["score"] = min(score, 100)

    except Exception as e:
        print(f"Error analyzing {url}: {e}")
        analysis["score"] = 0
        
    return analysis

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        res = analyze_website(sys.argv[1])
        print(res)
