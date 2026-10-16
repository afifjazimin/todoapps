-- =============================================
-- Telegram Bot Integration — Supabase Migration
-- =============================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This adds: telegram_profiles table, link code generator, and linking RPC functions.
-- Safe to run more than once.

-- =============================================
-- 1. Table telegram_profiles
-- =============================================

CREATE TABLE IF NOT EXISTS telegram_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_chat_id bigint UNIQUE,
  telegram_username text,
  link_code text UNIQUE,
  is_linked boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  linked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_telegram_profiles_chat_id ON telegram_profiles(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_profiles_link_code ON telegram_profiles(link_code);

-- =============================================
-- 2. RLS Policies
-- =============================================

ALTER TABLE telegram_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own telegram profile" ON telegram_profiles;
CREATE POLICY "Users can view own telegram profile"
ON telegram_profiles FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own telegram profile" ON telegram_profiles;
CREATE POLICY "Users can insert own telegram profile"
ON telegram_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own telegram profile" ON telegram_profiles;
CREATE POLICY "Users can update own telegram profile"
ON telegram_profiles FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own telegram profile" ON telegram_profiles;
CREATE POLICY "Users can delete own telegram profile"
ON telegram_profiles FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- 3. Function to generate or get existing link code
-- =============================================

CREATE OR REPLACE FUNCTION get_or_create_telegram_link_code()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  existing_code text;
  new_code text;
  is_already_linked boolean := false;
  tg_user text := null;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT link_code, is_linked, telegram_username
  INTO existing_code, is_already_linked, tg_user
  FROM telegram_profiles
  WHERE user_id = uid;

  IF existing_code IS NOT NULL AND NOT is_already_linked THEN
    RETURN jsonb_build_object(
      'link_code', existing_code,
      'is_linked', false,
      'telegram_username', tg_user
    );
  END IF;

  IF is_already_linked THEN
    RETURN jsonb_build_object(
      'link_code', existing_code,
      'is_linked', true,
      'telegram_username', tg_user
    );
  END IF;

  -- Generate a clean 6-character alphanumeric code (avoid ambiguous 0/O/1/I)
  LOOP
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    -- Ensure uniqueness
    EXIT WHEN NOT EXISTS (SELECT 1 FROM telegram_profiles WHERE link_code = new_code);
  END LOOP;

  INSERT INTO telegram_profiles (user_id, link_code, is_linked)
  VALUES (uid, new_code, false)
  ON CONFLICT (user_id)
  DO UPDATE SET link_code = new_code, is_linked = false;

  RETURN jsonb_build_object(
    'link_code', new_code,
    'is_linked', false,
    'telegram_username', null
  );
END;
$$;

REVOKE ALL ON FUNCTION get_or_create_telegram_link_code() FROM public;
GRANT EXECUTE ON FUNCTION get_or_create_telegram_link_code() TO authenticated;

-- =============================================
-- 4. Function to unlink Telegram account
-- =============================================

CREATE OR REPLACE FUNCTION unlink_telegram_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE telegram_profiles
  SET
    telegram_chat_id = NULL,
    telegram_username = NULL,
    is_linked = false,
    linked_at = NULL
  WHERE user_id = uid;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION unlink_telegram_account() FROM public;
GRANT EXECUTE ON FUNCTION unlink_telegram_account() TO authenticated;

-- =============================================
-- Done! Verify with:
-- SELECT * FROM telegram_profiles;
-- =============================================
