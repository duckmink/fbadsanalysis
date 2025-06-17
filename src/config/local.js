module.exports = {
  APIFY_API_TOKEN: 'apify_api_DeaHrHnUpODSNrGhwhZrP9pZWwJIbx1zwcLx',
  PORT: 3000,
  DB: {
    HOST: 'localhost',
    USER: 'macbookpro',
    PASSWORD: '',
    DATABASE: 'ads_spy',
    PORT: 5432,
    dialect: 'postgres',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  OPENAI: {
    API_KEY: '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', // Replace with your actual API key
    MODEL: 'gpt-4o',    // Model to use for analysis
    VISION_MODEL: 'gpt-4o'  // Model to use for image analysis
  }
}; 