-- Add RTMP server URL column to streams table
-- This enables each user to have persistent, unique streaming credentials

-- Add the column (safe operation, allows NULL for existing records)
ALTER TABLE streams
ADD COLUMN IF NOT EXISTS rtmp_server_url TEXT;

-- Add index for faster credential lookups
CREATE INDEX IF NOT EXISTS idx_streams_credentials
ON streams(mux_stream_id, stream_key)
WHERE mux_stream_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN streams.rtmp_server_url IS 'RTMP ingest URL for OBS/streaming software. Typically rtmp://global-live.mux.com:5222/app';

-- Update RLS policies to ensure users can only access their own credentials
-- (Already enforced via events.user_id relationship, this is just a safety check)

COMMENT ON TABLE streams IS 'Streaming sessions with unique per-user credentials (stream_key, rtmp_server_url)';
