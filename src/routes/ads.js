const express = require('express');
const router = express.Router();
const adsController = require('../controllers/adsController');

/**
 * @route   POST /api/scrape
 * @desc    Scrape ads from a Facebook page
 * @access  Public
 */
router.post('/scrape', adsController.scrapeAds);

/**
 * @route   DELETE /api/cache
 * @desc    Clear cache for a specific page
 * @access  Public
 */
router.delete('/cache', adsController.clearCache);

module.exports = router; 