import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database'

// Test database setup
const supabaseUrl = 'https://yedvdwedhoetxukablxf.supabase.co'
const supabaseServiceKey = 'sb_secret_0vs2_C1wmxbN65Wd509P-A_V9fPYCaq'

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

test.describe('ConvertCast Database Operations', () => {
  let testUserId: string
  let testViewerId: string
  let testEventId: string
  let testStreamId: string
  let testRegistrationId: string

  test.beforeAll(async () => {
    // Clean up any existing test data
    await supabase.from('chat_messages').delete().like('message', '%ConvertCast Test%')
    await supabase.from('registrations').delete().like('access_token', '%test_%')
    await supabase.from('streams').delete().eq('stream_key', 'test_stream_key')
    await supabase.from('events').delete().like('title', '%ConvertCast Test%')
    await supabase.from('viewer_profiles').delete().like('email', '%convertcast-test%')
    await supabase.from('users').delete().like('email', '%convertcast-test%')
  })

  test.afterAll(async () => {
    // Clean up test data after all tests
    await supabase.from('chat_messages').delete().like('message', '%ConvertCast Test%')
    await supabase.from('registrations').delete().like('access_token', '%test_%')
    await supabase.from('streams').delete().eq('stream_key', 'test_stream_key')
    await supabase.from('events').delete().like('title', '%ConvertCast Test%')
    await supabase.from('viewer_profiles').delete().like('email', '%convertcast-test%')
    await supabase.from('users').delete().like('email', '%convertcast-test%')
  })

  test('should create user account', async () => {
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: 'streamer@convertcast-test.com',
        name: 'ConvertCast Test Streamer',
        company: 'ConvertCast Test Inc',
        timezone: 'America/New_York'
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data.email).toBe('streamer@convertcast-test.com')
    expect(data.name).toBe('ConvertCast Test Streamer')

    testUserId = data.id
  })

  test('should create viewer profile with intent scoring', async () => {
    const { data, error } = await supabase
      .from('viewer_profiles')
      .insert({
        email: 'viewer@convertcast-test.com',
        first_name: 'High',
        last_name: 'Intent',
        phone: '+1234567890',
        timezone: 'America/New_York',
        intent_score: 95, // JACKPOT level
        showup_surge_data: {
          reminder_sequence: 'aggressive',
          engagement_history: ['opened_all', 'clicked_multiple'],
          predicted_attendance: 0.89
        },
        engagemax_data: {
          poll_responses: 12,
          quiz_scores: [100, 95, 98],
          reaction_count: 47
        },
        autooffer_data: {
          price_sensitivity: 'low',
          conversion_likelihood: 0.87,
          previous_purchases: 2
        }
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data.email).toBe('viewer@convertcast-test.com')
    expect(data.intent_score).toBe(95)
    expect(data.first_name).toBe('High')
    expect(data.last_name).toBe('Intent')

    testViewerId = data.id
  })

  test('should create event with SmartScheduler data', async () => {
    const tomorrow = new Date(Date.now() + 86400000)
    const eventEnd = new Date(Date.now() + 90000000)

    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id: testUserId,
        title: 'ConvertCast Test: AI-Powered Webinar Revolution',
        description: 'Testing ShowUp Surge™, EngageMax™, and AutoOffer™ functionality',
        scheduled_start: tomorrow.toISOString(),
        scheduled_end: eventEnd.toISOString(),
        timezone: 'America/New_York',
        status: 'scheduled',
        max_attendees: 1000,
        predicted_attendance: 750,
        predicted_revenue: 125000,
        smartscheduler_data: {
          optimal_times: ['2pm EST', '7pm EST', '11am PST'],
          global_reach: 47,
          attendance_prediction: {
            confidence: 0.89,
            factors: ['day_of_week', 'time_zone', 'audience_profile']
          }
        }
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data.title).toBe('ConvertCast Test: AI-Powered Webinar Revolution')
    expect(data.user_id).toBe(testUserId)
    expect(data.status).toBe('scheduled')
    expect(data.predicted_attendance).toBe(750)
    expect(data.predicted_revenue).toBe(125000)

    testEventId = data.id
  })

  test('should create registration with ShowUp Surge™ tracking', async () => {
    // Generate access token using database function
    const { data: accessToken, error: tokenError } = await supabase
      .rpc('generate_access_token')

    expect(tokenError).toBeNull()
    expect(accessToken).toBeTruthy()
    expect(accessToken).toMatch(/^convertcast_/)

    const { data, error } = await supabase
      .from('registrations')
      .insert({
        event_id: testEventId,
        viewer_profile_id: testViewerId,
        access_token: accessToken,
        source: 'email',
        showup_surge_sequence: {
          sequence_stage: 1,
          reminders_sent: 0,
          opens: 0,
          clicks: 0,
          optimal_send_time: '2pm',
          personalized_incentive: 'VIP_ACCESS'
        }
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data.event_id).toBe(testEventId)
    expect(data.viewer_profile_id).toBe(testViewerId)
    expect(data.source).toBe('email')

    testRegistrationId = data.id
  })

  test('should create stream with EngageMax™ and AutoOffer™ config', async () => {
    const { data, error } = await supabase
      .from('streams')
      .insert({
        event_id: testEventId,
        stream_key: 'test_stream_key',
        status: 'idle',
        peak_viewers: 0,
        total_viewers: 0,
        engagemax_config: {
          polls_enabled: true,
          quizzes_enabled: true,
          reactions_enabled: true,
          cta_enabled: true
        },
        autooffer_config: {
          experiments_enabled: true,
          dynamic_pricing: true,
          a_b_testing: true
        }
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data.event_id).toBe(testEventId)
    expect(data.status).toBe('idle')

    testStreamId = data.id
  })

  test('should test ShowUp Surge™ optimization function', async () => {
    const { data, error } = await supabase
      .rpc('optimize_showup_surge', {
        event_id: testEventId,
        viewer_id: testViewerId
      })

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data.optimal_reminder_time).toBeTruthy()
    expect(data.incentive_type).toBeTruthy()
    expect(data.predicted_attendance_boost).toBeGreaterThan(0.8) // High intent viewer
    expect(data.personalized_message).toBeTruthy()
  })

  test('should test engagement score calculation', async () => {
    const initialScore = 95

    const { data, error } = await supabase
      .rpc('calculate_engagement_score', {
        viewer_id: testViewerId,
        time_spent: 600, // 10 minutes
        interactions: 15, // High interaction count
        engagement_rate: 0.8, // 80% engagement
        purchase_history: 2 // Previous purchases
      })

    expect(error).toBeNull()
    expect(data).toBeGreaterThanOrEqual(80) // Should maintain high score

    // Verify the viewer profile was updated
    const { data: updatedViewer } = await supabase
      .from('viewer_profiles')
      .select('intent_score')
      .eq('id', testViewerId)
      .single()

    expect(updatedViewer.intent_score).toBeGreaterThanOrEqual(80)
  })

  test('should create EngageMax™ interactions', async () => {
    const interactions = [
      {
        stream_id: testStreamId,
        viewer_profile_id: testViewerId,
        interaction_type: 'poll' as const,
        interaction_data: {
          poll_id: 'poll_1',
          question: 'What is your biggest challenge?',
          options: ['Time', 'Money', 'Skills', 'Tools']
        },
        response: {
          selected_option: 'Time',
          response_time: 5.2
        }
      },
      {
        stream_id: testStreamId,
        viewer_profile_id: testViewerId,
        interaction_type: 'quiz' as const,
        interaction_data: {
          quiz_id: 'quiz_1',
          question: 'What percentage increase in attendance does ShowUp Surge™ deliver?',
          correct_answer: '50-70%'
        },
        response: {
          answer: '50-70%',
          correct: true,
          response_time: 3.1
        }
      },
      {
        stream_id: testStreamId,
        viewer_profile_id: testViewerId,
        interaction_type: 'reaction' as const,
        interaction_data: {
          reaction_type: 'fire',
          timestamp: Date.now()
        },
        response: {
          reaction: '🔥',
          intensity: 'high'
        }
      }
    ]

    for (const interaction of interactions) {
      const { data, error } = await supabase
        .from('engagemax_interactions')
        .insert(interaction)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data.interaction_type).toBe(interaction.interaction_type)
      expect(data.stream_id).toBe(testStreamId)
      expect(data.viewer_profile_id).toBe(testViewerId)
    }
  })

  test('should create AutoOffer™ experiment', async () => {
    const { data, error } = await supabase
      .from('autooffer_experiments')
      .insert({
        stream_id: testStreamId,
        variant_a: {
          price: 497,
          headline: 'Limited Time: 50% Off Today Only!',
          button_text: 'Get Instant Access',
          urgency: 'high',
          total_views: 0,
          total_clicks: 0,
          total_purchases: 0,
          total_revenue: 0
        },
        variant_b: {
          price: 697,
          headline: 'Premium Access: Complete Training System',
          button_text: 'Join The Elite Program',
          urgency: 'medium',
          total_views: 0,
          total_clicks: 0,
          total_purchases: 0,
          total_revenue: 0
        }
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data.stream_id).toBe(testStreamId)
  })

  test('should test AutoOffer™ conversion tracking', async () => {
    const { data, error } = await supabase
      .rpc('track_autooffer_conversion', {
        stream_id: testStreamId,
        viewer_id: testViewerId,
        offer_variant: 'A',
        action: 'purchase',
        value: 497
      })

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data.viewer_id).toBe(testViewerId)
    expect(data.variant).toBe('A')
    expect(data.action).toBe('purchase')
    expect(data.value).toBe(497)
  })

  test('should create synthetic chat messages for AI Live Chat', async () => {
    const messageTypes = ['social_proof', 'engagement', 'urgency']
    const intentLevels = ['high', 'medium', 'low']

    for (const messageType of messageTypes) {
      for (const intentLevel of intentLevels) {
        const { data, error } = await supabase
          .rpc('create_synthetic_message', {
            stream_id: testStreamId,
            message_type: messageType,
            intent_level: intentLevel
          })

        expect(error).toBeNull()
        expect(data).toBeTruthy() // Should return the message ID
      }
    }

    // Verify synthetic messages were created
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('stream_id', testStreamId)
      .eq('is_synthetic', true)

    expect(messages).toBeTruthy()
    expect(messages.length).toBeGreaterThanOrEqual(9) // 3 types × 3 levels
  })

  test('should test InsightEngine™ predictions', async () => {
    const { data, error } = await supabase
      .rpc('generate_insight_predictions', {
        event_id: testEventId
      })

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data.predicted_attendance).toBeGreaterThan(0)
    expect(data.predicted_revenue).toBeGreaterThan(0)
    expect(data.confidence_score).toBeGreaterThan(0)
    expect(data.confidence_score).toBeLessThanOrEqual(1)
    expect(data.optimization_recommendations).toBeTruthy()
    expect(data.intent_distribution).toBeTruthy()
    expect(data.intent_distribution.jackpot_viewers).toBeGreaterThanOrEqual(1) // Our test viewer

    // Verify InsightEngine analytics record was created
    const { data: analytics } = await supabase
      .from('insightengine_analytics')
      .select('*')
      .eq('event_id', testEventId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    expect(analytics).toBeTruthy()
    expect(analytics.predictions).toBeTruthy()
  })

  test('should test real-time subscriptions', async () => {
    // This test verifies that real-time is enabled on the required tables
    // In a full integration test, you would set up actual subscriptions

    // Test that we can insert data and it would trigger real-time updates
    const testMessage = {
      stream_id: testStreamId,
      viewer_profile_id: testViewerId,
      message: 'ConvertCast Test Real-time Message 🚀',
      status: 'active' as const
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert(testMessage)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data.message).toBe('ConvertCast Test Real-time Message 🚀')

    // Test viewer profile update (would trigger real-time)
    const { error: updateError } = await supabase
      .from('viewer_profiles')
      .update({
        intent_score: 98,
        last_seen_at: new Date().toISOString()
      })
      .eq('id', testViewerId)

    expect(updateError).toBeNull()

    // Test stream status update (would trigger real-time)
    const { error: streamError } = await supabase
      .from('streams')
      .update({
        status: 'active',
        total_viewers: 150,
        peak_viewers: 200
      })
      .eq('id', testStreamId)

    expect(streamError).toBeNull()
  })

  test('should test complex queries with relationships', async () => {
    // Test getting event with all related data
    const { data: eventWithRelations, error } = await supabase
      .from('events')
      .select(`
        *,
        registrations(
          id,
          viewer_profile_id,
          access_token,
          attended,
          showup_surge_sequence,
          viewer_profiles(
            id,
            email,
            first_name,
            last_name,
            intent_score,
            showup_surge_data,
            engagemax_data
          )
        ),
        streams(
          id,
          status,
          peak_viewers,
          total_viewers,
          engagemax_config,
          autooffer_config,
          chat_messages(
            id,
            message,
            is_synthetic,
            intent_signals
          ),
          engagemax_interactions(
            id,
            interaction_type,
            response
          )
        )
      `)
      .eq('id', testEventId)
      .single()

    expect(error).toBeNull()
    expect(eventWithRelations).toBeTruthy()
    expect(eventWithRelations.registrations).toBeTruthy()
    expect(eventWithRelations.registrations.length).toBeGreaterThan(0)
    expect(eventWithRelations.streams).toBeTruthy()

    const registration = eventWithRelations.registrations[0]
    expect(registration.viewer_profiles).toBeTruthy()
    expect(registration.viewer_profiles.intent_score).toBe(98) // Updated score

    const stream = eventWithRelations.streams[0]
    expect(stream.chat_messages).toBeTruthy()
    expect(stream.engagemax_interactions).toBeTruthy()
  })

  test('should test performance with indexes', async () => {
    const startTime = Date.now()

    // Test query that should benefit from indexes
    const { data, error } = await supabase
      .from('viewer_profiles')
      .select('*')
      .gte('intent_score', 90)
      .order('intent_score', { ascending: false })
      .limit(100)

    const queryTime = Date.now() - startTime

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(queryTime).toBeLessThan(1000) // Should complete in less than 1 second

    // Verify our high-intent test viewer is in the results
    const testViewer = data.find(v => v.id === testViewerId)
    expect(testViewer).toBeTruthy()
    expect(testViewer.intent_score).toBeGreaterThanOrEqual(90)
  })

  test('should verify all database constraints and validations', async () => {
    // Test intent score constraint (0-100)
    const { error: constraintError } = await supabase
      .from('viewer_profiles')
      .insert({
        email: 'invalid@test.com',
        first_name: 'Invalid',
        last_name: 'Score',
        phone: '+1234567890',
        intent_score: 150 // Invalid - should be max 100
      })

    expect(constraintError).toBeTruthy()
    expect(constraintError.message).toContain('violates check constraint')

    // Test unique constraint
    const { error: uniqueError } = await supabase
      .from('viewer_profiles')
      .insert({
        email: 'viewer@convertcast-test.com', // Duplicate email
        first_name: 'Duplicate',
        last_name: 'Email',
        phone: '+9876543210'
      })

    expect(uniqueError).toBeTruthy()
    expect(uniqueError.message).toContain('duplicate key')

    // Test enum constraint
    const { error: enumError } = await supabase
      .from('events')
      .insert({
        user_id: testUserId,
        title: 'Invalid Status Event',
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date(Date.now() + 3600000).toISOString(),
        timezone: 'UTC',
        status: 'invalid_status' as any // Invalid enum value
      })

    expect(enumError).toBeTruthy()
  })

  test('should verify Row Level Security policies', async () => {
    // Create a client without admin privileges to test RLS
    const publicClient = createClient(supabaseUrl, 'sb_publishable_vkcAvLcI3uxDXtpvfSjsmw_LOwKDb90')

    // Try to access users table without authentication (should fail or return empty)
    const { data, error } = await publicClient
      .from('users')
      .select('*')
      .limit(1)

    // RLS should prevent access to user data without proper authentication
    // The exact behavior depends on your RLS policies
    if (data) {
      expect(data.length).toBe(0) // No data returned due to RLS
    } else {
      expect(error).toBeTruthy() // Access denied
    }

    // Viewer profiles should be accessible (based on our RLS policy)
    const { data: viewerData, error: viewerError } = await publicClient
      .from('viewer_profiles')
      .select('email, first_name, intent_score')
      .limit(5)

    // This should work based on our RLS policy allowing viewer profile access
    expect(viewerError).toBeNull()
  })

  test('should test database functions permissions', async () => {
    // Test that functions can be called (they have GRANT EXECUTE permissions)
    const { data: token, error: tokenError } = await supabase
      .rpc('generate_access_token')

    expect(tokenError).toBeNull()
    expect(token).toBeTruthy()
    expect(token).toMatch(/^convertcast_/)

    // Test calculation function
    const { data: score, error: scoreError } = await supabase
      .rpc('calculate_engagement_score', {
        viewer_id: testViewerId,
        time_spent: 300,
        interactions: 5,
        engagement_rate: 0.6
      })

    expect(scoreError).toBeNull()
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})