const axios = require('axios');
const config = require('../config');
const Ad = require('../models/ad');
const { sequelize } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc    Scrape ads from a Facebook page
 * @route   POST /api/scrape
 * @access  Public
 */
exports.scrapeAds = async (req, res) => {
  try {
    const { pageUrl, forceRefresh } = req.body;

    if (!pageUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Page URL is required'
      });
    }

    // Kiểm tra cache trong PostgreSQL
    const cachedData = await Ad.findOne({ 
      where: { pageUrl },
      order: [['createdAt', 'DESC']] 
    });
    
    if (cachedData && !forceRefresh) {
      console.log(`Using cached data for ${pageUrl}`);
      return res.status(200).json({
        status: 'success',
        count: cachedData.count,
        data: cachedData.data,
        source: 'cache'
      });
    }

    console.log(`Fetching fresh data from Apify for ${pageUrl}`);
    
    // Prepare request to Apify
    const requestBody = {
      activeStatus: "active",
      isDetailsPerAd: true,
      onlyTotal: false,
      resultsLimit: 99999,
      startUrls: [
        {
          url: pageUrl,
          method: "GET"
        }
      ]
    };

    // Call Apify API
    const response = await axios.post(
      `${config.APIFY_URL}?token=${config.APIFY_API_TOKEN}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Process data similar to the n8n workflow
    const processedData = response.data.map(item => {
      // Extract base data
      const processedItem = {
        id: uuidv4(),
        text: item.snapshot?.body?.text || '',
        ctaText: item.snapshot?.ctaText || '',
        ctaType: item.snapshot?.ctaType || '',
        startDate: item.startDate ? new Date(item.startDate * 1000).toLocaleDateString('en-GB') : '',
        media: [],
        mediaType: 'none'
      };

      // Process images
      const hasImages = item.snapshot?.images && item.snapshot.images.length > 0;
      if (hasImages) {
        processedItem.media = item.snapshot.images.map(image => image.originalImageUrl);
        processedItem.mediaType = 'image';
      }
      
      // Process videos
      const hasVideos = item.snapshot?.videos && item.snapshot.videos.length > 0;
      if (hasVideos) {
        if (hasImages) {
          processedItem.media = [
            ...processedItem.media,
            ...item.snapshot.videos.map(video => video.videoSdUrl)
          ];
          processedItem.mediaType = 'mixed';
        } else {
          processedItem.media = item.snapshot.videos.map(video => video.videoSdUrl);
          processedItem.mediaType = 'video';
        }
      }

      return processedItem;
    });

    // Bắt đầu transaction
    const transaction = await sequelize.transaction();

    try {
      // Xóa cache cũ nếu có
      if (cachedData) {
        await Ad.destroy({
          where: { pageUrl },
          transaction
        });
      }

      // Lưu vào PostgreSQL để cache
      await Ad.create({
        pageUrl,
        data: processedData,
        count: processedData.length
      }, { transaction });

      // Commit transaction
      await transaction.commit();
    } catch (error) {
      // Rollback nếu có lỗi
      await transaction.rollback();
      throw error;
    }

    res.status(200).json({
      status: 'success',
      count: processedData.length,
      data: processedData,
      source: 'apify'
    });
  } catch (error) {
    console.error('Error scraping ads:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to scrape ads'
    });
  }
};

/**
 * @desc    Clear cache for a specific page
 * @route   DELETE /api/cache
 * @access  Public
 */
exports.clearCache = async (req, res) => {
  try {
    const { pageUrl } = req.body;

    if (!pageUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Page URL is required'
      });
    }

    const deletedCount = await Ad.destroy({
      where: { pageUrl }
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No cache found for this page URL'
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Cache cleared for ${pageUrl}`,
      deletedCount
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to clear cache'
    });
  }
};

/**
 * @desc    Get ad by ID
 * @route   GET /api/ads/:id
 * @access  Public
 */
exports.getAdById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Ad ID is required'
      });
    }

    // Tìm tất cả các records trong database
    const ads = await Ad.findAll();
    
    // Tìm quảng cáo theo ID
    let foundAd = null;
    for (const ad of ads) {
      const foundItem = ad.data.find(item => item.id === id);
      if (foundItem) {
        foundAd = foundItem;
        break;
      }
    }

    if (!foundAd) {
      return res.status(404).json({
        status: 'error',
        message: 'Ad not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: foundAd
    });
  } catch (error) {
    console.error('Error getting ad by ID:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get ad'
    });
  }
}; 