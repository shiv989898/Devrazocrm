import asyncio
from playwright.async_api import async_playwright
import urllib.parse
import re

async def debug_scrape():
    query = "Dental Clinic in Austin, TX"
    url = f"https://www.google.com/maps/search/{urllib.parse.quote_plus(query)}"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        await page.goto(url, timeout=30000)
        await page.wait_for_selector('a[href*="/maps/place/"]', timeout=15000)
        
        elements = await page.query_selector_all('a[href*="/maps/place/"]')
        if elements:
            el = elements[0]
            await el.click()
            await page.wait_for_timeout(3000) # Wait for details panel
            
            content = await page.content()
            with open("maps_debug.html", "w", encoding="utf-8") as f:
                f.write(content)
                
            print("Saved maps_debug.html")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_scrape())
