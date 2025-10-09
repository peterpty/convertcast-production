export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_encrypted: boolean
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      ai_analysis: {
        Row: {
          autooffer_trigger: Json | null
          buying_signals: string[] | null
          created_at: string | null
          id: string
          insightengine_predictions: Json | null
          intent_score: number | null
          objections: string[] | null
          recommended_action: string | null
          stream_id: string
          suggested_message: string | null
          updated_at: string | null
          viewer_profile_id: string
        }
        Insert: {
          autooffer_trigger?: Json | null
          buying_signals?: string[] | null
          created_at?: string | null
          id?: string
          insightengine_predictions?: Json | null
          intent_score?: number | null
          objections?: string[] | null
          recommended_action?: string | null
          stream_id: string
          suggested_message?: string | null
          updated_at?: string | null
          viewer_profile_id: string
        }
        Update: {
          autooffer_trigger?: Json | null
          buying_signals?: string[] | null
          created_at?: string | null
          id?: string
          insightengine_predictions?: Json | null
          intent_score?: number | null
          objections?: string[] | null
          recommended_action?: string | null
          stream_id?: string
          suggested_message?: string | null
          updated_at?: string | null
          viewer_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_viewer_profile_id_fkey"
            columns: ["viewer_profile_id"]
            isOneToOne: false
            referencedRelation: "viewer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      autooffer_experiments: {
        Row: {
          conversion_rate_a: number | null
          conversion_rate_b: number | null
          created_at: string | null
          id: string
          stream_id: string
          updated_at: string | null
          variant_a: Json | null
          variant_b: Json | null
          winner: string | null
        }
        Insert: {
          conversion_rate_a?: number | null
          conversion_rate_b?: number | null
          created_at?: string | null
          id?: string
          stream_id: string
          updated_at?: string | null
          variant_a?: Json | null
          variant_b?: Json | null
          winner?: string | null
        }
        Update: {
          conversion_rate_a?: number | null
          conversion_rate_b?: number | null
          created_at?: string | null
          id?: string
          stream_id?: string
          updated_at?: string | null
          variant_a?: Json | null
          variant_b?: Json | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "autooffer_experiments_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string | null
          id: string
          intent_signals: Json | null
          is_private: boolean
          is_synthetic: boolean | null
          message: string
          reply_to_message_id: string | null
          reply_to_user_id: string | null
          sender_id: string | null
          status: string
          stream_id: string
          viewer_profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          intent_signals?: Json | null
          is_private?: boolean
          is_synthetic?: boolean | null
          message: string
          reply_to_message_id?: string | null
          reply_to_user_id?: string | null
          sender_id?: string | null
          status?: string
          stream_id: string
          viewer_profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          intent_signals?: Json | null
          is_private?: boolean
          is_synthetic?: boolean | null
          message?: string
          reply_to_message_id?: string | null
          reply_to_user_id?: string | null
          sender_id?: string | null
          status?: string
          stream_id?: string
          viewer_profile_id?: string
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
          },
        ]
      }
      engagemax_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_data: Json | null
          interaction_type: string
          response: Json | null
          stream_id: string
          viewer_profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_data?: Json | null
          interaction_type: string
          response?: Json | null
          stream_id: string
          viewer_profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_data?: Json | null
          interaction_type?: string
          response?: Json | null
          stream_id?: string
          viewer_profile_id?: string
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
          },
        ]
      }
      event_analytics: {
        Row: {
          average_watch_time: number | null
          conversion_rate: number | null
          created_at: string | null
          email_registrations: number | null
          event_ended_at: string | null
          event_id: string
          event_started_at: string | null
          id: string
          notifications_clicked: number | null
          notifications_opened: number | null
          notifications_sent: number | null
          peak_concurrent_viewers: number | null
          registration_to_attendance_rate: number | null
          sms_registrations: number | null
          social_registrations: number | null
          total_engagement_actions: number | null
          total_registrations: number | null
          total_revenue: number | null
          updated_at: string | null
          viewers_attended: number | null
        }
        Insert: {
          average_watch_time?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          email_registrations?: number | null
          event_ended_at?: string | null
          event_id: string
          event_started_at?: string | null
          id?: string
          notifications_clicked?: number | null
          notifications_opened?: number | null
          notifications_sent?: number | null
          peak_concurrent_viewers?: number | null
          registration_to_attendance_rate?: number | null
          sms_registrations?: number | null
          social_registrations?: number | null
          total_engagement_actions?: number | null
          total_registrations?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          viewers_attended?: number | null
        }
        Update: {
          average_watch_time?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          email_registrations?: number | null
          event_ended_at?: string | null
          event_id?: string
          event_started_at?: string | null
          id?: string
          notifications_clicked?: number | null
          notifications_opened?: number | null
          notifications_sent?: number | null
          peak_concurrent_viewers?: number | null
          registration_to_attendance_rate?: number | null
          sms_registrations?: number | null
          social_registrations?: number | null
          total_engagement_actions?: number | null
          total_registrations?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          viewers_attended?: number | null
        }
        Relationships: []
      }
      event_notifications: {
        Row: {
          clicked_count: number | null
          created_at: string | null
          error_details: Json | null
          event_id: string
          failed_count: number | null
          id: string
          notification_timing: string
          notification_type: string
          opened_count: number | null
          recipients_count: number | null
          scheduled_time: string
          sent_count: number | null
          status: string
          template_name: string
          updated_at: string | null
        }
        Insert: {
          clicked_count?: number | null
          created_at?: string | null
          error_details?: Json | null
          event_id: string
          failed_count?: number | null
          id?: string
          notification_timing: string
          notification_type: string
          opened_count?: number | null
          recipients_count?: number | null
          scheduled_time: string
          sent_count?: number | null
          status?: string
          template_name: string
          updated_at?: string | null
        }
        Update: {
          clicked_count?: number | null
          created_at?: string | null
          error_details?: Json | null
          event_id?: string
          failed_count?: number | null
          id?: string
          notification_timing?: string
          notification_type?: string
          opened_count?: number | null
          recipients_count?: number | null
          scheduled_time?: string
          sent_count?: number | null
          status?: string
          template_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          custom_fields: Json | null
          description: string | null
          id: string
          max_attendees: number | null
          predicted_attendance: number | null
          predicted_revenue: number | null
          registration_required: boolean | null
          scheduled_end: string
          scheduled_start: string
          smartscheduler_data: Json | null
          status: string
          timezone: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_fields?: Json | null
          description?: string | null
          id?: string
          max_attendees?: number | null
          predicted_attendance?: number | null
          predicted_revenue?: number | null
          registration_required?: boolean | null
          scheduled_end: string
          scheduled_start: string
          smartscheduler_data?: Json | null
          status?: string
          timezone: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_fields?: Json | null
          description?: string | null
          id?: string
          max_attendees?: number | null
          predicted_attendance?: number | null
          predicted_revenue?: number | null
          registration_required?: boolean | null
          scheduled_end?: string
          scheduled_start?: string
          smartscheduler_data?: Json | null
          status?: string
          timezone?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      insightengine_analytics: {
        Row: {
          accuracy_score: number | null
          actual_results: Json | null
          created_at: string | null
          event_id: string
          id: string
          predictions: Json | null
          recommendations: Json | null
        }
        Insert: {
          accuracy_score?: number | null
          actual_results?: Json | null
          created_at?: string | null
          event_id: string
          id?: string
          predictions?: Json | null
          recommendations?: Json | null
        }
        Update: {
          accuracy_score?: number | null
          actual_results?: Json | null
          created_at?: string | null
          event_id?: string
          id?: string
          predictions?: Json | null
          recommendations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "insightengine_analytics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_contacts: {
        Row: {
          consent_date: string | null
          consent_email: boolean | null
          consent_ip: string | null
          consent_sms: boolean | null
          created_at: string | null
          custom_fields: Json | null
          email: string | null
          external_id: string | null
          first_name: string | null
          id: string
          integration_id: string
          last_name: string | null
          lists: Json | null
          opt_out_at: string | null
          phone: string | null
          sync_status: string | null
          synced_at: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consent_date?: string | null
          consent_email?: boolean | null
          consent_ip?: string | null
          consent_sms?: boolean | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          external_id?: string | null
          first_name?: string | null
          id?: string
          integration_id: string
          last_name?: string | null
          lists?: Json | null
          opt_out_at?: string | null
          phone?: string | null
          sync_status?: string | null
          synced_at?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consent_date?: string | null
          consent_email?: boolean | null
          consent_ip?: string | null
          consent_sms?: boolean | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          external_id?: string | null
          first_name?: string | null
          id?: string
          integration_id?: string
          last_name?: string | null
          lists?: Json | null
          opt_out_at?: string | null
          phone?: string | null
          sync_status?: string | null
          synced_at?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_contacts_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_usage_logs: {
        Row: {
          created_at: string | null
          estimated_cost_usd: number | null
          event_id: string | null
          failure_count: number | null
          id: string
          integration_id: string
          metadata: Json | null
          operation_type: string
          recipient_count: number | null
          success_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          estimated_cost_usd?: number | null
          event_id?: string | null
          failure_count?: number | null
          id?: string
          integration_id: string
          metadata?: Json | null
          operation_type: string
          recipient_count?: number | null
          success_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          estimated_cost_usd?: number | null
          event_id?: string | null
          failure_count?: number | null
          id?: string
          integration_id?: string
          metadata?: Json | null
          operation_type?: string
          recipient_count?: number | null
          success_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_usage_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          channel_description: string | null
          channel_name: string | null
          created_at: string | null
          id: number
          ingest_url: string
          is_live: boolean
          playback_id: string | null
          status: string
          stream_id: string
          stream_key: string
          updated_at: string | null
        }
        Insert: {
          channel_description?: string | null
          channel_name?: string | null
          created_at?: string | null
          id?: number
          ingest_url: string
          is_live?: boolean
          playback_id?: string | null
          status?: string
          stream_id: string
          stream_key: string
          updated_at?: string | null
        }
        Update: {
          channel_description?: string | null
          channel_name?: string | null
          created_at?: string | null
          id?: number
          ingest_url?: string
          is_live?: boolean
          playback_id?: string | null
          status?: string
          stream_id?: string
          stream_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      obs_connections: {
        Row: {
          available_scenes: Json | null
          available_sources: Json | null
          connection_metadata: Json | null
          connection_name: string
          connection_status: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_connected_at: string | null
          obs_version: string | null
          updated_at: string | null
          user_id: string
          websocket_password: string | null
          websocket_url: string
        }
        Insert: {
          available_scenes?: Json | null
          available_sources?: Json | null
          connection_metadata?: Json | null
          connection_name: string
          connection_status?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_connected_at?: string | null
          obs_version?: string | null
          updated_at?: string | null
          user_id: string
          websocket_password?: string | null
          websocket_url?: string
        }
        Update: {
          available_scenes?: Json | null
          available_sources?: Json | null
          connection_metadata?: Json | null
          connection_name?: string
          connection_status?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_connected_at?: string | null
          obs_version?: string | null
          updated_at?: string | null
          user_id?: string
          websocket_password?: string | null
          websocket_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "obs_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      obs_scenes: {
        Row: {
          created_at: string | null
          id: string
          is_current: boolean | null
          last_activated_at: string | null
          obs_connection_id: string
          scene_index: number | null
          scene_name: string
          scene_sources: Json | null
          scene_uuid: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          last_activated_at?: string | null
          obs_connection_id: string
          scene_index?: number | null
          scene_name: string
          scene_sources?: Json | null
          scene_uuid?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          last_activated_at?: string | null
          obs_connection_id?: string
          scene_index?: number | null
          scene_name?: string
          scene_sources?: Json | null
          scene_uuid?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obs_scenes_obs_connection_id_fkey"
            columns: ["obs_connection_id"]
            isOneToOne: false
            referencedRelation: "obs_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      obs_sources: {
        Row: {
          created_at: string | null
          filter_config: Json | null
          id: string
          is_visible: boolean | null
          obs_connection_id: string
          obs_scene_id: string | null
          source_kind: string | null
          source_name: string
          source_settings: Json | null
          source_type: string | null
          source_uuid: string | null
          transform_config: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          filter_config?: Json | null
          id?: string
          is_visible?: boolean | null
          obs_connection_id: string
          obs_scene_id?: string | null
          source_kind?: string | null
          source_name: string
          source_settings?: Json | null
          source_type?: string | null
          source_uuid?: string | null
          transform_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          filter_config?: Json | null
          id?: string
          is_visible?: boolean | null
          obs_connection_id?: string
          obs_scene_id?: string | null
          source_kind?: string | null
          source_name?: string
          source_settings?: Json | null
          source_type?: string | null
          source_uuid?: string | null
          transform_config?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obs_sources_obs_connection_id_fkey"
            columns: ["obs_connection_id"]
            isOneToOne: false
            referencedRelation: "obs_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obs_sources_obs_scene_id_fkey"
            columns: ["obs_scene_id"]
            isOneToOne: false
            referencedRelation: "obs_scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      overlay_analytics: {
        Row: {
          event_type: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_value: number | null
          overlay_config_id: string | null
          recorded_at: string | null
          session_id: string | null
          stream_id: string
          template_id: string | null
        }
        Insert: {
          event_type: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_value?: number | null
          overlay_config_id?: string | null
          recorded_at?: string | null
          session_id?: string | null
          stream_id: string
          template_id?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_value?: number | null
          overlay_config_id?: string | null
          recorded_at?: string | null
          session_id?: string | null
          stream_id?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "overlay_analytics_overlay_config_id_fkey"
            columns: ["overlay_config_id"]
            isOneToOne: false
            referencedRelation: "overlay_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overlay_analytics_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overlay_analytics_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "overlay_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      overlay_configs: {
        Row: {
          animation_config: Json | null
          auto_hide_after_ms: number | null
          created_at: string | null
          display_duration_ms: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          overlay_type: string
          position_config: Json
          stream_id: string
          style_config: Json
          template_id: string | null
          trigger_conditions: Json | null
          trigger_count: number | null
          updated_at: string | null
          z_index: number | null
        }
        Insert: {
          animation_config?: Json | null
          auto_hide_after_ms?: number | null
          created_at?: string | null
          display_duration_ms?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          overlay_type: string
          position_config?: Json
          stream_id: string
          style_config?: Json
          template_id?: string | null
          trigger_conditions?: Json | null
          trigger_count?: number | null
          updated_at?: string | null
          z_index?: number | null
        }
        Update: {
          animation_config?: Json | null
          auto_hide_after_ms?: number | null
          created_at?: string | null
          display_duration_ms?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          overlay_type?: string
          position_config?: Json
          stream_id?: string
          style_config?: Json
          template_id?: string | null
          trigger_conditions?: Json | null
          trigger_count?: number | null
          updated_at?: string | null
          z_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "overlay_configs_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overlay_configs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "overlay_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      overlay_events: {
        Row: {
          error_message: string | null
          event_data: Json | null
          event_type: string
          expires_at: string | null
          id: string
          overlay_config_id: string | null
          processed_at: string | null
          processing_status: string | null
          retry_count: number | null
          stream_id: string
          triggered_at: string | null
        }
        Insert: {
          error_message?: string | null
          event_data?: Json | null
          event_type: string
          expires_at?: string | null
          id?: string
          overlay_config_id?: string | null
          processed_at?: string | null
          processing_status?: string | null
          retry_count?: number | null
          stream_id: string
          triggered_at?: string | null
        }
        Update: {
          error_message?: string | null
          event_data?: Json | null
          event_type?: string
          expires_at?: string | null
          id?: string
          overlay_config_id?: string | null
          processed_at?: string | null
          processing_status?: string | null
          retry_count?: number | null
          stream_id?: string
          triggered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "overlay_events_overlay_config_id_fkey"
            columns: ["overlay_config_id"]
            isOneToOne: false
            referencedRelation: "overlay_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overlay_events_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      overlay_templates: {
        Row: {
          animation_config: Json | null
          created_at: string | null
          id: string
          is_default: boolean | null
          is_public: boolean | null
          overlay_type: string
          position_config: Json
          style_config: Json
          template_description: string | null
          template_name: string
          trigger_conditions: Json | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          animation_config?: Json | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          overlay_type: string
          position_config?: Json
          style_config?: Json
          template_description?: string | null
          template_name: string
          trigger_conditions?: Json | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          animation_config?: Json | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          overlay_type?: string
          position_config?: Json
          style_config?: Json
          template_description?: string | null
          template_name?: string
          trigger_conditions?: Json | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "overlay_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          access_token: string
          attendance_duration: number | null
          attended: boolean | null
          created_at: string | null
          event_id: string
          id: string
          registered_at: string | null
          registration_data: Json | null
          showup_surge_sequence: Json | null
          source: string | null
          updated_at: string | null
          viewer_profile_id: string
        }
        Insert: {
          access_token: string
          attendance_duration?: number | null
          attended?: boolean | null
          created_at?: string | null
          event_id: string
          id?: string
          registered_at?: string | null
          registration_data?: Json | null
          showup_surge_sequence?: Json | null
          source?: string | null
          updated_at?: string | null
          viewer_profile_id: string
        }
        Update: {
          access_token?: string
          attendance_duration?: number | null
          attended?: boolean | null
          created_at?: string | null
          event_id?: string
          id?: string
          registered_at?: string | null
          registration_data?: Json | null
          showup_surge_sequence?: Json | null
          source?: string | null
          updated_at?: string | null
          viewer_profile_id?: string
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
          },
        ]
      }
      streams: {
        Row: {
          autooffer_config: Json | null
          created_at: string | null
          engagemax_config: Json | null
          event_id: string
          id: string
          mux_playback_id: string | null
          mux_stream_id: string | null
          peak_viewers: number | null
          status: string
          stream_key: string | null
          total_viewers: number | null
          updated_at: string | null
        }
        Insert: {
          autooffer_config?: Json | null
          created_at?: string | null
          engagemax_config?: Json | null
          event_id: string
          id?: string
          mux_playback_id?: string | null
          mux_stream_id?: string | null
          peak_viewers?: number | null
          status?: string
          stream_key?: string | null
          total_viewers?: number | null
          updated_at?: string | null
        }
        Update: {
          autooffer_config?: Json | null
          created_at?: string | null
          engagemax_config?: Json | null
          event_id?: string
          id?: string
          mux_playback_id?: string | null
          mux_stream_id?: string | null
          peak_viewers?: number | null
          status?: string
          stream_key?: string | null
          total_viewers?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "streams_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          api_key_encrypted: string | null
          api_secret_encrypted: string | null
          capabilities: Json | null
          configuration: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          last_error: string | null
          last_error_at: string | null
          last_used_at: string | null
          oauth_token_encrypted: string | null
          sender_email: string | null
          sender_phone: string | null
          service_name: string
          service_type: string
          status: string | null
          total_failed: number | null
          total_sent: number | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          capabilities?: Json | null
          configuration?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_error?: string | null
          last_error_at?: string | null
          last_used_at?: string | null
          oauth_token_encrypted?: string | null
          sender_email?: string | null
          sender_phone?: string | null
          service_name: string
          service_type: string
          status?: string | null
          total_failed?: number | null
          total_sent?: number | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          capabilities?: Json | null
          configuration?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_error?: string | null
          last_error_at?: string | null
          last_used_at?: string | null
          oauth_token_encrypted?: string | null
          sender_email?: string | null
          sender_phone?: string | null
          service_name?: string
          service_type?: string
          status?: string | null
          total_failed?: number | null
          total_sent?: number | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          auth_uid: string | null
          created_at: string | null
          id: number
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          auth_uid?: string | null
          created_at?: string | null
          id?: number
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          auth_uid?: string | null
          created_at?: string | null
          id?: number
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      viewer_profiles: {
        Row: {
          ai_insights: Json | null
          autooffer_data: Json | null
          behavioral_data: Json | null
          company: string | null
          created_at: string | null
          device_info: Json | null
          email: string
          engagemax_data: Json | null
          engagement_metrics: Json | null
          first_name: string
          first_seen_at: string | null
          id: string
          intent_score: number | null
          last_name: string
          last_seen_at: string | null
          lifetime_value: number | null
          phone: string
          purchase_history: Json | null
          showup_surge_data: Json | null
          timezone: string | null
          total_events_attended: number | null
          total_purchases: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          ai_insights?: Json | null
          autooffer_data?: Json | null
          behavioral_data?: Json | null
          company?: string | null
          created_at?: string | null
          device_info?: Json | null
          email: string
          engagemax_data?: Json | null
          engagement_metrics?: Json | null
          first_name: string
          first_seen_at?: string | null
          id?: string
          intent_score?: number | null
          last_name: string
          last_seen_at?: string | null
          lifetime_value?: number | null
          phone: string
          purchase_history?: Json | null
          showup_surge_data?: Json | null
          timezone?: string | null
          total_events_attended?: number | null
          total_purchases?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_insights?: Json | null
          autooffer_data?: Json | null
          behavioral_data?: Json | null
          company?: string | null
          created_at?: string | null
          device_info?: Json | null
          email?: string
          engagemax_data?: Json | null
          engagement_metrics?: Json | null
          first_name?: string
          first_seen_at?: string | null
          id?: string
          intent_score?: number | null
          last_name?: string
          last_seen_at?: string | null
          lifetime_value?: number | null
          phone?: string
          purchase_history?: Json | null
          showup_surge_data?: Json | null
          timezone?: string | null
          total_events_attended?: number | null
          total_purchases?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      viewer_sessions: {
        Row: {
          device_info: Json | null
          duration_seconds: number | null
          id: string
          ip_address: string | null
          joined_at: string | null
          left_at: string | null
          stream_id: string
          user_agent: string | null
          viewer_profile_id: string
        }
        Insert: {
          device_info?: Json | null
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          joined_at?: string | null
          left_at?: string | null
          stream_id: string
          user_agent?: string | null
          viewer_profile_id: string
        }
        Update: {
          device_info?: Json | null
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          joined_at?: string | null
          left_at?: string | null
          stream_id?: string
          user_agent?: string | null
          viewer_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewer_sessions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_sessions_viewer_profile_id_fkey"
            columns: ["viewer_profile_id"]
            isOneToOne: false
            referencedRelation: "viewer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      integration_usage_summary: {
        Row: {
          contact_count: number | null
          last_used_at: string | null
          service_name: string | null
          service_type: string | null
          status: string | null
          total_cost_mtd: number | null
          total_failed: number | null
          total_sent: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_attendance_rate: {
        Args: { p_event_id: string }
        Returns: number
      }
      calculate_engagement_score: {
        Args: {
          engagement_rate?: number
          interactions?: number
          purchase_history?: number
          time_spent?: number
          viewer_id: string
        }
        Returns: number
      }
      calculate_user_integration_cost: {
        Args: { p_end_date?: string; p_start_date?: string; p_user_id: string }
        Returns: number
      }
      cleanup_expired_overlay_events: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_synthetic_message: {
        Args: {
          intent_level?: string
          message_type?: string
          stream_id: string
        }
        Returns: string
      }
      generate_access_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_insight_predictions: {
        Args: { event_id: string }
        Returns: Json
      }
      get_primary_integration: {
        Args: { p_service_type: string; p_user_id: string }
        Returns: string
      }
      get_user_id_from_auth: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      increment_analytics_counter: {
        Args: {
          p_counter_name: string
          p_event_id: string
          p_increment?: number
        }
        Returns: undefined
      }
      increment_integration_usage: {
        Args: {
          p_failure_count: number
          p_integration_id: string
          p_success_count: number
        }
        Returns: undefined
      }
      increment_overlay_usage: {
        Args: { p_template_id: string }
        Returns: undefined
      }
      optimize_showup_surge: {
        Args: { event_id: string; viewer_id: string }
        Returns: Json
      }
      track_autooffer_conversion: {
        Args: {
          action: string
          offer_variant: string
          stream_id: string
          value?: number
          viewer_id: string
        }
        Returns: Json
      }
      track_notification_click: {
        Args: { p_notification_id: string; p_viewer_profile_id: string }
        Returns: undefined
      }
      track_notification_open: {
        Args: { p_notification_id: string; p_viewer_profile_id: string }
        Returns: undefined
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
