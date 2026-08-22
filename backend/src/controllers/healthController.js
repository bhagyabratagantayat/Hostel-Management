const db = require('../config/db');
const env = require('../config/env');

const getHealthStatus = async (req, res) => {
  const dbConnected = await db.testConnection();
  
  const status = {
    status: dbConnected ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    services: {
      api: {
        status: 'UP'
      },
      database: {
        status: dbConnected ? 'CONNECTED' : 'DISCONNECTED'
      }
    }
  };

  const statusCode = dbConnected ? 200 : 503;
  return res.status(statusCode).json(status);
};

module.exports = {
  getHealthStatus
};
