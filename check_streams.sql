-- Check if multiple users have the same stream key
SELECT
  s.stream_key,
  s.mux_stream_id,
  COUNT(DISTINCT e.user_id) as user_count,
  STRING_AGG(DISTINCT e.user_id::text, ', ') as user_ids,
  s.created_at
FROM streams s
JOIN events e ON e.id = s.event_id
GROUP BY s.stream_key, s.mux_stream_id, s.created_at
HAVING COUNT(DISTINCT e.user_id) > 1
ORDER BY s.created_at DESC;

-- Also check total streams per user
SELECT
  e.user_id,
  COUNT(s.id) as stream_count,
  MAX(s.created_at) as latest_stream
FROM events e
LEFT JOIN streams s ON s.event_id = e.id
GROUP BY e.user_id
ORDER BY e.user_id;
