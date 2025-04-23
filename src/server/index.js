import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression'; // Add compression

import * as game from './game.js';

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable compression for all responses
app.use(compression());

// Set Cache-Control headers for static assets
const staticOptions = {
  maxAge: '1d', // Cache for 1 day
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      // Don't cache HTML
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
};

// js & css files
app.use(express.static(path.join(__dirname, '../client'), staticOptions));

// images & assets folder 
app.use('/assets', express.static(path.join(__dirname, '../client/assets/'), staticOptions));

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Optimize state synchronization
let lastStateHash = '';

app.get('/getState', (req, res) => {
  const state = game.machine.getState();
  const messages = game.machine.messages_for_frontend;
  
  // Generate a simple hash of the state
  const stateHash = `${state.state}-${state.score}-${state.host.POSITION}`;
  
  // Set cache control headers
  res.setHeader('Cache-Control', 'no-cache');
  
  // Send ETag for caching
  const etag = `"${stateHash}"`;
  res.setHeader('ETag', etag);
  
  // Check If-None-Match header for conditional requests
  if (req.headers['if-none-match'] === etag && messages.length === 0) {
    return res.status(304).end(); // Not Modified
  }
  
  // Send the response
  res.json({
    state,
    messages,
    timestamp: Date.now()
  });

  // Clear messages after sending
  game.machine.messages_for_frontend.length = 0;
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});