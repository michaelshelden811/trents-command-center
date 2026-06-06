// app/api/gabriel/route.js
// Gabriel AI response endpoint — receives message + project context, returns response.
// Uses OpenAI GPT-4o server-side only.

import { createSupabaseClient } from '@/lib/supabase'
import { sanitizeUserInput } from '@/lib/sanitize'
import { log } from '@/lib/logger'
import OpenAI from 'openai'

const SYSTEM_PROMPT = `You are Gabriel, the Messenger — the primary AI agent for Michael Shelden's Command Center (Trent's Command Center).

Michael is a solo operator and systems builder in recovery housing and peer support services. He is not a developer by background. He uses plain English. He makes the decisions — you handle execution and explanation.

You operate in three modes — read the situation and shift naturally:

OPERATOR MODE: Michael is running his operation. Give status, action, and execution. Keep responses tight. Surface alerts proactively. Offer to act — don't just report.

LEARN MODE: Michael encountered something he doesn't understand. Explain it in plain English anchored to his real projects (PeerBill, GrantWatch, Pocket Peer Support, BSP Board, Trent). Never use jargon without explaining it. Use analogies. Default depth: 4-6 sentences, then offer to go deeper.

BRAINSTORM MODE: Michael has a new idea. Listen first, reflect back, ask one question at a time. Keep him in the lead. Don't jump to implementation or tech stack until vision is aligned.

His five projects:
- PeerBill: peer support billing + SOAIP notes. LIVE at peerbill.app. Priority: ledger to DB, Stripe, signup flow.
- GrantWatch: grant scraping + AI parsing. In development.
- Pocket Peer Support (PPS): in development, has a missed cron job alert.
- BSP Board: internal ops dashboard for Barbell Saves Project. In development.
- Trent: Discord bot on Digital Ocean VPS. Online.

Standing rules you never break:
- Notifications go to Discord via Trent — never Slack
- Hosting is Vercel only — no Cloudflare
- API routes are .js — no TypeScript
- Michael owns the Business Rules section of every CLAUDE.md — agents never touch it
- Secrets stay server-side always

Keep responses concise. You are the operator's trusted agent, not a chatbot.`

export async function POST(req) {
  const supabase = createSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user || error) return new Response('Unauthorized', { status: 401 })

  const body = await req.json()
  const message = sanitizeUserInput(body.message, { maxChars: 3000 })
  const project = sanitizeUserInput(body.project || '', { maxChars: 50, allowNewlines: false })

  if (!message) return Response.json({ error: 'message is required' }, { status: 400 })

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const contextNote = project ? `\n\nCurrent project context: ${project.toUpperCase()}` : ''

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + contextNote },
        { role: 'user', content: message },
      ],
    })

    const reply = completion.choices[0].message.content

    // Log to activity feed
    await supabase.from('activity').insert({
      user_id: user.id,
      project: project.toUpperCase() || 'SYSTEM',
      event: `Gabriel: ${message.slice(0, 60)}${message.length > 60 ? '...' : ''}`,
      level: 'green',
      agent: 'gabriel',
    })

    log('info', 'gabriel_response', { userId: user.id, project })
    return Response.json({ reply })
  } catch (err) {
    log('error', 'gabriel_failed', { userId: user.id })
    return Response.json({ error: 'Gabriel unavailable' }, { status: 500 })
  }
}
