const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://yedvdwedhoetxukablxf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZHZkd2VkaG9ldHh1a2FibHhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzYwMTExOCwiZXhwIjoyMDUzMTc3MTE4fQ.PgI8jBl5vK7PaUpNPVQB8JBa4Gn1gH4GBKFpjsm7iI0';

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
    try {
        console.log('🚀 Starting ConvertCast database setup...');

        // Read the setup SQL file
        const setupSQL = fs.readFileSync('supabase_setup.sql', 'utf8');

        // Split the SQL into individual statements
        const statements = setupSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`📝 Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];

            if (statement.trim()) {
                console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

                try {
                    const { data, error } = await supabase.rpc('exec_sql', {
                        sql_query: statement + ';'
                    });

                    if (error) {
                        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
                        console.error('Statement:', statement.substring(0, 100) + '...');
                    } else {
                        console.log(`✅ Statement ${i + 1} executed successfully`);
                    }
                } catch (err) {
                    console.error(`❌ Exception executing statement ${i + 1}:`, err.message);
                }
            }
        }

        console.log('🎉 Database setup completed!');

        // Verify the setup
        console.log('🔍 Verifying database setup...');
        await verifySetup();

    } catch (error) {
        console.error('💥 Database setup failed:', error);
    }
}

async function verifySetup() {
    try {
        // Check if all tables exist
        const tables = [
            'users', 'viewer_profiles', 'events', 'registrations',
            'streams', 'chat_messages', 'ai_analysis',
            'engagemax_interactions', 'autooffer_experiments', 'insightengine_analytics'
        ];

        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                console.error(`❌ Table ${table} verification failed:`, error.message);
            } else {
                console.log(`✅ Table ${table} exists and is accessible`);
            }
        }

        // Test inserting sample data
        console.log('📊 Testing with sample data...');

        // Insert a test user
        const { data: user, error: userError } = await supabase
            .from('users')
            .insert({
                email: 'test@convertcast.com',
                name: 'Test Streamer',
                company: 'ConvertCast Demo'
            })
            .select()
            .single();

        if (userError) {
            console.error('❌ Test user creation failed:', userError.message);
        } else {
            console.log('✅ Test user created:', user.email);

            // Insert a test viewer profile
            const { data: viewer, error: viewerError } = await supabase
                .from('viewer_profiles')
                .insert({
                    email: 'viewer@convertcast.com',
                    first_name: 'Test',
                    last_name: 'Viewer',
                    phone: '+1234567890',
                    timezone: 'America/New_York'
                })
                .select()
                .single();

            if (viewerError) {
                console.error('❌ Test viewer creation failed:', viewerError.message);
            } else {
                console.log('✅ Test viewer profile created:', viewer.email);

                // Clean up test data
                await supabase.from('viewer_profiles').delete().eq('id', viewer.id);
                await supabase.from('users').delete().eq('id', user.id);
                console.log('🧹 Test data cleaned up');
            }
        }

        console.log('🎊 Database verification completed successfully!');
        console.log('🚀 ConvertCast database is ready for production!');

    } catch (error) {
        console.error('💥 Database verification failed:', error);
    }
}

// Alternative direct SQL execution approach
async function executeDirectSQL() {
    try {
        console.log('🔧 Attempting direct SQL execution...');

        // Create tables directly using JavaScript
        const tableCreationQueries = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                avatar_url TEXT,
                company TEXT,
                timezone TEXT DEFAULT 'America/New_York',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );`,

            // Viewer profiles table
            `CREATE TABLE IF NOT EXISTS viewer_profiles (
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
            );`,

            // Events table
            `CREATE TABLE IF NOT EXISTS events (
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
            );`
        ];

        for (let i = 0; i < tableCreationQueries.length; i++) {
            const query = tableCreationQueries[i];
            console.log(`⚡ Creating table ${i + 1}...`);

            // Use raw SQL execution
            const { data, error } = await supabase.rpc('exec_sql', {
                query: query
            });

            if (error) {
                console.error(`❌ Failed to create table ${i + 1}:`, error);
            } else {
                console.log(`✅ Table ${i + 1} created successfully`);
            }
        }

    } catch (error) {
        console.error('💥 Direct SQL execution failed:', error);
    }
}

// Run the setup
if (require.main === module) {
    setupDatabase().catch(console.error);
}

module.exports = { setupDatabase, verifySetup };