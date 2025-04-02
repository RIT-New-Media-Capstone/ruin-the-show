import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import * as game from './game.js';

const app = express();
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
  const ratings = game.getRatings()
  const difficulty = game.getDifficulty()
  const lights = game.getLights()
  const volume = game.getZoom()
  const applauseX = game.getApplauseX()

  const state = { 
    ratings, 
    difficulty, 
    lights, 
    zoom,
    applauseX,
  }

  res.json(state)
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});