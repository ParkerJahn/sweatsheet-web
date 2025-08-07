import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5173", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # Input valid username and password
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[2]/form/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('DRP12')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[2]/form/input[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Jsolve90')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Check for any visible error messages or UI changes indicating login failure or success
        await page.mouse.wheel(0, window.innerHeight)
        

        # Try to reload the page and attempt login again to see if issue persists or if login can complete successfully
        await page.goto('http://localhost:5173/login', timeout=10000)
        

        # Input valid username and password and click login button
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[2]/form/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('DRP12')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[2]/form/input[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Jsolve90')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Extract JWT token from storage or verify role-based access by accessing protected routes
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div/nav/a[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Navigate to other protected routes (Home, SweatSheet, Messages) to verify access without authorization errors
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div/nav/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Navigate to SweatSheet page to verify access without authorization errors
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div/nav/a[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Navigate to Messages page to verify access without authorization errors
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div/nav/a[4]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assert that the login was successful by checking the presence of navigation links indicating authenticated state
        nav_links = ['Home', 'Calendar', 'SweatSheet', 'Messages', 'Your Team', 'Shop DRP', 'Profile', 'Settings', 'Help', 'Logout']
        for link_text in nav_links:
            locator = frame.locator(f"nav >> text={link_text}")
            assert await locator.is_visible(), f"Navigation link '{link_text}' should be visible after login"
          
        # Extract JWT token from localStorage or sessionStorage
        token = await frame.evaluate("() => window.localStorage.getItem('jwtToken') || window.sessionStorage.getItem('jwtToken')")
        assert token is not None and len(token) > 0, 'JWT token should be present after login'
          
        # Decode JWT token to verify role claims
        import jwt
        decoded_token = jwt.decode(token, options={"verify_signature": False})
        assert 'role' in decoded_token, 'JWT token should contain role claim'
        expected_roles = ['user', 'admin', 'editor']  # Adjust based on expected roles
        assert decoded_token['role'] in expected_roles, f"Role claim should be one of {expected_roles}"
          
        # Verify access to multiple protected routes without authorization errors
        protected_routes = ['Home', 'Calendar', 'SweatSheet', 'Messages']
        for route in protected_routes:
            nav_link = frame.locator(f"nav >> text={route}")
            await nav_link.click()
            await page.wait_for_timeout(2000)  # wait for page to load
            # Check that 404 error message is not present
            error_locator = frame.locator("text=404 Not Found")
            assert not await error_locator.is_visible(), f"Route {route} should be accessible without 404 error"
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    