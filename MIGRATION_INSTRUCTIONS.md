# 🚀 Database Migration: Add Stream Credentials Column

## ⚠️ **IMPORTANT: Run this in Supabase Dashboard (Safest for Production)**

### **Step 1: Open Supabase SQL Editor**
1. Go to: https://app.supabase.com
2. Select your project: `yedvdwedhoetxukablxf`
3. Click: **SQL Editor** (left sidebar)
4. Click: **New Query**

### **Step 2: Copy and Paste This SQL**

```sql
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

COMMENT ON TABLE streams IS 'Streaming sessions with unique per-user credentials (stream_key, rtmp_server_url)';
```

### **Step 3: Run the Query**
1. Click: **Run** (or press Ctrl+Enter / Cmd+Enter)
2. Verify: "Success. No rows returned" message appears
3. Done! ✅

### **Step 4: Verify Migration**
Run this query to verify the column was added:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'streams' AND column_name = 'rtmp_server_url';
```

Expected result:
```
column_name       | data_type | is_nullable
rtmp_server_url   | text      | YES
```

### **Step 5: Check Existing Data** (Optional)
See current streams:

```sql
SELECT id, mux_stream_id, stream_key, rtmp_server_url, created_at
FROM streams
ORDER BY created_at DESC
LIMIT 10;
```

---

## ✅ **Migration Complete!**
Once you've run this SQL, you can proceed with testing the new Stream Credentials feature in the Studio interface.
