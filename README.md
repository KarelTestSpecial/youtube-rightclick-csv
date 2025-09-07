# YouTube Rightclick

A simple browser extension that lets you quickly save YouTube video URLs to a list. Perfect for content curators, researchers, or anyone who needs to collect multiple video links without breaking their workflow.

## Features

- **One-Click Saving:** Add YouTube videos to your list via a simple right-click context menu.
- **Save from Anywhere:** Works on YouTube's homepage, subscription feeds, search results, and on the video watch page itself.
- **Popup Interface:** A clean and simple popup to view your list, add the currently watched video, copy the list to your clipboard, or clear it.
- **CSV Formatting:** The list is automatically formatted as a CSV (`"Title","URL"`), ready to be pasted into a spreadsheet.
- **Local Storage:** Your video list is saved locally and privately on your computer.

## How to Use

1.  **Adding a Video:**
    - **Right-Click:** On any YouTube page, right-click on a video link or thumbnail and select "Add video to CSV" from the context menu.
    - **Popup Button:** While watching a video, click the extension icon in your browser's toolbar and then click the "Add Current Video" button.

2.  **Managing Your List:**
    - Click the extension icon in your browser's toolbar to open the popup.
    - **View:** Your saved videos are displayed in the text area.
    - **Copy:** Click "Copy to Clipboard" to copy the entire list.
    - **Clear:** Click "Clear List" to permanently delete all videos from your list.

## Installation

### For Users
This extension can be installed from the Chrome Web Store (link to be added here).

### For Developers
1.  Clone this repository or download the source code.
2.  Open Google Chrome and navigate to `chrome://extensions`.
3.  Enable "Developer mode" using the toggle in the top right corner.
4.  Click the "Load unpacked" button and select the directory containing the extension's files.

## Privacy

This extension respects your privacy. It does not collect any personal data. All data is stored locally on your device. For more details, please see the [Privacy Policy](PRIVACY.md).
