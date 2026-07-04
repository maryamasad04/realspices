-- Migration: Add email and phone columns to address table if they don't exist
-- Run this SQL in your Supabase SQL editor if you get "Could not find the 'email' column" errors

ALTER TABLE public.address
ADD COLUMN IF NOT EXISTS phone VARCHAR(32);

ALTER TABLE public.address
ADD COLUMN IF NOT EXISTS email VARCHAR(255);
