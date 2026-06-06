// lib/logger.js
// PII never enters logs. Use this everywhere instead of console.log.

const PII_FIELDS = ['full_name', 'name', 'email', 'phone', 'note', 'content', 'description', 'address']

function scrubPII(obj) {
  if (!obj || typeof obj !== 'object') return obj
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      PII_FIELDS.some(f => k.toLowerCase().includes(f)) ? '[redacted]' : v
    ])
  )
}

export function log(level, message, context = {}) {
  const safe = scrubPII(context)
  console.log(JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...safe }))
}
