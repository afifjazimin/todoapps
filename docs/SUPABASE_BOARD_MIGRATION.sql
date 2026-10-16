-- =============================================
-- Board View (Custom Columns) — Supabase Migration
-- =============================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This adds: board_columns table, todos.column_id, todos.position,
-- and the ensure_board_columns() RPC used by the app on load.
-- Safe to run more than once.

-- =============================================
-- 1. board_columns table (one set of columns per user)
-- =============================================

CREATE TABLE IF NOT EXISTS board_columns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#94a3b8',
  position double precision NOT NULL DEFAULT 0,
  is_done boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_board_columns_user_id ON board_columns(user_id);

-- =============================================
-- 2. RLS — users can only manage their own columns
-- =============================================

ALTER TABLE board_columns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own board_columns" ON board_columns;
CREATE POLICY "Users can view own board_columns"
ON board_columns FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own board_columns" ON board_columns;
CREATE POLICY "Users can insert own board_columns"
ON board_columns FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own board_columns" ON board_columns;
CREATE POLICY "Users can update own board_columns"
ON board_columns FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own board_columns" ON board_columns;
CREATE POLICY "Users can delete own board_columns"
ON board_columns FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- 3. New columns on todos
-- =============================================

-- Which board column the task sits in (owner's column).
-- If the column is deleted, the app falls back to the first column.
ALTER TABLE todos ADD COLUMN IF NOT EXISTS column_id uuid REFERENCES board_columns(id) ON DELETE SET NULL;

-- Sort order inside a column (ascending). Float so a drag only updates one row.
ALTER TABLE todos ADD COLUMN IF NOT EXISTS position double precision;

CREATE INDEX IF NOT EXISTS idx_todos_column_id ON todos(column_id);

-- =============================================
-- 4. ensure_board_columns() — called by the app on load
-- =============================================
-- Creates the default columns (To Do / In Progress / Done) the first time a
-- user opens the board, and places their existing todos into To Do or Done
-- based on is_completed. The advisory lock makes concurrent calls (e.g. React
-- StrictMode double effects) safe — defaults are never created twice.

CREATE OR REPLACE FUNCTION ensure_board_columns()
RETURNS SETOF board_columns
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  todo_col uuid;
  done_col uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('board_columns:' || uid::text));

  IF NOT EXISTS (SELECT 1 FROM board_columns WHERE user_id = uid) THEN
    INSERT INTO board_columns (user_id, name, color, position, is_done)
    VALUES (uid, 'To Do', '#94a3b8', 1000, false)
    RETURNING id INTO todo_col;

    INSERT INTO board_columns (user_id, name, color, position, is_done)
    VALUES (uid, 'In Progress', '#0066ff', 2000, false);

    INSERT INTO board_columns (user_id, name, color, position, is_done)
    VALUES (uid, 'Done', '#10b981', 3000, true)
    RETURNING id INTO done_col;

    -- Backfill this user's existing todos (newest first inside each column)
    UPDATE todos
    SET
      column_id = CASE WHEN is_completed THEN done_col ELSE todo_col END,
      position = COALESCE(position, -EXTRACT(EPOCH FROM created_at))
    WHERE user_id = uid AND column_id IS NULL;
  END IF;

  RETURN QUERY
    SELECT * FROM board_columns WHERE user_id = uid ORDER BY position;
END;
$$;

REVOKE ALL ON FUNCTION ensure_board_columns() FROM public;
GRANT EXECUTE ON FUNCTION ensure_board_columns() TO authenticated;

-- =============================================
-- Done! Verify with:
-- SELECT * FROM board_columns LIMIT 10;
-- SELECT id, title, column_id, position FROM todos LIMIT 10;
-- =============================================
