const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const authRoutes = require('./routes/auth');
const analyzeRoutes = require('./routes/analyze');

const app = express();

// Body parser and CORS middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/rag', require('./routes/rag'));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

// Port setting
const PORT = process.env.PORT || 5000;

// Serve static build from frontend
app.use(express.static(path.join(__dirname, '../client/dist')));

// Fallback route for SPA - needs to be AFTER APIs and static files
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
