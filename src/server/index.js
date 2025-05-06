/**
 * @file index.js
 * @description Game Server
 */

//modules
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

//game logic
import * as game from './game.js';

const app = express(); // express app
app.use(express.json()); // middleware
const PORT = 3000; // listening on...

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// js & css files
app.use(express.static(path.join(__dirname, '../client')));

// images & assets folder 
app.use('/assets', express.static(path.join(__dirname, '../client/assets/')));


// Route to serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

//Endpoint for current game state
app.get('/getState', (req, res) => {
  res.json({
    state: game.machine.getState(),
    messages: game.machine.messages_for_frontend
  });

  game.machine.messages_for_frontend.length = 0;
});

// Endpoint to update the game state 
app.post('/setState', (req, res) => {
  const { event, data = {} } = req.body;

  // Validate event
  if (!event || typeof event !== 'string') {
    return res.status(400).json({ error: `Missing or invalid event name: ${event}` });
  }

  // Ensure event is recognized
  if (!Object.values(game.machine.events).includes(event)) {
    return res.status(400).json({ error: 'Unknown event' });
  }

  //Dispatch the event
  game.machine.addEvent(event, data);
  res.json({ success: true, message: `Event '${event}' dispatched` });
})

//start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});