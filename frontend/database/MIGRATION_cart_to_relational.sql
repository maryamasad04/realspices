-- Migration script: Convert cart from flat table to relational structure
-- This will drop the old cart table and create new cart and cart_items tables
-- IMPORTANT: This will delete existing cart data. Back up if needed!

-- Step 1: Drop old cart table (with CASCADE to remove dependencies)
DROP TABLE IF EXISTS cart CASCADE;

-- Step 2: Create new cart table (parent table)
CREATE TABLE cart (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create cart_items table (child table)
CREATE TABLE cart_items (
  id BIGSERIAL PRIMARY KEY,
  cart_id BIGINT NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  original_price DECIMAL(10, 2) CHECK (original_price >= 0),
  image TEXT,
  grade TEXT,
  weight TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cart_id, product_id) -- Prevent duplicate products in same cart
);

-- Step 4: Create indexes for better query performance
CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- Step 5: Create trigger to auto-update cart.updated_at when cart_items change
CREATE OR REPLACE FUNCTION update_cart_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE cart 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = COALESCE(NEW.cart_id, OLD.cart_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cart_items_update_cart_timestamp
AFTER INSERT OR UPDATE OR DELETE ON cart_items
FOR EACH ROW
EXECUTE FUNCTION update_cart_timestamp();

-- Step 6: Create trigger to auto-update cart_items.updated_at
CREATE OR REPLACE FUNCTION update_cart_items_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cart_items_update_timestamp
BEFORE UPDATE ON cart_items
FOR EACH ROW
EXECUTE FUNCTION update_cart_items_timestamp();

-- Verification queries (optional - uncomment to check)
-- SELECT * FROM cart;
-- SELECT * FROM cart_items;
-- SELECT c.user_id, ci.product_name, ci.quantity, ci.price 
-- FROM cart c 
-- LEFT JOIN cart_items ci ON c.id = ci.cart_id;
