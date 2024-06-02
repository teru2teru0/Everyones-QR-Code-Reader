chrome.runtime.onInstalled.addListener(() => {
  console.log("QR Code Reader extension installed.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'capture') {
    chrome.tabs.captureVisibleTab(null, {}, (dataUrl) => {
      sendResponse({ screenshotUrl: dataUrl });
    });
    return true; // 非同期で sendResponse を呼び出すため
  }
});