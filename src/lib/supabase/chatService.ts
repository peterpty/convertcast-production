import { supabase } from './client';
import type { Database } from '@/types/database';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];

export interface ChatMessageWithProfile {
  id: string;
  message: string;
  created_at: string;
  stream_id: string | null;
  viewer_profile_id: string | null;
  is_synthetic: boolean;
  is_private: boolean;
  sender_id: string | null;
  reply_to_user_id: string | null;
  reply_to_message_id: string | null;
  status: 'active' | 'removed' | 'deleted' | 'pinned' | 'synthetic';
  intent_signals: any;
  viewer_profiles?: {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

/**
 * Chat Service - Production-ready chat message persistence
 * Handles all Supabase interactions for chat messages
 */
export class ChatService {
  /**
   * Save a chat message to Supabase
   * @param streamId - The stream ID
   * @param message - The message content
   * @param username - Username of sender
   * @param viewerProfileId - Optional viewer profile ID
   * @param isSynthetic - Whether this is an AI-generated message
   * @param intentSignals - Optional AI intent scoring data
   * @param isPrivate - Whether this is a private message (visible only to host)
   * @param senderId - User ID or session ID of the sender
   * @param replyToUserId - User ID this message is replying to (for bi-directional private messaging)
   * @param replyToMessageId - Message ID this is replying to (for threading context)
   */
  static async saveMessage(
    streamId: string,
    message: string,
    username: string = 'Anonymous',
    viewerProfileId?: string | null,
    isSynthetic: boolean = false,
    intentSignals?: any,
    isPrivate: boolean = false,
    senderId?: string | null,
    replyToUserId?: string | null,
    replyToMessageId?: string | null
  ): Promise<ChatMessage | null> {
    try {
      const messageData: ChatMessageInsert = {
        stream_id: streamId,
        viewer_profile_id: viewerProfileId || null,
        message: message.substring(0, 500), // Limit message length
        status: isSynthetic ? 'synthetic' : 'active',
        is_synthetic: isSynthetic,
        intent_signals: intentSignals || null,
        is_private: isPrivate,
        sender_id: senderId || null,
        reply_to_user_id: replyToUserId || null,
        reply_to_message_id: replyToMessageId || null,
      };

      // Validate UUID before insert
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(streamId)) {
        console.error('❌ INVALID STREAM UUID:', {
          provided: streamId,
          type: typeof streamId,
          length: streamId?.length
        });
        throw new Error(`Invalid stream UUID format: ${streamId}`);
      }

      console.log('💾 Attempting to save message:', {
        stream_id: streamId,
        message_preview: message.substring(0, 50),
        is_private: isPrivate,
        sender_id: senderId
      });

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('❌ DATABASE ERROR - Failed to save chat message:', {
          error_message: error.message,
          error_code: error.code,
          error_details: error.details,
          error_hint: error.hint,
          full_error: JSON.stringify(error, null, 2),
          attempted_data: messageData
        });
        throw error; // Throw instead of return null so caller can handle
      }

      console.log('✅ Chat message saved to Supabase:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ EXCEPTION saving chat message:', {
        message: error?.message,
        stack: error?.stack,
        full_error: error
      });
      throw error; // Re-throw so caller knows it failed
    }
  }

