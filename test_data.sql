-- ConvertCast Test Data Script
-- Execute this after running supabase_setup.sql to test the schema with sample data

-- Insert test user (streamer)
INSERT INTO users (id, email, name, company, timezone)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'streamer@example.com',
    'John Streamer',
    'StreamCorp',
    'America/New_York'
);

-- Insert test viewer profiles
INSERT INTO viewer_profiles (id, email, first_name, last_name, phone, company, timezone, intent_score, lifetime_value)
VALUES
    (
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        'viewer1@example.com',
        'Alice',
        'Smith',
        '+1234567890',
        'TechCorp',
        'America/New_York',
        75,
        250.00
    ),
    (
        'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        'viewer2@example.com',
        'Bob',
        'Johnson',
        '+1987654321',
        'BusinessInc',
        'America/Los_Angeles',
        60,
        180.50
    );

-- Insert test event
INSERT INTO events (id, user_id, title, description, scheduled_start, scheduled_end, timezone, status)
VALUES (
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Product Launch Webinar',
    'Introducing our revolutionary new product',
    '2024-03-15 14:00:00-04:00',
    '2024-03-15 15:30:00-04:00',
    'America/New_York',
    'scheduled'
);

-- Insert test registrations
INSERT INTO registrations (id, event_id, viewer_profile_id, access_token, source, attended)
VALUES
    (
        'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
        'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        'token_alice_1234567890abcdef1234567890abcdef1234567890abcdef12',
        'email',
        true
    ),
    (
        'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
        'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
        'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        'token_bob___1234567890abcdef1234567890abcdef1234567890abcdef12',
        'email',
        false
    );

-- Insert test stream
INSERT INTO streams (id, event_id, mux_stream_id, mux_playback_id, stream_key, status, peak_viewers, total_viewers)
VALUES (
    'g6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'mux_stream_12345',
    'zCHLD2ZWIMMz00ewHpdUkyeqnwyYt9dvlLBAecdmdp9Q',
    'rtmp_key_abcdef',
    'active',
    25,
    47
);

-- Insert test chat messages
INSERT INTO chat_messages (id, stream_id, viewer_profile_id, message, status, is_synthetic)
VALUES
    (
        'h7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
        'g6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        'This product looks amazing! When will it be available?',
        'active',
        false
    ),
    (
        'i8eebc99-9c0b-4ef8-bb6d-6bb9bd380a99',
        'g6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
        'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        'What is the pricing for the enterprise version?',
        'active',
        false
    );

-- Insert test AI analysis
INSERT INTO ai_analysis (id, viewer_profile_id, stream_id, intent_score, buying_signals, objections, recommended_action)
VALUES
    (
        'j9eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa',
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        'g6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
        85,
        ARRAY['asked about availability', 'expressed enthusiasm'],
        ARRAY['concerned about price'],
        'Send pricing information and availability timeline'
    ),
    (
        'k0eebc99-9c0b-4ef8-bb6d-6bb9bd380bbb',
        'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        'g6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
        70,
        ARRAY['asked about enterprise pricing'],
        ARRAY['budget constraints'],
        'Offer enterprise trial or volume discount'
    );

-- Insert test EngageMax interactions
INSERT INTO engagemax_interactions (id, stream_id, viewer_profile_id, interaction_type, interaction_data, response)
VALUES
    (
        'l1eebc99-9c0b-4ef8-bb6d-6bb9bd380ccc',
        'g6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        'poll',
        '{"question": "How interested are you in this product?", "options": ["Very interested", "Somewhat interested", "Not interested"]}',
        '{"selected": "Very interested", "timestamp": "2024-03-15T14:15:00Z"}'
    ),
    (
        'm2eebc99-9c0b-4ef8-bb6d-6bb9bd380ddd',
        'g6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
        'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        'reaction',
        '{"type": "thumbs_up"}',
        '{"reacted": true, "timestamp": "2024-03-15T14:20:00Z"}'
    );

-- Insert test AutoOffer experiment
INSERT INTO autooffer_experiments (id, stream_id, variant_a, variant_b, winner, conversion_rate_a, conversion_rate_b)
VALUES (
    'n3eebc99-9c0b-4ef8-bb6d-6bb9bd380eee',
    'g6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
    '{"price": 99, "message": "Limited time offer: 50% off!"}',
    '{"price": 149, "message": "Premium package with extras!"}',
    'variant_a',
    0.12,
    0.08
);

-- Insert test InsightEngine analytics
INSERT INTO insightengine_analytics (id, event_id, predictions, actual_results, accuracy_score)
VALUES (
    'o4eebc99-9c0b-4ef8-bb6d-6bb9bd380fff',
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    '{"predicted_attendance": 45, "predicted_conversion": 0.15, "predicted_revenue": 675}',
    '{"actual_attendance": 47, "actual_conversion": 0.12, "actual_revenue": 564}',
    0.89
);

-- Verify the test data was inserted correctly
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'viewer_profiles', COUNT(*) FROM viewer_profiles
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'registrations', COUNT(*) FROM registrations
UNION ALL
SELECT 'streams', COUNT(*) FROM streams
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 'ai_analysis', COUNT(*) FROM ai_analysis
UNION ALL
SELECT 'engagemax_interactions', COUNT(*) FROM engagemax_interactions
UNION ALL
SELECT 'autooffer_experiments', COUNT(*) FROM autooffer_experiments
UNION ALL
SELECT 'insightengine_analytics', COUNT(*) FROM insightengine_analytics;

-- Test some key relationships
SELECT
    u.name as streamer,
    e.title as event,
    COUNT(r.id) as registrations,
    COUNT(CASE WHEN r.attended THEN 1 END) as attended
FROM users u
LEFT JOIN events e ON u.id = e.user_id
LEFT JOIN registrations r ON e.id = r.event_id
GROUP BY u.id, u.name, e.id, e.title;

-- Test viewer engagement data
SELECT
    vp.first_name || ' ' || vp.last_name as viewer_name,
    vp.intent_score,
    vp.lifetime_value,
    COUNT(cm.id) as chat_messages,
    COUNT(ei.id) as interactions
FROM viewer_profiles vp
LEFT JOIN chat_messages cm ON vp.id = cm.viewer_profile_id
LEFT JOIN engagemax_interactions ei ON vp.id = ei.viewer_profile_id
GROUP BY vp.id, vp.first_name, vp.last_name, vp.intent_score, vp.lifetime_value;