const openaiService = require('../services/openaiService');
const Ad = require('../models/ad');

/**
 * @desc    Phân tích quảng cáo và tạo template
 * @route   POST /api/ai/analyze
 * @access  Public
 */
exports.analyzeAd = async (req, res) => {
  try {
    const { 
      adId, 
      businessName, 
      industry, 
      targetAudience, 
      businessDescription, 
      uniqueSellingPoints,
      tone,
      products 
    } = req.body;
    
    if (!adId) {
      return res.status(400).json({
        status: 'error',
        message: 'Cần cung cấp ID quảng cáo'
      });
    }

    // Tìm tất cả các records trong database
    const ads = await Ad.findAll();
    
    // Tìm quảng cáo theo ID
    let foundAd = null;
    for (const ad of ads) {
      const foundItem = ad.data.find(item => item.id === adId);
      if (foundItem) {
        foundAd = foundItem;
        break;
      }
    }

    if (!foundAd) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy quảng cáo với ID này'
      });
    }

    // Tạo business context cho AI
    const businessContext = {
      businessName: businessName || 'Unknown Business',
      industry: industry || 'Unspecified',
      targetAudience: targetAudience || 'General audience',
      businessDescription: businessDescription || '',
      uniqueSellingPoints: uniqueSellingPoints || [],
      tone: tone || 'Friendly',
      products: products || []
    };

    // Phân tích content trước với context
    const contentAnalysis = await openaiService.analyzeAdContent(foundAd, businessContext);
    
    // Phân tích hình ảnh hoặc video tùy thuộc vào loại media
    let mediaAnalysis = { analysis: "Không có dữ liệu media" };
    
    if (foundAd.mediaType === 'image' || foundAd.mediaType === 'mixed') {
      mediaAnalysis = await openaiService.analyzeAdImages(foundAd, businessContext);
    } else if (foundAd.mediaType === 'video') {
      mediaAnalysis = await openaiService.analyzeAdVideo(foundAd, businessContext);
    }

    // Phân tích video nếu có
    let videoAnalysis = null;
    if (foundAd.mediaType === 'video' || foundAd.mediaType === 'mixed') {
      videoAnalysis = await openaiService.analyzeAdVideo(foundAd, businessContext);
    }

    res.status(200).json({
      status: 'success',
      data: {
        ad: foundAd,
        businessContext: businessContext,
        content: contentAnalysis,
        media: mediaAnalysis,
        video: videoAnalysis
      }
    });
  } catch (error) {
    console.error('Error analyzing ad:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to analyze ad'
    });
  }
}; 