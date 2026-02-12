from playwright.sync_api import sync_playwright

def verify_hero_image():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to home page...")
        try:
            page.goto("http://localhost:3000", timeout=60000, wait_until="domcontentloaded")
        except Exception as e:
            print(f"Navigation timed out or failed: {e}")

        # Take an initial screenshot
        page.screenshot(path="verification_hero_initial.png")

        print("Waiting for hero image...")
        try:
            hero_image = page.locator("main section img").first
            hero_image.wait_for(state="visible", timeout=10000)
            print("Hero image is visible.")

            # Check src
            src = hero_image.get_attribute("src")
            print(f"Hero image src: {src}")

            # Check computed style for opacity
            opacity = hero_image.evaluate("el => window.getComputedStyle(el).opacity")
            print(f"Hero image opacity: {opacity}")

            # Check parent opacity
            parent_opacity = hero_image.locator("..").evaluate("el => window.getComputedStyle(el).opacity")
            print(f"Parent div opacity: {parent_opacity}")

            if opacity != "1":
                 print("WARNING: Hero image opacity is not 1!")
            else:
                 print("SUCCESS: Hero image opacity is 1.")

        except Exception as e:
            print(f"Failed to verify hero image: {e}")

        # Wait a bit more for animations
        page.wait_for_timeout(2000)

        # Take screenshot
        page.screenshot(path="verification_hero_final.png")
        print("Screenshot saved to verification_hero_final.png")

        browser.close()

if __name__ == "__main__":
    verify_hero_image()
