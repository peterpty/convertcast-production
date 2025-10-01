-- ConvertCast Database Enhancements
-- Additional functions and real-time features for branded functionality

-- Step 1: Enable real-time on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE viewer_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE engagemax_interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE streams;

-- Step 2: Create utility functions for branded features

-- Function: Generate unique access token
CREATE OR REPLACE FUNCTION generate_access_token()
RETURNS TEXT AS $$
BEGIN
    RETURN 'convertcast_' || encode(gen_random_bytes(16), 'hex') || '_' || extract(epoch from now())::bigint;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate viewer engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
    viewer_id UUID,
    time_spent INTEGER DEFAULT 0,
    interactions INTEGER DEFAULT 0,
    engagement_rate DECIMAL DEFAULT 0,
    purchase_history INTEGER DEFAULT 0
)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    time_points INTEGER;
    interaction_points INTEGER;
    engagement_points INTEGER;
    history_points INTEGER;
BEGIN
    -- Time spent points (max 25 points for 5+ minutes)
    time_points := LEAST(time_spent / 300.0 * 25, 25);

    -- Interaction points (max 30 points for 10+ interactions)
    interaction_points := LEAST(interactions / 10.0 * 30, 30);

    -- Engagement rate points (max 25 points)
    engagement_points := engagement_rate * 25;

    -- Purchase history points (max 20 points for 3+ purchases)
    history_points := LEAST(purchase_history / 3.0 * 20, 20);

    -- Calculate total score
    score := time_points + interaction_points + engagement_points + history_points;

    -- Update viewer profile with new intent score
    UPDATE viewer_profiles
    SET intent_score = score,
        updated_at = NOW()
    WHERE id = viewer_id;

    RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function: ShowUp Surge™ optimization
CREATE OR REPLACE FUNCTION optimize_showup_surge(
    event_id UUID,
    viewer_id UUID
)
RETURNS JSONB AS $$
DECLARE
    viewer_data RECORD;
    optimization JSONB;
    optimal_time TEXT;
    incentive_type TEXT;
    reminder_sequence JSONB;
BEGIN
    -- Get viewer profile data
    SELECT * INTO viewer_data
    FROM viewer_profiles
    WHERE id = viewer_id;

    -- Determine optimal reminder time based on engagement history
    IF viewer_data.intent_score >= 90 THEN
        optimal_time := '2_hours_before';
        incentive_type := 'VIP_EARLY_ACCESS';
    ELSIF viewer_data.intent_score >= 75 THEN
        optimal_time := '4_hours_before';
        incentive_type := 'BONUS_CONTENT';
    ELSIF viewer_data.intent_score >= 50 THEN
        optimal_time := '1_day_before';
        incentive_type := 'LIMITED_DISCOUNT';
    ELSE
        optimal_time := '2_days_before';
        incentive_type := 'SOCIAL_PROOF';
    END IF;

    -- Create reminder sequence
    reminder_sequence := jsonb_build_object(
        'sequence_type', 'aggressive',
        'reminders', jsonb_build_array(
            jsonb_build_object('time', '7_days_before', 'type', 'introduction'),
            jsonb_build_object('time', '3_days_before', 'type', 'value_reminder'),
            jsonb_build_object('time', optimal_time, 'type', 'urgency'),
            jsonb_build_object('time', '30_min_before', 'type', 'final_call')
        )
    );

    -- Build optimization response
    optimization := jsonb_build_object(
        'optimal_reminder_time', optimal_time,
        'incentive_type', incentive_type,
        'reminder_sequence', reminder_sequence,
        'predicted_attendance_boost', CASE
            WHEN viewer_data.intent_score >= 90 THEN 0.85
            WHEN viewer_data.intent_score >= 75 THEN 0.72
            WHEN viewer_data.intent_score >= 50 THEN 0.58
            ELSE 0.45
        END,
        'personalized_message', CASE
            WHEN viewer_data.intent_score >= 90 THEN 'VIP exclusive access - don''t miss out!'
            WHEN viewer_data.intent_score >= 75 THEN 'Special bonus content waiting for you'
            WHEN viewer_data.intent_score >= 50 THEN 'Limited time offer expires soon'
            ELSE 'Join thousands of others already registered'
        END
    );

    -- Update registration with ShowUp Surge data
    UPDATE registrations
    SET showup_surge_sequence = optimization,
        updated_at = NOW()
    WHERE event_id = optimize_showup_surge.event_id
    AND viewer_profile_id = viewer_id;

    RETURN optimization;
