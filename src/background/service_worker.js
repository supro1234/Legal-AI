// LexGuard AI — Background Service Worker (MV3)
// Acts as a message router; no direct API calls here.

chrome.runtime.onInstalled.addListener(() => {
  console.log('[LexGuard] Extension installed / updated.')
})

// Clear all sensitive data (keys + auth cache) every time the browser starts fresh
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.session.clear()
  chrome.storage.local.remove(['claudeAuthCache', 'geminiAuthCache'])
  console.log('[LexGuard] Browser started — session cleared.')
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage()
    sendResponse({ ok: true })
  }
  return true // keep port open for async response
})
