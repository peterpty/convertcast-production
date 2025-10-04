/**
 * Cleanup Script for Orphaned Test Streams
 *
 * This script will:
 * 1. Query all streams from the database
 * 2. Show you the streams with their details
 * 3. Delete all streams (since we're starting fresh after fixing the bug)
 * 4. Also delete associated events
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yedvdwedhoetxukablxf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZHZkd2VkaG9ldHh1a2FibHhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA1ODk2MiwiZXhwIjoyMDczNjM0OTYyfQ.OAVwRwx0-3aEjM1UKN2qpKM2an1ccwmFOnUuCUaigoM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanup() {
  try {
    console.log('🔍 Querying all streams from database...\n');

    // Get all streams
    const { data: streams, error: streamsError } = await supabase
      .from('streams')
      .select('id, stream_key, status, created_at, mux_stream_id, event_id')
      .order('created_at', { ascending: false });

    if (streamsError) {
      throw streamsError;
    }

    if (!streams || streams.length === 0) {
      console.log('✅ No streams found in database. Database is clean!');
      return;
    }

    console.log(`📊 Found ${streams.length} streams in database:\n`);

    // Display streams
    streams.forEach((stream, index) => {
      console.log(`${index + 1}. Stream ID: ${stream.id}`);
      console.log(`   Stream Key: ${stream.stream_key ? stream.stream_key.substring(0, 8) + '...' : 'NULL'}`);
      console.log(`   Mux Stream ID: ${stream.mux_stream_id || 'NULL'}`);
      console.log(`   Status: ${stream.status}`);
      console.log(`   Created: ${new Date(stream.created_at).toLocaleString()}`);
      console.log(`   Event ID: ${stream.event_id}`);
      console.log('');
    });

    console.log('\n🗑️  CLEANUP MODE: Deleting ALL test streams...\n');

    // Get all event IDs to delete
    const eventIds = [...new Set(streams.map(s => s.event_id).filter(Boolean))];

    // Delete all streams
    const { error: deleteStreamsError } = await supabase
      .from('streams')
      .delete()
      .in('id', streams.map(s => s.id));

    if (deleteStreamsError) {
      throw deleteStreamsError;
    }

    console.log(`✅ Deleted ${streams.length} streams`);

    // Delete associated events
    if (eventIds.length > 0) {
      const { error: deleteEventsError } = await supabase
        .from('events')
        .delete()
        .in('id', eventIds);

      if (deleteEventsError) {
        console.log('⚠️  Warning: Could not delete all events:', deleteEventsError.message);
      } else {
        console.log(`✅ Deleted ${eventIds.length} associated events`);
      }
    }

    console.log('\n✨ Database cleanup complete! Ready for fresh testing.\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanup();
