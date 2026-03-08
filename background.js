// Helper to open the standalone window
function openStandaloneWindow() {
  chrome.windows.create({
    url: chrome.runtime.getURL('popup.html?mode=standalone'),
    type: 'popup',
    width: 650,
    height: 750,
    focused: true
  });
}

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "open-json-enhance",
    title: "Open JSON Enhance",
    contexts: ["all"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "open-json-enhance") {
    openStandaloneWindow();
  }
});

// Listen for messages from popup to handle "always standalone" logic more reliably
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openStandalone") {
    openStandaloneWindow();
    sendResponse({ success: true });
  }
});
