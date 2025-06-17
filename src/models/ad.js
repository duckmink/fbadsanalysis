const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Ad = sequelize.define('ad', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  count: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['pageUrl']
    }
  ]
});

// Add a class method to delete old cache
Ad.deleteOldCache = async function() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return await this.destroy({
    where: {
      createdAt: {
        [sequelize.Sequelize.Op.lt]: oneWeekAgo
      }
    }
  });
};

module.exports = Ad; 