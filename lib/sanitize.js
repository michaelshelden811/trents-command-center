// lib/sanitize.js
// Apply to every user-supplied string before DB writes or AI calls.

export function sanitizeUserInput(input, options = {}) {
  const {
    maxChars = 4000,
    allowNewlines = true,
    allowHTML = false,
  } = options

  if (input === null || input === undefined) return ''
  if (typeof input !== 'string') input = String(input)

  input = input.replace(/\0/g, '')

  if (!allowNewlines) {
    input = input.replace(/[\r\n\t]/g, ' ').trim()
  }

  if (!allowHTML) {
    input = input.replace(/<[^>]*>/g, '')
  }

  input = input.normalize('NFC')

  const chars = [...input]
  if (chars.length > maxChars) {
    input = chars.slice(0, maxChars).join('')
  }

  return input.trim()
}
