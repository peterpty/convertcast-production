import { supabase, supabaseAdmin } from '@/lib/supabase/client'
import type { Database, ViewerProfile, Event, IntentLevel } from '@/types/database'

type Tables = Database['public']['Tables']

// Utility function to get intent level from score
export function getIntentLevel(score: number): IntentLevel {
  if (score >= 90) return 'JACKPOT'
  if (score >= 75) return 'HOT_LEAD'
  if (score >= 60) return 'WARM'
  if (score >= 40) return 'LUKEWARM'
  return 'COLD'
}

// User queries
export const userQueries = {
  async create(userData: Tables['users']['Insert']) {
    return await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single()
  },

  async getById(id: string) {
    return await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
  },

  async getByEmail(email: string) {
    return await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
  }
}

// Viewer profile queries
export const viewerQueries = {
  async create(viewerData: Tables['viewer_profiles']['Insert']) {
    return await supabaseAdmin
      .from('viewer_profiles')
      .insert(viewerData)
      .select()
      .single()
  },

  async getById(id: string) {
    return await supabaseAdmin
      .from('viewer_profiles')
      .select('*')
      .eq('id', id)
      .single()
  },

  async getByEmail(email: string) {
    return await supabaseAdmin
      .from('viewer_profiles')
      .select('*')
      .eq('email', email)
      .single()
  },

  async updateIntentScore(id: string, score: number) {
    return await supabaseAdmin
      .from('viewer_profiles')
      .update({ intent_score: score, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
  },

  async getHighIntentViewers(minScore: number = 75, limit: number = 100) {
    return await supabaseAdmin
      .from('viewer_profiles')
      .select('*')
      .gte('intent_score', minScore)
      .order('intent_score', { ascending: false })
      .limit(limit)
  },

  async updateEngagement(id: string, timeSpent: number, interactions: number) {
    // Calculate new engagement score using our database function
    const { data, error } = await supabaseAdmin.rpc('calculate_engagement_score', {
      viewer_id: id,
      time_spent: timeSpent,
      interactions: interactions,
      engagement_rate: Math.min(interactions / 10, 1),
      purchase_history: 0 // Will be updated based on actual purchase data
    })

    if (error) throw error
    return data
  }
}

// Event queries
export const eventQueries = {
  async create(eventData: Tables['events']['Insert']) {
    return await supabaseAdmin
      .from('events')
      .insert(eventData)
      .select()
      .single()
  },

  async getById(id: string) {
    return await supabaseAdmin
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
          autooffer_config
        )
      `)
      .eq('id', id)
      .single()
  },

  async getByUserId(userId: string) {
    return await supabaseAdmin
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  },

  async updatePredictions(id: string, attendance: number, revenue: number) {
    return await supabaseAdmin
      .from('events')
      .update({
        predicted_attendance: attendance,
        predicted_revenue: revenue,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
  }
}

// Registration queries
export const registrationQueries = {
  async create(registrationData: Tables['registrations']['Insert']) {
    // Generate unique access token
    const { data: token } = await supabaseAdmin.rpc('generate_access_token')

    return await supabaseAdmin
      .from('registrations')
      .insert({
        ...registrationData,
        access_token: token
      })
      .select()
      .single()
  },

  async getByEventId(eventId: string) {
    return await supabaseAdmin
      .from('registrations')
      .select(`
        *,
        viewer_profiles(
          id,
          email,
          first_name,
          last_name,
          intent_score,
          showup_surge_data,
          engagemax_data
        )
      `)
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false })
  },

  async getByAccessToken(token: string) {
    return await supabaseAdmin
      .from('registrations')
      .select(`
        *,
        events(*),
        viewer_profiles(*)
      `)
      .eq('access_token', token)
      .single()
  },

  async markAttended(id: string, duration: number) {
    return await supabaseAdmin
      .from('registrations')
      .update({
        attended: true,
        attendance_duration: duration,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
  }
}

// Stream queries
export const streamQueries = {
  async create(streamData: Tables['streams']['Insert']) {
    return await supabaseAdmin
      .from('streams')
      .insert(streamData)
      .select()
      .single()
  },

  async getByEventId(eventId: string) {
    return await supabaseAdmin
      .from('streams')
      .select('*')
      .eq('event_id', eventId)
      .single()
  },

  async updateStatus(id: string, status: 'idle' | 'active' | 'ended') {
    return await supabaseAdmin
      .from('streams')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
  },

  async updateViewerCount(id: string, currentViewers: number) {
    // Get current peak viewers to compare
    const { data: stream } = await supabaseAdmin
      .from('streams')
      .select('peak_viewers, total_viewers')
      .eq('id', id)
      .single()

    const newPeakViewers = Math.max(stream?.peak_viewers || 0, currentViewers)
    const newTotalViewers = Math.max(stream?.total_viewers || 0, currentViewers)

    return await supabaseAdmin
      .from('streams')
      .update({
        peak_viewers: newPeakViewers,
        total_viewers: newTotalViewers,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
  }
}

// Chat message queries
export const chatQueries = {
  async create(messageData: Tables['chat_messages']['Insert']) {
    return await supabaseAdmin
      .from('chat_messages')
      .insert(messageData)
      .select()
      .single()
  },

  async getByStreamId(streamId: string, limit: number = 100) {
    return await supabaseAdmin
      .from('chat_messages')
      .select(`
        *,
        viewer_profiles(
          id,
          first_name,
          last_name,
          intent_score
        )
      `)
      .eq('stream_id', streamId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)
  },

  async createSynthetic(streamId: string, messageType: string = 'social_proof', intentLevel: string = 'medium') {
    const { data, error } = await supabaseAdmin.rpc('create_synthetic_message', {
      stream_id: streamId,
      message_type: messageType,
      intent_level: intentLevel
    })

    if (error) throw error
    return data
  },

  async moderateMessage(id: string, status: 'active' | 'removed' | 'deleted' | 'pinned') {
    return await supabaseAdmin
      .from('chat_messages')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
  }
}

// EngageMax interaction queries
export const engagemaxQueries = {
  async create(interactionData: Tables['engagemax_interactions']['Insert']) {
    return await supabaseAdmin
      .from('engagemax_interactions')
      .insert(interactionData)
      .select()
      .single()
  },

  async getByStreamId(streamId: string, interactionType?: 'poll' | 'quiz' | 'reaction' | 'cta') {
    let query = supabaseAdmin
      .from('engagemax_interactions')
      .select(`
        *,
        viewer_profiles(
          id,
          first_name,
          last_name,
          intent_score
        )
      `)
      .eq('stream_id', streamId)

    if (interactionType) {
      query = query.eq('interaction_type', interactionType)
    }

    return query.order('created_at', { ascending: false })
  },

  async getEngagementStats(streamId: string) {
    return await supabaseAdmin
      .from('engagemax_interactions')
      .select('interaction_type, viewer_profile_id')
      .eq('stream_id', streamId)
  }
}

// AutoOffer experiment queries
export const autoofferQueries = {
  async create(experimentData: Tables['autooffer_experiments']['Insert']) {
    return await supabaseAdmin
      .from('autooffer_experiments')
      .insert(experimentData)
      .select()
      .single()
  },

  async getByStreamId(streamId: string) {
    return await supabaseAdmin
      .from('autooffer_experiments')
      .select('*')
      .eq('stream_id', streamId)
      .order('created_at', { ascending: false })
  },

  async trackConversion(
    streamId: string,
    viewerId: string,
    variant: string,
    action: string,
    value: number = 0
  ) {
    const { data, error } = await supabaseAdmin.rpc('track_autooffer_conversion', {
      stream_id: streamId,
      viewer_id: viewerId,
      offer_variant: variant,
      action: action,
      value: value
    })

    if (error) throw error
    return data
  },

  async updateWinner(id: string, winner: string) {
    return await supabaseAdmin
      .from('autooffer_experiments')
      .update({
        winner,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
  }
}

// ShowUp Surge queries
export const showupSurgeQueries = {
  async optimizeForViewer(eventId: string, viewerId: string) {
    const { data, error } = await supabaseAdmin.rpc('optimize_showup_surge', {
      event_id: eventId,
      viewer_id: viewerId
    })

    if (error) throw error
    return data
  },

  async getOptimizationData(eventId: string) {
    return await supabaseAdmin
      .from('registrations')
      .select(`
        id,
        showup_surge_sequence,
        viewer_profiles(
          id,
          intent_score,
          showup_surge_data
        )
      `)
      .eq('event_id', eventId)
  }
}

// InsightEngine analytics queries
export const insightEngineQueries = {
  async generatePredictions(eventId: string) {
    const { data, error } = await supabaseAdmin.rpc('generate_insight_predictions', {
      event_id: eventId
    })

    if (error) throw error
    return data
  },

  async getAnalytics(eventId: string) {
    return await supabaseAdmin
      .from('insightengine_analytics')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
  },

  async updateActualResults(id: string, actualResults: any, accuracyScore: number) {
    return await supabaseAdmin
      .from('insightengine_analytics')
      .update({
        actual_results: actualResults,
        accuracy_score: accuracyScore
      })
      .eq('id', id)
      .select()
      .single()
  }
}

// AI analysis queries
export const aiAnalysisQueries = {
  async create(analysisData: Tables['ai_analysis']['Insert']) {
    return await supabaseAdmin
      .from('ai_analysis')
      .insert(analysisData)
      .select()
      .single()
  },

  async getByViewerId(viewerId: string, streamId: string) {
    return await supabaseAdmin
      .from('ai_analysis')
      .select('*')
      .eq('viewer_profile_id', viewerId)
      .eq('stream_id', streamId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
  },

  async getHighIntentAnalysis(streamId: string, minIntentScore: number = 75) {
    return await supabaseAdmin
      .from('ai_analysis')
      .select(`
        *,
        viewer_profiles(
          id,
          email,
          first_name,
          last_name,
          intent_score
        )
      `)
      .eq('stream_id', streamId)
      .gte('intent_score', minIntentScore)
      .order('intent_score', { ascending: false })
  }
}

// Real-time subscriptions
export const realTimeSubscriptions = {
  subscribeToChatMessages(streamId: string, callback: (payload: any) => void) {
    return supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `stream_id=eq.${streamId}`
        },
        callback
      )
      .subscribe()
  },

  subscribeToEngageMaxInteractions(streamId: string, callback: (payload: any) => void) {
    return supabase
      .channel('engagemax_interactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'engagemax_interactions',
          filter: `stream_id=eq.${streamId}`
        },
        callback
      )
      .subscribe()
  },

  subscribeToViewerProfiles(callback: (payload: any) => void) {
    return supabase
      .channel('viewer_profiles')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'viewer_profiles'
        },
        callback
      )
      .subscribe()
  },

  subscribeToStreams(eventId: string, callback: (payload: any) => void) {
    return supabase
      .channel('streams')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streams',
          filter: `event_id=eq.${eventId}`
        },
        callback
      )
      .subscribe()
  }
}

// Analytics and reporting
export const analyticsQueries = {
  async getEventSummary(eventId: string) {
    const { data: event } = await eventQueries.getById(eventId)
    if (!event) return null

    const registrations = event.registrations || []
    const totalRegistered = registrations.length
    const totalAttended = registrations.filter(r => r.attended).length

    const intentDistribution = registrations.reduce((acc, r) => {
      const score = r.viewer_profiles?.intent_score || 0
      const level = getIntentLevel(score)
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<IntentLevel, number>)

    return {
      event,
      totalRegistered,
      totalAttended,
      attendanceRate: totalRegistered > 0 ? (totalAttended / totalRegistered) * 100 : 0,
      intentDistribution,
      predictedAttendance: event.predicted_attendance,
      predictedRevenue: event.predicted_revenue
    }
  },

  async getStreamAnalytics(streamId: string) {
    const [
      { data: stream },
      { data: chatMessages },
      { data: interactions },
      { data: experiments }
    ] = await Promise.all([
      streamQueries.getByEventId(streamId),
      chatQueries.getByStreamId(streamId),
      engagemaxQueries.getByStreamId(streamId),
      autoofferQueries.getByStreamId(streamId)
    ])

    return {
      stream,
      chatMessages: chatMessages?.length || 0,
      totalInteractions: interactions?.length || 0,
      pollInteractions: interactions?.filter(i => i.interaction_type === 'poll').length || 0,
      quizInteractions: interactions?.filter(i => i.interaction_type === 'quiz').length || 0,
      reactionInteractions: interactions?.filter(i => i.interaction_type === 'reaction').length || 0,
      ctaInteractions: interactions?.filter(i => i.interaction_type === 'cta').length || 0,
      activeExperiments: experiments?.length || 0
    }
  }
}