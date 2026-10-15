-- Migración 003: ejercicios propios con grupo muscular y tipos de día donde se sugieren

CREATE TABLE IF NOT EXISTS custom_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  suggested_in TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_exercises_device_id ON custom_exercises(device_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_exercises_device_name ON custom_exercises(device_id, lower(name));

ALTER TABLE custom_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to custom_exercises" ON custom_exercises FOR ALL USING (true) WITH CHECK (true);
