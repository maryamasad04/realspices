-- Migration: Fix product table id column to use SERIAL for auto-increment
-- This migration converts the id column from a regular integer to SERIAL
-- Run this in your Supabase SQL editor to fix the table

-- Step 1: Create a sequence for the id column
CREATE SEQUENCE IF NOT EXISTS public.product_id_seq
    START 100
    INCREMENT 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Step 2: Alter the id column to use the sequence as default
ALTER TABLE public.product
    ALTER COLUMN id SET DEFAULT nextval('public.product_id_seq'::regclass);

-- Step 3: Set the sequence owner
ALTER SEQUENCE public.product_id_seq OWNED BY public.product.id;

-- Verify the changes
-- SELECT * FROM information_schema.columns 
-- WHERE table_name='product' AND column_name='id';
