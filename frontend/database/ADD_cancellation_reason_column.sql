-- Add cancellation_reason column to order table
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add comment
COMMENT ON COLUMN "order".cancellation_reason IS 'Reason provided by admin when cancelling an order';
