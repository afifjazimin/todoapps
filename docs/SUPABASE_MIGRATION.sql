-- =============================================
-- Enhanced Task Feature — Supabase Migration
-- =============================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This adds: category column, due_date column, sub_tasks table

-- =============================================
-- 1. Add new columns to todos table
-- =============================================

-- Add category column (replaces hashtag-in-title approach)
ALTER TABLE todos ADD COLUMN IF NOT EXISTS category text DEFAULT 'personal';

-- Add due_date column (optional due date for tasks)
ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_date date;

-- =============================================
-- 2. Migrate existing hashtag categories
-- =============================================
-- Extract #category from title into the new category column
-- and clean the title string

UPDATE todos
SET
  category = LOWER(
    (regexp_match(title, '#(work|personal|shopping|fitness)', 'i'))[1]
  ),
  title = TRIM(regexp_replace(title, '\s*#(work|personal|shopping|fitness)', '', 'i'))
WHERE title ~ '#(work|personal|shopping|fitness)';

-- =============================================
-- 3. Create sub_tasks table
-- =============================================

CREATE TABLE IF NOT EXISTS sub_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id uuid NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster lookups by parent todo
CREATE INDEX IF NOT EXISTS idx_sub_tasks_todo_id ON sub_tasks(todo_id);

-- =============================================
-- 4. Enable RLS on sub_tasks
-- =============================================

ALTER TABLE sub_tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only read their own sub_tasks
CREATE POLICY "Users can view own sub_tasks"
ON sub_tasks FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: users can only create sub_tasks for themselves
CREATE POLICY "Users can insert own sub_tasks"
ON sub_tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can only update their own sub_tasks
CREATE POLICY "Users can update own sub_tasks"
ON sub_tasks FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: users can only delete their own sub_tasks
CREATE POLICY "Users can delete own sub_tasks"
ON sub_tasks FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- Done! Verify with:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'todos';
-- SELECT * FROM sub_tasks LIMIT 5;
-- =============================================
