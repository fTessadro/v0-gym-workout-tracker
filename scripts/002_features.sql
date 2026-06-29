-- Migración 002: Notas en workouts + Plantillas de usuario

-- Agregar columna de notas a los entrenamientos
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Tabla de plantillas (rutinas reutilizables del usuario)
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de ejercicios de las plantillas
CREATE TABLE IF NOT EXISTS template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_templates_device_id ON templates(device_id);
CREATE INDEX IF NOT EXISTS idx_template_exercises_template_id ON template_exercises(template_id);

-- RLS y políticas públicas (sin autenticación)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to templates" ON templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to template_exercises" ON template_exercises FOR ALL USING (true) WITH CHECK (true);
