require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const { startScheduler } = require('./utils/scheduler');
const adsRoutes = require('./routes/ads');
const aiRoutes = require('./routes/ai');

// Connect to PostgreSQL
connectDB().then(() => {
  // Khởi động scheduler xóa cache cũ
  startScheduler();
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', adsRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Facebook Ads Scraper API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 