  /**
   * Get chat messages for a stream with viewer profiles
   * @param streamId - The stream ID
   * @param limit - Maximum number of messages to return
   */
  static async getMessages(
    streamId: string,
    limit: number = 50,
    currentUserId?: string | null,
    isHost: boolean = false
  ): Promise<ChatMessageWithProfile[]> {
    try {
      let query = supabase
        .from('chat_messages')
        .select(`
          id,
          message,
          created_at,
          stream_id,
          viewer_profile_id,
          is_synthetic,
          is_private,
          sender_id,
          reply_to_user_id,
          reply_to_message_id,
          status,
          intent_signals,
          viewer_profiles (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('stream_id', streamId)
        .in('status', ['active', 'pinned'])
        .order('created_at', { ascending: true })
        .limit(limit);

      const { data, error } = await query;

      if (error) {
        console.error('❌ Failed to fetch chat messages:', error);
        return [];
      }

      // Filter private messages on the client side
      // Host sees all messages, viewers only see public messages + their own private messages + replies to them
      const filtered = (data as ChatMessageWithProfile[]).filter(msg => {
        if (isHost) return true; // Host sees everything
        if (!msg.is_private) return true; // Everyone sees public messages
        if (msg.sender_id === currentUserId) return true; // Viewers see their own private messages
        if (msg.reply_to_user_id === currentUserId) return true; // Viewers see private replies addressed to them
        return false;
      });

      return filtered;
    } catch (error) {
      console.error('❌ Error fetching chat messages:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time chat messages for a stream
   * @param streamId - The stream ID
   * @param onMessage - Callback when new message arrives
   * @returns Unsubscribe function
   */
  static subscribeToMessages(
    streamId: string,
    onMessage: (message: ChatMessageWithProfile) => void
  ): () => void {
    console.log('📡 Setting up Supabase Realtime subscription for stream:', streamId);

    const handleMessage = async (payload: any, eventType: string) => {
      console.log(`📨 ${eventType} event from Supabase Realtime:`, payload);

      // Fetch the message with profile data
      const messageId = payload.new?.id || payload.old?.id;
      if (!messageId) {
        console.error('❌ No message ID in payload');
        return;
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          message,
          created_at,
          stream_id,
          viewer_profile_id,
          is_synthetic,
          is_private,
          sender_id,
          reply_to_user_id,
          reply_to_message_id,
          status,
          intent_signals,
          viewer_profiles (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('id', messageId)
        .single();

      if (data && !error) {
        console.log('✅ Broadcasting message to UI:', { id: data.id, status: data.status });
        onMessage(data as ChatMessageWithProfile);
      } else {
        console.error('❌ Failed to fetch message data:', error);
      }
    };

    const channel = supabase
      .channel(`chat:${streamId}`)
      // Listen for new messages (INSERT)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => handleMessage(payload, 'INSERT')
      )
      // Listen for message updates (UPDATE) - for pin/unpin
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => handleMessage(payload, 'UPDATE')
      )
      .subscribe((status) => {
        console.log(`📡 Supabase Realtime status for chat:${streamId}:`, status);
      });

    // Return unsubscribe function
    return () => {
      console.log('🔌 Unsubscribing from chat realtime:', streamId);
      supabase.removeChannel(channel);
    };
  }

  /**
   * Delete a chat message
   * @param messageId - The message ID to delete
   */
  static async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ status: 'deleted' })
        .eq('id', messageId);

      if (error) {
        console.error('❌ Failed to delete message:', error);
        return false;
      }

      console.log('✅ Message deleted:', messageId);
      return true;
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      return false;
    }
  }

  /**
   * Pin a chat message
   * @param messageId - The message ID to pin
   */
  static async pinMessage(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ status: 'pinned' })
        .eq('id', messageId);

      if (error) {
        console.error('❌ Failed to pin message:', error);
        return false;
      }

      console.log('✅ Message pinned:', messageId);
      return true;
    } catch (error) {
      console.error('❌ Error pinning message:', error);
      return false;
    }
  }

  /**
   * Unpin a chat message
   * @param messageId - The message ID to unpin
   */
  static async unpinMessage(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ status: 'active' })
        .eq('id', messageId);

      if (error) {
        console.error('❌ Failed to unpin message:', error);
        return false;
      }

      console.log('✅ Message unpinned:', messageId);
      return true;
    } catch (error) {
      console.error('❌ Error unpinning message:', error);
      return false;
    }
  }

  /**
   * Get message statistics for a stream
   * @param streamId - The stream ID
   */
  static async getMessageStats(streamId: string): Promise<{
    total: number;
    synthetic: number;
    real: number;
    avgIntentScore: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('is_synthetic, intent_signals')
        .eq('stream_id', streamId)
        .eq('status', 'active');

      if (error || !data) {
        return { total: 0, synthetic: 0, real: 0, avgIntentScore: 0 };
      }

      const total = data.length;
      const synthetic = data.filter(m => m.is_synthetic).length;
      const real = total - synthetic;

      const intentScores = data
        .filter(m => m.intent_signals?.buying_intent)
        .map(m => m.intent_signals.buying_intent);

      const avgIntentScore = intentScores.length > 0
        ? intentScores.reduce((a, b) => a + b, 0) / intentScores.length
        : 0;

      return {
        total,
        synthetic,
        real,
        avgIntentScore: Math.round(avgIntentScore * 100),
      };
    } catch (error) {
      console.error('❌ Error getting message stats:', error);
      return { total: 0, synthetic: 0, real: 0, avgIntentScore: 0 };
    }
  }
}
