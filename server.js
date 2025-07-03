const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('.'));

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials! Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test Supabase connection
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase
            .from('dune_results')
            .select('count(*)', { count: 'exact' });
        
        if (error) {
            console.error('Supabase connection error:', error);
        } else {
            console.log('✅ Connected to Supabase successfully');
        }
    } catch (err) {
        console.error('Supabase connection test failed:', err);
    }
}

// Initialize on startup
testSupabaseConnection();

// Webhook secret for verification
const WEBHOOK_SECRET = process.env.DUNE_WEBHOOK_SECRET || 'your-secret-key';

// Verify webhook signature
function verifyWebhookSignature(payload, signature) {
    if (!signature) return false;
    
    const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
    
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

// Dune webhook endpoint - supports both query parameter and header authentication
app.post('/webhook/dune', async (req, res) => {
    try {
        // Check for query parameter authentication
        const querySecret = req.query.dune_secret;
        
        // Check for header authentication
        const signature = req.headers['x-dune-signature'];
        const payload = JSON.stringify(req.body);
        
        // Verify authentication - either query parameter or signature
        let isAuthenticated = false;
        
        if (querySecret) {
            // Query parameter authentication
            isAuthenticated = querySecret === WEBHOOK_SECRET;
            console.log('Using query parameter authentication');
        } else if (signature) {
            // Header signature authentication
            isAuthenticated = verifyWebhookSignature(payload, signature);
            console.log('Using header signature authentication');
        }
        
        if (WEBHOOK_SECRET !== 'your-secret-key' && !isAuthenticated) {
            console.log('Invalid webhook authentication');
            return res.status(401).json({ error: 'Invalid authentication' });
        }

        const data = req.body;
        console.log('Received Dune webhook:', {
            query_id: data.query_id,
            execution_id: data.execution_id,
            timestamp: new Date().toISOString(),
            auth_method: querySecret ? 'query_param' : 'header'
        });

        // Store the webhook data in Supabase
        const { error: insertError } = await supabase
            .from('dune_results')
            .insert({
                query_id: data.query_id || 'unknown',
                execution_id: data.execution_id || null,
                data: data.result || data,
                metadata: {
                    headers: req.headers,
                    query_params: req.query,
                    received_at: new Date().toISOString(),
                    query_metadata: data.query_metadata || null,
                    auth_method: querySecret ? 'query_param' : 'header'
                }
            });

        if (insertError) {
            console.error('Error inserting into Supabase:', insertError);
            return res.status(500).json({ error: 'Database error' });
        }

        // Process the data for your timeline if needed
        await processTimelineData(data);

        res.status(200).json({ 
            success: true, 
            message: 'Webhook received and processed',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Process data for timeline display
async function processTimelineData(duneData) {
    try {
        const result = duneData.result || duneData;
        
        if (result.rows && Array.isArray(result.rows)) {
            for (const row of result.rows) {
                // Example: assuming your Dune query returns pump.fun token data
                // Adjust the field names based on your actual query structure
                const timelineItem = {
                    year: new Date(row.created_at || Date.now()).getFullYear(),
                    title: row.name || row.title || 'New Token',
                    ticker: row.symbol || row.ticker || 'TOKEN',
                    description: row.description || `Market cap: ${row.market_cap || 'N/A'}`,
                    data: row
                };

                // Insert into timeline_items table
                const { error } = await supabase
                    .from('timeline_items')
                    .insert(timelineItem);

                if (error) {
                    console.error('Error inserting timeline item:', error);
                }
            }
        }
    } catch (error) {
        console.error('Error processing timeline data:', error);
    }
}

// API endpoint to get timeline data
app.get('/api/timeline', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('timeline_items')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching timeline data:', error);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Error in timeline endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to get all Dune data
app.get('/api/dune-data', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('dune_results')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching Dune data:', error);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Error in dune-data endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to get latest Dune data
app.get('/api/dune-data/latest', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('dune_results')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error fetching latest Dune data:', error);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json(data || {});
    } catch (error) {
        console.error('Error in latest dune-data endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        database: 'supabase'
    });
});

// Test endpoint for webhook
app.post('/webhook/test', (req, res) => {
    console.log('Test webhook received:', req.body);
    res.json({ message: 'Test webhook received', data: req.body });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Webhook URL: http://localhost:${PORT}/webhook/dune`);
    console.log(`Query param URL: http://localhost:${PORT}/webhook/dune?dune_secret=YOUR_SECRET`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log('Using Supabase for database storage');
});
