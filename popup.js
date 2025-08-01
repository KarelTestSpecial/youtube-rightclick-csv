document.addEventListener('DOMContentLoaded', () => {
    const csvOutput = document.getElementById('csvOutput');
    const copyButton = document.getElementById('copyButton');
    const clearButton = document.getElementById('clearButton');
    const addCurrentVideoButton = document.getElementById('addCurrentVideoButton');

    // Function to update the popup view
    const updatePopupView = (videos = []) => {
        if (videos.length > 0) {
            csvOutput.value = videos.map(v => `"${v.title.replace(/"/g, '""')}","${v.url}"`).join('\n');
            copyButton.disabled = false;
            clearButton.disabled = false;
        } else {
            csvOutput.value = '';
            copyButton.disabled = true;
            clearButton.disabled = true;
        }
    };

    // --- Initialization ---
    // 1. Populate the list with saved videos
    chrome.storage.local.get({ videoList: [] }, (data) => {
        updatePopupView(data.videoList);
    });

    // 2. Check the current tab and enable the 'Add' button if relevant
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab && currentTab.url && currentTab.url.includes("youtube.com/watch")) {
            addCurrentVideoButton.disabled = false;
        }
    });

    // --- Event Listeners ---
    // Listen for live changes in storage
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.videoList) {
            updatePopupView(changes.videoList.newValue);
        }
    });
    
    // Button: Add current video
    addCurrentVideoButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            // We use the same injection function here as in the background script
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                // We cannot directly pass a named function from the popup,
                // so we define it explicitly here.
                func: () => {
                    const titleElement = document.querySelector('h1.ytd-watch-metadata #title, h1.title.ytd-video-primary-info-renderer');
                    if (titleElement) {
                        return { title: titleElement.innerText, url: window.location.href };
                    }
                    return null;
                }
            }, (injectionResults) => {
                if (!chrome.runtime.lastError && injectionResults && injectionResults[0] && injectionResults[0].result) {
                    // Send details to the background script to save them
                    // This is not strictly necessary (popup can save itself), but centralizes the logic.
                    chrome.runtime.sendMessage({ type: "SAVE_VIDEO", details: injectionResults[0].result });
                }
            });
        });
    });

    // We need a listener in background.js to catch this message
    // (Adjustment in background.js needed)

    copyButton.addEventListener('click', () => {
        if(csvOutput.value) {
            csvOutput.select();
            document.execCommand('copy');
        }
    });

    clearButton.addEventListener('click', () => {
        if (confirm("Weet je zeker dat je de hele lijst wilt wissen?")) {
            chrome.storage.local.set({ videoList: [] });
        }
    });
});