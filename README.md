# Library of Pump.fun - Dune Integration

This project integrates with Dune Analytics to automatically import query results into a local database via webhooks.

## Features

- **Webhook Endpoint**: Receives data from Dune Analytics webhooks
- **SQLite Database**: Stores Dune query results and timeline data
- **REST API**: Provides endpoints to access stored data
- **Timeline Integration**: Automatically converts Dune data to timeline items
- **Security**: Webhook signature verification for secure data reception

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configuration

Create a `.env` file in the root directory:

```env
DUNE_WEBHOOK_SECRET=your-secret-key-here
PORT=3000
```

### 3. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## Dune Webhook Setup

### 1. Get Your Webhook URL

Once the server is running, your webhook URL will be:
```
http://localhost:3000/webhook/dune
```

For production, replace `localhost:3000` with your actual domain.

### 2. Configure Dune Webhook

1. Go to your Dune query page
2. Click on "Settings" or "Webhooks"
3. Add a new webhook with:
   - **URL**: `http://your-domain.com/webhook/dune`
   - **Secret**: The same secret you set in your `.env` file
   - **Events**: Select when you want the webhook to trigger (e.g., on query completion)

### 3. Test the Webhook

You can test the webhook endpoint using curl:

```bash
curl -X POST http://localhost:3000/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## API Endpoints

### Webhook Endpoints
- `POST /webhook/dune` - Receives Dune webhook data
- `POST /webhook/test` - Test endpoint for webhook testing

### Data Endpoints
- `GET /api/timeline` - Get timeline items (last 50)
- `GET /api/dune-data` - Get all Dune data (last 100)
- `GET /api/dune-data/latest` - Get latest Dune data entry

### Utility Endpoints
- `GET /health` - Health check endpoint

## Database Schema

### dune_results table
- `id` - Primary key
- `query_id` - Dune query ID
- `execution_id` - Dune execution ID
- `timestamp` - When the data was received
- `data` - JSON data from Dune
- `metadata` - Additional metadata
- `created_at` - Record creation time

### timeline_items table
- `id` - Primary key
- `year` - Year for timeline display
- `title` - Timeline item title
- `ticker` - Token ticker/symbol
- `description` - Item description
- `data` - Raw JSON data
- `created_at` - Record creation time

## Customization

### Processing Dune Data

Edit the `processTimelineData()` function in `server.js` to customize how Dune data is converted to timeline items:

```javascript
function processTimelineData(duneData) {
    // Customize this based on your Dune query structure
    const result = duneData.result || duneData;
    
    if (result.rows && Array.isArray(result.rows)) {
        result.rows.forEach(row => {
            // Map your Dune query fields to timeline items
            const timelineItem = {
                year: new Date(row.created_at || Date.now()).getFullYear(),
                title: row.name || 'New Item',
                ticker: row.symbol || 'TOKEN',
                description: row.description || 'Description',
                data: JSON.stringify(row)
            };
            
            // Insert into database...
        });
    }
}
```

### Frontend Integration

To display the data in your frontend, fetch from the API endpoints:

```javascript
// Get timeline data
fetch('/api/timeline')
    .then(response => response.json())
    .then(data => {
        // Update your timeline display
        updateTimeline(data);
    });

// Get latest Dune data
fetch('/api/dune-data/latest')
    .then(response => response.json())
    .then(data => {
        // Use the latest data
        console.log('Latest Dune data:', data);
    });
```

## Security

- Always use HTTPS in production
- Keep your webhook secret secure
- Consider rate limiting for production deployments
- Validate and sanitize incoming data

## Troubleshooting

### Common Issues

1. **Webhook not receiving data**
   - Check that your server is accessible from the internet
   - Verify the webhook URL is correct
   - Check the webhook secret matches

2. **Database errors**
   - Ensure the application has write permissions to the directory
   - Check SQLite is properly installed

3. **Signature verification fails**
   - Verify the webhook secret is correct
   - Check that the signature header is being sent by Dune

### Logs

The server logs important events:
- Webhook receptions
- Database operations
- Errors and warnings

Check the console output for debugging information.

## Production Deployment

For production deployment:

1. Use a process manager like PM2
2. Set up proper logging
3. Use environment variables for configuration
4. Set up database backups
5. Configure reverse proxy (nginx/Apache)
6. Use HTTPS with SSL certificates

## License

MIT License # Updated with webhook secret
