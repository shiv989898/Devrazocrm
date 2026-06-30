import httpx
from bs4 import BeautifulSoup
import re

async def analyze_website(url: str):
    analysis = {
        "score": 100,
        "has_ssl": url.startswith('https'),
        "has_contact_form": False,
        "email": None,
        "has_booking": False,
        "mobile_friendly": True, # Assume true unless checked properly
        "page_size_kb": 0,
        "summary": "Analysis failed",
        "problems": "",
        "recommendations": "",
        "opportunities": ""
    }
    
    if not url:
        return analysis

    try:
        if not url.startswith('http'):
            url = f"https://{url}"
            
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            response = await client.get(url, follow_redirects=True)
            html = response.text
            
            analysis['page_size_kb'] = len(html) // 1024
            
            soup = BeautifulSoup(html, 'html.parser')
            text = soup.get_text().lower()
            
            # Check for contact forms
            if soup.find('form') or 'contact' in text or 'get in touch' in text:
                analysis['has_contact_form'] = True
            else:
                analysis['score'] -= 15
                
            # Extract Email using Regex
            # Simple broad email regex
            email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
            # Check mailto: links just in case
            mailto = soup.find('a', href=re.compile(r'^mailto:'))
            
            if mailto:
                analysis['email'] = mailto['href'].replace('mailto:', '').split('?')[0].strip()
            elif email_match:
                analysis['email'] = email_match.group(0).strip()
            else:
                analysis['email'] = None
                
            # Check for booking (calendly, etc)
            if 'calendly.com' in html or 'booking' in text or 'schedule' in text or 'book now' in text:
                analysis['has_booking'] = True
            else:
                analysis['score'] -= 20
                
            problems = []
            if not analysis['has_contact_form']: problems.append("No clear contact form.")
            if not analysis['has_booking']: problems.append("No online booking system.")
            if not analysis['has_ssl']: problems.append("Missing SSL (Not secure).")
            if not analysis['email']: problems.append("No public email address found.")
            
            analysis['problems'] = "; ".join(problems)
            analysis['summary'] = f"Website analyzed. Found {len(problems)} missing conversion features."
            
            return analysis
            
    except Exception as e:
        print(f"Failed to analyze {url}: {e}")
        analysis['summary'] = "Failed to load website."
        analysis['score'] = 0
        return analysis
