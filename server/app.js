(function () {
  /**
   * Main application file
   */

  'use strict';

  var express = require('express');
  var mongoose = require('mongoose');
  var config = require('./config/environment');


  // Setup server
  var app = express();
  var server;

  var createServer = function (logger) {
    server = require('http').createServer(app);
    var socketio = require('socket.io')(server, {
      serveClient: (config.env === 'production') ? false : true,
      path: '/socket.io-client'
    });
    require('./config/socketio')(socketio, logger);
    require('./config/express')(app);
    require('./routes')(app);
    //server.on('listening', function () {
    // Connect to database
    mongoose.connect(config.mongo.uri, config.mongo.options);

    var conn = mongoose.connection;
    conn.on('error', logger.error.bind(logger, 'mongo connection error:'));

    conn.once('open', function () {
      logger.info('mongodb connected');
      require('./components/redis').mongooseRedisCache(mongoose);
      // Populate DB with sample data
      if (config.seedDB && require('cluster').isMaster) {
        logger.warn('Populate DB with sample data');
        require('./config/seed');
      }
    });
    //});

    return server;
  };

  exports.createServer = createServer;
}());
