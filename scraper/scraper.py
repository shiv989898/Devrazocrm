import asyncio
from playwright.async_api import async_playwright
import re

async def scrape_google_maps(keyword: str, location: str):
    """
    Basic scraper for Google Maps using Playwright.
    Note: For production, this should be rotated with proxies.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Navigate to Google Maps
        await page.goto("https://www.google.com/maps")
        
        # Wait for search box
        await page.wait_for_selector('input#searchboxinput')
        
        # Search for keyword + location
        search_query = f"{keyword} in {location}"
        await page.fill('input#searchboxinput', search_query)
        await page.press('input#searchboxinput', 'Enter')
        
        # Wait for results list to load
        try:
            await page.wait_for_selector('div[role="feed"]', timeout=10000)
        except Exception:
            await browser.close()
            return []
            
        results = []
        
        # Grab the first visible listings
        listings = await page.locator('div[role="feed"] > div > div > a').all()
        for listing in listings[:10]: # Limit to 10 for basic testing
            href = await listing.get_attribute('href')
            name = await listing.get_attribute('aria-label')
            
            if href and name:
                results.append({
                    "name": name,
                    "maps_link": href,
                    "category": keyword,
                    "city": location
                })
        
        await browser.close()
        return results

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2:
        keyword = sys.argv[1]
        location = sys.argv[2]
        res = asyncio.run(scrape_google_maps(keyword, location))
        print(res)
