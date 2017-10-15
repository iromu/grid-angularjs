'use strict';
/*eslint no-process-env:0*/

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
  // Seed database on startup
  seedDB: true

};
