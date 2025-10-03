// Check streams in database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yedvdwedhoetxukablxf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZHZkd2VkaG9ldHh1a2FibHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTg5NjIsImV4cCI6MjA3MzYzNDk2Mn0.fu2tFf_C56nrO6fZgBfG2eqXkIEKW739fv0u6MqU1nc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStreams() {
  console.log('\n🔍 Checking database for streams...\n');

  // Get all streams
  const { data: allStreams, error: allError } = await supabase
    .from('streams')
    .select('*')
    .order('created_at', { ascending: false });

  if (allError) {
    console.error('❌ Error fetching streams:', allError);
    return;
  }

  console.log(`Total streams in database: ${allStreams?.length || 0}`);

  if (allStreams && allStreams.length > 0) {
    console.log('\n📊 Stream Details:\n');
    allStreams.forEach((stream, index) => {
      console.log(`Stream ${index + 1}:`);
      console.log(`  ID: ${stream.id}`);
      console.log(`  Status: ${stream.status}`);
      console.log(`  Event ID: ${stream.event_id}`);
      console.log(`  Mux Stream ID: ${stream.mux_stream_id || 'null'}`);
      console.log(`  Created: ${stream.created_at}`);
      console.log('');
    });
  }

  // Check for active/live streams specifically
  const { data: activeStreams, error: activeError } = await supabase
    .from('streams')
    .select('*')
    .in('status', ['active', 'live'])
    .order('created_at', { ascending: false });

  console.log(`\nActive/Live streams: ${activeStreams?.length || 0}`);

  // Check user
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.log('\n⚠️ No authenticated session (expected in Node.js script)');
  } else {
    console.log('\n👤 Authenticated user:', userData.user?.email);
  }

  // Get events too
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  console.log(`\nTotal events in database: ${events?.length || 0}`);

  if (events && events.length > 0) {
    console.log('\n📅 Event Details:\n');
    events.forEach((event, index) => {
      console.log(`Event ${index + 1}:`);
      console.log(`  ID: ${event.id}`);
      console.log(`  Title: ${event.title}`);
      console.log(`  Status: ${event.status}`);
      console.log(`  User ID: ${event.user_id}`);
      console.log(`  Created: ${event.created_at}`);
      console.log('');
    });
  }
}

checkStreams().catch(console.error);