END;
$$ LANGUAGE plpgsql;

-- Function: AutoOffer™ conversion tracking
CREATE OR REPLACE FUNCTION track_autooffer_conversion(
    stream_id UUID,
    viewer_id UUID,
    offer_variant TEXT,
    action TEXT, -- 'view', 'click', 'purchase'
    value DECIMAL DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    experiment_data RECORD;
    conversion_data JSONB;
    updated_stats JSONB;
BEGIN
    -- Get current experiment data
    SELECT * INTO experiment_data
    FROM autooffer_experiments
    WHERE autooffer_experiments.stream_id = track_autooffer_conversion.stream_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- Create conversion tracking data
    conversion_data := jsonb_build_object(
        'viewer_id', viewer_id,
        'variant', offer_variant,
        'action', action,
        'value', value,
        'timestamp', extract(epoch from now()),
        'intent_score', (SELECT intent_score FROM viewer_profiles WHERE id = viewer_id)
    );

    -- Update experiment statistics
    IF offer_variant = 'A' THEN
        updated_stats := jsonb_build_object(
            'total_views', COALESCE((experiment_data.variant_a->>'total_views')::INTEGER, 0) + CASE WHEN action = 'view' THEN 1 ELSE 0 END,
            'total_clicks', COALESCE((experiment_data.variant_a->>'total_clicks')::INTEGER, 0) + CASE WHEN action = 'click' THEN 1 ELSE 0 END,
            'total_purchases', COALESCE((experiment_data.variant_a->>'total_purchases')::INTEGER, 0) + CASE WHEN action = 'purchase' THEN 1 ELSE 0 END,
            'total_revenue', COALESCE((experiment_data.variant_a->>'total_revenue')::DECIMAL, 0) + CASE WHEN action = 'purchase' THEN value ELSE 0 END
        );

        UPDATE autooffer_experiments
        SET variant_a = variant_a || updated_stats,
            updated_at = NOW()
        WHERE id = experiment_data.id;
    ELSE
        updated_stats := jsonb_build_object(
            'total_views', COALESCE((experiment_data.variant_b->>'total_views')::INTEGER, 0) + CASE WHEN action = 'view' THEN 1 ELSE 0 END,
            'total_clicks', COALESCE((experiment_data.variant_b->>'total_clicks')::INTEGER, 0) + CASE WHEN action = 'click' THEN 1 ELSE 0 END,
            'total_purchases', COALESCE((experiment_data.variant_b->>'total_purchases')::INTEGER, 0) + CASE WHEN action = 'purchase' THEN 1 ELSE 0 END,
            'total_revenue', COALESCE((experiment_data.variant_b->>'total_revenue')::DECIMAL, 0) + CASE WHEN action = 'purchase' THEN value ELSE 0 END
        );

        UPDATE autooffer_experiments
        SET variant_b = variant_b || updated_stats,
            updated_at = NOW()
        WHERE id = experiment_data.id;
    END IF;

    RETURN conversion_data;
END;
$$ LANGUAGE plpgsql;

-- Function: InsightEngine™ predictions
CREATE OR REPLACE FUNCTION generate_insight_predictions(
    event_id UUID
)
RETURNS JSONB AS $$
DECLARE
    event_data RECORD;
    registration_stats RECORD;
    predictions JSONB;
    predicted_attendance INTEGER;
    predicted_revenue DECIMAL;
    optimization_recommendations JSONB;
BEGIN
    -- Get event data
    SELECT * INTO event_data FROM events WHERE id = event_id;

    -- Get registration statistics
    SELECT
        COUNT(*) as total_registrations,
        AVG(vp.intent_score) as avg_intent_score,
        COUNT(*) FILTER (WHERE vp.intent_score >= 90) as jackpot_viewers,
        COUNT(*) FILTER (WHERE vp.intent_score >= 75) as hot_leads,
        COUNT(*) FILTER (WHERE vp.intent_score >= 50) as warm_viewers
    INTO registration_stats
    FROM registrations r
    JOIN viewer_profiles vp ON vp.id = r.viewer_profile_id
    WHERE r.event_id = generate_insight_predictions.event_id;

    -- Calculate predictions based on intent scores and historical data
    predicted_attendance := ROUND(
        registration_stats.total_registrations * (
            0.95 * (registration_stats.jackpot_viewers::DECIMAL / NULLIF(registration_stats.total_registrations, 0)) +
            0.78 * (registration_stats.hot_leads::DECIMAL / NULLIF(registration_stats.total_registrations, 0)) +
            0.52 * (registration_stats.warm_viewers::DECIMAL / NULLIF(registration_stats.total_registrations, 0)) +
            0.28 * ((registration_stats.total_registrations - registration_stats.jackpot_viewers - registration_stats.hot_leads - registration_stats.warm_viewers)::DECIMAL / NULLIF(registration_stats.total_registrations, 0))
        )
    );

    -- Calculate predicted revenue (estimated $167 average per attendee for high-intent webinars)
    predicted_revenue := predicted_attendance * 167 * (registration_stats.avg_intent_score / 100.0);

    -- Generate optimization recommendations
    optimization_recommendations := jsonb_build_array(
        CASE WHEN registration_stats.avg_intent_score < 60 THEN
            jsonb_build_object('type', 'engagement', 'priority', 'high', 'action', 'Increase pre-webinar engagement with polls and teasers')
        END,
        CASE WHEN predicted_attendance < registration_stats.total_registrations * 0.5 THEN
            jsonb_build_object('type', 'showup_surge', 'priority', 'high', 'action', 'Activate ShowUp Surge™ aggressive reminder sequence')
        END,
        CASE WHEN registration_stats.jackpot_viewers > 10 THEN
            jsonb_build_object('type', 'vip_experience', 'priority', 'medium', 'action', 'Create VIP experience for JACKPOT viewers')
        END,
        jsonb_build_object('type', 'autooffer', 'priority', 'medium', 'action', 'Prepare A/B test offers at 25% and 45% through webinar')
    );

    -- Build predictions object
    predictions := jsonb_build_object(
        'predicted_attendance', predicted_attendance,
        'predicted_revenue', predicted_revenue,
        'confidence_score', CASE
            WHEN registration_stats.total_registrations > 100 THEN 0.92
            WHEN registration_stats.total_registrations > 50 THEN 0.87
            WHEN registration_stats.total_registrations > 20 THEN 0.78
            ELSE 0.65
        END,
        'attendance_rate', ROUND((predicted_attendance::DECIMAL / NULLIF(registration_stats.total_registrations, 1)) * 100, 1),
        'revenue_per_attendee', ROUND(predicted_revenue / NULLIF(predicted_attendance, 1), 2),
        'optimization_recommendations', optimization_recommendations,
        'intent_distribution', jsonb_build_object(
            'jackpot_viewers', registration_stats.jackpot_viewers,
            'hot_leads', registration_stats.hot_leads,
            'warm_viewers', registration_stats.warm_viewers,
            'cold_viewers', registration_stats.total_registrations - registration_stats.jackpot_viewers - registration_stats.hot_leads - registration_stats.warm_viewers
        )
    );

    -- Update event with predictions
    UPDATE events
    SET predicted_attendance = predicted_attendance,
        predicted_revenue = predicted_revenue,
        updated_at = NOW()
    WHERE id = event_id;

    -- Insert into InsightEngine analytics
    INSERT INTO insightengine_analytics (event_id, predictions)
    VALUES (event_id, predictions);

    RETURN predictions;
END;
$$ LANGUAGE plpgsql;

-- Function: Create synthetic chat message for AI Live Chat
CREATE OR REPLACE FUNCTION create_synthetic_message(
    stream_id UUID,
    message_type TEXT DEFAULT 'social_proof', -- 'social_proof', 'engagement', 'urgency'
    intent_level TEXT DEFAULT 'medium' -- 'low', 'medium', 'high'
)
RETURNS UUID AS $$
DECLARE
    message_text TEXT;
    synthetic_viewer_id UUID;
    message_id UUID;
    intent_signals JSONB;
BEGIN
    -- Create a synthetic viewer profile for the message
    INSERT INTO viewer_profiles (
        email, first_name, last_name, phone, timezone, intent_score
    ) VALUES (
        'synthetic_' || gen_random_uuid() || '@convertcast.ai',
        (ARRAY['Alex', 'Sarah', 'Mike', 'Lisa', 'David', 'Emma', 'John', 'Amy'])[ceil(random() * 8)],
        (ARRAY['Johnson', 'Smith', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore'])[ceil(random() * 8)],
        '+1-555-' || lpad((random() * 9999)::text, 4, '0') || '-' || lpad((random() * 9999)::text, 4, '0'),
        'America/New_York',
        CASE intent_level
            WHEN 'high' THEN 85 + (random() * 15)::INTEGER
            WHEN 'medium' THEN 60 + (random() * 25)::INTEGER
            ELSE 20 + (random() * 40)::INTEGER
        END
    ) RETURNING id INTO synthetic_viewer_id;

    -- Generate appropriate message based on type and intent
    message_text := CASE message_type
        WHEN 'social_proof' THEN CASE intent_level
            WHEN 'high' THEN (ARRAY[
                'This is exactly what I needed! Already implementing these strategies 🚀',
                'Mind blown! This approach just solved my biggest challenge',
                'Taking notes like crazy! Pure gold here 💎',
                'Already seeing results from the first tip - incredible!'
            ])[ceil(random() * 4)]
            WHEN 'medium' THEN (ARRAY[
                'Great insights so far! Really helpful content',
                'Love the practical examples - very actionable',
                'This makes so much sense now, thanks for explaining it clearly',
                'Bookmarking this for later implementation'
            ])[ceil(random() * 4)]
            ELSE (ARRAY[
                'Interesting perspective, learning a lot',
                'Good information, thanks for sharing',
                'Nice content, appreciate the free value',
                'Helpful tips, enjoying the presentation'
            ])[ceil(random() * 4)]
        END
        WHEN 'engagement' THEN (ARRAY[
            'Can you share more details about the advanced features?',
            'How does this compare to other solutions in the market?',
            'What kind of results have other clients seen?',
            'Is there a case study you can walk us through?'
        ])[ceil(random() * 4)]
        WHEN 'urgency' THEN (ARRAY[
            'How long is this special offer available?',
            'Is the bonus included with all packages?',
            'Can I get started immediately after purchase?',
            'What happens if I need to upgrade later?'
        ])[ceil(random() * 4)]
        ELSE 'Thanks for the great content!'
    END;

    -- Set intent signals based on message
    intent_signals := jsonb_build_object(
        'buying_intent', CASE intent_level
            WHEN 'high' THEN random() * 0.3 + 0.7
            WHEN 'medium' THEN random() * 0.4 + 0.3
            ELSE random() * 0.3
        END,
        'engagement_score', CASE message_type
            WHEN 'engagement' THEN random() * 0.3 + 0.7
            WHEN 'social_proof' THEN random() * 0.4 + 0.4
            ELSE random() * 0.5 + 0.2
        END,
        'sentiment', CASE intent_level
            WHEN 'high' THEN 'very_positive'
            WHEN 'medium' THEN 'positive'
            ELSE 'neutral'
        END
    );

    -- Insert the synthetic message
    INSERT INTO chat_messages (
        stream_id,
        viewer_profile_id,
        message,
        status,
        is_synthetic,
        intent_signals
    ) VALUES (
        create_synthetic_message.stream_id,
        synthetic_viewer_id,
        message_text,
        'synthetic',
        true,
        intent_signals
    ) RETURNING id INTO message_id;

    RETURN message_id;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION generate_access_token() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_engagement_score(UUID, INTEGER, INTEGER, DECIMAL, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION optimize_showup_surge(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION track_autooffer_conversion(UUID, UUID, TEXT, TEXT, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_insight_predictions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_synthetic_message(UUID, TEXT, TEXT) TO authenticated;

COMMIT;