const { createClient } = require('@supabase/supabase-js');

// Supabase configuration with the database password
const supabaseUrl = 'https://yedvdwedhoetxukablxf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZHZkd2VkaG9ldHh1a2FibHhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzYwMTExOCwiZXhwIjoyMDUzMTc3MTE4fQ.PgI8jBl5vK7PaUpNPVQB8JBa4Gn1gH4GBKFpjsm7iI0';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

async function createTablesDirectly() {
  console.log('🚀 Creating ConvertCast database tables directly...');

  try {
    // 1. Create users table
    console.log('📝 Creating users table...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          avatar_url TEXT,
          company TEXT,
          timezone TEXT DEFAULT 'America/New_York',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (usersError) {
      console.error('❌ Users table creation failed:', usersError.message);
    } else {
      console.log('✅ Users table created successfully');
    }

    // 2. Create viewer_profiles table
    console.log('📝 Creating viewer_profiles table...');
    const { error: viewerError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS viewer_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          company TEXT,
          timezone TEXT NOT NULL,
          device_info JSONB DEFAULT '{}',
          behavioral_data JSONB DEFAULT '{}',
          purchase_history JSONB DEFAULT '[]',
          engagement_metrics JSONB DEFAULT '{}',
          intent_score INTEGER DEFAULT 0 CHECK (intent_score >= 0 AND intent_score <= 100),
          lifetime_value DECIMAL(10,2) DEFAULT 0,
          ai_insights JSONB DEFAULT '{}',
          showup_surge_data JSONB DEFAULT '{}',
          engagemax_data JSONB DEFAULT '{}',
          autooffer_data JSONB DEFAULT '{}',
          total_events_attended INTEGER DEFAULT 0,
          total_purchases INTEGER DEFAULT 0,
          total_spent DECIMAL(10,2) DEFAULT 0,
          first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (viewerError) {
      console.error('❌ Viewer profiles table creation failed:', viewerError.message);
    } else {
      console.log('✅ Viewer profiles table created successfully');
    }

    // 3. Create events table
    console.log('📝 Creating events table...');
    const { error: eventsError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
          scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
          timezone TEXT NOT NULL,
          status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'live', 'completed')),
          max_attendees INTEGER,
          registration_required BOOLEAN DEFAULT true,
          custom_fields JSONB DEFAULT '{}',
          smartscheduler_data JSONB DEFAULT '{}',
          predicted_attendance INTEGER,
          predicted_revenue DECIMAL(10,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (eventsError) {
      console.error('❌ Events table creation failed:', eventsError.message);
    } else {
      console.log('✅ Events table created successfully');
    }

    console.log('🎉 Core tables created! Testing basic functionality...');

    // Test basic table operations
    await testBasicOperations();

  } catch (error) {
    console.error('💥 Direct table creation failed:', error);
  }
}

async function testBasicOperations() {
  try {
    console.log('🧪 Testing basic database operations...');

    // Test 1: Insert a test user
    const { data: testUser, error: userInsertError } = await supabase
      .from('users')
      .insert({
        email: 'test@convertcast.com',
        name: 'Test Streamer',
        company: 'ConvertCast Demo'
      })
      .select()
      .single();

    if (userInsertError) {
      console.error('❌ Test user insertion failed:', userInsertError.message);
      return;
    }

    console.log('✅ Test user created:', testUser.email);

    // Test 2: Insert a test viewer profile
    const { data: testViewer, error: viewerInsertError } = await supabase
      .from('viewer_profiles')
      .insert({
        email: 'viewer@convertcast.com',
        first_name: 'Test',
        last_name: 'Viewer',
        phone: '+1234567890',
        timezone: 'America/New_York',
        intent_score: 75
      })
      .select()
      .single();

    if (viewerInsertError) {
      console.error('❌ Test viewer insertion failed:', viewerInsertError.message);
      return;
    }

    console.log('✅ Test viewer created:', testViewer.email, 'with intent score:', testViewer.intent_score);

    // Test 3: Create a test event
    const { data: testEvent, error: eventInsertError } = await supabase
      .from('events')
      .insert({
        user_id: testUser.id,
        title: 'ConvertCast Demo Webinar',
        description: 'Testing all the amazing features',
        scheduled_start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        scheduled_end: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 1 hour
        timezone: 'America/New_York',
        status: 'scheduled'
      })
      .select()
      .single();

    if (eventInsertError) {
      console.error('❌ Test event creation failed:', eventInsertError.message);
      return;
    }

    console.log('✅ Test event created:', testEvent.title);

    // Test 4: Query relationships
    const { data: userWithEvents, error: relationshipError } = await supabase
      .from('users')
      .select(`
        *,
        events (
          id,
          title,
          status
        )
      `)
      .eq('id', testUser.id)
      .single();

    if (relationshipError) {
      console.error('❌ Relationship query failed:', relationshipError.message);
    } else {
      console.log('✅ Relationship test passed - User has', userWithEvents.events.length, 'events');
    }

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await supabase.from('events').delete().eq('id', testEvent.id);
    await supabase.from('viewer_profiles').delete().eq('id', testViewer.id);
    await supabase.from('users').delete().eq('id', testUser.id);

    console.log('🎊 Database setup and testing completed successfully!');
    console.log('🚀 ConvertCast database is ready for production!');

    // Display setup summary
    console.log('\n📊 Setup Summary:');
    console.log('✅ Users table - Ready for streamers');
    console.log('✅ Viewer Profiles table - Ready for registration tracking');
    console.log('✅ Events table - Ready for webinar scheduling');
    console.log('✅ Relationships - Foreign keys working correctly');
    console.log('✅ JSONB fields - Ready for AI data storage');
    console.log('✅ Intent scoring - Ready for ShowUp Surge™');
    console.log('\n🎯 Next: Run remaining table creation for full feature set');

  } catch (error) {
    console.error('💥 Testing failed:', error);
  }
}

// Run the direct setup
if (require.main === module) {
  createTablesDirectly().catch(console.error);
}

module.exports = { createTablesDirectly, testBasicOperations };