-- Add unique constraint on x_handle and performance indexes
ALTER TABLE participants ADD CONSTRAINT unique_x_handle UNIQUE (x_handle);

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_participants_wallet_address ON participants(wallet_address);
CREATE INDEX IF NOT EXISTS idx_participants_x_handle ON participants(x_handle);
CREATE INDEX IF NOT EXISTS idx_participants_created_at ON participants(created_at);
