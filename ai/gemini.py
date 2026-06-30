from google import genai
import os
import json

def get_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("WARNING: GEMINI_API_KEY not set. Mocking AI responses.")
        return None
    return genai.Client(api_key=api_key)

def review_website(analysis_data: dict, business_category: str):
    client = get_client()
    if not client:
        return {
            "summary": "Mock summary",
            "problems": "Mock problems",
            "recommendations": "Mock recommendations",
            "opportunities": "Mock opportunities"
        }
        
    prompt = f"""
    You are an expert digital marketing consultant. Review the following automated website analysis for a {business_category} business.
    Analysis data: {json.dumps(analysis_data, indent=2)}
    
    Provide your response in JSON format with exactly the following keys:
    - "summary": A 2-sentence overview of their online presence.
    - "problems": A bulleted list of major issues found (e.g., no website, missing SSL, slow loading).
    - "recommendations": A bulleted list of fixes for the problems.
    - "opportunities": Specific digital services an agency could sell to them (e.g., "Build an online booking system").
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        # Clean response in case it contains markdown formatting for JSON
        text = response.text
        if text.startswith("```json"):
            text = text[7:-3]
        return json.loads(text)
    except Exception as e:
        print(f"Error generating AI review: {e}")
        return None

def generate_outreach(business_name: str, city: str, category: str, analysis_data: dict, tone: str = "Friendly"):
    client = get_client()
    if not client:
        return "Mock outreach email..."
        
    prompt = f"""
    You are an expert B2B sales development representative for a software agency.
    Write a cold outreach message to {business_name} (a {category} in {city}).
    Tone: {tone}
    
    Use the following website analysis to personalize the message and point out areas of improvement:
    {json.dumps(analysis_data, indent=2)}
    
    Keep the message short, professional, and focus on offering a quick chat to discuss solutions. Do not be overly salesy.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        print(f"Error generating outreach: {e}")
        return None
