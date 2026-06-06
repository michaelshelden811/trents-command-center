-- Trent's Command Center — Base Schema
-- Run this ONCE in the Supabase SQL editor.
-- Do not run again — tables persist.
-- RLS is enabled on every table at creation.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  email       text UNIQUE NOT NULL,
  role        text NOT NULL DEFAULT 'operator',
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own record"
  ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own record"
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- TASKS TABLE
-- Agent task queue — both Gabriel and Michael read/write
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project     text NOT NULL,
  title       text NOT NULL,
  status      text NOT NULL DEFAULT 'pending',
  progress    integer DEFAULT 0,
  notes       text,
  created_by  text DEFAULT 'gabriel',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own tasks"
  ON public.tasks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own tasks"
  ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own tasks"
  ON public.tasks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own tasks"
  ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RECOMMENDATIONS TABLE
-- Agent intel surfaced after each session
-- ============================================================

CREATE TABLE IF NOT EXISTS public.recommendations (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project     text NOT NULL,
  text        text NOT NULL,
  priority    text NOT NULL DEFAULT 'info',
  dismissed   boolean NOT NULL DEFAULT false,
  agent       text DEFAULT 'gabriel',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own recommendations"
  ON public.recommendations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own recommendations"
  ON public.recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own recommendations"
  ON public.recommendations FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- ACTIVITY FEED TABLE
-- Last N events across all projects
-- ============================================================

CREATE TABLE IF NOT EXISTS public.activity (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project     text NOT NULL,
  event       text NOT NULL,
  level       text NOT NULL DEFAULT 'info',
  agent       text DEFAULT 'gabriel',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own activity"
  ON public.activity FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own activity"
  ON public.activity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id),
  action        text NOT NULL,
  resource_type text NOT NULL,
  resource_id   text,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own audit logs"
  ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own audit logs"
  ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
