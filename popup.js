document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const listSelector = document.getElementById('listSelector');
    const deleteListButton = document.getElementById('deleteListButton');
    const newListNameInput = document.getElementById('newListName');
    const addListButton = document.getElementById('addListButton');
    const addCurrentVideoButton = document.getElementById('addCurrentVideoButton');
    const videoOutput = document.getElementById('videoOutput');
    const copyButton = document.getElementById('copyButton');
    const clearButton = document.getElementById('clearButton');

    // --- State & Render ---
    let state = {
        lists: {},
        activeList: ''
    };

    const render = () => {
        const { lists, activeList } = state;
        const listNames = Object.keys(lists);
        const currentVideos = lists[activeList] || [];

        // 1. Populate Dropdown
        listSelector.innerHTML = '';
        listNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            listSelector.appendChild(option);
        });
        listSelector.value = activeList;

        // 2. Display Videos
        if (currentVideos.length > 0) {
            videoOutput.value = currentVideos.map(v => `${v.title}\n${v.url}`).join('\n\n');
        } else {
            videoOutput.value = '';
        }

        // 3. Update Button States
        copyButton.disabled = currentVideos.length === 0;
        clearButton.disabled = currentVideos.length === 0;
        deleteListButton.disabled = listNames.length <= 1; // Can't delete the last list
        videoOutput.placeholder = `List "${activeList}" is empty.`;
    };

    // --- Initialization ---
    // 1. Get initial data from storage
    chrome.storage.local.get({ lists: { 'Default List': [] }, activeList: 'Default List' }, (data) => {
        state.lists = data.lists;
        state.activeList = data.activeList;
        render();
    });

    // 2. Enable 'Add' button if on a YouTube watch page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab && currentTab.url && currentTab.url.includes("youtube.com/watch")) {
            addCurrentVideoButton.disabled = false;
        }
    });

    // --- Event Listeners ---
    // Listen for storage changes from other parts of the extension (e.g., background script)
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            if (changes.lists) {
                state.lists = changes.lists.newValue;
            }
            if (changes.activeList) {
                state.activeList = changes.activeList.newValue;
            }
            render();
        }
    });

    // Change active list
    listSelector.addEventListener('change', (e) => {
        const newActiveList = e.target.value;
        chrome.storage.local.set({ activeList: newActiveList });
        // The storage.onChanged listener will handle the re-render
    });

    // Add a new list
    addListButton.addEventListener('click', () => {
        const newName = newListNameInput.value.trim();
        if (newName && !state.lists[newName]) {
            const newLists = { ...state.lists, [newName]: [] };
            chrome.storage.local.set({ lists: newLists, activeList: newName }, () => {
                newListNameInput.value = ''; // Clear input on success
            });
        }
    });

    // Delete the selected list
    deleteListButton.addEventListener('click', () => {
        const listToDelete = state.activeList;
        if (Object.keys(state.lists).length <= 1) {
            alert("You cannot delete the last list.");
            return;
        }
        if (confirm(`Are you sure you want to delete the list "${listToDelete}"?`)) {
            const newLists = { ...state.lists };
            delete newLists[listToDelete];
            const newActiveList = Object.keys(newLists)[0]; // Switch to the first available list
            chrome.storage.local.set({ lists: newLists, activeList: newActiveList });
        }
    });

    // Add current video to the active list
    addCurrentVideoButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    const titleElement = document.querySelector('h1.ytd-watch-metadata #title, h1.title.ytd-video-primary-info-renderer');
                    return titleElement ? { title: titleElement.innerText, url: window.location.href } : null;
                }
            }, (injectionResults) => {
                if (!chrome.runtime.lastError && injectionResults && injectionResults[0] && injectionResults[0].result) {
                    chrome.runtime.sendMessage({ type: "SAVE_VIDEO", details: injectionResults[0].result });
                }
            });
        });
    });

    // Copy videos from the active list
    copyButton.addEventListener('click', () => {
        if(videoOutput.value) {
            videoOutput.select();
            document.execCommand('copy');
        }
    });

    // Clear all videos from the active list
    clearButton.addEventListener('click', () => {
        if (confirm(`Are you sure you want to clear all videos from "${state.activeList}"?`)) {
            const newLists = { ...state.lists, [state.activeList]: [] };
            chrome.storage.local.set({ lists: newLists });
        }
    });
});