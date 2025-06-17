const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Phân tích quảng cáo và tạo template
router.post('/analyze', aiController.analyzeAd);

module.exports = router; 