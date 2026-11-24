require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/communitycare';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// REST API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/needs', require('./routes/needs'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/help-requests', require('./routes/helpRequests'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/diet', require('./routes/diet'));
app.use('/api/match', require('./routes/match'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/stats', require('./routes/stats'));

// Unknown API route
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  res.status(500).json({ message: 'Something went wrong on the server' });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`CommunityCare AI running at http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
