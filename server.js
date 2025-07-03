const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('.'));

// Database setup
const dbPath = path.join(__dirname, 'dune_data.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Create table for Dune query results
    db.run(`
        CREATE TABLE IF NOT EXISTS dune_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query_id TEXT NOT NULL,
            execution_id TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            data TEXT NOT NULL,
            metadata TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating dune_results table:', err.message);
        } else {
            console.log('Database tables initialized');
        }
    });

    // Create table for timeline items (for your pump.fun timeline)
    db.run(`
        CREATE TABLE IF NOT EXISTS timeline_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER,
            title TEXT NOT NULL,
            ticker TEXT,
            description TEXT,
            data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating timeline_items table:', err.message);
        }
    });
}

// Webhook secret for verification (set this in your .env file)
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

// Dune webhook endpoint
app.post('/webhook/dune', (req, res) => {
    try {
        const signature = req.headers['x-dune-signature'];
        const payload = JSON.stringify(req.body);
        
        // Verify webhook signature if secret is provided
        if (WEBHOOK_SECRET !== 'your-secret-key' && !verifyWebhookSignature(payload, signature)) {
            console.log('Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const data = req.body;
        console.log('Received Dune webhook:', {
            query_id: data.query_id,
            execution_id: data.execution_id,
            timestamp: new Date().toISOString()
        });

        // Store the webhook data in database
        const stmt = db.prepare(`
            INSERT INTO dune_results (query_id, execution_id, data, metadata)
            VALUES (?, ?, ?, ?)
        `);

        stmt.run(
            data.query_id || 'unknown',
            data.execution_id || null,
            JSON.stringify(data.result || data),
            JSON.stringify({
                headers: req.headers,
                received_at: new Date().toISOString(),
                query_metadata: data.query_metadata || null
            })
        );

        stmt.finalize();

        // Process the data for your timeline if needed
        processTimelineData(data);

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
function processTimelineData(duneData) {
    // This function processes Dune data and converts it to timeline items
    // Customize this based on your Dune query structure
    
    try {
        const result = duneData.result || duneData;
        
        if (result.rows && Array.isArray(result.rows)) {
            result.rows.forEach(row => {
                // Example: assuming your Dune query returns pump.fun token data
                // Adjust the field names based on your actual query structure
                const timelineItem = {
                    year: new Date(row.created_at || Date.now()).getFullYear(),
                    title: row.name || row.title || 'New Token',
                    ticker: row.symbol || row.ticker || 'TOKEN',
                    description: row.description || `Market cap: ${row.market_cap || 'N/A'}`,
                    data: JSON.stringify(row)
                };

                // Insert into timeline_items table
                const stmt = db.prepare(`
                    INSERT INTO timeline_items (year, title, ticker, description, data)
                    VALUES (?, ?, ?, ?, ?)
                `);

                stmt.run(
                    timelineItem.year,
                    timelineItem.title,
                    timelineItem.ticker,
                    timelineItem.description,
                    timelineItem.data
                );

                stmt.finalize();
            });
        }
    } catch (error) {
        console.error('Error processing timeline data:', error);
    }
}

// API endpoint to get timeline data
app.get('/api/timeline', (req, res) => {
    db.all(`
        SELECT * FROM timeline_items 
        ORDER BY created_at DESC 
        LIMIT 50
    `, (err, rows) => {
        if (err) {
            console.error('Error fetching timeline data:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(rows);
        }
    });
});

// API endpoint to get all Dune data
app.get('/api/dune-data', (req, res) => {
    db.all(`
        SELECT * FROM dune_results 
        ORDER BY timestamp DESC 
        LIMIT 100
    `, (err, rows) => {
        if (err) {
            console.error('Error fetching Dune data:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(rows);
        }
    });
});

// API endpoint to get latest Dune data
app.get('/api/dune-data/latest', (req, res) => {
    db.get(`
        SELECT * FROM dune_results 
        ORDER BY timestamp DESC 
        LIMIT 1
    `, (err, row) => {
        if (err) {
            console.error('Error fetching latest Dune data:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(row || {});
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        database: 'connected'
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
    console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
}); 