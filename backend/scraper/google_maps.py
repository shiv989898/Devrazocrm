import asyncio
from playwright.sync_api import sync_playwright
import urllib.parse
import re
import json


def _scrape_google_maps_sync(category: str, location: str, max_results: int = 30, exclude_names: list = None, progress_callback=None):
    """Synchronous scraper using Playwright sync API.
    
    This avoids the NotImplementedError that occurs when using Playwright's
    async API inside uvicorn on Windows + Python 3.14, because uvicorn's
    event loop doesn't support subprocess transport.
    """
    exclude_names_set = set(exclude_names) if exclude_names else set()
    query = f"{category} in {location}"
    url = f"https://www.google.com/maps/search/{urllib.parse.quote_plus(query)}"
    
    results = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        try:
            page.goto(url, timeout=30000)
            page.wait_for_selector('a[href*="/maps/place/"]', timeout=15000)
            
            # Scroll the results panel to load more results (Google Maps uses infinite scroll)
            try:
                # Find the scrollable feed container or just press PageDown on an element
                for _ in range(50):
                    elements = page.query_selector_all('a[href*="/maps/place/"]')
                    
                    # Count how many fresh, unseen links we have
                    fresh_count = 0
                    seen_hrefs = set()
                    for el in elements:
                        href = el.get_attribute('href')
                        name = el.get_attribute('aria-label')
                        if href and href not in seen_hrefs:
                            seen_hrefs.add(href)
                            if name and name not in exclude_names_set:
                                fresh_count += 1
                                
                    if fresh_count >= max_results:
                        break
                    
                    if elements:
                        # Hover the last element and scroll down
                        elements[-1].hover()
                        page.mouse.wheel(0, 3000)
                        page.wait_for_timeout(1500)
            except Exception as e:
                print("Error while scrolling:", e)
            
            # Extract links
            elements = page.query_selector_all('a[href*="/maps/place/"]')
            
            # Deduplicate and limit
            links = []
            seen = set()
            for el in elements:
                href = el.get_attribute('href')
                name_attr = el.get_attribute('aria-label')
                name = name_attr if name_attr else "Unknown"
                
                if href and href not in seen and name not in exclude_names_set:
                    seen.add(href)
                    links.append(el)
                    if len(links) >= max_results:
                        break
            
            for index, el in enumerate(links):
                if progress_callback:
                    progress_callback(index, len(links), f"Extracting details {index + 1}/{len(links)}...")
                # Extract Name directly from the link's aria-label
                name_attr = el.get_attribute('aria-label')
                name = name_attr if name_attr else "Unknown"
                
                # Click on the element to open its details
                try:
                    el.scroll_into_view_if_needed()
                    
                    old_h1 = page.query_selector('h1')
                    old_h1_text = old_h1.inner_text() if old_h1 else ""
                    
                    el.click()
                    
                    # Wait for the h1 (title) to change, guaranteeing the new detail pane is fully loaded
                    safe_old_h1 = json.dumps(old_h1_text)
                    try:
                        page.wait_for_function(f"""() => {{
                            const h1 = document.querySelector('h1');
                            return h1 && h1.innerText !== {safe_old_h1};
                        }}""", timeout=4000)
                        # Wait a tiny bit extra for the phone number DOM to settle
                        page.wait_for_timeout(800)
                    except Exception:
                        # If it takes longer than 4 seconds, it timed out. Just proceed rather than hanging.
                        pass
                    
                    try:
                        page.wait_for_selector(
                            'button[data-item-id="address"], a[data-item-id="authority"], button[data-item-id^="phone:tel:"]',
                            timeout=3000
                        )
                    except Exception:
                        pass
                    
                    # Website link
                    website = None
                    web_el = page.query_selector('a[data-item-id="authority"]')
                    if web_el:
                        website = web_el.get_attribute('href')
                        
                    # Phone
                    phone = None
                    phone_el = page.query_selector('button[data-item-id^="phone:tel:"]')
                    if phone_el:
                        phone_data = phone_el.get_attribute('data-item-id')
                        phone = phone_data.replace('phone:tel:', '') if phone_data else None
                        
                    # Address
                    address = None
                    addr_el = page.query_selector('button[data-item-id="address"]')
                    if addr_el:
                        aria_addr = addr_el.get_attribute('aria-label')
                        if aria_addr and "Address: " in aria_addr:
                            address = aria_addr.replace("Address: ", "").strip()
                        else:
                            address = addr_el.inner_text()
                        
                    # Rating
                    rating = None
                    rating_el = page.query_selector('div.F7nice')
                    if rating_el:
                        rating_text = rating_el.inner_text()
                        match = re.search(r'([\d.]+)', rating_text)
                        if match:
                            rating = float(match.group(1))
                            
                    results.append({
                        "name": name,
                        "website": website,
                        "phone": phone,
                        "address": address.split('\n')[0] if address else None,
                        "city": location.split(',')[0].strip(),
                        "state": location.split(',')[1].strip() if ',' in location else None,
                        "google_rating": rating,
                    })
                    
                except Exception as e:
                    print(f"Error extracting detail for {query}: {e}")
                    
        except Exception as e:
            print(f"Scraping failed: {e}")
        finally:
            browser.close()
            
    return results


async def scrape_google_maps(category: str, location: str, max_results: int = 30, exclude_names: list = None, progress_callback=None):
    """Async wrapper that runs the sync scraper in a thread pool.
    
    This keeps the FastAPI endpoint non-blocking while avoiding
    the event loop subprocess issue on Windows.
    """
    return await asyncio.to_thread(_scrape_google_maps_sync, category, location, max_results, exclude_names, progress_callback)


if __name__ == "__main__":
    # Test script (works both standalone and inside uvicorn)
    res = _scrape_google_maps_sync("Dental Clinic", "Austin, TX", 2)
    print(res)
