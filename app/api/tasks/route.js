// app/api/tasks/route.js
// Task queue CRUD — GET all tasks, POST new task, PATCH update task status

import { createSupabaseClient } from '@/lib/supabase'
import { sanitizeUserInput } from '@/lib/sanitize'
import { log } from '@/lib/logger'

export async function GET(req) {
  const supabase = createSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user || error) return new Response('Unauthorized', { status: 401 })

  const { data, error: dbError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (dbError) {
    log('error', 'tasks_fetch_failed', { userId: user.id })
    return new Response('Internal Server Error', { status: 500 })
  }

  return Response.json(data)
}

export async function POST(req) {
  const supabase = createSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user || error) return new Response('Unauthorized', { status: 401 })

  const body = await req.json()
  const title = sanitizeUserInput(body.title, { maxChars: 200, allowNewlines: false })
  const project = sanitizeUserInput(body.project, { maxChars: 50, allowNewlines: false })

  if (!title || !project) {
    return new Response('title and project are required', { status: 400 })
  }

  const { data, error: dbError } = await supabase
    .from('tasks')
    .insert({ user_id: user.id, title, project: project.toUpperCase(), status: 'pending', progress: 0, created_by: 'gabriel' })
    .select()
    .single()

  if (dbError) {
    log('error', 'task_create_failed', { userId: user.id })
    return new Response('Internal Server Error', { status: 500 })
  }

  return Response.json(data)
}

export async function PATCH(req) {
  const supabase = createSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user || error) return new Response('Unauthorized', { status: 401 })

  const body = await req.json()
  const { id, status, progress, notes } = body

  if (!id) return new Response('id is required', { status: 400 })

  const updates = {}
  if (status) updates.status = status
  if (typeof progress === 'number') updates.progress = Math.min(100, Math.max(0, progress))
  if (notes) updates.notes = sanitizeUserInput(notes, { maxChars: 500 })
  if (status === 'done') updates.completed_at = new Date().toISOString()

  const { data, error: dbError } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (dbError) {
    log('error', 'task_update_failed', { userId: user.id })
    return new Response('Internal Server Error', { status: 500 })
  }

  return Response.json(data)
}
