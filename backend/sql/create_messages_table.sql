-- Create messages table and trigger to notify on insert
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger function to notify
CREATE OR REPLACE FUNCTION notify_new_message() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('new_message', json_build_object(
    'id', NEW.id,
    'content', NEW.content,
    'created_at', NEW.created_at
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS messages_notify_trigger ON public.messages;
CREATE TRIGGER messages_notify_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();
