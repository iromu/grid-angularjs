/* global process:true */

'use strict';

var config = require('./config/environment');
var sticky = require('sticky-cluster');
var logging = require('./logging');
var async = require('async');
var express = require('express');

var config = require('./config/environment');
// if process.env.NODE_ENV has not been set, default to development
var NODE_ENV = process.env.NODE_ENV || 'development';


// Set up logging
var logger = logging.createLogger({
  // log directory
  dir: "CONSOLE",
  // for valid log levels, see
  // [bunyan docs](https://github.com/trentm/node-bunyan#levels)
  level: "debug"
});


function startFn(callback) {
  var app = express();
  var server = require('http').createServer(app);


  var socketio = require('socket.io')(server, {
    serveClient: (config.env === 'production') ? false : true,
    path: '/socket.io-client'
  });
  require('./config/socketio')(socketio, logger);


  require('./config/express')(app);
  require('./routes')(app);


  var mongoose = require('mongoose');
  mongoose.connect(config.mongo.uri, config.mongo.options);

  var conn = mongoose.connection;
  conn.on('error', logger.error.bind(logger, 'mongo connection error:'));

  conn.once('open', function () {
    logger.info('mongodb connected');
    require('./components/redis').mongooseRedisCache(mongoose, logger);
    // Populate DB with sample data
    if (config.seedDB && require('cluster').isMaster) {
      logger.warn('Populate DB with sample data');
      require('./config/seed');
    }
  });

  callback(server);
}

function run(cluster) {


  // In production environment, create a cluster
  if (NODE_ENV === 'production' || Boolean(config.cluster) || cluster) {

    sticky(startFn, {
      concurrency: parseInt(process.env.WEB_CONCURRENCY, require('os').cpus().length),
      port: parseInt(process.env.PORT, 9000),
      debug: (NODE_ENV === 'development')
    });

  } else {
    startFn(function (server) {
      // Start server
      server.listen(config.port, config.ip, function () {
        console.log('Express server listening on %d, in %s mode', config.port, NODE_ENV);
      });
    });
  }
}


exports.run = run;
