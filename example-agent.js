const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store connected clients
const clients = new Set();

// SSE endpoint
app.get('/sse', (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Add client to set
  clients.add(res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    content: "Agent connected! How can I help you today?",
    type: "connection"
  })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    clients.delete(res);
    console.log('Client disconnected');
  });

  console.log('Client connected to SSE');
});

// Message endpoint
app.post('/api/send-message', (req, res) => {
  const { message } = req.body;
  console.log('Received message:', message);

  // Echo the message back with a simple response
  const responses = [
    `I received your message: "${message}". How can I help you further?`,
    `That's interesting! You said: "${message}". Tell me more!`,
    `I understand you're asking about: "${message}". Let me help you with that.`,
    `Great question! Regarding "${message}", here's what I think...`,
    `I see you mentioned "${message}". That's a fascinating topic!`
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  // Send response to all connected clients
  const responseData = JSON.stringify({
    content: randomResponse,
    timestamp: new Date().toISOString()
  });

  clients.forEach(client => {
    try {
      client.write(`data: ${responseData}\n\n`);
    } catch (error) {
      console.error('Error sending to client:', error);
      clients.delete(client);
    }
  });

  res.json({ success: true, message: 'Message processed' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    connectedClients: clients.size,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`Example agent server running at http://localhost:${port}`);
  console.log(`SSE endpoint: http://localhost:${port}/sse`);
  console.log(`Message endpoint: http://localhost:${port}/api/send-message`);
  console.log(`Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  clients.forEach(client => {
    try {
      client.write(`data: ${JSON.stringify({
        content: "Agent is shutting down. Goodbye!",
        type: "shutdown"
      })}\n\n`);
      client.end();
    } catch (error) {
      console.error('Error closing client:', error);
    }
  });
  process.exit(0);
});
