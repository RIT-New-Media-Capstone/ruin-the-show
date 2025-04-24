import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import * as game from './game.js';

const app = express();
app.use(express.json());
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// js & css files
app.use(express.static(path.join(__dirname, '../client')));

// images & assets folder 
app.use('/assets', express.static(path.join(__dirname, '../client/assets/')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/getState', (req, res) => {
  res.json({
    state: game.machine.getState(),
    messages: game.machine.messages_for_frontend
  });

  game.machine.messages_for_frontend.length = 0;
});

app.post('/setState', (req, res) => {
  const { event, data = {} } = req.body;

  if (!event || typeof event !== 'string') {
    return res.status(400).json({ error: `Missing or invalid event name: ${event}` });
  }

  if (!Object.values(game.machine.events).includes(event)) {
    return res.status(400).json({ error: 'Unknown event' });
  }

  game.machine.addEvent(event, data);
  res.json({ success: true, message: `Event '${event}' dispatched` });
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});