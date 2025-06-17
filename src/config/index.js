require('dotenv').config();
const localConfig = require('./local');

// Ưu tiên sử dụng biến môi trường, nếu không có thì dùng local config
module.exports = {
  APIFY_API_TOKEN: process.env.APIFY_API_TOKEN || localConfig.APIFY_API_TOKEN,
  APIFY_URL: 'https://api.apify.com/v2/acts/apify~facebook-ads-scraper/run-sync-get-dataset-items',
  PORT: process.env.PORT || localConfig.PORT,
  DB: {
    HOST: process.env.DB_HOST || localConfig.DB.HOST,
    USER: process.env.DB_USER || localConfig.DB.USER,
    PASSWORD: process.env.DB_PASSWORD || localConfig.DB.PASSWORD,
    DATABASE: process.env.DB_NAME || localConfig.DB.DATABASE,
    PORT: process.env.DB_PORT || localConfig.DB.PORT,
    dialect: 'postgres',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  OPENAI: {
    API_KEY: process.env.OPENAI_API_KEY || localConfig.OPENAI.API_KEY,
    MODEL: process.env.OPENAI_MODEL || localConfig.OPENAI.MODEL,
    VISION_MODEL: process.env.OPENAI_VISION_MODEL || localConfig.OPENAI.VISION_MODEL
  },
  CACHE_DURATION: 7 * 24 * 60 * 60 * 1000 // 1 tuần tính bằng milliseconds
}; 