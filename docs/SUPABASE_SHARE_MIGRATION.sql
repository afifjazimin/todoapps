-- =============================================
-- Task Sharing Feature — Supabase Migration (Fixed RLS Version)
-- =============================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This version resolves the "infinite recursion detected" policy bug.

-- 1. Add owner_email column to todos table
ALTER TABLE todos ADD COLUMN IF NOT EXISTS owner_email text;

-- 2. Backfill existing owner_email values based on auth.users email
UPDATE todos
SET owner_email = u.email
FROM auth.users u
WHERE todos.user_id = u.id AND todos.owner_email IS NULL;

-- 3. Create todo_shares table with user_id (representing task owner)
CREATE TABLE IF NOT EXISTS todo_shares (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id uuid NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  shared_with_email text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Ensure user_id column exists if table was previously created without it
ALTER TABLE todo_shares ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill user_id in todo_shares from the parent todo creator
UPDATE todo_shares
SET user_id = t.user_id
FROM todos t
WHERE todo_shares.todo_id = t.id AND todo_shares.user_id IS NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_todo_shares_todo_id ON todo_shares(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_shares_email ON todo_shares(shared_with_email);
CREATE INDEX IF NOT EXISTS idx_todo_shares_user_id ON todo_shares(user_id);

-- 4. Enable Row Level Security (RLS) on todo_shares
ALTER TABLE todo_shares ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for todo_shares (no dependency on todos table to prevent recursion)
DROP POLICY IF EXISTS "Users can view shares for own todos or shared with them" ON todo_shares;
CREATE POLICY "Users can view shares for own todos or shared with them"
ON todo_shares FOR SELECT
USING (
  auth.uid() = user_id
  OR shared_with_email = (auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Owners can insert shares for their own todos" ON todo_shares;
CREATE POLICY "Owners can insert shares for their own todos"
ON todo_shares FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "Owners can delete shares or shared users can remove themselves" ON todo_shares;
CREATE POLICY "Owners can delete shares or shared users can remove themselves"
ON todo_shares FOR DELETE
USING (
  auth.uid() = user_id
  OR shared_with_email = (auth.jwt() ->> 'email')
);

-- 6. Update RLS policies on todos table to allow shared access
DROP POLICY IF EXISTS "Users can view own todos" ON todos;
DROP POLICY IF EXISTS "Users can view own or shared todos" ON todos;
CREATE POLICY "Users can view own or shared todos"
ON todos FOR SELECT
USING (
  auth.uid() = user_id
  OR id IN (SELECT todo_id FROM todo_shares WHERE shared_with_email = (auth.jwt() ->> 'email'))
);

DROP POLICY IF EXISTS "Users can update own todos" ON todos;
DROP POLICY IF EXISTS "Users can update own or shared todos" ON todos;
CREATE POLICY "Users can update own or shared todos"
ON todos FOR UPDATE
USING (
  auth.uid() = user_id
  OR id IN (SELECT todo_id FROM todo_shares WHERE shared_with_email = (auth.jwt() ->> 'email'))
);

DROP POLICY IF EXISTS "Users can delete own todos" ON todos;
DROP POLICY IF EXISTS "Users can delete own or shared todos" ON todos;
CREATE POLICY "Users can delete own or shared todos"
ON todos FOR DELETE
USING (
  auth.uid() = user_id
  OR id IN (SELECT todo_id FROM todo_shares WHERE shared_with_email = (auth.jwt() ->> 'email'))
);

-- 7. Update RLS policies on sub_tasks table to allow shared access (simply based on parent todo accessibility)
DROP POLICY IF EXISTS "Users can view own sub_tasks" ON sub_tasks;
DROP POLICY IF EXISTS "Users can view sub_tasks of accessible todos" ON sub_tasks;
CREATE POLICY "Users can view sub_tasks of accessible todos"
ON sub_tasks FOR SELECT
USING (
  todo_id IN (SELECT id FROM todos)
);

DROP POLICY IF EXISTS "Users can insert own sub_tasks" ON sub_tasks;
DROP POLICY IF EXISTS "Users can insert sub_tasks of accessible todos" ON sub_tasks;
CREATE POLICY "Users can insert sub_tasks of accessible todos"
ON sub_tasks FOR INSERT
WITH CHECK (
  todo_id IN (SELECT id FROM todos)
);

DROP POLICY IF EXISTS "Users can update own sub_tasks" ON sub_tasks;
DROP POLICY IF EXISTS "Users can update sub_tasks of accessible todos" ON sub_tasks;
CREATE POLICY "Users can update sub_tasks of accessible todos"
ON sub_tasks FOR UPDATE
USING (
  todo_id IN (SELECT id FROM todos)
);

DROP POLICY IF EXISTS "Users can delete own sub_tasks" ON sub_tasks;
DROP POLICY IF EXISTS "Users can delete sub_tasks of accessible todos" ON sub_tasks;
CREATE POLICY "Users can delete sub_tasks of accessible todos"
ON sub_tasks FOR DELETE
USING (
  todo_id IN (SELECT id FROM todos)
);
