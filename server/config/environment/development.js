'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/grid-dev'
  },
  redis: {
    uri: 'redis://localhost:6379'
  },
  seedDB: true
};
