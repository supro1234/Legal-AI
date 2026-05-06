/**
 * Compresses a contract to only the most legally important sentences.
 * Reduces tokens by ~70% — ~900 tokens instead of 4000.
 */

const HIGH_PRIORITY_KEYWORDS = [
  "deposit", "refund", "terminate", "evict", "penalty", "notice",
  "liable", "liability", "indemnity", "indemnify", "waive", "waiver",
  "forfeit", "arbitration", "court", "jurisdiction", "governing law",
  "electricity", "maintenance", "lock-in", "lock in", "data", "share",
  "third party", "third-party", "increase", "revision", "non-refundable",
  "immediately", "exclusive", "perpetual", "irrevocable", "sublicense",
  "intellectual property", "confidential", "non-compete", "non-solicitation",
  "damages", "limitation", "warranty", "as-is", "disclaimer", "severance",
  "termination", "at will", "cause", "probation", "overtime", "compensation"
]

export function compressContract(text, maxChars = 2500) {
  // Normalize whitespace
  let cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (cleaned.length <= maxChars) return cleaned

  // Split into sentences
  const sentences = cleaned.match(/[^.!?\n]+[.!?\n]+/g) || [cleaned]

  const seen = new Set()
  const important = []
  const rest = []

  for (const s of sentences) {
    const lower = s.toLowerCase()
    const trimmed = s.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)

    if (HIGH_PRIORITY_KEYWORDS.some(kw => lower.includes(kw))) {
      important.push(trimmed)
    } else {
      rest.push(trimmed)
    }
  }

  // Build result: important first, fill rest up to limit
  let result = ''
  for (const s of [...important, ...rest]) {
    if ((result + s).length > maxChars) break
    result += s + ' '
  }

  return result.trim() || cleaned.slice(0, maxChars)
}
