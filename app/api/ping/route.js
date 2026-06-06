// app/api/ping/route.js
// Pings all five project health routes and returns their status.
// Trent (VPS) is always reported as 'ok' since it has no HTTP health route.

import { createSupabaseClient } from '@/lib/supabase'
import { log } from '@/lib/logger'

const PROJECTS = {
  peerbill: process.env.PEERBILL_HEALTH_URL,
  grantwatch: process.env.GRANTWATCH_HEALTH_URL,
  pps: process.env.PPS_HEALTH_URL,
  bspboard: process.env.BSP_BOARD_HEALTH_URL,
}

async function pingUrl(url) {
  if (!url) return 'unknown'
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) })
    return r.ok ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}

export async function GET(req) {
  const supabase = createSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user || error) return new Response('Unauthorized', { status: 401 })

  const results = await Promise.allSettled(
    Object.entries(PROJECTS).map(async ([id, url]) => [id, await pingUrl(url)])
  )

  const health = { trent: 'ok' }
  for (const r of results) {
    if (r.status === 'fulfilled') {
      const [id, status] = r.value
      health[id] = status
    }
  }

  log('info', 'health_ping_complete', { results: Object.keys(health).length })
  return Response.json(health)
}
