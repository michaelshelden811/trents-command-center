// app/api/voice/route.js
// Receives audio blob from browser, sends to OpenAI Whisper, returns transcript.
// The OPENAI_API_KEY never touches the browser — this is server-side only.

import { createSupabaseClient } from '@/lib/supabase'
import { log } from '@/lib/logger'
import OpenAI from 'openai'

export async function POST(req) {
  const supabase = createSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user || error) return new Response('Unauthorized', { status: 401 })

  const formData = await req.formData()
  const audio = formData.get('audio')

  if (!audio) {
    return Response.json({ error: 'No audio provided' }, { status: 400 })
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language: 'en',
    })

    log('info', 'voice_transcribed', { userId: user.id, chars: transcription.text.length })
    return Response.json({ text: transcription.text })
  } catch (err) {
    log('error', 'whisper_failed', { userId: user.id })
    return Response.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
