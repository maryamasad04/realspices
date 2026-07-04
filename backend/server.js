require('dotenv').config();
const express = require('express');
const { Client } = require('pg');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 5000;
const WS_PORT = process.env.WS_PORT || 8080;
const DATABASE_URL = process.env.DATABASE_URL || process.env.DB_URL || process.env.DB_CONNECTION_STRING;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set. Set it in .env before running.');
  process.exit(1);
}

// Create WebSocket server first
const wss = new WebSocket.Server({ port: WS_PORT }, () => {
  console.log(`WebSocket server listening on ws://localhost:${WS_PORT}`);
});

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  ws.on('message', (message) => {
    console.log('Received from client:', message);
  });
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Connect to Postgres
const client = new Client({ connectionString: DATABASE_URL });
client.connect()
  .then(() => console.log('Connected to Postgres'))
  .catch((err) => {
    console.error('Postgres connection error', err);
    process.exit(1);
  });

// Listen for notifications
client.on('notification', (msg) => {
  try {
    const payload = msg.payload;
    // Broadcast to all connected WebSocket clients
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  } catch (err) {
    console.error('Error handling notification:', err);
  }
});

client.query('LISTEN new_message').catch((err) => console.error('LISTEN error', err));

app.get('/', (req, res) => res.send('Realtime server running'));

app.listen(PORT, () => {
  console.log(`Express HTTP server listening on http://localhost:${PORT}`);
});
