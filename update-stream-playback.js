// Quick script to update stream playback ID in database
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/['"]/g, '');
  }
});

async function updateStreamPlaybackId() {
  const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.SUPABASE_SERVICE_ROLE_KEY
  );

  // First create test user
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'streamer@example.com',
      name: 'John Streamer',
      company: 'StreamCorp',
      timezone: 'America/New_York'
    });

  if (userError && userError.code !== '23505') { // ignore duplicate key error
    console.error('Error creating user:', userError);
  }

  // Then create test event
  const { error: eventError } = await supabase
    .from('events')
    .insert({
      id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Product Launch Webinar',
      description: 'Introducing our revolutionary new product',
      scheduled_start: '2024-03-15T14:00:00-04:00',
      scheduled_end: '2024-03-15T15:30:00-04:00',
      timezone: 'America/New_York',
      status: 'live'
    });

  if (eventError && eventError.code !== '23505') { // ignore duplicate key error
    console.error('Error creating event:', eventError);
  }

  // Finally create the test stream
  const { data, error } = await supabase
    .from('streams')
    .insert({
      id: 'g6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
      event_id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      mux_stream_id: 'mux_stream_12345',
      mux_playback_id: 'zCHLD2ZWIMMz00ewHpdUkyeqnwyYt9dvlLBAecdmdp9Q',
      stream_key: 'rtmp_key_abcdef',
      status: 'active',
      peak_viewers: 25,
      total_viewers: 47
    });

  if (error) {
    console.error('Error creating stream:', error);
  } else {
    console.log('✅ Stream created successfully!');
    console.log('Now you can access the stream at:');
    console.log('http://localhost:3005/watch/zCHLD2ZWIMMz00ewHpdUkyeqnwyYt9dvlLBAecdmdp9Q');
  }

  process.exit(0);
}

updateStreamPlaybackId();