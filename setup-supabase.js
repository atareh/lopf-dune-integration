const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
    console.log('Setting up Supabase database tables...');
    
    try {
        // Create dune_results table
        const { error: duneError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS dune_results (
                    id SERIAL PRIMARY KEY,
                    query_id TEXT NOT NULL,
                    execution_id TEXT,
                    timestamp TIMESTAMPTZ DEFAULT NOW(),
                    data JSONB NOT NULL,
                    metadata JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            `
        });

        if (duneError) {
            console.error('Error creating dune_results table:', duneError);
        } else {
            console.log('✅ dune_results table created/verified');
        }

        // Create timeline_items table
        const { error: timelineError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS timeline_items (
                    id SERIAL PRIMARY KEY,
                    year INTEGER,
                    title TEXT NOT NULL,
                    ticker TEXT,
                    description TEXT,
                    data JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            `
        });

        if (timelineError) {
            console.error('Error creating timeline_items table:', timelineError);
        } else {
            console.log('✅ timeline_items table created/verified');
        }

        // Create indexes
        const { error: indexError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE INDEX IF NOT EXISTS idx_dune_results_timestamp ON dune_results(timestamp);
                CREATE INDEX IF NOT EXISTS idx_timeline_items_created_at ON timeline_items(created_at);
            `
        });

        if (indexError) {
            console.error('Error creating indexes:', indexError);
        } else {
            console.log('✅ Indexes created/verified');
        }

        console.log('\n🎉 Database setup complete!');
        
    } catch (error) {
        console.error('Setup failed:', error);
    }
}

setupDatabase();
