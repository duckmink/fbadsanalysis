const Ad = require('../models/ad');

/**
 * Hàm xóa cache cũ (hơn 7 ngày)
 */
const cleanOldCache = async () => {
  try {
    const deletedCount = await Ad.deleteOldCache();
    console.log(`Cleaned ${deletedCount} old cache entries`);
  } catch (error) {
    console.error('Error cleaning old cache:', error);
  }
};

/**
 * Khởi động scheduler để chạy hàng ngày
 */
const startScheduler = () => {
  // Chạy lần đầu khi khởi động
  cleanOldCache();
  
  // Sau đó chạy mỗi 24 giờ
  setInterval(cleanOldCache, 24 * 60 * 60 * 1000);
  
  console.log('Cache cleanup scheduler has been started');
};

module.exports = { startScheduler }; 