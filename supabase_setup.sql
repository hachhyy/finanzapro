-- ======================================================================
-- FINANZAPRO - SUPABASE SQL SETUP
-- Copia y pega este código completo en el "SQL Editor" de tu proyecto
-- de Supabase y pulsa "Run" para crear la tabla de sincronización.
-- ======================================================================

CREATE TABLE IF NOT EXISTS public.user_state (
  id TEXT PRIMARY KEY,
  state_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.user_state ENABLE ROW LEVEL SECURITY;

-- Crear política de acceso para tu instancia personal con tu Anon Key
DROP POLICY IF EXISTS "Permitir acceso completo a instancia personal" ON public.user_state;

CREATE POLICY "Permitir acceso completo a instancia personal"
  ON public.user_state
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insertar fila inicial por defecto si no existe
INSERT INTO public.user_state (id, state_data, updated_at)
VALUES ('default_user', '{}'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;
