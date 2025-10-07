-- Check if users are sharing the same stream key
SELECT
  s.id as stream_db_id,
  s.stream_key,
  s.mux_stream_id,
  s.created_at as stream_created,
  e.id as event_id,
  e.user_id,
  e.title as event_title
FROM streams s
JOIN events e ON e.id = s.event_id
ORDER BY s.stream_key, e.user_id;

-- Count how many users per stream key
SELECT
  s.stream_key,
  COUNT(DISTINCT e.user_id) as user_count,
  STRING_AGG(DISTINCT e.user_id::text, ', ') as user_ids
FROM streams s
JOIN events e ON e.id = s.event_id
GROUP BY s.stream_key
ORDER BY user_count DESC;
