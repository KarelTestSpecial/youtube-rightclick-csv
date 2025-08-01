// --- Helper Functions ---

function normalizeAndSave(videoDetails) {
  if (!videoDetails || !videoDetails.url || !videoDetails.title) {
    console.error("Invalid or incomplete video details received.", videoDetails);
    return;
  }
  try {
    const urlObject = new URL(videoDetails.url);
    const videoId = urlObject.searchParams.get('v');
    if (!videoId) { return; }
    const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const finalDetails = { title: videoDetails.title.trim(), url: cleanUrl };
    chrome.storage.local.get({ videoList: [] }, (data) => {
      const videoList = data.videoList;
      if (!videoList.some(video => video.url === finalDetails.url)) {
        videoList.push(finalDetails);
        chrome.storage.local.set({ videoList }, () => console.log("Video added:", finalDetails.title));
      } else {
        console.log("Video already in list:", finalDetails.title);
      }
    });
  } catch (e) { console.error("Could not parse URL:", videoDetails.url, e); }
}

// --- Injected Scripts ---

function getVideoDetailsFromWatchPage() {
  const titleElement = document.querySelector('h1.ytd-watch-metadata #title, h1.title.ytd-video-primary-info-renderer');
  if (titleElement) { return { title: titleElement.innerText, url: window.location.href }; }
  return null;
}

// DEFINITIVE, TWO-STEP SEARCH FUNCTION
function getTitleForVideoId(videoId) {
    // Strategy 1: The most robust method via the container.
    const allRenderers = document.querySelectorAll('ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer');
    for (const renderer of allRenderers) {
        if (renderer.querySelector(`a[href*="/watch?v=${videoId}"]`)) {
            const titleElement = renderer.querySelector('#video-title');
            if (titleElement && titleElement.innerText && titleElement.innerText.trim() !== "") {
                return titleElement.innerText;
            }
        }
    }

    // Strategy 2: Fallback via aria-label.
    const allLinks = document.querySelectorAll(`a[href*="/watch?v=${videoId}"]`);
    for (const link of allLinks) {
        if (link.ariaLabel) {
            // aria-label often contains the full title plus extra info, we need to clean this up.
            // Example: "Title of the video from Channel Name some time ago 5 minutes"
            // We try to get the raw data, which is already a huge improvement.
            return link.ariaLabel;
        }
    }

    return null; // No strategy could find a title.
}


// --- Event Listeners ---

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToCSV",
    title: "Add video to CSV",
    contexts: ["page", "link", "image", "video"],
    documentUrlPatterns: ["*://www.youtube.com/*"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== "addToCSV") return;
    let videoId = null;
    if (info.mediaType === 'image' && info.srcUrl && info.srcUrl.includes('ytimg.com/vi/')) {
        const parts = info.srcUrl.split('/');
        if (parts.length > 4) videoId = parts[4];
    } else if (info.linkUrl) {
        try {
            const url = new URL(info.linkUrl);
            if (url.hostname.includes('youtube.com') && url.pathname === '/watch') {
                videoId = url.searchParams.get('v');
            }
        } catch (e) { /* Negeer */ }
    }
    if (videoId) {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: getTitleForVideoId,
            args: [videoId]
        }, (injectionResults) => {
            if (!chrome.runtime.lastError && injectionResults && injectionResults[0] && injectionResults[0].result) {
                normalizeAndSave({ title: injectionResults[0].result, url: videoUrl });
            } else {
                console.warn(`Could not find title for video ID ${videoId}. Using placeholder.`);
                normalizeAndSave({ title: `Video (ID: ${videoId})`, url: videoUrl });
            }
        });
        return;
    }
    if (tab.url && tab.url.includes("youtube.com/watch")) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: getVideoDetailsFromWatchPage
        }, (watchPageResults) => {
            if (!chrome.runtime.lastError && watchPageResults && watchPageResults[0] && watchPageResults[0].result) {
                normalizeAndSave(watchPageResults[0].result);
            }
        });
    }
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "SAVE_VIDEO" && message.details) {
        normalizeAndSave(message.details);
    }
});