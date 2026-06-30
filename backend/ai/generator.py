import os
from google import genai
from google.genai import types

import json

def generate_outreach_drafts_batch(leads_data: list) -> dict:
    """
    Takes a list of dicts: [{'name': '...', 'category': '...', 'problems': '...'}]
    Returns a dict mapping lead_name -> email draft string.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    
    # Fallback if no API key or empty list
    results = {}
    if not leads_data:
        return results
        
    fallback_message = "Hi team,\n\nI noticed you are a great business in your area, but your website might be losing you customers. We help businesses like yours capture more leads online.\n\nOpen to a quick chat?\n\nBest,\nShiv\nDevrazo Team"

    if not api_key or api_key == "your_key_here":
        print("Warning: No GEMINI_API_KEY found. Using fallback drafts.")
        for lead in leads_data:
            results[lead['name']] = f"Hi {lead['name']} team,\n\nI noticed you are a great {lead['category']} in your area, but your website might be losing you customers. We help businesses like yours capture more leads online.\n\nOpen to a quick chat?\n\nBest,\nShiv\nDevrazo Team"
        return results
        
    try:
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
        You are a world-class copywriter and B2B email designer for Devrazo LeadOS.
        Your task is to write a highly converting, beautifully designed HTML cold email for EACH of the following businesses.
        
        Goal: Pitch our digital agency services to offer a complete website redesign, modernization, or a brand new, highly converting website. Ask them for a quick chat.
        Tone: Professional yet conversational, helpful, not overly salesy.
        
        Formatting RULES:
        1. The output MUST be raw HTML (for `email_body`). Do not include ```html blocks inside the JSON string, just output valid HTML.
        2. Use inline CSS styles extensively (this is required for Gmail compatibility). Do not use <style> tags.
        3. Design a modern, clean layout. Use a subtle background, a white card container, rounded corners, and nice typography (sans-serif).
        4. Include a clear, large, beautifully styled Call-to-Action (CTA) button linking to: https://devrazo.dev/contact
        5. Mention their business name and their current website link in the email to prove authenticity.
        6. Focus heavily on how a beautiful, modern, high-converting website can bring them more customers and elevate their brand. Do NOT focus on minor technical issues like SSL certificates, hosting, or domain names. Only talk about design, user experience, and getting more leads!
        7. Always use the name "Shiv" as the sender when introducing yourself or signing off (e.g., "Best, Shiv"). Do NOT use placeholders like "[Your Name]".
        
        Here is the JSON list of businesses:
        {json.dumps(leads_data, indent=2)}
        
        RETURN EXACTLY A JSON OBJECT matching this schema:
        {{
            "drafts": [
                {{
                    "name": "Exact Business Name",
                    "email_body": "The raw HTML drafted email code..."
                }}
            ]
        }}
        Make sure the returned JSON is valid and contains an entry for every business provided.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        if response and response.text:
            text = response.text
            # Strip markdown json blocks if present
            if text.startswith("```json"):
                text = text.replace("```json", "", 1)
            if text.startswith("```"):
                text = text.replace("```", "", 1)
            text = text.strip()
            if text.endswith("```"):
                text = text[:-3].strip()
                
            try:
                data = json.loads(text)
                for draft in data.get("drafts", []):
                    results[draft["name"]] = draft["email_body"]
            except json.JSONDecodeError as e:
                print(f"Failed to parse JSON from AI: {e}\nResponse text: {text}")
                
        # Fill in any missing ones with fallback
        for lead in leads_data:
            if lead['name'] not in results:
                results[lead['name']] = fallback_message
                
        return results
        
    except Exception as e:
        print(f"AI Batch Generation failed: {e}")
        for lead in leads_data:
            results[lead['name']] = fallback_message
        return results

