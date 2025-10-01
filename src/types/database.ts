export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          company: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          company?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          company?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      viewer_profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone: string
          company: string | null
          timezone: string | null
          device_info: Json
          behavioral_data: Json
          purchase_history: Json
          engagement_metrics: Json
          intent_score: number
          lifetime_value: number
          ai_insights: Json
          showup_surge_data: Json
          engagemax_data: Json
          autooffer_data: Json
          total_events_attended: number
          total_purchases: number
          total_spent: number
          first_seen_at: string
          last_seen_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          phone: string
          company?: string | null
          timezone?: string | null
          device_info?: Json
          behavioral_data?: Json
          purchase_history?: Json
          engagement_metrics?: Json
          intent_score?: number
          lifetime_value?: number
          ai_insights?: Json
          showup_surge_data?: Json
          engagemax_data?: Json
          autooffer_data?: Json
          total_events_attended?: number
          total_purchases?: number
          total_spent?: number
          first_seen_at?: string
          last_seen_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string
          company?: string | null
          timezone?: string | null
          device_info?: Json
          behavioral_data?: Json
          purchase_history?: Json
          engagement_metrics?: Json
          intent_score?: number
          lifetime_value?: number
          ai_insights?: Json
          showup_surge_data?: Json
          engagemax_data?: Json
          autooffer_data?: Json
          total_events_attended?: number
          total_purchases?: number
          total_spent?: number
          first_seen_at?: string
          last_seen_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          scheduled_start: string
          scheduled_end: string
          timezone: string
          status: 'draft' | 'scheduled' | 'live' | 'completed'
          max_attendees: number | null
          registration_required: boolean
          custom_fields: Json
          smartscheduler_data: Json
          predicted_attendance: number | null
          predicted_revenue: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          scheduled_start: string
          scheduled_end: string
          timezone: string
          status?: 'draft' | 'scheduled' | 'live' | 'completed'
          max_attendees?: number | null
          registration_required?: boolean
          custom_fields?: Json
          smartscheduler_data?: Json
          predicted_attendance?: number | null
          predicted_revenue?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          scheduled_start?: string
          scheduled_end?: string
          timezone?: string
          status?: 'draft' | 'scheduled' | 'live' | 'completed'
          max_attendees?: number | null
          registration_required?: boolean
          custom_fields?: Json
          smartscheduler_data?: Json
          predicted_attendance?: number | null
          predicted_revenue?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      registrations: {
        Row: {
          id: string
          event_id: string
          viewer_profile_id: string
          access_token: string
          registration_data: Json
          source: 'email' | 'sms' | 'social' | null
          registered_at: string
          attended: boolean
          attendance_duration: number
          showup_surge_sequence: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          viewer_profile_id: string
          access_token: string
          registration_data?: Json
          source?: 'email' | 'sms' | 'social' | null
          registered_at?: string
          attended?: boolean
          attendance_duration?: number
          showup_surge_sequence?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          viewer_profile_id?: string
          access_token?: string
          registration_data?: Json
          source?: 'email' | 'sms' | 'social' | null
          registered_at?: string
          attended?: boolean
          attendance_duration?: number
          showup_surge_sequence?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_viewer_profile_id_fkey"
            columns: ["viewer_profile_id"]
            isOneToOne: false
            referencedRelation: "viewer_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      streams: {
        Row: {
          id: string
          event_id: string
          mux_stream_id: string | null
          mux_playback_id: string | null
          stream_key: string | null
          status: 'idle' | 'active' | 'ended'
          peak_viewers: number
          total_viewers: number
          engagemax_config: Json
          autooffer_config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          mux_stream_id?: string | null
          mux_playback_id?: string | null
          stream_key?: string | null
          status?: 'idle' | 'active' | 'ended'
          peak_viewers?: number
          total_viewers?: number
          engagemax_config?: Json
          autooffer_config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          mux_stream_id?: string | null
          mux_playback_id?: string | null
          stream_key?: string | null
          status?: 'idle' | 'active' | 'ended'
          peak_viewers?: number
          total_viewers?: number
          engagemax_config?: Json
          autooffer_config?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "streams_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          id: string
          stream_id: string
          viewer_profile_id: string
          message: string
          status: 'active' | 'removed' | 'deleted' | 'pinned' | 'synthetic'
          is_synthetic: boolean
          intent_signals: Json
          created_at: string
        }
        Insert: {
          id?: string
          stream_id: string
          viewer_profile_id: string
          message: string
          status?: 'active' | 'removed' | 'deleted' | 'pinned' | 'synthetic'
          is_synthetic?: boolean
          intent_signals?: Json
          created_at?: string
        }
        Update: {
          id?: string
          stream_id?: string
          viewer_profile_id?: string
          message?: string
          status?: 'active' | 'removed' | 'deleted' | 'pinned' | 'synthetic'
          is_synthetic?: boolean
          intent_signals?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_viewer_profile_id_fkey"
            columns: ["viewer_profile_id"]
            isOneToOne: false
            referencedRelation: "viewer_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_analysis: {
        Row: {
          id: string
          viewer_profile_id: string
          stream_id: string
          intent_score: number
          buying_signals: string[]
          objections: string[]
          recommended_action: string | null
          suggested_message: string | null
          autooffer_trigger: Json
          insightengine_predictions: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          viewer_profile_id: string
          stream_id: string
          intent_score?: number
          buying_signals?: string[]
          objections?: string[]
          recommended_action?: string | null
          suggested_message?: string | null
          autooffer_trigger?: Json
          insightengine_predictions?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          viewer_profile_id?: string
          stream_id?: string
          intent_score?: number
          buying_signals?: string[]
          objections?: string[]
          recommended_action?: string | null
          suggested_message?: string | null
          autooffer_trigger?: Json
          insightengine_predictions?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_viewer_profile_id_fkey"
            columns: ["viewer_profile_id"]
            isOneToOne: false
            referencedRelation: "viewer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          }
        ]
      }
      engagemax_interactions: {
        Row: {
          id: string
          stream_id: string
          viewer_profile_id: string
          interaction_type: 'poll' | 'quiz' | 'reaction' | 'cta'
          interaction_data: Json
          response: Json
          created_at: string
        }
        Insert: {
          id?: string
          stream_id: string
          viewer_profile_id: string
          interaction_type: 'poll' | 'quiz' | 'reaction' | 'cta'
          interaction_data?: Json
          response?: Json
          created_at?: string
        }
        Update: {
          id?: string
          stream_id?: string
          viewer_profile_id?: string
          interaction_type?: 'poll' | 'quiz' | 'reaction' | 'cta'
          interaction_data?: Json
          response?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagemax_interactions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagemax_interactions_viewer_profile_id_fkey"
            columns: ["viewer_profile_id"]
            isOneToOne: false
            referencedRelation: "viewer_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      autooffer_experiments: {
        Row: {
          id: string
          stream_id: string
          variant_a: Json
          variant_b: Json
          winner: string | null
          conversion_rate_a: number
          conversion_rate_b: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          stream_id: string
          variant_a?: Json
          variant_b?: Json
          winner?: string | null
          conversion_rate_a?: number
          conversion_rate_b?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          stream_id?: string
          variant_a?: Json
          variant_b?: Json
          winner?: string | null
          conversion_rate_a?: number
          conversion_rate_b?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "autooffer_experiments_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          }
        ]
      }
      insightengine_analytics: {
        Row: {
          id: string
          event_id: string
          predictions: Json
          actual_results: Json
          accuracy_score: number
          recommendations: Json
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          predictions?: Json
          actual_results?: Json
          accuracy_score?: number
          recommendations?: Json
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          predictions?: Json
          actual_results?: Json
          accuracy_score?: number
          recommendations?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insightengine_analytics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_access_token: {
        Args: Record<string, never>
        Returns: string
      }
      calculate_engagement_score: {
        Args: {
          viewer_id: string
          time_spent?: number
          interactions?: number
          engagement_rate?: number
          purchase_history?: number
        }
        Returns: number
      }
      optimize_showup_surge: {
        Args: {
          event_id: string
          viewer_id: string
        }
        Returns: Json
      }
      track_autooffer_conversion: {
        Args: {
          stream_id: string
          viewer_id: string
          offer_variant: string
          action: string
          value?: number
        }
        Returns: Json
      }
      generate_insight_predictions: {
        Args: {
          event_id: string
        }
        Returns: Json
      }
      create_synthetic_message: {
        Args: {
          stream_id: string
          message_type?: string
          intent_level?: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Utility types for ConvertCast branded features
export type IntentLevel = 'JACKPOT' | 'HOT_LEAD' | 'WARM' | 'LUKEWARM' | 'COLD'

export interface ShowUpSurgeData {
  sequence_stage: number
  reminders_sent: number
  opens: number
  clicks: number
  optimal_send_time: string
  personalized_incentive: string
  predicted_attendance: number
}

export interface EngageMaxData {
  poll_responses: number
  quiz_scores: number[]
  reaction_count: number
  engagement_score: number
  total_interactions: number
}

export interface AutoOfferData {
  price_sensitivity: 'low' | 'medium' | 'high'
  conversion_likelihood: number
  previous_purchases: number
  optimal_price_point: number
  a_b_test_variant: 'A' | 'B' | null
}

export interface SmartSchedulerData {
  optimal_times: string[]
  global_reach: number
  attendance_prediction: {
    confidence: number
    factors: string[]
  }
  timezone_distribution: Record<string, number>
}

export interface InsightEnginePredictions {
  predicted_attendance: number
  predicted_revenue: number
  confidence_score: number
  attendance_rate: number
  revenue_per_attendee: number
  optimization_recommendations: Array<{
    type: string
    priority: 'high' | 'medium' | 'low'
    action: string
  }>
  intent_distribution: {
    jackpot_viewers: number
    hot_leads: number
    warm_viewers: number
    cold_viewers: number
  }
}

type ViewerProfileRow = Database['public']['Tables']['viewer_profiles']['Row']
export interface ViewerProfile extends ViewerProfileRow {
  showup_surge_data?: ShowUpSurgeData
  engagemax_data?: EngageMaxData
  autooffer_data?: AutoOfferData
}

type EventRow = Database['public']['Tables']['events']['Row']
export interface Event extends EventRow {
  smartscheduler_data: SmartSchedulerData
}

type StreamRow = Database['public']['Tables']['streams']['Row']
export interface Stream extends StreamRow {
  engagemax_config: {
    polls_enabled: boolean
    quizzes_enabled: boolean
    reactions_enabled: boolean
    cta_enabled: boolean
  }
  autooffer_config: {
    experiments_enabled: boolean
    dynamic_pricing: boolean
    a_b_testing: boolean
  }
}