// server/index.js
const express = require('express');
const path = require('path');
const game = require("./game.js")

const app = express();
const PORT = 3000;

// Serve static files from the client folder
app.use(express.static(path.join(__dirname, '../client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  game.rfidScan()
});