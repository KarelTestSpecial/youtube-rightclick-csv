from playwright.sync_api import sync_playwright, expect
import os
import time

def find_service_worker(context, timeout=20):
    """Polls the browser context to find the extension's service worker."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        for sw in context.service_workers:
            if 'background.js' in sw.url:
                print("Service worker found.")
                return sw
        time.sleep(0.5) # Wait half a second before polling again
    return None

def verify_popup_with_download_button():
    """
    This script verifies that the 'Download List' button is correctly
    added to the extension's popup.
    """
    extension_path = os.path.abspath('.')

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            '',
            headless=True,
            args=[
                f'--disable-extensions-except={extension_path}',
                f'--load-extension={extension_path}',
            ]
        )

        # Use the robust polling function to find the service worker
        service_worker = find_service_worker(context)
        if not service_worker:
            context.close()
            raise Exception("Could not find the extension's service worker after polling.")

        # Derive the popup URL from the service worker's URL
        extension_id = service_worker.url.split('/')[2]
        popup_url = f'chrome-extension://{extension_id}/popup.html'

        # Open the popup in a new page
        popup_page = context.new_page()
        popup_page.goto(popup_url)

        # Assert: Check if the "Download List" button is visible and has the correct state
        download_button = popup_page.locator('#downloadButton')
        expect(download_button).to_be_visible(timeout=5000)
        expect(download_button).to_have_text("Download List")
        expect(download_button).to_be_disabled() # Should be disabled on empty list

        # Screenshot: Capture the result for visual verification.
        print("Taking screenshot...")
        popup_page.screenshot(path='jules-scratch/verification/verification.png')
        print("Verification script ran successfully. Screenshot created.")

        context.close()

if __name__ == '__main__':
    verify_popup_with_download_button()