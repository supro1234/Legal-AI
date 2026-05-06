/**
 * Analysis result cache — stores results in chrome.storage.local.
 * Same contract = same hash = instant result, zero API calls.
 * Cache expires after 24 hours.
 */

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

function hashText(text) {
  // Fast djb2-style hash — deterministic for same input
  let hash = 5381
  const sample = text.replace(/\s+/g, ' ').trim().slice(0, 600)
  for (let i = 0; i < sample.length; i++) {
    hash = ((hash << 5) + hash) ^ sample.charCodeAt(i)
    hash |= 0 // keep 32-bit int
  }
  return 'ac_' + Math.abs(hash).toString(36)
}

export async function getCachedResult(contractText) {
  if (typeof chrome === 'undefined' || !chrome.storage) return null
  const key = hashText(contractText)
  return new Promise(resolve => {
    chrome.storage.local.get(key, data => {
      const entry = data[key]
      if (!entry) return resolve(null)
      if (Date.now() - entry.timestamp > CACHE_TTL) {
        chrome.storage.local.remove(key)
        return resolve(null)
      }
      resolve(entry.result)
    })
  })
}

export async function cacheResult(contractText, result) {
  if (typeof chrome === 'undefined' || !chrome.storage) return
  const key = hashText(contractText)
  return new Promise(resolve => {
    chrome.storage.local.set({ [key]: { result, timestamp: Date.now() } }, resolve)
  })
}
